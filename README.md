# Roamora

Travel booking website for India, built with Next.js (App Router) and TypeScript. Teal Lagoon colours with a Glass Tabs hero.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

Needs Node 22.13 or newer (uses Node's built-in SQLite, no database to install).

## What works in this first version
- Home page with a search box; Tours search is live (Hotels, Flights and Cars show "coming soon").
- `/search` with text search, type filters, price slider, trip length and sorting.
- `/destinations/[slug]` with highlights, inclusions and a live price breakdown (base + 5% GST + ₹0 fee = total).
- Sign up and log in (email + password, mobile number validated for India). Passwords are hashed with scrypt; sessions use an httpOnly cookie.
- Save places (heart) and booking requests, stored in SQLite at `data/roamora.db` (created automatically, git-ignored).
- `/trips` shows saved places and booking requests, and lets you cancel a request.
- Prices are always recalculated on the server, never trusted from the browser.

## Before going live
- **Sample data:** prices, itineraries and photos in `lib/destinations.ts` are placeholders. Replace them with your real packages. Photos are Unsplash links; if one does not match the place, change its id there.
- **Payments:** bookings are saved as "requested" and no money is taken. Add Razorpay (UPI, cards, netbanking) next, then set status to `confirmed` after payment.
- **Email/SMS/WhatsApp confirmations**, password reset, rate limiting on login, and an admin screen to confirm bookings are not built yet.
- **Database:** SQLite is fine for one server. For hosting on Vercel-style platforms use a hosted database (Postgres) instead.
- **Reviews:** none are shown yet because none are real. Add verified reviews before showing ratings.
- Optional hero video: put a clip at `public/hero.mp4`.

## Folders
- `app/` pages and API routes (`app/api/*`)
- `components/` UI
- `lib/` destinations, pricing, database and auth
- `design/templates.html` the 10 hero templates that were reviewed
