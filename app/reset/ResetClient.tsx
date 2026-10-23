'use client';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSite } from '@/components/SiteProvider';
import Shell from '@/components/Shell';

export default function ResetClient() {
  const token = useSearchParams().get('token') ?? '';
  const { openAuth, refresh } = useSite();
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('password') !== f.get('again')) { setErr('The two passwords do not match.'); return; }
    setErr(''); setBusy(true);
    const r = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: f.get('password') }) });
    setBusy(false);
    if (!r.ok) { setErr((await r.json()).error); return; }
    setDone(true); refresh();
  }

  return (
    <Shell title="Choose a new password">
      {done ? <div className="empty"><p role="status">Password changed. You were logged out everywhere, so please log in again.</p><button className="btn btn-dark inline" type="button" onClick={() => openAuth('login')}>Log in</button></div>
        : <form className="aform" onSubmit={submit}>
          <label className="f"><span>New password (min 8 characters)</span><input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
          <label className="f"><span>Type it again</span><input name="again" type="password" minLength={8} autoComplete="new-password" required /></label>
          {err && <p className="err dark" role="alert">{err}</p>}
          <button className="btn btn-dark inline" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        </form>}
    </Shell>
  );
}
