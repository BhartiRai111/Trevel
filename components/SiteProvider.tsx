'use client';
import type { Destination } from '@/lib/destinations';
import type { Backdrops } from '@/lib/backdrop';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type User = { id: number; name: string; email: string; phone: string; isAdmin: boolean; emailVerified: boolean };
type AuthMode = 'login' | 'register' | 'forgot' | null;

type Ctx = {
  dests: Destination[];
  backdrops: Backdrops;
  user: User | null;
  mailEnabled: boolean;
  ready: boolean;
  saved: Set<string>;
  authMode: AuthMode;
  openAuth: (m?: 'login' | 'register' | 'forgot') => void;
  closeAuth: () => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  toggleSave: (slug: string) => Promise<void>;
};

const SiteContext = createContext<Ctx | null>(null);

export function useSite() {
  const c = useContext(SiteContext);
  if (!c) throw new Error('useSite must be used inside SiteProvider');
  return c;
}

export default function SiteProvider({ children, dests, backdrops }: { children: ReactNode; dests: Destination[]; backdrops: Backdrops }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [mailEnabled, setMailEnabled] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  const refresh = useCallback(async () => {
    try {
      const { user: u, mailEnabled: me } = await (await fetch('/api/auth/me')).json();
      setUser(u); setMailEnabled(!!me);
      if (u) {
        const { slugs } = await (await fetch('/api/saved')).json();
        setSaved(new Set<string>(slugs));
      } else setSaved(new Set());
    } catch { /* offline: stay logged out */ }
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    document.body.style.overflow = authMode ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAuthMode(null); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [authMode]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setSaved(new Set());
  }, []);

  const toggleSave = useCallback(async (slug: string) => {
    if (!user) { setAuthMode('login'); return; }
    const has = saved.has(slug);
    setSaved(s => { const n = new Set(s); has ? n.delete(slug) : n.add(slug); return n; });
    const res = await fetch(has ? `/api/saved?slug=${encodeURIComponent(slug)}` : '/api/saved', has ? { method: 'DELETE' } : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug })
    });
    if (!res.ok) refresh();
  }, [user, saved, refresh]);

  return (
    <SiteContext.Provider value={{ dests, backdrops, user, mailEnabled, ready, saved, authMode, openAuth: (m = 'login') => setAuthMode(m), closeAuth: () => setAuthMode(null), refresh, logout, toggleSave }}>
      {children}
    </SiteContext.Provider>
  );
}
