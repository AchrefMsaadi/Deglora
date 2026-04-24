# ✦ DEGLORA — Vercel Deployment Guide

> Rooted in Nature. Powered by Intelligence.

---

## Project Structure (Vercel-ready)

```
deglora-vercel/
├── vercel.json              ← Vercel config (routes static + API)
├── package.json             ← Node deps for serverless functions
├── .env.example             ← Copy → add to Vercel env vars
├── .gitignore
├── supabase-schema.sql      ← Run in Supabase SQL Editor first
│
├── public/                  ← All static files (Vercel serves this)
│   ├── index.html
│   ├── assets/logo.png
│   ├── css/
│   │   ├── main.css
│   │   ├── sections.css
│   │   ├── animations.css
│   │   └── components.css
│   └── js/
│       ├── supabase-client.js
│       ├── loader.js
│       ├── animations.js
│       ├── customize.js
│       ├── ai-quiz.js
│       ├── rewards.js
│       ├── cart.js
│       ├── payment.js
│       ├── auth.js
│       ├── qr-demo.js
│       └── main.js
│
└── api/                     ← Vercel Serverless Functions
    ├── recommend.js          ← POST /api/recommend  (AI blend)
    ├── qr-scan.js            ← POST /api/qr-scan    (bottle points)
    └── health.js             ← GET  /api/health     (status check)
```

---

## Deploy in 5 Steps

### 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial Deglora commit"
git remote add origin https://github.com/YOUR_USERNAME/deglora.git
git push -u origin main
```

### 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. **Framework Preset**: leave as **Other** (or Static)
4. **Root Directory**: leave as `.` (the repo root)
5. Click **Deploy** — Vercel auto-detects `vercel.json`

### 3 — Add Environment Variables

In Vercel: **Project → Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-your-key-here` |

> Without this key, the AI quiz uses built-in smart fallback blends — the site still works fully.

### 4 — Set up Supabase

1. In [supabase.com](https://supabase.com) → your project
2. **SQL Editor → New Query** → paste `supabase-schema.sql` → **Run**
3. Open `public/js/supabase-client.js` and set:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
// (get from Supabase Dashboard → Settings → API → Project URL)
const SUPABASE_KEY = 'sb_publishable_k-4meuDkhCyHmTQ5WuZdmw_GcVmlbgs';
```

4. Commit and push — Vercel auto-redeploys.

### 5 — Verify

After deploy, test these URLs:

| URL | Expected |
|-----|----------|
| `https://your-app.vercel.app/` | Deglora homepage |
| `https://your-app.vercel.app/api/health` | `{"status":"ok"}` |
| POST `https://your-app.vercel.app/api/recommend` | AI blend JSON |

---

## How It Works on Vercel

```
Browser request
    │
    ├── /                    → serves public/index.html
    ├── /css/main.css        → serves public/css/main.css
    ├── /js/auth.js          → serves public/js/auth.js
    │
    ├── /api/recommend       → runs api/recommend.js (serverless Node)
    ├── /api/qr-scan         → runs api/qr-scan.js   (serverless Node)
    └── /api/health          → runs api/health.js    (serverless Node)
```

The `vercel.json` sets `"outputDirectory": "public"` so all files inside
`public/` are served as static assets. Files inside `api/` are automatically
detected and deployed as serverless functions.

---

## Common Issues

**404 on homepage** — Make sure `index.html` is inside `public/` and `vercel.json` has `"outputDirectory": "public"`.

**API 404** — Check that `api/recommend.js` exists at repo root level, not inside `public/`.

**AI quiz not working** — Add `ANTHROPIC_API_KEY` in Vercel env vars. The site works without it (fallback blends are used).

**Supabase auth not working** — Update `SUPABASE_URL` in `public/js/supabase-client.js` with your actual project URL.

**Camera not working on deployed site** — Browsers require HTTPS for `getUserMedia`. Vercel provides HTTPS by default — this is fine.

---

*© 2024 Deglora · Made with ♥ in Tunisia*
