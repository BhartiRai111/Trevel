import { db } from './db';
import { mailConfigured } from './env';

type Opts = { to: string; subject: string; text: string; html?: string; /** hide the body in the admin outbox (reset and verify links) */ sensitive?: boolean };

/**
 * Sends an email through SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM).
 * Every email is also recorded in the outbox table so admins can see what was sent.
 * Without SMTP settings nothing is sent: it is recorded as "logged" (and printed to the server console when not in production).
 * Never throws.
 */
export async function sendMail({ to, subject, text, html, sensitive }: Opts) {
  let status: 'sent' | 'failed' | 'logged' = 'logged';
  let error: string | null = null;
  if (mailConfigured()) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const port = Number(process.env.SMTP_PORT || 587);
      const tx = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port, secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        connectionTimeout: 10000, socketTimeout: 15000
      });
      await tx.sendMail({ from: process.env.MAIL_FROM || 'Roamora <no-reply@localhost>', to, subject, text, html });
      status = 'sent';
    } catch (e) { status = 'failed'; error = String((e as Error).message).slice(0, 200); }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[email not sent: SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
  }
  try {
    db().prepare('INSERT INTO outbox (to_addr, subject, body, status, error, created_at) VALUES (?,?,?,?,?,?)')
      .run(to, subject, sensitive ? '(contains a private link, not stored)' : text, status, error, Date.now());
  } catch { /* never fail the request because of logging */ }
  return status;
}
