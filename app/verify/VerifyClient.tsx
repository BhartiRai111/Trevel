'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSite } from '@/components/SiteProvider';

export default function VerifyClient() {
  const token = useSearchParams().get('token') ?? '';
  const { refresh } = useSite();
  const [res, setRes] = useState<{ ok: boolean; msg: string } | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; ran.current = true; // the link works once, so call the API only once
    (async () => {
      const r = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const d = await r.json();
      setRes({ ok: r.ok, msg: r.ok ? 'Your email is verified. Thank you!' : d.error });
      if (r.ok) refresh();
    })();
  }, [token, refresh]);

  return (
    <main className="page"><h1 className="ph">Verify email</h1>
      <div className="empty">{res ? <><p role="status">{res.msg}</p><Link className="btn btn-dark inline" href={res.ok ? '/search' : '/'}>{res.ok ? 'Find a trip' : 'Go home'}</Link></> : <p>Checking your link…</p>}</div>
    </main>
  );
}
