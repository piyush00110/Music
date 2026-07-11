import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/lib/PlayerContext";
import { SearchProvider } from "@/lib/SearchContext";
import { ThemeProvider } from "@/lib/ThemeContext";
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
      className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] noise-bg">
        <ThemeProvider>
          <SearchProvider>
            <PlayerProvider>
              <ErrorBoundary>
                <div className="aurora-bg" aria-hidden="true" />
                <LayoutShell>{children}</LayoutShell>
              </ErrorBoundary>
            </PlayerProvider>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
