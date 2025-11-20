import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DisableContextMenu from "@/components/DisableContextMenu";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tools Haru",
  description: "A suite of amazing Modern tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className} suppressHydrationWarning>
        <DisableContextMenu />
        {children}
      </body>
    </html>
  );
}
