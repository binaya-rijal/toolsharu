import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import DisableContextMenu from "@/components/DisableContextMenu";


import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

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
    <html lang="en" className={`dark ${poppins.variable}`}>
      <body className={poppins.className} suppressHydrationWarning>
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
        <DisableContextMenu />
        {children}
      </body>
    </html>
  );
}
