"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Play, Pause, Download, RefreshCw, Settings2, Image as ImageIcon, Wand2, ArrowLeft, Video } from "lucide-react";

interface Frame {
    x: number;
    y: number;
    w: number;
    h: number;
}

export default function SpriteSheetAnimator() {
    // UI State
    const [view, setView] = useState<'setup' | 'result'>('setup');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Data State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [frames, setFrames] = useState<Frame[]>([]);

    // Configuration State (Manual Override)
    const [rows, setRows] = useState(1);
    const [cols, setCols] = useState(1);
    const [fps, setFps] = useState(10);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isRecording, setIsRecording] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // -------------------------------------------------------------------------
    // 1. Image Handling & Auto-Detection Logic
    // -------------------------------------------------------------------------

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target?.result as string);
                setView('setup');
                setFrames([]);
                setRows(1);
                setCols(1);
            };
            reader.readAsDataURL(file);
        }
    };

    // Load image object when source changes
    useEffect(() => {
        if (imageSrc) {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                imgRef.current = img;
            };
        }
    }, [imageSrc]);

    const detectFrames = async () => {
        if (!imgRef.current) return;
        setIsAnalyzing(true);

        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));

        const img = imgRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setIsAnalyzing(false);
            return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Helper: Check if a row is empty (transparent)
        const isRowEmpty = (y: number) => {
            for (let x = 0; x < width; x++) {
                if (data[(y * width + x) * 4 + 3] > 10) return false; // Threshold for alpha
            }
            return true;
        };

        // Helper: Check if a col is empty
        const isColEmpty = (x: number) => {
            for (let y = 0; y < height; y++) {
                if (data[(y * width + x) * 4 + 3] > 10) return false;
            }
            return true;
        };

        // Scan Y-axis for row regions
        const rowRegions: { start: number, end: number }[] = [];
        let inRow = false;
        let startY = 0;

        for (let y = 0; y < height; y++) {
            const empty = isRowEmpty(y);
            if (!inRow && !empty) {
                inRow = true;
                startY = y;
            } else if (inRow && (empty || y === height - 1)) {
                inRow = false;
                rowRegions.push({ start: startY, end: y });
            }
        }

        // Scan X-axis for col regions
        const colRegions: { start: number, end: number }[] = [];
        let inCol = false;
        let startX = 0;

        for (let x = 0; x < width; x++) {
            const empty = isColEmpty(x);
            if (!inCol && !empty) {
                inCol = true;
                startX = x;
            } else if (inCol && (empty || x === width - 1)) {
                inCol = false;
                colRegions.push({ start: startX, end: x });
            }
        }

        // Generate Frames from intersections
        const newFrames: Frame[] = [];

        // Fallback: If no regions found (e.g. full opaque image), treat as 1x1
        if (rowRegions.length === 0) rowRegions.push({ start: 0, end: height });
        if (colRegions.length === 0) colRegions.push({ start: 0, end: width });

        // Update manual inputs to match detected grid
        setRows(rowRegions.length);
        setCols(colRegions.length);

        for (const row of rowRegions) {
            for (const col of colRegions) {
                newFrames.push({
                    x: col.start,
                    y: row.start,
                    w: col.end - col.start,
                    h: row.end - row.start
                });
            }
        }

        setFrames(newFrames);
        setIsAnalyzing(false);
        setView('result');
        setCurrentFrameIndex(0);
        setIsPlaying(true);
    };

    // Manual Generation (using rows/cols inputs)
    const generateManualFrames = () => {
        if (!imgRef.current) return;
        const img = imgRef.current;
        const newFrames: Frame[] = [];
        const spriteWidth = img.width / cols;
        const spriteHeight = img.height / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                newFrames.push({
                    x: c * spriteWidth,
                    y: r * spriteHeight,
                    w: spriteWidth,
                    h: spriteHeight
                });
            }
        }
        setFrames(newFrames);
        setView('result');
        setCurrentFrameIndex(0);
        setIsPlaying(true);
    };

    // -------------------------------------------------------------------------
    // 2. Animation Loop
    // -------------------------------------------------------------------------

    const animate = useCallback((time: number) => {
        if ((!isPlaying && !isRecording) || frames.length === 0) return;

        const timeSinceLastFrame = time - lastFrameTimeRef.current;
        const frameInterval = 1000 / fps;

        if (timeSinceLastFrame >= frameInterval) {
            // Check stop condition for recording
            if (isRecording && currentFrameIndex === frames.length - 1) {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                    setIsPlaying(false);
                    return;
                }
            }

            setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
            lastFrameTimeRef.current = time;
        }

        animationRef.current = requestAnimationFrame(animate);
    }, [isPlaying, isRecording, fps, frames.length, currentFrameIndex]);

    useEffect(() => {
        if (isPlaying || isRecording) {
            lastFrameTimeRef.current = performance.now();
            animationRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, isRecording, animate]);

    // -------------------------------------------------------------------------
    // 3. Rendering
    // -------------------------------------------------------------------------

    useEffect(() => {
        drawFrame(currentFrameIndex);
    }, [currentFrameIndex, frames, zoom]);

    const drawFrame = (index: number) => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const frame = frames[index];

        if (!canvas || !img || !frame) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Update canvas size
        canvas.width = frame.w * zoom;
        canvas.height = frame.h * zoom;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            img,
            frame.x, frame.y, frame.w, frame.h, // Source rect
            0, 0, frame.w * zoom, frame.h * zoom // Dest rect
        );
    };

    // -------------------------------------------------------------------------
    // 4. Download Logic
    // -------------------------------------------------------------------------

    const handleDownloadVideo = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setCurrentFrameIndex(0);
        setIsPlaying(false);
        chunksRef.current = [];

        const stream = canvas.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'animation.webm';
            link.click();
            URL.revokeObjectURL(url);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
    };

    // -------------------------------------------------------------------------
    // 5. UI Render
    // -------------------------------------------------------------------------

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sprite Sheet Animator</h1>
                    <p className="text-muted-foreground mt-1">Turn your sprite sheets into animations automatically.</p>
                </div>
                {view === 'result' && (
                    <button
                        onClick={() => {
                            setView('setup');
                            setIsPlaying(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Setup
                    </button>
                )}
            </div>

            {/* VIEW: SETUP */}
            {view === 'setup' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Upload & Preview */}
                    <div className="space-y-6">
                        <div className="bg-card border rounded-xl p-8 shadow-sm text-center space-y-4">
                            <div className="relative group cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-xl bg-muted/30 group-hover:bg-muted/50 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Upload size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-lg">Upload Sprite Sheet</p>
                                        <p className="text-sm text-muted-foreground">Drag & drop or click to choose</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {imageSrc && (
                            <div className="bg-card border rounded-xl p-4 shadow-sm overflow-hidden">
                                <p className="text-sm font-medium mb-3 text-muted-foreground">Source Preview</p>
                                <div className="bg-muted/20 rounded-lg p-2 flex items-center justify-center border-2 border-dashed border-muted-foreground/10">
                                    <img
                                        src={imageSrc}
                                        alt="Preview"
                                        className="max-h-[300px] object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="space-y-6">
                        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Wand2 size={20} className="text-primary" />
                                    Generate Animation
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We'll automatically detect the frames in your sprite sheet.
                                </p>
                            </div>

                            <button
                                onClick={detectFrames}
                                disabled={!imageSrc || isAnalyzing}
                                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw size={20} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={20} />
                                        Auto-Generate Animation
                                    </>
                                )}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Or Manual Setup</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rows</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={rows}
                                        onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full p-2 rounded-md border bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Columns</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={cols}
                                        onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full p-2 rounded-md border bg-background"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={generateManualFrames}
                                disabled={!imageSrc}
                                className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                            >
                                Use Manual Grid
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: RESULT */}
            {view === 'result' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Settings2 size={18} />
                                    Playback Controls
                                </h3>
                            </div>

                            {/* FPS */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Speed</label>
                                    <span className="text-sm text-muted-foreground">{fps} FPS</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    value={fps}
                                    onChange={(e) => setFps(parseInt(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* Play/Pause */}
                            <div className="flex items-center justify-center gap-4 pt-4">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md"
                                >
                                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsPlaying(false);
                                        setCurrentFrameIndex(0);
                                    }}
                                    className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Download size={18} />
                                Export
                            </h3>
                            <button
                                onClick={handleDownloadVideo}
                                disabled={isRecording}
                                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                            >
                                <Video size={18} />
                                {isRecording ? 'Recording...' : 'Download Video Animation'}
                            </button>
                            <p className="text-xs text-muted-foreground text-center">
                                Downloads as .webm video
                            </p>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border rounded-xl p-8 h-full min-h-[500px] flex flex-col shadow-sm relative">
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur p-2 rounded-lg border shadow-sm z-10">
                                <span className="text-xs font-medium text-muted-foreground">Zoom</span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-20 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/10 overflow-hidden relative">
                                <canvas
                                    ref={canvasRef}
                                    className="shadow-2xl bg-white"
                                    style={{
                                        imageRendering: 'pixelated',
                                        backgroundImage: `
                                            linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                            linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                            linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                            linear-gradient(-45deg, transparent 75%, #ccc 75%)
                                        `,
                                        backgroundSize: '20px 20px',
                                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                                    }}
                                />
                            </div>

                            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                                <span>Frame: {currentFrameIndex + 1} / {frames.length}</span>
                                <span>Size: {frames[0]?.w}x{frames[0]?.h}px</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
