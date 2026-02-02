'use client';
import './globals.css';
import { ReactNode } from 'react';
import { DM_Sans } from 'next/font/google';
import RootProviders from '@/components/layout/RootProviders';
import { OfflineBanner } from '@/components/system/OfflineBanner';
import { ShellCommands } from '@/components/system/ShellCommands';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const useNewUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function () {
              if (typeof window === 'undefined') return;

              // Only stub if Capacitor is not yet injected
              if (!window.Capacitor) {
                window.Capacitor = {
                  isNative: true,
                  platform: 'android',
                  Plugins: {},
                  triggerEvent: function (eventName, data) {
                    console.warn('[Capacitor stub] Event before bridge ready:', eventName);
                  }
                };
              }
            })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-transparent" suppressHydrationWarning={true}>
        <RootProviders>
          <OfflineBanner />
          <ShellCommands />
          <div id="app-canvas">
            {children}
          </div>
        </RootProviders>
      </body>
    </html>
  );
}
