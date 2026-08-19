// ============================================================
//  GET /api/research?domain=example.com[&db=us]
//  Cloudflare Pages Function. Calls the Semrush Analytics API
//  server-side (key stays secret), normalizes the CSV into one
//  JSON payload the frontend renders directly.
//
//  Secret required:  SEMRUSH_API_KEY   (wrangler secret / dashboard)
//  Optional vars:    CACHE_TTL_HOURS (default 12), ALLOW_ORIGIN (default same-origin)
//
//  NOTE: Semrush's Analytics API uses two-letter column codes. The
//  mappings below follow the documented API; if a field looks off on
//  your account, adjust the code in COLS and redeploy — everything is
//  centralized here on purpose.
// ============================================================

const ANALYTICS = "https://api.semrush.com/";
const BACKLINKS = "https://api.semrush.com/analytics/v1/";

// intent codes → single letter
const IMAP = { "0": "C", "1": "I", "2": "N", "3": "T" };
const DIRECTORIES = new Set(["yelp.com","clutch.co","designrush.com","bbb.org","thumbtack.com","manta.com","birdeye.com","upcity.com","goodfirms.co","expertise.com","g2.com","trustpilot.com","indeed.com","linkedin.com","facebook.com","semrush.com","sortlist.com","angi.com","houzz.com"]);

const num = (v) => Number(String(v ?? "").replace(/[^0-9.\-]/g, "")) || 0;
const clean = (s) => String(s || "").trim().toLowerCase()
  .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\s+/g, "");

function jsonResponse(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin || "*",
      "cache-control": "no-store",
    },
  });
}

// --- Semrush call helpers -------------------------------------------------
async function sem(base, key, params) {
  const url = new URL(base);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cf: { cacheTtl: 0 } });
  const text = (await res.text()).trim();
  // Semrush reports errors as plain text: "ERROR 50 :: NOTHING FOUND"
  if (/^ERROR\s+\d+/i.test(text)) {
    const m = text.match(/^ERROR\s+(\d+)\s*::\s*(.*)$/i);
    const e = new Error(m ? m[2] : text);
    e.semCode = m ? Number(m[1]) : 0;
    e.semText = text;
    throw e;
  }
  return text;
}
// parse semicolon CSV → array of arrays (no header)
const rows = (txt) => String(txt).trim().split(/\r?\n/).slice(1).map((l) => l.split(";"));

// --- normalize everything into the view state ----------------------------
function shape(domain, raw, totalTraffic) {
  // KEYWORDS  (Ph Po Pp Pd Nq Cp Ur Tr Kd In)
  const kw = rows(raw.organic).map((r) => {
    const sharePct = num(r[7]);
    return {
      keyword: r[0] || "",
      position: num(r[1]),
      prev: num(r[2]),
      diff: num(r[3]),
      volume: num(r[4]),
      cpc: num(r[5]),
      url: r[6] || "",
      traffic: Math.round((sharePct / 100) * totalTraffic),
      kd: num(r[8]),
      intent: IMAP[(String(r[9] || "0").match(/\d/) || ["0"])[0]] || "C",
    };
  }).filter((r) => r.keyword);

  // POSITION BUCKETS from the fetched sample
  const b = { t3: 0, t410: 0, t1120: 0, t2130: 0, t3150: 0, t51: 0 };
  for (const r of kw) {
    const p = r.position;
    if (p <= 3) b.t3++; else if (p <= 10) b.t410++; else if (p <= 20) b.t1120++;
    else if (p <= 30) b.t2130++; else if (p <= 50) b.t3150++; else b.t51++;
  }
  const pos = [
    { lab: "Top 3", n: b.t3 }, { lab: "4–10", n: b.t410 }, { lab: "11–20", n: b.t1120 },
    { lab: "21–30", n: b.t2130 }, { lab: "31–50", n: b.t3150 }, { lab: "51–100", n: b.t51 },
  ];
  const top3 = b.t3, top10 = b.t3 + b.t410;

  // HISTORY  (Rk Or Ot Oc Dt) — ascending, last 24
  let hist = rows(raw.history).map((r) => ({
    d: String(r[4] || "").replace(/-/g, ""), kw: num(r[1]), tr: num(r[2]),
  })).filter((h) => h.d.length >= 6).sort((a, b) => (a.d < b.d ? -1 : 1))
    .map((h) => ({ m: h.d.slice(0, 4) + "-" + h.d.slice(4, 6), kw: h.kw, tr: h.tr }));
  if (hist.length > 24) hist = hist.slice(hist.length - 24);

  // COMPETITORS  (Dn Cr Np Ot)
  const comp = rows(raw.competitors).map((r) => ({
    d: (r[0] || "").toLowerCase(), rel: num(r[1]), ck: num(r[2]), tr: num(r[3]),
  })).filter((c) => c.d && c.d !== domain).slice(0, 8)
    .map((c) => ({ ...c, tag: DIRECTORIES.has(c.d) ? "Directory" : "Competitor" }));

  return { kw, pos, top3, top10, hist, comp };
}

