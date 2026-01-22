'use client';

import './globals.css';
// load design tokens and base (safe, non-invasive)
import "../design-system/base.css";
import { ReactNode, Suspense } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { Poppins } from 'next/font/google';

import WelcomeGate from '@/components/layout/WelcomeGate';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const useNewUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning={true}>
      <body className="min-h-screen" suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <WelcomeGate>
                {children}
              </WelcomeGate>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
