# Roamora

Travel booking website for India, built with Next.js (App Router) and TypeScript. Teal Lagoon colours with a Glass Tabs hero.

```bash
npm install
cp .env.example .env.local      # then edit it
npm run dev                     # http://localhost:3000
npm run build && npm start
```

Needs Node 20.9 or newer.

## Database: PostgreSQL
- **Production:** set `DATABASE_URL` to any PostgreSQL connection string (Neon, Supabase, Railway, AWS RDS, your own server). Tables are created automatically on first start and the 12 sample destinations are added.
- **Local development:** leave `DATABASE_URL` empty. A real Postgres that runs inside Node (PGlite) is used and saved in `./data/pglite`. Nothing to install.
- **Moving old data:** if you used the earlier SQLite version, copy it over once: start the app once with `DATABASE_URL` set (this creates the tables), then run `DATABASE_URL=... node scripts/sqlite-to-postgres.mjs data/roamora.db`.
- Works on Vercel, Netlify and other serverless hosts as long as `DATABASE_URL` points to a hosted Postgres. Use the provider's pooled connection string on serverless, and set `PG_POOL_MAX=1` or `2` there.

## Features
**Four things to book:** tours, hotels, flights and cars with driver. The tabs on the home page open the matching search.
- **Hotels** (`/hotels`): search by city or name, dates, guests, stars and price. Total for the stay with GST shown. GST follows the room rate: up to ₹1,000 nil, ₹1,001 to ₹7,500 12%, above ₹7,500 18%. Up to 3 guests per room, up to 5 rooms.
- **Flights** (`/flights`): search by from, to and date; only flights that operate on that weekday are shown, and if there are none you see which days it does run. Economy fare per person plus 5% GST, up to 9 passengers.
- **Cars with driver** (`/cars`): search by city, dates and type. Rate per day (driver, fuel and tolls for 250 km a day included) plus 5% GST.
- Every booking is a request: `requested` → `confirmed` by you → `paid`. Prices are always recalculated on the server. All four kinds show up in My trips, in emails and in the admin booking list.

**Destination guide and booking page**
- Click any destination card (home page or Tours) to open its page: places to see, food and cafés, things to do, visitor information (best time, how to reach, getting around, tips), day-by-day plan and reviews. Each of the 12 destinations has its own content.
- **Book This Trip** (in the page header, in the price card and in a bar at the bottom on phones) opens `/destinations/[slug]/book`: choose a Standard, Comfort or Premium package, dates, travellers, traveller details and special requests, with a live price breakdown (package price × travellers + 5% GST).
- Submitting uses the same booking workflow as everything else: saved as a request, shown in My Trips and Admin (with the package and the note), confirmation email sent, then confirm → pay.
- **Package prices** are the destination price times a multiplier (Standard ×1, Comfort ×1.4, Premium ×1.9 by default), so changing the destination price in Admin updates every package.
- **Everything in the guide is sample information**, shown with a notice on each page. Edit it in Admin > Tours (one line per place: `kind | type | name | description | image`). Photos in the sample guide are placeholders by category; set a real photo per item in Admin. Use `see`, `food` or `do` as the kind.

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

**Protection against abuse**
- Login: 5 wrong passwords per email from one IP, 30 per IP, and 25 per email across all IPs, each within 15 minutes, then "try again later" (HTTP 429). The real owner on a different IP is not locked out by one attacker. A large attack spread over many IPs against one email can still lock that account for up to 15 minutes; that is the trade-off for stopping password guessing.
- Per hour: 10 sign-ups per IP, 5 forgot-password requests per IP, 10 reset and 20 verify tries per IP, 10 booking requests and 10 reviews per user, 20 payment starts per user.
- Security headers on every page (no framing, no content sniffing, HTTPS only, restricted browser features).
- The IP comes from `X-Forwarded-For`, so host the site behind a proxy that sets it (Nginx, Cloudflare, Vercel). Without one, an attacker can fake the IP header; the per-email limits still apply.

**Admin (`/admin`)**
- Bookings: confirm requests, mark offline payments as paid, cancel. Counts and paid revenue at the top.
- Hotels, Flights and Cars tabs: add, edit and hide listings, rates, schedules (days of the week and times).
- Destinations: add, edit, hide. Price, days, text, image, highlights and the day-by-day plan. Existing bookings keep the price they were made at.
- Reviews: hide or show.

## Setup
1. **Admin access:** set `ADMIN_EMAILS` in `.env.local`, then register an account with that email. Register it first after deploying. Once SMTP is set up the admin must also click the verify link.
2. **Email (SMTP):** set `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` (Gmail app password, Brevo, Zoho, AWS SES and others work). Without `SMTP_HOST` nothing is sent; emails are only recorded in Admin > Emails (and printed to the server console when not in production).
3. **Payments (optional):** set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. In the Razorpay dashboard add a webhook to `https://YOUR-SITE/api/payments/webhook` for `payment.captured` and put its secret in `RAZORPAY_WEBHOOK_SECRET`. Use test keys first. Without keys, confirmed bookings show "we will share payment details" and admins can use **Mark paid**.
4. **Data:** on first run the 12 sample destinations are copied into the database. After that, change them in `/admin`, not in code.

## Booking flow
`requested` (traveller sends request) → `confirmed` (admin checks availability) → `paid` (Razorpay or admin marks paid). A traveller can cancel `requested` and `confirmed` bookings. Paid bookings must be cancelled by an admin, and refunds are done from the Razorpay dashboard (not automated).

## Before going live
- **Flights, hotels and cars are sample data.** The airlines (SkyIndia, Deccan Wings), flight numbers, hotels and car rates are made up so you can try the whole flow. Replace them in `/admin` with your real inventory. The site does not connect to airline or hotel systems, so seats and rooms are confirmed by your team after each request. Live fares and instant ticketing would need a partner API (for example Amadeus or a travel consolidator).
- Sample prices, plans, guide text (places, food, activities, visitor information) and photos are placeholders. The guide has no ratings and no restaurant prices or availability on purpose. Edit them in `/admin` (photos are Unsplash ids or any https image link).
- Not built yet: SMS and automatic WhatsApp messages (WhatsApp Business API), trip reminder emails, automatic refunds, live airline and hotel inventory (partner APIs), reviews for hotels and cars.
- Email sending was tested against a local test mail server, not against Gmail or another provider. Send yourself a test booking after you add your SMTP settings.
- Back up your database (most providers do this daily; check yours). Use SSL in `DATABASE_URL` (`?sslmode=require`) for hosted databases.
- Razorpay calls could not be tested against the live API from the build environment. The payment signature check, webhook and booking status changes were tested; do a test-mode payment before going live.

## Folders
- `app/` pages and API routes (`app/api/*`)
- `components/` UI
- `lib/` database (`db.ts`), auth, pricing, Razorpay helpers
- `scripts/sqlite-to-postgres.mjs` one-off data copy from the old SQLite version
- `design/templates.html` the 10 hero templates that were reviewed
