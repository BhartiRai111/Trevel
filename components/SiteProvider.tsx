'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Ctx = {
  query: string;
  setQuery: (q: string) => void;
  openLogin: () => void;
  openBook: (name?: string) => void;
  closeAll: () => void;
  modal: 'login' | 'book' | null;
  bookName: string;
};

const SiteContext = createContext<Ctx | null>(null);

export function useSite() {
  const c = useContext(SiteContext);
  if (!c) throw new Error('useSite must be used inside SiteProvider');
  return c;
}

export default function SiteProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'login' | 'book' | null>(null);
  const [bookName, setBookName] = useState('Hill Track');

  const closeAll = useCallback(() => setModal(null), []);
  const openLogin = useCallback(() => setModal('login'), []);
  const openBook = useCallback((name = 'Hill Track') => { setBookName(name); setModal('book'); }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [modal]);

  return (
    <SiteContext.Provider value={{ query, setQuery, openLogin, openBook, closeAll, modal, bookName }}>
      {children}
    </SiteContext.Provider>
  );
}
