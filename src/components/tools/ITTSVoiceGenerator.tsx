"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play, Trash2, Copy, Plus, Volume2, Settings, Save, Mic } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  gender: string;
  previewUrl?: string;
}

export default function ITTSVoiceGenerator() {
  const [apiKey, setApiKey] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Mock data for initial display if no API key
  useEffect(() => {
    const savedKey = localStorage.getItem("inworld_api_key");
    const savedWorkspace = localStorage.getItem("inworld_workspace_id");
    if (savedKey) setApiKey(savedKey);
    if (savedWorkspace) setWorkspaceId(savedWorkspace);
  }, []);

  const saveConfig = () => {
    localStorage.setItem("inworld_api_key", apiKey);
    localStorage.setItem("inworld_workspace_id", workspaceId);
    setIsConfigOpen(false);
    fetchVoices();
  };

  const fetchVoices = async () => {
    if (!apiKey || !workspaceId) return;
    setLoading(true);
    try {
      // TODO: Replace with actual Inworld API endpoint
      // const response = await fetch(`https://api.inworld.ai/v1/workspaces/${workspaceId}/voices`, {
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`, // or Basic Auth depending on key type
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const data = await response.json();
      // setVoices(data.voices);
      
      // Mocking voices for now as I don't have the exact API spec and key
      setTimeout(() => {
        setVoices([
          { id: "voice_1", name: "Alice (English US)", gender: "Female" },
          { id: "voice_2", name: "Bob (English UK)", gender: "Male" },
          { id: "voice_3", name: "Charlie (Australian)", gender: "Male" },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch voices", error);
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!text || !selectedVoice) return;
    setLoading(true);
    try {
      // TODO: Replace with actual Inworld API endpoint for synthesis
      // const response = await fetch(`https://api.inworld.ai/v1/workspaces/${workspaceId}/sessions/...`, { ... });
      
      // Mocking audio generation
      setTimeout(() => {
        setAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"); // Placeholder audio
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to generate audio", error);
      setLoading(false);
    }
  };

  const deleteVoice = async (voiceId: string) => {
    if (!confirm("Are you sure you want to delete this voice?")) return;
    // TODO: Implement delete API call
    setVoices(voices.filter(v => v.id !== voiceId));
  };

  const cloneVoice = async () => {
    // TODO: Implement voice cloning (file upload + API call)
    alert("Voice cloning feature coming soon (requires file upload implementation)");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Controls */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Settings size={20} /> Configuration
            </h2>
            <button 
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isConfigOpen ? "Hide" : "Edit"}
            </button>
          </div>
          
          {isConfigOpen && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Inworld API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your API Key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace ID</label>
                <input
                  type="text"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter Workspace ID"
                />
              </div>
              <button
                onClick={saveConfig}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <Save size={16} /> Save & Fetch Voices
              </button>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Mic size={20} /> Voices
          </h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a voice...</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
             <button
                onClick={cloneVoice}
                className="flex-1 flex items-center justify-center gap-2 border p-2 rounded-md hover:bg-accent transition-colors text-sm"
              >
                <Copy size={16} /> Clone Voice
              </button>
          </div>

          {selectedVoice && (
             <div className="p-3 bg-accent/50 rounded-lg text-sm space-y-2">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Selected: {voices.find(v => v.id === selectedVoice)?.name}</span>
                    <button 
                        onClick={() => deleteVoice(selectedVoice)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                        title="Delete Voice"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Right Column: Generator */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card border rounded-xl p-6 h-full flex flex-col">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Volume2 size={20} /> Text to Speech
            </h2>
            
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 min-h-[300px] w-full p-4 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter text to generate speech..."
            />

            <div className="mt-6 flex items-center justify-between gap-4">
                {audioUrl && (
                    <audio controls src={audioUrl} className="flex-1" />
                )}
                
                <button
                    onClick={generateAudio}
                    disabled={loading || !text || !selectedVoice}
                    className={cn(
                        "px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-all",
                        loading || !text || !selectedVoice
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                    )}
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                    Generate Audio
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
