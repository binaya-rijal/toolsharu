import Link from "next/link";
import { ArrowRight, Heart, Zap, Shield } from "lucide-react";
import Footer from "@/components/Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Header */}
            <header className="w-full p-4 md:p-6 flex justify-between items-center border-b bg-card/50 backdrop-blur-sm fixed top-0 z-50">
                <div className="font-bold text-xl md:text-2xl tracking-tight">ToolsHaru.com</div>
                <Link
                    href="/donate"
                    className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium text-sm md:text-base"
                >
                    <Heart size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" />
                    <span>Donate</span>
                </Link>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-12 space-y-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
                <div className="space-y-4 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        Next-Gen Tools
                    </h1>
                    <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                        Empower your workflow with our suite of intelligent, modern, and efficient tools. Built for creators, developers, and everyone in between.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 w-full sm:w-auto">
                    <Link
                        href="/dashboard"
                        className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-1 w-full sm:w-auto"
                    >
                        View Tools
                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* Features Grid Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-12 md:mt-16 text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <div className="p-6 rounded-2xl bg-card border hover:border-primary/50 transition-colors">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                            <Zap size={24} />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Lightning Fast</h3>
                        <p className="text-muted-foreground">Optimized performance ensures your tools load instantly and work without lag.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-card border hover:border-primary/50 transition-colors">
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                            <Shield size={24} />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Secure & Private</h3>
                        <p className="text-muted-foreground">Your data is processed locally where possible and never shared with third parties.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-card border hover:border-primary/50 transition-colors">
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                            <Heart size={24} />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Community First</h3>
                        <p className="text-muted-foreground">Built with love for the community. Completely free to use and open for feedback.</p>
                    </div>
                </div>

                {/* Additional Section */}
                <div className="w-full max-w-5xl mt-16 md:mt-24 text-left space-y-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Everything You Need</h2>
                        <p className="text-muted-foreground mt-4">A growing collection of utilities designed to make your life easier.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Reliable Infrastructure</h3>
                                <p className="text-muted-foreground text-sm mt-1">Hosted on high-performance servers with 99.9% uptime guarantee.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Regular Updates</h3>
                                <p className="text-muted-foreground text-sm mt-1">We constantly improve our tools based on user feedback and requests.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Modern Design</h3>
                                <p className="text-muted-foreground text-sm mt-1">Clean, intuitive interfaces that look great on any device.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Easy Export</h3>
                                <p className="text-muted-foreground text-sm mt-1">Download your generated content in high-quality formats instantly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
