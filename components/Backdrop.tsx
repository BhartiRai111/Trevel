'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { img } from '@/lib/destinations';
import { pickBackdrop } from '@/lib/backdrop';
import { useSite } from './SiteProvider';

const isVideo = (s: string) => /\.(mp4|webm)(\?.*)?$/i.test(s);
const MOTION = ['bd-zoom', 'bd-panl', 'bd-rise', 'bd-panr'];

function View({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI(n => (n + 1) % items.length), 8000);
    return () => clearInterval(id);
  }, [items.length]);
  return (
    <div className="backdrop" aria-hidden="true">
      {items.map((src, k) => isVideo(src)
        ? <video key={src} className={`bd${k === i ? ' on' : ''}`} src={src} autoPlay muted loop playsInline preload="metadata" />
        : <div key={src} className={`bd ${MOTION[k % MOTION.length]}${k === i ? ' on' : ''}`} style={{ backgroundImage: `url('${img(src, 2000, 75)}')` }} />)}
    </div>
  );
}

/** Full-screen animated background behind every page: photos of the place you are looking at, under a teal gradient. */
export default function Backdrop() {
  const path = usePathname();
  const sp = useSearchParams();
  const { backdrops, dests } = useSite();
  const items = pickBackdrop(path, sp, backdrops, dests);
  if (!items.length) return null;
  return <View key={items.join('|')} items={items} />; // new key = fresh slideshow when the place changes
}
