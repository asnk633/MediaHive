import './globals.css';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import RootProviders from '@/components/layout/RootProviders';
import { OfflineBanner } from '@/components/system/OfflineBanner';
import { ShellCommands } from '@/components/system/ShellCommands';
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from '@/contexts/ThemeContext';

import { AmbientCursorLight } from '@/components/ui/AmbientCursorLight';
import { GlobalCommandPalette } from '@/components/layout/GlobalCommandPalette';
import { WebViewDetector } from '@/components/WebViewDetector';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerCleanup } from '@/components/layout/ServiceWorkerCleanup';
import { TelemetryFAB } from '@/components/TelemetryFAB';
import '@/utils/safeAreaInitializer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en" className={cn(inter.variable)} suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{const s=localStorage.getItem('theme');const p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(!s&&p)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(_){}})()`
          }}
        />
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
        <a href="#main-scroll-container" className="skip-link">Skip to Content</a>
        <ServiceWorkerCleanup />
        <WebViewDetector />
        <AmbientCursorLight />
        <QueryProvider>
          <ThemeProvider>
            <RootProviders>
              <OfflineBanner />
              <ShellCommands />
              <div id="app-canvas">
                {children}
              </div>
              <GlobalCommandPalette />
              <Toaster />
            </RootProviders>
          </ThemeProvider>
        </QueryProvider>
        {/* Telemetry & Log Share FAB — always visible, auth-agnostic */}
        <TelemetryFAB />
      {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
