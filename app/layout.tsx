import type { Metadata, Viewport } from 'next';
import './globals.css';
import SiteProvider from '@/components/SiteProvider';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { Footer } from '@/components/HomeSections';

export const metadata: Metadata = {
  title: { default: 'Roamora | Travel India, your way', template: '%s | Roamora' },
  description: 'Discover and book tours across India. Final price with GST shown upfront.'
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f8f86' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteProvider>
          <Navbar />
          {children}
          <Footer />
          <AuthModal />
        </SiteProvider>
      </body>
    </html>
  );
}
