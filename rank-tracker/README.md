# Weldwood Rank Tracker — self-hosted

A branded keyword rank tracker that runs on your own domain (e.g.
`rank.weldwoodmarketing.com`). The browser talks only to your own Cloudflare
Function; that Function holds the Semrush API key and talks to Semrush. **The key
never reaches the browser.**

```
Browser  ──►  /api/research?domain=…   (Cloudflare Pages Function)  ──►  Semrush API
  ▲                                            │
  └──────────────  normalized JSON  ◄──────────┘
```

## What you need

1. **A Cloudflare account** (free tier is fine).
2. **A Semrush subscription with API access.** The API and its "units" are a
   separate entitlement from the normal Semrush login — confirm you have an
   **API key** (Semrush → *Subscription info / API units*). Each domain lookup
   here spends ~4–5 API units (one call each: overview, history, keywords,
   competitors, backlinks).
3. **Node.js 18+** on your machine.

## Local test (5 minutes)

```bash
cd rank-tracker
npm install
cp .dev.vars.example .dev.vars      # then edit .dev.vars and paste your key
npm run dev                          # opens http://localhost:8788
```

The page loads `weldwoodmarketing.com` by default; type any domain in the header
to research it.

## Deploy to Cloudflare Pages

```bash
npx wrangler login
npm run deploy                       # creates the "weldwood-rank-tracker" Pages project
```

Then set the secret (this is the important part — it's what keeps your key off
the client):

```bash
npx wrangler pages secret put SEMRUSH_API_KEY --project-name weldwood-rank-tracker
# paste your Semrush API key when prompted
```

> You can also do all of this in the dashboard: **Cloudflare → Workers & Pages →
> Create → Pages → connect this Git repo**, set the **root directory** to
> `rank-tracker` and **build output** to `public`, then add `SEMRUSH_API_KEY`
> under **Settings → Variables and Secrets → Secret**.

## Point your subdomain at it

**Cloudflare → your Pages project → Custom domains → Set up a custom domain →**
`rank.weldwoodmarketing.com`.

- If `weldwoodmarketing.com`'s DNS is already on Cloudflare, it wires the CNAME
  automatically.
- If DNS lives elsewhere (e.g. your host/registrar), add a **CNAME** record:
  `rank` → `weldwood-rank-tracker.pages.dev`.

Your WordPress site is untouched — this is a separate subdomain on separate
infrastructure.

## Config knobs (wrangler.toml / dashboard vars)

| Name | Default | What it does |
|------|---------|--------------|
| `SEMRUSH_API_KEY` | — | **Secret.** Your Semrush API key. Required. |
| `CACHE_TTL_HOURS` | `12` | How long an edge-cached domain result is reused before re-spending units. Set `0` to disable caching. |
| `ALLOW_ORIGIN` | same-origin | Only needed if you serve the frontend from a different origin than the API. |

## ⚠️ Verify the Semrush columns on first run

The Function (`functions/api/research.js`) maps Semrush's two-letter API column
codes into the dashboard's fields. Those mappings follow Semrush's documented
Analytics API, but they were written **without a live key to test against** — so
on your first real lookup, sanity-check a couple of numbers (keyword count,
a few positions) against the Semrush UI. If anything looks off, the column codes
are all centralized in the `research()` and `shape()` functions near the top of
`research.js` with comments — adjust and redeploy. (Tell Jake's Claude and it can
fix the mapping in minutes.)

## Notes

- **Position mix & "top-3 spots"** are computed from the top 100 keywords by
  traffic (one API call), so they reflect that sample; the headline keyword
  count is the site's true total from the overview call.
- **Rankings are Google US, desktop.** To track mobile, change `database` to
  `mobile-us` in `research.js`, or ask for a Desktop/Mobile toggle.
- **Cost control:** the 12-hour cache means repeat lookups of the same domain
  are free until the cache expires. Lower `CACHE_TTL_HOURS` for fresher data,
  raise it to spend fewer units.
