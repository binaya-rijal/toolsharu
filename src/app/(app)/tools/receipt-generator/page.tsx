"use client";

import { useState, useEffect } from "react";
import ReceiptForm from "@/components/receipt/ReceiptForm";
import ReceiptPreview from "@/components/receipt/ReceiptPreview";
import { ReceiptData } from "@/components/receipt/ReceiptData";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";

export default function ReceiptGeneratorPage() {
    const [receiptData, setReceiptData] = useState<ReceiptData>({
        institutionName: "",
        institutionAddress: "",
        institutionLogo: undefined,
        receiptNumber: "",
        receiptDate: new Date().toISOString().split("T")[0],
        studentName: "",
        studentAddress: "",
        studentContact: "",
        feeItems: [
            {
                id: "1",
                service: "",
                paid: 0,
                due: 0,
                tax: 0,
            },
        ],
        paymentMethod: "Cash",
        paymentDetails: "",
        terms: "",
    });

    useEffect(() => {
        // Generate receipt number on client side only to avoid hydration mismatch
        setReceiptData(prev => ({
            ...prev,
            receiptNumber: `RCP-${Date.now().toString().slice(-6)}`
        }));
    }, []);

    const handleDownload = async () => {
        const element = document.getElementById("receipt-preview");
        if (!element) return;

        try {
            const dataUrl = await toPng(element, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: "#ffffff",
            });

            const link = document.createElement("a");
            link.download = `receipt-${receiptData.receiptNumber}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error generating receipt:", error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Tuition Fee Receipt Generator
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Generate professional fee receipts for students
                    </p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    <Download size={20} />
                    Download Receipt
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-card border rounded-xl p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <ReceiptForm data={receiptData} onChange={setReceiptData} />
                </div>

                {/* Preview Section */}
                <div className="bg-card border rounded-xl p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold">Preview</h2>
                        <p className="text-sm text-muted-foreground">
                            Live preview of your receipt
                        </p>
                    </div>
                    <div className="bg-white rounded-lg overflow-hidden">
                        <ReceiptPreview data={receiptData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
