import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

import { AuthProvider } from "@/contexts/AuthContextProvider";
import { WindowProvider } from "@/contexts/WindowContext";
import AuthGuard from "@/components/AuthGuard";
import ShellWrapper from "@/components/ShellWrapper";

export const metadata: Metadata = {
  title: "MediaHive | Operational Dashboard",
  description: "Cyber-Luxury productivity interface for media workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} dark`}>
      <body className="bg-black text-slate-200 antialiased overflow-hidden selection:bg-teal-500/30 selection:text-white isolate">
        <WindowProvider>
          <AuthProvider>
            <AuthGuard>
              {/* Tauri-safe viewport container: avoids global padding that clips native frame/borders */}
              <div className="w-full h-full relative z-10 pointer-events-auto bg-[#080810] isolate">
                <ShellWrapper>
                  {children}
                </ShellWrapper>
              </div>
            </AuthGuard>
          </AuthProvider>
        </WindowProvider>
      </body>
    </html>
  );
}
