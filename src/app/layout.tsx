import './globals.css';
// load design tokens and base (safe, non-invasive)
import "../design-system/base.css";
import { ReactNode } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/context/ThemeProvider";

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'MediaHive',
  description: 'Media management system for Thaiba Garden',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const useNewUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  return (
    <html lang="en" data-theme="dark" className={`dark ${poppins.variable}`} suppressHydrationWarning={true}>
      <body className="min-h-screen" suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}