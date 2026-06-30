import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/contexts/AuthContextProvider";
import { WindowProvider } from "@/contexts/WindowContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthGuard from "@/components/AuthGuard";
import ShellWrapper from "@/components/ShellWrapper";

export const metadata: Metadata = {
  title: "MediaHive | Operational Dashboard",
  description: "Professional dashboard interface for media workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var detected = !!(window.__TAURI_INTERNALS__ || window.__TAURI__ || window.isTauri);
            if (detected) {
              document.documentElement.classList.add('desktop-app');
            }
          })();
        ` }} />
      </head>
      <body className="text-slate-200 antialiased overflow-hidden selection:bg-blue-500/30 selection:text-white isolate">
        <WindowProvider>
          <ThemeProvider>
            <AuthProvider>
              <AuthGuard>
                {/* Tauri-safe viewport container: avoids global padding that clips native frame/borders */}
                <div className="w-full h-full relative z-10 pointer-events-auto bg-transparent isolate">
                  <ShellWrapper>
                    {children}
                  </ShellWrapper>
                </div>
              </AuthGuard>
            </AuthProvider>
          </ThemeProvider>
        </WindowProvider>
      </body>
    </html>
  );
}