function yoy(hist, sel) {
  if (hist.length < 2) return null;
  const a = sel(hist[0]), b = sel(hist[hist.length - 1]);
  if (a <= 0) return b > 0 ? { v: "new", dir: "up" } : null;
  const r = b / a;
  if (r >= 1.9) return { v: Math.round(r * 10) / 10 + "×", dir: "up" };
  const pct = Math.round((r - 1) * 100);
  return { v: (pct >= 0 ? "+" : "") + pct + "%", dir: pct >= 0 ? "up" : "down" };
}

async function research(domain, db, key) {
  // 1) domain overview → headline totals
  const overviewTxt = await sem(ANALYTICS, key, {
    type: "domain_rank", domain, database: db, export_columns: "Dn,Rk,Or,Ot,Oc",
  });
  const ov = rows(overviewTxt)[0] || [];
  const totalKw = num(ov[2]), totalTraffic = num(ov[3]), totalCost = num(ov[4]);

  // 2) the rest in parallel (tolerate individual failures)
  const [history, organic, competitors, backlinks] = await Promise.allSettled([
    sem(ANALYTICS, key, { type: "domain_rank_history", domain, database: db, export_columns: "Rk,Or,Ot,Oc,Dt" }),
    sem(ANALYTICS, key, { type: "domain_organic", domain, database: db, display_limit: "100", display_sort: "tr_desc", export_columns: "Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Kd,In" }),
    sem(ANALYTICS, key, { type: "domain_organic_organic", domain, database: db, display_limit: "10", display_sort: "np_desc", export_columns: "Dn,Cr,Np,Ot" }),
    sem(BACKLINKS, key, { type: "backlinks_overview", target: domain, target_type: "root_domain", export_columns: "ascore,total,domains_num" }),
  ]);
  const val = (s) => (s.status === "fulfilled" ? s.value : "");

  const raw = { history: val(history), organic: val(organic), competitors: val(competitors) };
  const s = shape(domain, raw, totalTraffic);

  const bl = rows(val(backlinks))[0] || [];
  const authority = num(bl[0]), totalBacklinks = num(bl[1]), refDomains = num(bl[2]);

  const kpis = [
    { label: "Authority Score", val: authority ? String(authority) : "—", sub: "/100", meter: authority, foot: refDomains ? refDomains.toLocaleString() + " ref. domains" : "Backlink strength" },
    { label: "Ranking keywords", val: totalKw.toLocaleString(), delta: yoy(s.hist, (h) => h.kw), foot: s.hist.length > 1 ? "vs " + s.hist.length + " mo ago" : "organic" },
    { label: "Monthly traffic", val: totalTraffic.toLocaleString(), delta: yoy(s.hist, (h) => h.tr), foot: s.hist.length > 1 ? "vs " + s.hist.length + " mo ago" : "est. visits" },
    { label: "Traffic value", val: "$" + totalCost.toLocaleString(), sub: "/mo", foot: "PPC equivalent" },
    { label: "Backlinks", val: totalBacklinks ? totalBacklinks.toLocaleString() : "—", foot: refDomains ? refDomains.toLocaleString() + " ref. domains" : "total links" },
    { label: "Top-3 spots", val: s.top3.toLocaleString(), foot: s.top10.toLocaleString() + " in the top 10" },
  ];

  return {
    domain, db,
    kw: totalKw, traffic: totalTraffic,
    kpis, hist: s.hist, pos: s.pos, rows: s.kw, comp: s.comp,
    sampleNote: "Position mix & top-3 counts are from the top " + s.kw.length + " keywords by traffic.",
    updated: Date.now(),
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = env.ALLOW_ORIGIN || new URL(request.url).origin;
  const key = env.SEMRUSH_API_KEY;
  if (!key) return jsonResponse({ error: "config", message: "SEMRUSH_API_KEY is not set on the server." }, 500, origin);

  const domain = clean(new URL(request.url).searchParams.get("domain"));
  const db = (new URL(request.url).searchParams.get("db") || "us").toLowerCase();
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return jsonResponse({ error: "bad_domain", message: "Enter a valid domain, e.g. example.com" }, 400, origin);
  }

  // edge cache to conserve Semrush units
  const ttl = Math.max(0, Number(env.CACHE_TTL_HOURS ?? 12)) * 3600;
  const cacheKey = new Request(new URL("/api/research?domain=" + domain + "&db=" + db, request.url).toString(), request);
  const cache = caches.default;
  if (ttl > 0) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  try {
    const data = await research(domain, db, key);
    const body = JSON.stringify(data);
    const resp = new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": origin,
        "cache-control": ttl > 0 ? `public, max-age=${ttl}` : "no-store",
      },
    });
    if (ttl > 0) context.waitUntil(cache.put(cacheKey, resp.clone()));
    return resp;
  } catch (e) {
    // Semrush "NOTHING FOUND" (code 50) → treat as no-data, not a hard error
    if (e.semCode === 50) return jsonResponse({ error: "no_data", message: "Semrush has no US data for " + domain + "." }, 404, origin);
    if (e.semCode === 120 || e.semCode === 130 || e.semCode === 132) return jsonResponse({ error: "auth", message: "Semrush rejected the API key (check the key / API access)." }, 502, origin);
    return jsonResponse({ error: "upstream", message: "Semrush request failed: " + (e.message || "unknown") }, 502, origin);
  }
}
