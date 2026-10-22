import SiteProvider from '@/components/SiteProvider';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Destinations from '@/components/Destinations';
import Featured from '@/components/Featured';
import Modals from '@/components/Modals';
import { Why, Stories, Cta, Footer } from '@/components/Sections';

export default function Home() {
  return (
    <SiteProvider>
      <Navbar />
      <main id="top">
        <Hero />
        <Destinations />
        <Featured />
        <Why />
        <Stories />
        <Cta />
      </main>
      <Footer />
      <Modals />
    </SiteProvider>
  );
}
