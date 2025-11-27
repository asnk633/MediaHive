import '../styles/tokens.css';
import './globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/context/ThemeProvider";

export const metadata = {
  title: 'Thaiba Garden',
  description: 'Media management system for Thaiba Garden',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#070607' }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* inside <head> of src/app/layout.tsx */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (!t) {
                    // detect system preference as fallback
                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    t = prefersDark ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', t);
                } catch (e) {
                  // ignore - localStorage not available
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}