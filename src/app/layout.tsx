'use client';
import './globals.css';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DM_Sans, Outfit, Inter } from 'next/font/google';
import RootProviders from '@/components/layout/RootProviders';
import { OfflineBanner } from '@/components/system/OfflineBanner';
import { ShellCommands } from '@/components/system/ShellCommands';
import QueryProvider from "@/providers/QueryProvider";

import { AmbientCursorLight } from '@/components/ui/AmbientCursorLight';
import { GlobalCommandPalette } from '@/components/layout/GlobalCommandPalette';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const useNewUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  return (
    <html lang="en" className={cn(dmSans.variable, outfit.variable, inter.variable)} suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              if (typeof window === 'undefined') return;

              // Only stub if we are likely on a native platform (localhost/file) and Capacitor is not yet ready.
              // This prevents the web version from misidentifying itself as native.
              const isLikelyNative = window.location.origin.includes('localhost') || 
                                   window.location.protocol === 'file:' ||
                                   /Capacitor/i.test(navigator.userAgent);

              if (isLikelyNative && !window.Capacitor) {
                window.Capacitor = {
                  isNative: true,
                  platform: 'android',
                  Plugins: {},
                  triggerEvent: function (eventName, data) {
                    console.warn('[Capacitor stub] Event before bridge ready:', eventName);
                  },
                  isNativePlatform: function() { return true; }
                };
              }
            })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-transparent" suppressHydrationWarning={true}>
        <AmbientCursorLight />
        <QueryProvider>
          <RootProviders>
            <OfflineBanner />
            <ShellCommands />
            <div id="app-canvas">
              {children}
            </div>
            <GlobalCommandPalette />
          </RootProviders>
        </QueryProvider>
      </body>
    </html>
  );
}
