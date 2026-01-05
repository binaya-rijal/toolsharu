import ITTSVoiceGenerator from "@/components/tools/ITTSVoiceGenerator";

export default function ITTSVoiceGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight"> Voice Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate realistic speech using AI. Configure your API key to get started.
        </p>
      </div>
      <ITTSVoiceGenerator />
    </div>
  );
}
