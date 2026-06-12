export interface Tool {
    id: string;
    name: string;
    href: string;
    emoji: string;
    description: string;
    section: string;
}

export const SECTIONS = [
    { id: "generators", title: "AI Generators", emoji: "✨" },
    { id: "research", title: "Research & Validation", emoji: "🔭" },
    { id: "design", title: "Design & Documents", emoji: "🎨" },
] as const;

export const TOOLS: Tool[] = [
    {
        id: "pain-miner",
        name: "PainMiner",
        href: "/tools/pain-miner",
        emoji: "⛏️",
        description:
            "Scrape Reddit discussions and turn repeated complaints into validated SaaS ideas — backed by demand signals, competitors, gaps, and clickable source threads.",
        section: "research",
    },
    {
        id: "script-to-video",
        name: "Script to Video",
        href: "/tools/script-to-video",
        emoji: "🎬",
        description:
            "Turn a video, audio track and hand image into a synced video. AI authors text, SVGs and animations timed to your audio, rendered to MP4 with Remotion.",
        section: "generators",
    },
    {
        id: "video-generator",
        name: "AI Media Generator",
        href: "/tools/video-generator",
        emoji: "🎥",
        description:
            "Generate images with Grok 2 (free & unlimited) or videos with OpenAI Sora. Powered by Puter.js.",
        section: "generators",
    },
    {
        id: "text-to-speech-generator",
        name: "Text to Speech Generator",
        href: "/tools/text-to-speech-generator",
        emoji: "🔊",
        description:
            "Generate realistic speech using Inworld AI voices. Clone voices and synthesize audio instantly.",
        section: "generators",
    },
    {
        id: "id-card-generator",
        name: "ID Card Generator",
        href: "/tools/id-card-generator",
        emoji: "🪪",
        description:
            "Generate professional ID cards with ready-made templates. Upload photos and details to get started.",
        section: "design",
    },
    {
        id: "receipt-generator",
        name: "Receipt Generator",
        href: "/tools/receipt-generator",
        emoji: "🧾",
        description:
            "Create professional tuition fee receipts with customizable templates and automatic calculations.",
        section: "design",
    },
];

export function getToolByHref(href: string): Tool | undefined {
    return TOOLS.find((t) => t.href === href);
}

export function getToolById(id: string): Tool | undefined {
    return TOOLS.find((t) => t.id === id);
}
