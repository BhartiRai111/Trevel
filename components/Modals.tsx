'use client';
import { useState, type FormEvent } from 'react';
import { unsplash } from '@/lib/places';
import { useSite } from './SiteProvider';

export default function Modals() {
  const { modal, closeAll, bookName } = useSite();
  const [showPw, setShowPw] = useState(false);
  const [booked, setBooked] = useState(false);
  if (!modal) return null;

  const close = (e: React.MouseEvent) => { if (e.target === e.currentTarget) closeAll(); };

  if (modal === 'login') {
    return (
      <div className="modal" onClick={close}>
        <div className="sheet photo" style={{ ['--img' as string]: `url('${unsplash('photo-1488646953014-85cb44e25828', 1000, 80)}')` }} role="dialog" aria-modal="true" aria-labelledby="lt">
          <button className="x" type="button" aria-label="Close" onClick={closeAll}>×</button>
          <h2 id="lt">Welcome!</h2>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); closeAll(); }}>
            <label className="field"><span>👤</span><input type="text" placeholder="Username" aria-label="Username" required /></label>
            <label className="field"><span>🔒</span>
              <input type={showPw ? 'text' : 'password'} placeholder="Password" aria-label="Password" required />
              <button type="button" className="eye" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(s => !s)}>👁</button>
            </label>
            <div className="row"><label><input type="checkbox" /> Remember me</label><a href="#">Forgot password?</a></div>
            <button className="btn btn-dark" type="submit">LOGIN</button>
            <p className="small">Don&apos;t have an account? <a href="#">Sign up</a></p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal" onClick={close}>
      <div className="sheet plain" role="dialog" aria-modal="true" aria-labelledby="bt">
        <button className="x dark" type="button" aria-label="Close" onClick={() => { setBooked(false); closeAll(); }}>×</button>
        <h2 id="bt">Book {bookName}</h2>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); setBooked(true); }}>
          <label className="f"><span>Name</span><input type="text" required /></label>
          <label className="f"><span>Date</span><input type="date" required /></label>
          <label className="f"><span>People</span><input type="number" min={1} max={20} defaultValue={2} required /></label>
          <button className="btn btn-dark" type="submit">Confirm booking</button>
        </form>
        {booked && <p className="ok dark">You&apos;re booked! A confirmation is on its way.</p>}
      </div>
    </div>
  );
}
