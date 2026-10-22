'use client';
import { useEffect, useState } from 'react';
import { useSite } from './SiteProvider';

export default function Navbar() {
  const { openLogin } = useSite();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav${solid ? ' solid' : ''}`}>
      <a className="logo" href="#top">Roamora</a>
      <nav className={`links${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        <a href="#places">Destinations</a>
        <a href="#featured">Featured</a>
        <a href="#why">Why Roamora</a>
        <a href="#stories">Stories</a>
      </nav>
      <button className="btn btn-light" type="button" onClick={openLogin}>Login</button>
      <button className="burger" type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span /><span />
      </button>
    </header>
  );
}
