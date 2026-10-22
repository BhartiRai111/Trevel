# Roamora

Travel booking website for India, built with Next.js (App Router) and TypeScript. Teal Lagoon colours with a Glass Tabs hero.

```bash
npm install
cp .env.example .env.local      # then edit it
npm run dev                     # http://localhost:3000
npm run build && npm start
```

Needs Node 22.13 or newer (uses Node's built-in SQLite, no database to install).

## Features
**Travellers**
- Search and filter destinations; destination pages with highlights, a day-by-day plan, reviews and a live price breakdown (base + 5% GST + ₹0 fee = total).
- Sign up / log in (email + password, Indian mobile number validated). Save places. Send booking requests.
- **My trips:** pay online once a booking is confirmed (Razorpay), cancel requests, share a read-only trip plan link (shows no phone, email or price) and write a review after the trip.
- **Reviews:** only the traveller of a paid or confirmed booking, after the travel date, once per booking. Only first name and last initial are public.

**Emails and account safety**
- Emails for: booking requested (traveller + a new-booking alert to every admin), confirmed, paid, cancelled, plus verify-your-email and forgot-password links.
- Forgot password: one-hour link, one use, logs the user out everywhere. The answer is the same whether or not the email has an account.
- Email verification: new accounts get a link. When email is set up, an admin account must also be verified.
- Admin screen has an **Emails** tab (what was sent, and any errors) and a **WhatsApp** button on each booking that opens a ready message to the customer (no WhatsApp API needed).

**Admin (`/admin`)**
- Bookings: confirm requests, mark offline payments as paid, cancel. Counts and paid revenue at the top.
- Destinations: add, edit, hide. Price, days, text, image, highlights and the day-by-day plan. Existing bookings keep the price they were made at.
- Reviews: hide or show.

## Setup
1. **Admin access:** set `ADMIN_EMAILS` in `.env.local`, then register an account with that email. Register it first after deploying. Once SMTP is set up the admin must also click the verify link.
2. **Email (SMTP):** set `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` (Gmail app password, Brevo, Zoho, AWS SES and others work). Without `SMTP_HOST` nothing is sent; emails are only recorded in Admin > Emails (and printed to the server console when not in production).
3. **Payments (optional):** set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. In the Razorpay dashboard add a webhook to `https://YOUR-SITE/api/payments/webhook` for `payment.captured` and put its secret in `RAZORPAY_WEBHOOK_SECRET`. Use test keys first. Without keys, confirmed bookings show "we will share payment details" and admins can use **Mark paid**.
4. **Data:** on first run the 12 sample destinations are copied into `data/roamora.db` (git-ignored). After that, change them in `/admin`, not in code.

## Booking flow
`requested` (traveller sends request) → `confirmed` (admin checks availability) → `paid` (Razorpay or admin marks paid). A traveller can cancel `requested` and `confirmed` bookings. Paid bookings must be cancelled by an admin, and refunds are done from the Razorpay dashboard (not automated).

## Before going live
- Sample prices, plans and photos are placeholders. Edit them in `/admin` (photos are Unsplash ids or any https image link).
- Not built yet: SMS and automatic WhatsApp messages (WhatsApp Business API), trip reminder emails, login rate limiting, automatic refunds, Hotels / Flights / Cars search.
- Email sending was tested against a local test mail server, not against Gmail or another provider. Send yourself a test booking after you add your SMTP settings.
- SQLite is fine for one server. On Vercel-style hosting use a hosted database instead.
- Razorpay calls could not be tested against the live API from the build environment. The payment signature check, webhook and booking status changes were tested; do a test-mode payment before going live.

## Folders
- `app/` pages and API routes (`app/api/*`)
- `components/` UI
- `lib/` database, auth, pricing, Razorpay helpers
- `design/templates.html` the 10 hero templates that were reviewed
