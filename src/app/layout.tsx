// src/app/layout.tsx
import React from "react";
import BottomNav from "@/components/BottomNav";
import { ClientFAB as FAB } from "@/components/ClientFAB";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "@/app/(shell)/ClientDataContext";
import { RoleProvider } from "@/app/(shell)/RoleContext";
// 🎯 Import the AuthProvider from the correct path
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientOfflineStatusIndicator as OfflineStatusIndicator } from "@/components/ClientOfflineStatusIndicator";

// 🎯 Ensure globals.css is imported here
import './globals.css';

// Add metadata for better SEO and PWA support
export const metadata = {
  title: 'Thaiba Garden Media Manager',
  description: 'Media management system for Thaiba Garden',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#000000',
  appleMobileWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'black-translucent',
  // PWA metadata
  manifest: '/manifest.json',
};

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    // 🎯 Wrap all other providers with AuthProvider
    <AuthProvider>
      <RoleProvider>
        <ToastProvider>
          <ClientDataProvider>
            <html lang="en">
              <head>
                {/* Preload critical resources */}
                <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                
                {/* PWA meta tags */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#000000" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                
                {/* Service worker registration */}
                <script dangerouslySetInnerHTML={{
                  __html: `
                    if ('serviceWorker' in navigator) {
                      window.addEventListener('load', () => {
                        navigator.serviceWorker.register('/sw.js')
                          .then((registration) => {
                            console.log('Service Worker registered with scope:', registration.scope);
                          })
                          .catch((error) => {
                            console.log('Service Worker registration failed:', error);
                          });
                      });
                    }
                  `
                }} />
              </head>
              <body className="min-h-screen bg-black text-white">
                <main className="pb-24 pt-4">{children}</main>

                {/* Offline status indicator */}
                <OfflineStatusIndicator />

                {/* Put FAB here so it's centered above the BottomNav */}
                <FAB />

                {/* Bottom navigation remains single-source-of-truth */}
                <BottomNav />
              </body>
            </html>
          </ClientDataProvider>
        </ToastProvider>
      </RoleProvider>
    </AuthProvider>
  );
}