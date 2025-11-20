import Link from "next/link";
import { IdCard, ArrowRight, Receipt } from "lucide-react";

export default function GeneratorToolsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Generator Tools</h1>
                <p className="text-muted-foreground mt-2">Create content instantly with our AI-powered generators.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/tools/id-card-generator" className="group relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <IdCard size={24} />
                        </div>
                        <h3 className="font-semibold text-lg">ID Card Generator</h3>
                    </div>
                    <p className="mt-4 text-muted-foreground text-sm">
                        Generate professional ID cards with AI-powered templates. Upload photos and details to get started.
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        Open Tool <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>

                <Link href="/tools/receipt-generator" className="group relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Receipt size={24} />
                        </div>
                        <h3 className="font-semibold text-lg">Receipt Generator</h3>
                    </div>
                    <p className="mt-4 text-muted-foreground text-sm">
                        Create professional tuition fee receipts with customizable templates and automatic calculations.
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        Open Tool <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
