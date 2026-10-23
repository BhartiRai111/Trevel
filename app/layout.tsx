import type { Metadata, Viewport } from 'next';
import './globals.css';
import SiteProvider from '@/components/SiteProvider';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import VerifyBanner from '@/components/VerifyBanner';
import { Footer } from '@/components/HomeSections';
import { allDestinations } from '@/lib/repo';
import { EMPTY_EXPLORE } from '@/lib/destinations';
import { listItems } from '@/lib/catalog';
import type { Car, Hotel } from '@/lib/catalogMeta';
import type { Backdrops } from '@/lib/backdrop';
import Backdrop from '@/components/Backdrop';
import { Suspense } from 'react';

// destinations come from the database, so pages are rendered per request
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Roamora | Travel India, your way', template: '%s | Roamora' },
  description: 'Discover and book tours across India. Final price with GST shown upfront.'
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f8f86' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // cards need only the short fields; the guide, plan and packages are loaded by the destination pages
  const full = await allDestinations(true);
  const dests = full.map(d => ({ ...d, about: '', itinerary: [], explore: EMPTY_EXPLORE, packages: [], gallery: [] }));
  const [hotels, cars] = await Promise.all([listItems<Hotel>('hotel'), listItems<Car>('car')]);
  const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];
  const backdrops: Backdrops = {
    dest: Object.fromEntries(full.map(d => [d.slug, uniq([d.img, ...d.gallery])])),
    hotel: Object.fromEntries(hotels.map(h => [h.slug, [h.img]])),
    car: Object.fromEntries(cars.map(c => [c.slug, [c.img]])),
    hotels: uniq(hotels.map(h => h.img)).slice(0, 6), cars: uniq(cars.map(c => c.img)).slice(0, 6),
    all: uniq(full.map(d => d.img)).slice(0, 6)
  };
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteProvider dests={dests} backdrops={backdrops}>
          <Suspense fallback={null}><Backdrop /></Suspense>
          <Navbar />
          {children}
          <Footer />
          <AuthModal />
          <VerifyBanner />
        </SiteProvider>
      </body>
    </html>
  );
}
