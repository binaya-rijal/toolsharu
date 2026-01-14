"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Film, Image, AlertCircle, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    puter: any;
  }
}

type GenerationType = "image" | "video";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<GenerationType>("image");
  
  // Result states - store URLs instead of DOM elements
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  // Video options
  const [testMode, setTestMode] = useState(true);
  const [videoModel, setVideoModel] = useState("sora-2");
  const [seconds, setSeconds] = useState(4);
  const [videoSize, setVideoSize] = useState("1280x720");

  // Image options
  const [imageModel, setImageModel] = useState("grok-2-image");

  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay video when URL changes
  useEffect(() => {
    if (generatedVideoUrl && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [generatedVideoUrl]);

  const handleGenerate = async () => {
    if (!prompt) return;
    if (!window.puter) {
      setError("Puter.js library not loaded yet. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);

    try {
      if (generationType === "image") {
        // Generate image using selected model
        let image: HTMLImageElement;
        
        if (imageModel === "grok-2-image") {
          // Grok - FREE & UNLIMITED (no size options supported)
          image = await window.puter.ai.txt2img({
            prompt: prompt,
            model: 'grok-2-image',
            provider: 'xai',
          });
        } else {
          // Together AI - supports aspect ratio
          image = await window.puter.ai.txt2img({
            prompt: prompt,
            model: imageModel,
            provider: 'together',
            width: 1280,
            height: 720,
          });
        }
        
        if (image && image.src) {
          setGeneratedImageUrl(image.src);
        }
      } else {
        // Use Sora for video generation
        let resultVideo: HTMLVideoElement;

        if (testMode) {
          resultVideo = await window.puter.ai.txt2vid(prompt, true);
        } else {
          resultVideo = await window.puter.ai.txt2vid(prompt, {
            model: videoModel,
            seconds: Number(seconds),
            size: videoSize
          });
        }

        // Extract the video source URL
        const videoSrc = resultVideo.src || resultVideo.getAttribute('data-source') || resultVideo.querySelector('source')?.src;
        if (videoSrc) {
          setGeneratedVideoUrl(videoSrc);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to generate ${generationType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `grok-generated-${Date.now()}.png`;
      link.click();
    } else if (generatedVideoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideoUrl;
      link.download = `sora-generated-${Date.now()}.mp4`;
      link.click();
    }
  };

  const hasResult = generatedImageUrl || generatedVideoUrl;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold border-b pb-2">
            <Sparkles className="text-primary" size={20} />
            <h2>AI Generator</h2>
          </div>

          {/* Generation Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Generation Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGenerationType("image")}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                  generationType === "image"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                )}
              >
                <Image size={18} />
                <span className="text-sm font-medium">Image</span>
              </button>
              <button
                onClick={() => setGenerationType("video")}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                  generationType === "video"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                )}
              >
                <Film size={18} />
                <span className="text-sm font-medium">Video</span>
              </button>
            </div>
          </div>

          {/* Model Info Badge */}
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            generationType === "image" 
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
          )}>
            {generationType === "image" ? (
              <>
                <Sparkles size={16} />
                <span><strong>Grok 2 Image</strong> - Free & Unlimited via Puter.js</span>
              </>
            ) : (
              <>
                <Film size={16} />
                <span><strong>OpenAI Sora</strong> - Test mode is free</span>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              className="w-full min-h-[120px] p-3 rounded-md bg-background border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={generationType === "image" 
                ? "Describe the image you want to generate (e.g., A cozy cabin at dusk in the snow, cinematic lighting)"
                : "Describe the video you want to generate (e.g., A drone shot of a futuristic city at sunset)"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Image-specific options */}
          {generationType === "image" && (
            <div className="space-y-4 pt-2 border-t">
              <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                Note: Grok 2 Image doesn&apos;t support custom sizes - images are generated in their default aspect ratio.
              </p>
            </div>
          )}

          {/* Video-specific options */}
          {generationType === "video" && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Test Mode (Free)</label>
                <input 
                  type="checkbox" 
                  checked={testMode} 
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                Test mode returns a sample video without using credits.
              </p>

              <div className={cn("space-y-4 transition-opacity", testMode && "opacity-50 pointer-events-none")}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <select 
                    className="w-full p-2 rounded-md bg-background border"
                    value={videoModel}
                    onChange={(e) => setVideoModel(e.target.value)}
                  >
                    <option value="sora-2">Sora 2</option>
                    <option value="sora-2-pro">Sora 2 Pro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <select 
                    className="w-full p-2 rounded-md bg-background border"
                    value={seconds}
                    onChange={(e) => setSeconds(Number(e.target.value))}
                  >
                    <option value={4}>4 Seconds</option>
                    <option value={8}>8 Seconds</option>
                    <option value={12}>12 Seconds</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution</label>
                  <select 
                    className="w-full p-2 rounded-md bg-background border"
                    value={videoSize}
                    onChange={(e) => setVideoSize(e.target.value)}
                  >
                    <option value="1280x720">1280x720 (Landscape)</option>
                    <option value="1920x1080">1920x1080 (HD)</option>
                    <option value="720x1280">720x1280 (Portrait)</option>
                    <option value="1024x1024">1024x1024 (Square)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating...
              </>
            ) : (
              <>
                {generationType === "image" ? <Image size={18} /> : <Film size={18} />}
                Generate {generationType === "image" ? "Image" : "Video"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="h-full min-h-[400px] bg-card border rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="font-semibold text-lg">Preview</h3>
            <div className="flex items-center gap-2">
              {hasResult && (
                <div className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20">
                  Generated Successfully
                </div>
              )}
              {hasResult && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden relative">
            {error ? (
              <div className="text-center p-6 text-destructive max-w-md">
                <AlertCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p className="font-medium">Generation Failed</p>
                <p className="text-sm mt-1 opacity-80">{error}</p>
              </div>
            ) : generatedImageUrl ? (
              <img 
                src={generatedImageUrl} 
                alt="Generated image" 
                className="max-w-full max-h-[500px] rounded-lg shadow-lg object-contain"
              />
            ) : generatedVideoUrl ? (
              <video 
                ref={videoRef}
                src={generatedVideoUrl}
                controls
                className="w-full max-h-[500px] rounded-lg shadow-lg object-contain bg-black"
              />
            ) : loading ? (
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Creating magic...</p>
                <p className="text-xs text-muted-foreground mt-2 opacity-70">
                  {generationType === "image" ? "This usually takes a few seconds" : "This might take a while"}
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-6">
                {generationType === "image" ? (
                  <>
                    <Image className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p>Enter a prompt and click Generate to create an image.</p>
                    <p className="text-sm mt-2 opacity-60 max-w-xs mx-auto">
                      Powered by <strong>Grok 2 Image</strong> - completely free via Puter.js
                    </p>
                  </>
                ) : (
                  <>
                    <Film className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p>Enter a prompt and click Generate to create a video.</p>
                    <p className="text-sm mt-2 opacity-60 max-w-xs mx-auto">
                      Note: Video generation may take several minutes for real models.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
