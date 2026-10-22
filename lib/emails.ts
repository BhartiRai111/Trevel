import { one } from './db';
import { adminEmailList, siteUrl } from './env';
import { inr } from './pricing';
import { sendMail } from './mail';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function layout(title: string, lines: string[], cta?: { label: string; url: string }) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0d2a28">
<h2 style="color:#0f8f86;margin:0 0 12px">Roamora</h2><h3 style="margin:0 0 12px">${esc(title)}</h3>
${lines.map(l => `<p style="line-height:1.5;margin:8px 0">${esc(l)}</p>`).join('')}
${cta ? `<p><a href="${esc(cta.url)}" style="background:#0f8f86;color:#fff;padding:12px 22px;border-radius:99px;text-decoration:none;display:inline-block">${esc(cta.label)}</a></p><p style="font-size:12px;color:#5a7471">Or open: ${esc(cta.url)}</p>` : ''}
</div>`;
  const text = [title, '', ...lines, ...(cta ? ['', `${cta.label}: ${cta.url}`] : []), '', '— Roamora'].join('\n');
  return { html, text };
}

type B = { id: number; ref: string; kind: string; travel_date: string; end_date: string | null; travellers: number; units: number; total: number; status: string; user_name: string; email: string; trip: string | null; slug: string };
const when = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/** Emails for a booking event. Never throws. Call it after the response is sent (see next/server `after`). */
export async function notifyBooking(kind: 'requested' | 'confirmed' | 'paid' | 'cancelled', bookingId: number) {
  try {
    const b = await one<B>(
      `SELECT b.id, b.ref, b.kind, b.travel_date, b.end_date, b.travellers, b.units, b.total, b.status, b.slug, u.name AS user_name, u.email, COALESCE(b.title, d.name) AS trip
         FROM bookings b JOIN users u ON u.id = b.user_id LEFT JOIN destinations d ON d.slug = b.slug WHERE b.id = $1`, [bookingId]);
    if (!b) return;
    const trip = b.trip ?? b.slug, first = b.user_name.split(/\s+/)[0];
    const who = b.kind === 'hotel' ? `${b.units} ${b.units === 1 ? 'room' : 'rooms'}, ${b.travellers} ${b.travellers === 1 ? 'guest' : 'guests'}` : b.kind === 'flight' ? `${b.travellers} ${b.travellers === 1 ? 'passenger' : 'passengers'}` : `${b.travellers} ${b.travellers === 1 ? 'traveller' : 'travellers'}`;
    const dates = b.end_date ? `${when(b.travel_date)} to ${when(b.end_date)}` : when(b.travel_date);
    const detail = `${trip} · ${dates} · ${who} · ${inr(b.total)} (GST included)`;
    const url = `${siteUrl()}/trips`;
    const msgs = {
      requested: { s: `We got your request ${b.ref}`, t: 'Booking request received', l: [`Hi ${first}, thanks for your request.`, detail, 'We will check availability and confirm soon. No payment has been taken.'], cta: 'View my trips' },
      confirmed: { s: `Confirmed: ${trip} (${b.ref})`, t: 'Your booking is confirmed', l: [`Hi ${first}, good news. ${trip} is available on your dates.`, detail, 'Please complete the payment from My trips, or wait for our payment details.'], cta: 'Pay now' },
      paid: { s: `Payment received for ${b.ref}`, t: 'Payment received', l: [`Hi ${first}, we received your payment. Your trip is booked.`, detail, 'You can share your day-by-day plan with friends from My trips.'], cta: 'View my trips' },
      cancelled: { s: `Booking ${b.ref} cancelled`, t: 'Booking cancelled', l: [`Hi ${first}, your booking has been cancelled.`, detail, 'If you paid already, contact us about your refund and quote your booking reference.'], cta: 'View my trips' }
    }[kind];
    const m = layout(msgs.t, msgs.l, { label: msgs.cta, url });
    await sendMail({ to: b.email, subject: msgs.s, text: m.text, html: m.html });

    if (kind === 'requested') {
      const a = layout('New booking request', [`${b.user_name} requested ${detail}.`, `Reference ${b.ref}.`], { label: 'Open admin', url: `${siteUrl()}/admin` });
      for (const to of adminEmailList()) await sendMail({ to, subject: `New booking request ${b.ref}`, text: a.text, html: a.html });
    }
  } catch (e) { console.error('notifyBooking failed', e); }
}

export async function sendVerifyEmail(to: string, name: string, link: string) {
  const m = layout('Verify your email', [`Hi ${name.split(/\s+/)[0]}, please confirm this email address for your Roamora account.`, 'The link works for 48 hours.'], { label: 'Verify email', url: link });
  return sendMail({ to, subject: 'Verify your Roamora email', text: m.text, html: m.html, sensitive: true });
}

export async function sendResetEmail(to: string, name: string, link: string) {
  const m = layout('Reset your password', [`Hi ${name.split(/\s+/)[0]}, we got a request to reset your password.`, 'The link works for 1 hour. If this was not you, ignore this email and your password stays the same.'], { label: 'Choose a new password', url: link });
  return sendMail({ to, subject: 'Reset your Roamora password', text: m.text, html: m.html, sensitive: true });
}
