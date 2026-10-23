'use client';
import { useState, type FormEvent } from 'react';
import { img } from '@/lib/destinations';
import { useSite } from './SiteProvider';

export default function AuthModal() {
  const { authMode, openAuth, closeAuth, refresh } = useSite();
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  if (!authMode) return null;
  const reg = authMode === 'register';
  const forgot = authMode === 'forgot';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`/api/auth/${reg ? 'register' : forgot ? 'forgot' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Something went wrong. Please try again.'); return; }
      if (forgot) { setInfo(data.message); return; }
      await refresh(); closeAuth();
    } catch { setErr('Could not reach the server. Check your internet and try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal" onMouseDown={e => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="sheet photo" style={{ ['--img' as string]: `url('${img('/photos/kerala/alleppey-houseboats.jpg', 1000, 80)}')` }} role="dialog" aria-modal="true" aria-labelledby="lt">
        <button className="x" type="button" aria-label="Close" onClick={closeAuth}>×</button>
        <h2 id="lt">{reg ? 'Create account' : forgot ? 'Reset password' : 'Welcome!'}</h2>
        <form onSubmit={submit} key={authMode}>
          {reg && <label className="field"><span>👤</span><input name="name" type="text" placeholder="Full name" aria-label="Full name" autoComplete="name" required /></label>}
          <label className="field"><span>✉️</span><input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required /></label>
          {reg && <label className="field"><span>📱</span><input name="phone" type="tel" inputMode="numeric" placeholder="Mobile number (10 digits)" aria-label="Mobile number" autoComplete="tel" required /></label>}
          {!forgot && <label className="field"><span>🔒</span>
            <input name="password" type={showPw ? 'text' : 'password'} placeholder={reg ? 'Password (min 8 characters)' : 'Password'} aria-label="Password" autoComplete={reg ? 'new-password' : 'current-password'} minLength={reg ? 8 : undefined} required />
            <button type="button" className="eye" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(s => !s)}>👁</button>
          </label>}
          {!reg && !forgot && <p className="small fp"><button type="button" className="linkbtn" onClick={() => { setErr(''); openAuth('forgot'); }}>Forgot password?</button></p>}
          {err && <p className="err" role="alert">{err}</p>}
          {info && <p className="err okmsg" role="status">{info}</p>}
          <button className="btn btn-dark" type="submit" disabled={busy}>{busy ? 'Please wait…' : reg ? 'CREATE ACCOUNT' : forgot ? 'SEND RESET LINK' : 'LOG IN'}</button>
          <p className="small">
            {reg || forgot ? 'Back to ' : "Don't have an account? "}
            <button type="button" className="linkbtn" onClick={() => { setErr(''); setInfo(''); openAuth(reg || forgot ? 'login' : 'register'); }}>{reg || forgot ? 'log in' : 'Sign up'}</button>
          </p>
        </form>
      </div>
    </div>
  );
}
