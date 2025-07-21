import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import { AccessibilityProvider, SkipToContent } from '@/components/accessibility/AccessibilityProvider';
import { AIModelLoader } from '@/components/ai/AIModelLoader';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Reflexion - Cognitive Health Companion',
  description: 'Daily cognitive health monitoring and support for seniors',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Reflexion" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <AccessibilityProvider>
          <SkipToContent />
          <AIModelLoader>
            <main id="main-content" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              {children}
            </main>
          </AIModelLoader>
        </AccessibilityProvider>
        <Toaster />
      </body>
    </html>
  );
}