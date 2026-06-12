-- =====================================================================
-- PainMiner schema: runs, threads, ideas, idea_sources + reddit_cache
-- Postgres / Supabase with Row Level Security.
--
-- Apply with the Supabase CLI:   supabase db push
-- or paste into the SQL editor of your Supabase project.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'demand_level') then
    create type public.demand_level as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'run_status') then
    create type public.run_status as enum ('running', 'completed', 'error');
  end if;
end$$;

-- ---------------------------------------------------------------------
-- profiles  (one row per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- runs  (one analysis run)
-- ---------------------------------------------------------------------
create table if not exists public.runs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  subreddit              text not null,
  time_window            text not null default 'week',
  status                 public.run_status not null default 'running',
  total_threads_scraped  integer not null default 0,
  total_comments_scraped integer not null default 0,
  model                  text,
  input_tokens           integer not null default 0,
  output_tokens          integer not null default 0,
  est_cost_usd           numeric(10, 6) not null default 0,
  error                  text,
  created_at             timestamptz not null default now()
);

create index if not exists runs_user_id_idx    on public.runs (user_id);
create index if not exists runs_created_at_idx on public.runs (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- threads  (high-signal source threads kept for a run)
-- ---------------------------------------------------------------------
create table if not exists public.threads (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references public.runs (id) on delete cascade,
  reddit_id    text,
  title        text not null,
  url          text not null,
  score        integer not null default 0,
  num_comments integer not null default 0,
  created_utc  bigint,
  raw_snippet  text
);

create index if not exists threads_run_id_idx on public.threads (run_id);

-- ---------------------------------------------------------------------
-- ideas  (validated SaaS opportunities derived from the data)
-- ---------------------------------------------------------------------
create table if not exists public.ideas (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references public.runs (id) on delete cascade,
  title           text not null,
  problem         text not null,
  demand_level    public.demand_level not null default 'low',
  demand_evidence text,
  competitors     jsonb not null default '[]'::jsonb,
  gaps            jsonb not null default '[]'::jsonb,
  monetization    text,
  pricing_hint    text,
  target_user     text,
  confidence      numeric(3, 2) not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists ideas_run_id_idx on public.ideas (run_id);

-- ---------------------------------------------------------------------
-- idea_sources  (links each idea to the threads that justify it)
-- ---------------------------------------------------------------------
create table if not exists public.idea_sources (
  id        uuid primary key default gen_random_uuid(),
  idea_id   uuid not null references public.ideas (id) on delete cascade,
  thread_id uuid references public.threads (id) on delete set null,
  quote     text
);

create index if not exists idea_sources_idea_id_idx   on public.idea_sources (idea_id);
create index if not exists idea_sources_thread_id_idx on public.idea_sources (thread_id);

-- ---------------------------------------------------------------------
-- reddit_cache  (raw fetches keyed by subreddit + time window, with TTL)
-- Not user-scoped: it is a shared, anonymised fetch cache. Only the
-- service role writes/reads it from server code, so RLS denies clients.
-- ---------------------------------------------------------------------
create table if not exists public.reddit_cache (
  id          uuid primary key default gen_random_uuid(),
  subreddit   text not null,
  time_window text not null,
  payload     jsonb not null,
  fetched_at  timestamptz not null default now(),
  unique (subreddit, time_window)
);

create index if not exists reddit_cache_key_idx on public.reddit_cache (subreddit, time_window);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles     enable row level security;
alter table public.runs         enable row level security;
alter table public.threads      enable row level security;
alter table public.ideas        enable row level security;
alter table public.idea_sources enable row level security;
alter table public.reddit_cache enable row level security;

-- profiles: a user can see/insert/update only their own profile row.
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_self_modify" on public.profiles;
create policy "profiles_self_modify" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- runs: owner-only.
drop policy if exists "runs_owner_all" on public.runs;
create policy "runs_owner_all" on public.runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- threads: visible/writable only when the parent run belongs to the user.
drop policy if exists "threads_owner_all" on public.threads;
create policy "threads_owner_all" on public.threads
  for all using (
    exists (select 1 from public.runs r where r.id = threads.run_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.runs r where r.id = threads.run_id and r.user_id = auth.uid())
  );

-- ideas: same ownership rule via parent run.
drop policy if exists "ideas_owner_all" on public.ideas;
create policy "ideas_owner_all" on public.ideas
  for all using (
    exists (select 1 from public.runs r where r.id = ideas.run_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.runs r where r.id = ideas.run_id and r.user_id = auth.uid())
  );

-- idea_sources: ownership via idea -> run.
drop policy if exists "idea_sources_owner_all" on public.idea_sources;
create policy "idea_sources_owner_all" on public.idea_sources
  for all using (
    exists (
      select 1 from public.ideas i
      join public.runs r on r.id = i.run_id
      where i.id = idea_sources.idea_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ideas i
      join public.runs r on r.id = i.run_id
      where i.id = idea_sources.idea_id and r.user_id = auth.uid()
    )
  );

-- reddit_cache: no client access at all. The service-role key used by the
-- API route bypasses RLS, so server code can still read/write it.
drop policy if exists "reddit_cache_no_client" on public.reddit_cache;
create policy "reddit_cache_no_client" on public.reddit_cache
  for all using (false) with check (false);
