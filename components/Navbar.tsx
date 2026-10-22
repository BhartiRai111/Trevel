'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSite } from './SiteProvider';

export default function Navbar() {
  const { user, ready, openAuth, logout } = useSite();
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav${scrolled || path !== '/' ? ' solid' : ''}`}>
      <Link className="logo" href="/">Roamora</Link>
      <nav className={`links${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        <Link href="/search">Tours</Link>
        <Link href="/hotels">Hotels</Link>
        <Link href="/flights">Flights</Link>
        <Link href="/cars">Cars</Link>
        <Link href="/trips">My trips</Link>
        {user?.isAdmin && <Link href="/admin">Admin</Link>}
        {ready && (user
          ? <button className="linkbtn mobile-only" type="button" onClick={logout}>Log out</button>
          : <button className="linkbtn mobile-only" type="button" onClick={() => openAuth('login')}>Log in</button>)}
      </nav>
      {ready && (user ? (
        <div className="who"><span>Hi, {user.name.split(' ')[0]}</span><button className="btn btn-light" type="button" onClick={logout}>Log out</button></div>
      ) : (
        <button className="btn btn-light desk-only" type="button" onClick={() => openAuth('login')}>Log in</button>
      ))}
      <button className="burger" type="button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}><span /><span /></button>
    </header>
  );
}
