"use client";

import { Heart, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function DonatePage() {
    const [copied, setCopied] = useState(false);
    const walletAddress = "TBcafQxQuuB3PUzNHAdSf5huAkmWgdmez9";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-red-100 text-red-600 mb-4">
                    <Heart size={48} fill="currentColor" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Support Our Work</h1>
                <p className="text-xl text-muted-foreground">
                    If you find these tools useful, consider supporting us to keep the servers running and development active.
                </p>
            </div>

            <div className="bg-card border rounded-xl p-8 shadow-sm space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">Crypto Donation</h3>

                    <div className="bg-muted/50 p-6 rounded-lg flex flex-col items-center justify-center space-y-4 border-2 border-dashed">
                        <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg shadow-sm">
                            <span><img src="/qr redot.jpg" alt="QR CODE" className="w-full h-full object-contain" /></span>
                        </div>
                        <p className="text-sm text-muted-foreground">Scan to donate</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
                        <div className="flex gap-2">
                            <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all border">
                                {walletAddress}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                title={copied ? "Copied!" : "Copy Address"}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
