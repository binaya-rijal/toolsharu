import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-background p-8 flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>
                    <div className="mt-12">
                        <Footer />
                    </div>
                </div>
            </main>
        </div>
    );
}
