"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Loader2, Play, Pause, Trash2, Copy, Volume2, Settings, Save, Mic, 
  Upload, X, Download, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  Gauge, RotateCcw
} from "lucide-react";

interface Voice {
  name: string;
  displayName?: string;
  language?: string;
  gender?: string;
  voiceId?: string;
}

interface GeneratedAudio {
  id: number;
  text: string;
  audioUrl: string;
  voiceName: string;
  voiceDisplayName: string;
  timestamp: Date;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
}

const MAX_CHAR_LIMIT = 6000;
const MAX_CONCURRENT = 10;

export default function ITTSVoiceGenerator() {
  const [apiKey, setApiKey] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingVoices, setFetchingVoices] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Generated audios list
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [generatingCount, setGeneratingCount] = useState(0);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});
  const audioIdCounter = useRef(1);
  
  // Voice cloning state
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneVoiceName, setCloneVoiceName] = useState("");
  const [cloneAudioFile, setCloneAudioFile] = useState<File | null>(null);
  const [cloning, setCloning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global audio controls
  const [globalVolume, setGlobalVolume] = useState(1);
  const [globalSpeed, setGlobalSpeed] = useState(1);

  useEffect(() => {
    const savedKey = localStorage.getItem("inworld_api_key");
    const savedWorkspace = localStorage.getItem("inworld_workspace_id");
    if (savedKey) setApiKey(savedKey);
    if (savedWorkspace) setWorkspaceId(savedWorkspace);
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const saveConfig = () => {
    if (!apiKey || !workspaceId) {
      showError("Please enter both API Key and Workspace ID");
      return;
    }
    localStorage.setItem("inworld_api_key", apiKey);
    localStorage.setItem("inworld_workspace_id", workspaceId);
    setIsConfigOpen(false);
    fetchVoices();
  };

  const fetchVoices = async () => {
    if (!apiKey || !workspaceId) {
      showError("Please configure API Key and Workspace ID first");
      return;
    }
    setFetchingVoices(true);
    setError(null);
    
    try {
      const response = await fetch('/api/inworld/voices', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'x-workspace-id': workspaceId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      const voiceList = data.voices || [];
      setVoices(voiceList);
      
      if (voiceList.length === 0) {
        showError("No voices found in workspace. Try cloning a voice first.");
      } else {
        showSuccess(`Loaded ${voiceList.length} voice(s) from workspace`);
      }
    } catch (err) {
      console.error("Failed to fetch voices:", err);
      showError(err instanceof Error ? err.message : "Failed to fetch voices");
    } finally {
      setFetchingVoices(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const synthesizeText = async (textToSynthesize: string, voiceName: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/inworld/synthesize', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'x-voice-name': voiceName,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSynthesize,
          modelId: "inworld-tts-1-max",
          timestampType: "WORD"
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Synthesis error:", errorData);
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
        return URL.createObjectURL(audioBlob);
      }
      
      throw new Error("No audio content in response");
    } catch (err) {
      console.error("Synthesis failed:", err);
      throw err;
    }
  };

  const generateAudio = async () => {
    if (!text || !selectedVoice) {
      showError("Please enter text and select a voice");
      return;
    }

    if (text.length > MAX_CHAR_LIMIT) {
      showError(`Text exceeds ${MAX_CHAR_LIMIT} character limit`);
      return;
    }

    if (generatingCount >= MAX_CONCURRENT) {
      showError(`Maximum ${MAX_CONCURRENT} concurrent generations allowed`);
      return;
    }

    setLoading(true);
    setGeneratingCount(prev => prev + 1);

    const selectedVoiceData = voices.find(v => v.name === selectedVoice);
    const voiceDisplayName = selectedVoiceData?.displayName || selectedVoice.split('/').pop() || selectedVoice;

    try {
      const audioUrl = await synthesizeText(text, selectedVoice);
      
      if (audioUrl) {
        const newAudio: GeneratedAudio = {
          id: audioIdCounter.current++,
          text: text,
          audioUrl: audioUrl,
          voiceName: selectedVoice,
          voiceDisplayName: voiceDisplayName,
          timestamp: new Date(),
          isPlaying: false,
          volume: globalVolume,
          playbackRate: globalSpeed,
        };
        
        setGeneratedAudios(prev => [newAudio, ...prev]);
        showSuccess("Audio generated successfully!");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setLoading(false);
      setGeneratingCount(prev => prev - 1);
    }
  };

  const regenerateAudio = async (audioItem: GeneratedAudio) => {
    if (generatingCount >= MAX_CONCURRENT) {
      showError(`Maximum ${MAX_CONCURRENT} concurrent generations allowed`);
      return;
    }

    setGeneratingCount(prev => prev + 1);
    
    // Mark as regenerating
    setGeneratedAudios(prev => prev.map(a => 
      a.id === audioItem.id ? { ...a, isPlaying: false } : a
    ));

    try {
      const audioUrl = await synthesizeText(audioItem.text, audioItem.voiceName);
      
      if (audioUrl) {
        // Revoke old URL
        URL.revokeObjectURL(audioItem.audioUrl);
        
        setGeneratedAudios(prev => prev.map(a => 
          a.id === audioItem.id 
            ? { ...a, audioUrl: audioUrl, timestamp: new Date() }
            : a
        ));
        showSuccess(`Audio #${audioItem.id} regenerated!`);
      }
    } catch (err) {
      showError(`Failed to regenerate audio #${audioItem.id}`);
    } finally {
      setGeneratingCount(prev => prev - 1);
    }
  };

  const togglePlayPause = (audioId: number) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (audio.paused) {
      // Pause all other audios
      Object.entries(audioRefs.current).forEach(([id, audioEl]) => {
        if (parseInt(id) !== audioId && !audioEl.paused) {
          audioEl.pause();
          setGeneratedAudios(prev => prev.map(a => 
            a.id === parseInt(id) ? { ...a, isPlaying: false } : a
          ));
        }
      });
      
      audio.play();
      setGeneratedAudios(prev => prev.map(a => 
        a.id === audioId ? { ...a, isPlaying: true } : a
      ));
    } else {
      audio.pause();
      setGeneratedAudios(prev => prev.map(a => 
        a.id === audioId ? { ...a, isPlaying: false } : a
      ));
    }
  };

  const updateAudioVolume = (audioId: number, volume: number) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      audio.volume = volume;
    }
    setGeneratedAudios(prev => prev.map(a => 
      a.id === audioId ? { ...a, volume } : a
    ));
  };

  const updateAudioSpeed = (audioId: number, speed: number) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      audio.playbackRate = speed;
    }
    setGeneratedAudios(prev => prev.map(a => 
      a.id === audioId ? { ...a, playbackRate: speed } : a
    ));
  };

  const downloadAudio = (audioItem: GeneratedAudio) => {
    const a = document.createElement('a');
    a.href = audioItem.audioUrl;
    a.download = `tts-audio-${audioItem.id}.mp3`;
    a.click();
  };

  const deleteAudio = (audioId: number) => {
    const audio = generatedAudios.find(a => a.id === audioId);
    if (audio) {
      URL.revokeObjectURL(audio.audioUrl);
    }
    setGeneratedAudios(prev => prev.filter(a => a.id !== audioId));
    delete audioRefs.current[audioId];
  };

  const handleCloneVoice = async () => {
    if (!cloneVoiceName || !cloneAudioFile) {
      showError("Please provide a voice name and upload an audio file");
      return;
    }
    
    setCloning(true);

    try {
      const base64Audio = await fileToBase64(cloneAudioFile);
      
      const response = await fetch('/api/inworld/voices', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'x-workspace-id': workspaceId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: cloneVoiceName,
          customVoice: {
            baseVoice: {
              language: "en",
              gender: "VOICE_GENDER_NEUTRAL"
            },
            audioSamples: [
              {
                audio: base64Audio,
                audioEncoding: cloneAudioFile.type.includes('wav') ? 'LINEAR16' : 'MP3'
              }
            ]
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to clone voice: ${response.status}`);
      }

      showSuccess(`Voice "${cloneVoiceName}" cloned successfully!`);
      setIsCloneModalOpen(false);
      setCloneVoiceName("");
      setCloneAudioFile(null);
      await fetchVoices();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to clone voice");
    } finally {
      setCloning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const deleteVoice = async (voiceName: string) => {
    if (!confirm("Are you sure you want to delete this voice?")) return;
    
    try {
      const response = await fetch('/api/inworld/voices', {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'x-voice-name': voiceName,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete voice: ${response.status}`);
      }

      showSuccess("Voice deleted successfully!");
      setSelectedVoice("");
      await fetchVoices();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete voice");
    }
  };

  const getVoiceDisplayName = (voice: Voice) => {
    return voice.displayName || voice.name.split('/').pop() || voice.name;
  };

  const charCount = text.length;
  const charPercentage = (charCount / MAX_CHAR_LIMIT) * 100;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-md animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-md animate-in slide-in-from-top-2">
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {/* Clone Voice Modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md m-4 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Clone a Voice</h3>
              <button onClick={() => setIsCloneModalOpen(false)} className="p-1 hover:bg-accent rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice Name</label>
                <input
                  type="text"
                  value={cloneVoiceName}
                  onChange={(e) => setCloneVoiceName(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter a name for the cloned voice"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Audio Sample</label>
                <p className="text-xs text-muted-foreground">Upload a clear audio sample (MP3 or WAV, 10-30 seconds recommended)</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setCloneAudioFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                >
                  {cloneAudioFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Volume2 size={20} className="text-primary" />
                      <span className="text-sm">{cloneAudioFile.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCloneAudioFile(null); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={24} className="mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload audio file</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="flex-1 p-2 border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneVoice}
                disabled={cloning || !cloneVoiceName || !cloneAudioFile}
                className={cn(
                  "flex-1 p-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors",
                  cloning || !cloneVoiceName || !cloneAudioFile
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {cloning ? <Loader2 className="animate-spin" size={16} /> : <Copy size={16} />}
                Clone Voice
              </button>
            </div>
          </div>
        </div>
      )}

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
                {isConfigOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {isConfigOpen && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inworld API Key (Basic Base64)</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your Basic (Base64) API Key"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace ID</label>
                  <input
                    type="text"
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., default-rkexmpzbw6j-o9u1c8ztdw"
                  />
                  <p className="text-xs text-muted-foreground">Find this in your Inworld dashboard URL</p>
                </div>
                <button
                  onClick={saveConfig}
                  disabled={fetchingVoices}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {fetchingVoices ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save & Fetch Voices
                </button>
              </div>
            )}
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Mic size={20} /> Voices
              </h2>
              <button 
                onClick={fetchVoices}
                disabled={fetchingVoices || !apiKey}
                className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                {fetchingVoices ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a voice...</option>
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {getVoiceDisplayName(voice)}
                  </option>
                ))}
              </select>
              {voices.length === 0 && !fetchingVoices && (
                <p className="text-xs text-muted-foreground">No voices loaded. Configure API and click Save & Fetch.</p>
              )}
            </div>

            <button
              onClick={() => setIsCloneModalOpen(true)}
              disabled={!apiKey || !workspaceId}
              className="w-full flex items-center justify-center gap-2 border p-2 rounded-md hover:bg-accent transition-colors text-sm disabled:opacity-50"
            >
              <Copy size={16} /> Clone New Voice
            </button>

            {selectedVoice && (
              <div className="p-3 bg-accent/50 rounded-lg text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate flex-1">
                    {getVoiceDisplayName(voices.find(v => v.name === selectedVoice) || { name: selectedVoice })}
                  </span>
                  <button 
                    onClick={() => deleteVoice(selectedVoice)}
                    className="text-destructive hover:bg-destructive/10 p-1 rounded ml-2"
                    title="Delete Voice"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Global Audio Controls */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Gauge size={20} /> Audio Controls
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="font-medium flex items-center gap-1">
                    <Volume2 size={14} /> Default Volume
                  </label>
                  <span className="text-muted-foreground">{Math.round(globalVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={globalVolume}
                  onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="font-medium flex items-center gap-1">
                    <Gauge size={14} /> Default Speed
                  </label>
                  <span className="text-muted-foreground">{globalSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={globalSpeed}
                  onChange={(e) => setGlobalSpeed(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generator & List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Volume2 size={20} /> Text to Speech
              <span className="ml-auto text-sm font-normal text-muted-foreground">
               Yoohoooo!!
              </span>
            </h2>
            
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_CHAR_LIMIT}
                className="min-h-[200px] w-full p-4 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter text to generate speech (max 6000 characters)..."
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                <span className={cn(charCount > MAX_CHAR_LIMIT * 0.9 && "text-yellow-500", charCount >= MAX_CHAR_LIMIT && "text-destructive")}>
                  {charCount.toLocaleString()}
                </span>
                <span> / {MAX_CHAR_LIMIT.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Character limit progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all",
                  charPercentage > 90 ? "bg-destructive" : charPercentage > 75 ? "bg-yellow-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(charPercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {generatingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="animate-spin" size={14} />
                    {generatingCount} generation(s) in progress
                  </span>
                )}
              </div>
              
              <button
                onClick={generateAudio}
                disabled={loading || !text || !selectedVoice || generatingCount >= MAX_CONCURRENT}
                className={cn(
                  "px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-all",
                  loading || !text || !selectedVoice || generatingCount >= MAX_CONCURRENT
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                )}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                Generate Audio
              </button>
            </div>
          </div>

          {/* Generated Audios List */}
          {generatedAudios.length > 0 && (
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Generated Audios ({generatedAudios.length})</h2>
                <button
                  onClick={() => {
                    generatedAudios.forEach(a => URL.revokeObjectURL(a.audioUrl));
                    setGeneratedAudios([]);
                    audioRefs.current = {};
                  }}
                  className="text-sm text-destructive hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {generatedAudios.map((audio, index) => (
                  <div 
                    key={audio.id}
                    className="bg-accent/30 border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          {audio.id}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{audio.voiceDisplayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {audio.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => regenerateAudio(audio)}
                          disabled={generatingCount >= MAX_CONCURRENT}
                          className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                          title="Regenerate"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => downloadAudio(audio)}
                          className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-primary transition-colors"
                          title={`Download as ${audio.id}.mp3`}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => deleteAudio(audio.id)}
                          className="p-2 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Text Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2 bg-background/50 p-2 rounded">
                      {audio.text}
                    </p>

                    {/* Audio Player Row */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePlayPause(audio.id)}
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex-shrink-0"
                      >
                        {audio.isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                      </button>
                      
                      <audio 
                        ref={(el) => { if (el) audioRefs.current[audio.id] = el; }}
                        src={audio.audioUrl}
                        onEnded={() => {
                          setGeneratedAudios(prev => prev.map(a => 
                            a.id === audio.id ? { ...a, isPlaying: false } : a
                          ));
                        }}
                        onLoadedMetadata={() => {
                          const audioEl = audioRefs.current[audio.id];
                          if (audioEl) {
                            audioEl.volume = audio.volume;
                            audioEl.playbackRate = audio.playbackRate;
                          }
                        }}
                        className="hidden"
                      />
                      
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        {/* Volume Control */}
                        <div className="flex items-center gap-2">
                          <Volume2 size={14} className="text-muted-foreground flex-shrink-0" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={audio.volume}
                            onChange={(e) => updateAudioVolume(audio.id, parseFloat(e.target.value))}
                            className="w-full accent-primary h-1"
                          />
                          <span className="text-xs text-muted-foreground w-8">{Math.round(audio.volume * 100)}%</span>
                        </div>
                        
                        {/* Speed Control */}
                        <div className="flex items-center gap-2">
                          <Gauge size={14} className="text-muted-foreground flex-shrink-0" />
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.25"
                            value={audio.playbackRate}
                            onChange={(e) => updateAudioSpeed(audio.id, parseFloat(e.target.value))}
                            className="w-full accent-primary h-1"
                          />
                          <span className="text-xs text-muted-foreground w-8">{audio.playbackRate}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
