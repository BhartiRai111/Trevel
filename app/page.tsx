import Hero from '@/components/Hero';
import HomePlaces from '@/components/HomePlaces';
import { Featured, Why, How } from '@/components/HomeSections';

export default function Home() {
  return (
    <main id="top">
      <Hero />
      <HomePlaces />
      <Featured />
      <Why />
      <How />
    </main>
  );
}
