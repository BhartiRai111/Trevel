'use client';
import { useState } from 'react';
import { useSite } from './SiteProvider';

/** Asks signed-in users to verify their email (only when email sending is set up). */
export default function VerifyBanner() {
  const { user, mailEnabled } = useSite();
  const [state, setState] = useState<'idle' | 'sent' | 'hidden'>('idle');
  const [err, setErr] = useState('');
  if (!user || user.emailVerified || !mailEnabled || state === 'hidden') return null;

  async function resend() {
    setErr('');
    const r = await fetch('/api/auth/resend', { method: 'POST' });
    if (r.ok) setState('sent'); else setErr((await r.json()).error || 'Could not send.');
  }
  return (
    <div className="vbar" role="status">
      <span>{state === 'sent' ? `We sent a link to ${user.email}. Check your inbox.` : `Please verify your email (${user.email}).`}{err && ` ${err}`}</span>
      {state === 'idle' && <button className="linkbtn" type="button" onClick={resend}>Send link again</button>}
      <button className="linkbtn" type="button" aria-label="Dismiss" onClick={() => setState('hidden')}>×</button>
    </div>
  );
}
