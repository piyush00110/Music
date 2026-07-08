import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/PlayerContext";
import { SearchProvider } from "@/lib/SearchContext";
import LayoutShell from "@/components/LayoutShell";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-geist-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurelia - Premium Music Player",
  description: "Experience music in its purest form. Stream millions of songs worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-full flex flex-col bg-[#050505] text-[#e5e2e1] noise-bg">
        <SearchProvider>
          <PlayerProvider>
            <ErrorBoundary>
              <LayoutShell>{children}</LayoutShell>
            </ErrorBoundary>
          </PlayerProvider>
        </SearchProvider>
      </body>
    </html>
  );
}
