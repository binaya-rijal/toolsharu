import { NextRequest, NextResponse } from 'next/server';

const INWORLD_VOICES_API = 'https://api.inworld.ai/voices/v1';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const workspaceId = request.headers.get('x-workspace-id');
  const voiceName = request.headers.get('x-voice-name');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  // If voiceName is provided, get specific voice details
  if (voiceName) {
    try {
      const endpoint = `${INWORLD_VOICES_API}/${voiceName}`;
      console.log('Fetching voice details from:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log(`Response ${response.status}:`, responseText.substring(0, 500));
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: `Failed to fetch voice details: ${response.status}`,
          details: responseText 
        }, { status: response.status });
      }

      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('Fetch voice details error:', errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  // List all voices (system + this workspace's cloned voices) via the global
  // /voices endpoint, paging through every result. The workspace-scoped endpoint
  // does not return cloned voices, so we use this one. Auth (Basic key) already
  // scopes which cloned voices are visible.
  void workspaceId;

  try {
    const endpoint = `${INWORLD_VOICES_API}/voices`;
    const allVoices: Record<string, unknown>[] = [];
    let pageToken = '';

    // Guard against runaway pagination.
    for (let page = 0; page < 50; page++) {
      const url = new URL(endpoint);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('orderBy', 'display_name asc');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      console.log('Fetching voices from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.log(`Response ${response.status}:`, responseText.substring(0, 500));
        return NextResponse.json({
          error: `Failed to fetch voices: ${response.status}`,
          details: responseText,
        }, { status: response.status });
      }

      const data = JSON.parse(responseText);
      const pageVoices = data.voices || data.customVoices || data.items || [];
      allVoices.push(...pageVoices);

      pageToken = data.nextPageToken || '';
      if (!pageToken || pageVoices.length === 0) break;
    }

    // Surface cloned/owned voices first so they're easy to find.
    allVoices.sort((a, b) => {
      const ownedA = a.owned ? 0 : 1;
      const ownedB = b.owned ? 0 : 1;
      if (ownedA !== ownedB) return ownedA - ownedB;
      return String(a.displayName || '').localeCompare(String(b.displayName || ''));
    });

    console.log(`Fetched ${allVoices.length} voices`);
    return NextResponse.json({ voices: allVoices });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error('Fetch voices error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const workspaceId = request.headers.get('x-workspace-id');
  const body = await request.json();

  if (!apiKey || !workspaceId) {
    return NextResponse.json({ error: 'Missing API key or workspace ID' }, { status: 400 });
  }

  try {
    // Use the :clone endpoint for voice cloning
    const endpoint = `${INWORLD_VOICES_API}/workspaces/${workspaceId}/voices:clone`;
    console.log('Cloning voice at:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('Clone response:', response.status, responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to clone voice: ${response.status}`, 
        details: responseText 
      }, { status: response.status });
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (e) {
    console.error('Clone voice exception:', e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const voiceName = request.headers.get('x-voice-name');

  if (!apiKey || !voiceName) {
    return NextResponse.json({ error: 'Missing API key or voice name' }, { status: 400 });
  }

  try {
    // voiceName should be the full resource name like "workspaces/xxx/voices/yyy"
    const endpoint = `${INWORLD_VOICES_API}/${voiceName}`;
    console.log('Deleting voice at:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete error:', errorText);
      return NextResponse.json({ error: `Failed to delete voice: ${response.status}` }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete voice exception:', e);
    return NextResponse.json({ error: 'Failed to delete voice' }, { status: 500 });
  }
}
