import TextToSpeechGenerator from "@/components/tools/TextToSpeechGenerator";

export default function TextToSpeechGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight"> Voice Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate realistic speech using AI. Configure your API key to get started.
        </p>
      </div>
      <TextToSpeechGenerator />
    </div>
  );
}
