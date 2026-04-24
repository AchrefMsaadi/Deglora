# ✦ DEGLORA
**Premium Tunisian Granola + Date Jam — Luxury Web Experience**
> Rooted in Nature. Powered by Intelligence.

---

## Project Structure

```
deglora/
├── frontend/
│   ├── index.html               ← Single-page app entry point
│   ├── assets/logo.png
│   ├── css/
│   │   ├── main.css             ← Variables, reset, nav, hero
│   │   ├── sections.css         ← Section layouts
│   │   ├── animations.css       ← Reveal states, mobile menu
│   │   └── components.css       ← Auth, cart, payment, QR, dropdown
│   └── js/
│       ├── supabase-client.js   ← Supabase init + DB helpers
│       ├── loader.js            ← Page loader
│       ├── animations.js        ← GSAP, parallax, cursor
│       ├── customize.js         ← Blend builder UI
│       ├── ai-quiz.js           ← AI quiz + API call
│       ├── rewards.js           ← Points counter
│       ├── cart.js              ← Shopping cart panel
│       ├── payment.js           ← 3-step checkout
│       ├── auth.js              ← Supabase auth module
│       ├── qr-demo.js           ← Camera + file import + demo QR
│       └── main.js              ← General polish
│
├── backend/
│   ├── server.js                ← Express API
│   ├── supabase-schema.sql      ← RUN THIS IN SUPABASE FIRST
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Quick Start

### 1 — Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and open your project
2. **SQL Editor → New Query** → paste `backend/supabase-schema.sql` → Run
3. This creates tables: `profiles`, `orders`, `qr_scans` + RLS policies + `increment_points` RPC

### 2 — Connect Frontend to Supabase

Edit `frontend/js/supabase-client.js`:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
// Get URL from: Supabase Dashboard > Settings > API > Project URL
const SUPABASE_KEY = 'sb_publishable_k-4meuDkhCyHmTQ5WuZdmw_GcVmlbgs';
```

### 3 — Open the Frontend

```bash
cd frontend
npx serve .          # or just open index.html in a browser
```

Everything works offline — Supabase auth needs internet but AI quiz has a smart fallback.

### 4 — Backend (optional — for real AI responses)

```bash
cd backend
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm start              # http://localhost:3001
```

---

## Features

### Navbar
- Transparent over hero (cream text on dark background)
- Scrolls to bright **cream** background (logo visible in dark circular wrapper)
- Right cluster: points chip (signed-in only) + auth button + Build Your Mix CTA

### Authentication
- Sign up / sign in via Supabase Auth
- Profile row auto-created in `public.profiles` on sign-up
- Points chip in navbar only visible when signed in
- Initials avatar replaces Sign In button when authenticated
- User dropdown: name, email, points, sign out

### Cart and Payment
1. Add blends from Customize or AI sections
2. Cart slide-in panel → Proceed to Checkout
3. Full-page payment flow (3 steps):
   - **Shipping**: name, phone, address, city, postal, country
   - **Payment**: card / cash on delivery / D17 Flouci + redeem points toggle
   - **Confirm**: order review, T&C, place order
4. Order saved to Supabase `orders` table
5. Points earned and redeemed synced to `profiles`

### QR Scanner (3 modes)
- **Camera**: real device camera via `getUserMedia`, jsQR live decode
- **Import**: drag & drop or file picker, jsQR reads image
- **Demo**: tap DGL-001/002/003 to simulate scan

### AI Recommendation
- 4-question quiz → POST to backend → Anthropic Claude API
- Smart client-side fallback (works without backend)

### Rewards
- Earn 50 pts per new QR scan, 5 pts re-scan
- Earn 1.5 pts per TND spent on orders
- 10 pts = 1 TND discount at checkout
- Tiers: Seed → Oat → Date

---

## Supabase Tables

| Table | Fields |
|-------|--------|
| `profiles` | id, email, full_name, points, tier |
| `orders` | id, user_id, items, total_tnd, shipping, payment, pts_earned, status |
| `qr_scans` | id, user_id, qr_code, pts_earned, scanned_at |

---

## Colour Palette

| Name | Hex |
|------|-----|
| Royal Burgundy | `#722f37` |
| Deep Burgundy | `#8b1538` |
| Sienna | `#a0522d` |
| Cream | `#f5f5dc` |
| Gold | `#c9a84c` |

---

*© 2024 Deglora · Made with love in Tunisia*
