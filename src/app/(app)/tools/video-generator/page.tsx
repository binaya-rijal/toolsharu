import VideoGenerator from "@/components/tools/VideoGenerator";
import { ToolOpenTracker } from "@/components/OpenedToolsProvider";

export default function VideoGeneratorPage() {
  return (
    <div className="space-y-6">
      <ToolOpenTracker id="video-generator" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Media Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate images with <strong>Grok 2</strong> (free & unlimited) or videos with <strong>OpenAI Sora</strong> using Puter.js.
        </p>
      </div>
      <VideoGenerator />
    </div>
  );
}
