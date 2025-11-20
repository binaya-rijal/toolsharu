"use client";

import { useState, useRef } from "react";
import IdCardForm, { IdCardData } from "@/components/id-card/IdCardForm";
import IdCardPreview from "@/components/id-card/IdCardPreview";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";

export default function IdCardGeneratorPage() {
    const [data, setData] = useState<IdCardData | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const handleGenerate = (formData: IdCardData) => {
        setData(formData);
    };

    const handleDownload = async () => {
        if (!previewRef.current) return;

        const canvas = await html2canvas(previewRef.current, {
            scale: 2,
            backgroundColor: null,
        });

        const link = document.createElement("a");
        link.download = `id-card-${data?.fullName || "generated"}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ID Card Generator</h1>
                    <p className="text-muted-foreground mt-2">Create professional ID cards in seconds.</p>
                </div>
                {data && (
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <Download size={18} />
                        Download Card
                    </button>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                    <div className="bg-card border rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Student Details</h2>
                        <IdCardForm onSubmit={handleGenerate} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
                        <div className="flex justify-center items-center min-h-[400px] bg-accent/20 rounded-lg p-8 overflow-hidden">
                            {data ? (
                                <div ref={previewRef}>
                                    <IdCardPreview data={data} />
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <p>Fill in the details and click Generate to see the preview.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
