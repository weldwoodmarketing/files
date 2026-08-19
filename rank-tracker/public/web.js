// ============================================================
//  Frontend — fetches normalized JSON from /api/research
//  (the Cloudflare Function that holds the Semrush key).
// ============================================================
const INAME = { C: "Commercial", I: "Informational", N: "Navigational", T: "Transactional" };
const $ = (s) => document.getElementById(s);
const fmt = (n) => Number(n || 0).toLocaleString();
const clean = (s) => String(s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\s+/g, "");

let state = null, busy = false, sortK = "position", sortDir = 1, fInt = "all", fPos = "all", fQ = "";
const tip = $("tip");

// ---------- fetch + orchestrate ----------
async function go(domainRaw) {
  if (busy) return;
  const domain = clean(domainRaw);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) { showError("bad_domain"); return; }
  busy = true; document.body.classList.add("is-busy");
  $("domGo").disabled = true; $("refreshBtn").classList.add("spin"); setStatus("loading");
  try {
    const res = await fetch("/api/research?domain=" + encodeURIComponent(domain) + "&db=us", { headers: { accept: "application/json" } });
    const data = await res.json().catch(() => ({ error: "upstream" }));
    if (!res.ok || data.error) { showError(data.error || "upstream", data.message); return; }
    render(data);
    document.title = "Rank Tracker — " + data.domain;
  } catch (e) {
    showError("network");
  } finally {
    busy = false; document.body.classList.remove("is-busy");
    $("domGo").disabled = false; $("refreshBtn").classList.remove("spin");
  }
}

// ---------- render ----------
const upSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>`;
const dnSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

function render(s) {
  state = s;
  $("errZone").hidden = true; $("dash").hidden = false;
  $("hDom").textContent = s.domain;
  $("hKw").textContent = s.kw ? fmt(s.kw) : "0";
  $("nowKw").textContent = s.kw ? fmt(s.kw) : "0";
  $("nowTr").textContent = fmt(s.traffic);
  $("readout").innerHTML = s.kpis.map((k) => {
    const d = k.delta ? `<span class="tag ${k.delta.dir}">${k.delta.dir === "up" ? upSvg : dnSvg}${k.delta.v}</span>` : "";
    const meter = k.meter != null ? `<div class="as-meter"><i style="width:${Math.min(100, k.meter)}%"></i></div>` : "";
    return `<div class="stat"><div class="s-lab">${k.label}</div><div class="s-val">${k.val}${k.sub ? `<small>${k.sub}</small>` : ""}</div>${meter}<div class="s-foot">${d}<span>${k.foot}</span></div></div>`;
  }).join("");
  drawArea($("kwHost"), s.hist, "kw", (v) => v + " keywords");
  drawArea($("trHost"), s.hist, "tr", (v) => v + " visits");
  const posMax = Math.max(1, ...s.pos.map((p) => p.n));
  const shades = ["var(--gold)", "var(--teal)", "color-mix(in srgb,var(--teal) 76%,var(--muted))", "color-mix(in srgb,var(--teal) 54%,var(--muted))", "color-mix(in srgb,var(--teal) 34%,var(--muted))", "color-mix(in srgb,var(--muted) 72%,transparent)"];
  $("posbars").innerHTML = s.pos.map((p, i) => `<div class="posrow"><div class="plab">${p.lab}</div><div class="ptrack" title="${p.n} keywords in positions ${p.lab}"><div class="pfill" style="width:${(p.n / posMax * 100).toFixed(1)}%;background:${shades[i]}"></div></div><div class="pnum">${fmt(p.n)}</div></div>`).join("");
  const compMax = Math.max(0.01, ...s.comp.map((c) => c.rel));
  const favColors = ["#83b19c", "#efc84b", "#c65f38", "#a2cbb8", "#f6d970", "#d9a37c", "#8a8474", "#6b6558"];
  $("compRows").innerHTML = s.comp.length ? s.comp.map((c, i) => `<div class="comprow"><div class="cd"><span class="fav" style="background:${favColors[i % favColors.length]}">${(c.d[0] || "?").toUpperCase()}</span>${c.d}<span class="tag2">${c.tag}</span></div><div class="rel"><span class="rt"><i style="width:${(c.rel / compMax * 100).toFixed(0)}%"></i></span><span class="rv">${c.rel.toFixed(2)}</span></div><div class="ck">${fmt(c.ck)}<small>keywords</small></div></div>`).join("") : `<div class="empty"><div class="em"></div><p>No overlapping competitors found.</p></div>`;
  renderTable();
  setStatus("live");
}

// ---------- area chart ----------
function drawArea(host, data, key, label) {
  const old = host.querySelector("svg"); if (old) old.remove();
  const W = 520, H = 176, pl = 6, pr = 6, pt = 16, pb = 22;
  if (!data || data.length < 2) { host.insertAdjacentHTML("beforeend", `<svg class="chart" viewBox="0 0 ${W} ${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="axislbl">Not enough history</text></svg>`); return; }
  const xs = (i) => pl + (i * (W - pl - pr) / (data.length - 1));
  const max = Math.max(...data.map((d) => d[key])) * 1.14 || 1;
  const ys = (v) => H - pb - (v / max) * (H - pt - pb);
  let line = "", area = `M ${xs(0)} ${H - pb} `;
  data.forEach((d, i) => { line += (i ? "L" : "M") + ` ${xs(i).toFixed(1)} ${ys(d[key]).toFixed(1)} `; area += `L ${xs(i).toFixed(1)} ${ys(d[key]).toFixed(1)} `; });
  area += `L ${xs(data.length - 1)} ${H - pb} Z`;
  let grid = ""; for (let g = 1; g <= 3; g++) { const v = max * g / 3.4, y = ys(v); grid += `<line class="gridline" x1="${pl}" y1="${y.toFixed(1)}" x2="${W - pr}" y2="${y.toFixed(1)}"/><text class="axislbl" x="${pl}" y="${(y - 4).toFixed(1)}">${Math.round(v)}</text>`; }
  const idx = [0, Math.floor(data.length / 2), data.length - 1];
  const xl = idx.map((i) => `<text class="axislbl" x="${xs(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}">${data[i].m}</text>`).join("");
  const li = data.length - 1, uid = key + "_" + Math.floor(xs(li));
  host.insertAdjacentHTML("beforeend", `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${label(data[li][key])} trend"><defs><linearGradient id="g_${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--series)" stop-opacity="0.36"/><stop offset="1" stop-color="var(--series)" stop-opacity="0.03"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#g_${uid})"/><path d="${line}" fill="none" stroke="var(--series-line)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><line class="crosshair" x1="0" y1="${pt}" x2="0" y2="${H - pb}" style="opacity:0"/><circle r="4.5" fill="var(--surface)" stroke="var(--series-line)" stroke-width="2.5" style="opacity:0"/><circle cx="${xs(li).toFixed(1)}" cy="${ys(data[li][key]).toFixed(1)}" r="4.6" fill="var(--gold)" stroke="var(--outline)" stroke-width="1.5"/>${xl}<rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>`);
  const svgEl = host.querySelector("svg"), hit = svgEl.querySelector("rect"), ch = svgEl.querySelector(".crosshair"), cd = svgEl.querySelector("circle");
  hit.addEventListener("mousemove", (e) => {
    const r = svgEl.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W;
    let i = Math.round((px - pl) / ((W - pl - pr) / (data.length - 1))); i = Math.max(0, Math.min(data.length - 1, i));
    const cx = xs(i), cy = ys(data[i][key]); ch.setAttribute("x1", cx); ch.setAttribute("x2", cx); ch.style.opacity = .7;
    cd.setAttribute("cx", cx); cd.setAttribute("cy", cy); cd.style.opacity = 1;
    tip.innerHTML = `<b>${label(data[i][key])}</b> · ${data[i].m}`;
    tip.style.left = (r.left + cx / W * r.width) + "px"; tip.style.top = (r.top + cy / H * r.height + scrollY) + "px"; tip.style.opacity = 1;
  });
  hit.addEventListener("mouseleave", () => { ch.style.opacity = 0; cd.style.opacity = 0; tip.style.opacity = 0; });
}

// ---------- table ----------
const posClass = (p) => (p <= 3 ? "pos-1" : p <= 10 ? "pos-2" : p <= 20 ? "pos-3" : "pos-4");
const kdColor = (kd) => (kd < 15 ? "var(--win)" : kd < 40 ? "var(--warn)" : "var(--loss)");
const fmtDiff = (d) => (!d ? `<span class="delta-cell flat">—</span>` : `<span class="delta-cell" style="color:${d > 0 ? "var(--win-ink)" : "var(--loss)"}">${d > 0 ? "▲" : "▼"}${Math.abs(d)}</span>`);
const passPos = (p) => fPos === "all" || (fPos === "top3" && p <= 3) || (fPos === "top10" && p <= 10) || (fPos === "p11" && p >= 11 && p <= 20) || (fPos === "p21" && p >= 21);
function renderTable() {
  if (!state) return;
  let r = state.rows.filter((x) => (fInt === "all" || x.intent === fInt) && passPos(x.position) && (fQ === "" || x.keyword.includes(fQ) || x.url.includes(fQ)));
  r.sort((a, b) => { let x = a[sortK], y = b[sortK]; if (sortK === "keyword" || sortK === "intent") { x = String(x); y = String(y); return x < y ? -sortDir : x > y ? sortDir : 0; } return (x - y) * sortDir; });
  $("kwBody").innerHTML = r.map((x) => `<tr><td class="kw">${x.keyword}<span class="u">${x.url}</span></td><td class="num"><span class="pos-pill ${posClass(x.position)}">${x.position}</span></td><td class="num">${fmtDiff(x.diff)}</td><td class="num">${fmt(x.volume)}</td><td class="num">${x.traffic}</td><td class="num"><span class="kd"><span class="bar"><i style="width:${Math.min(100, x.kd)}%;background:${kdColor(x.kd)}"></i></span>${x.kd}</span></td><td><span class="intent i-${x.intent}" title="${INAME[x.intent]}">${x.intent}</span></td></tr>`).join("") || `<tr><td colspan="7"><div class="empty"><div class="em"></div><p>Nothing matches those filters.</p></div></td></tr>`;
  $("rowCount").textContent = r.length + " of " + state.rows.length;
}

// ---------- status + errors ----------
const timeago = (t) => { const s = Math.round((Date.now() - t) / 1000); if (s < 60) return "just now"; const m = Math.round(s / 60); if (m < 60) return m + " min ago"; return Math.round(m / 60) + " hr ago"; };
function setStatus(kind) {
  const dot = $("statDot"), txt = $("statText"), live = $("liveDot");
  dot.className = "d"; live.className = "dot";
  if (kind === "loading") { dot.classList.add("busy"); live.classList.add("busy"); txt.textContent = "Fetching " + ($("domInput").value.trim() || "…"); }
  else if (kind === "live") { txt.textContent = "Live · updated " + (state ? timeago(state.updated) : "just now"); }
  else { dot.classList.add("err"); live.classList.add("err"); txt.textContent = "Data unavailable"; }
}
function errorCopy(code, msg) {
  switch (code) {
    case "bad_domain": return { h: "Check the domain", p: msg || "Enter a valid domain like example.com — no https://, no path." };
    case "no_data": return { h: "No data for that domain", p: msg || "Semrush has no US organic data for this domain. Try another one." };
    case "auth": case "config": return { h: "Server key issue", p: msg || "The Semrush API key isn't set or was rejected. Set SEMRUSH_API_KEY on the Worker." };
    case "network": return { h: "Can't reach the server", p: "The request didn't go through. Check your connection and hit refresh." };
    default: return { h: "Couldn't load the data", p: msg || "Semrush request failed. Try refresh, or another domain." };
  }
}
function showError(code, msg) {
  $("dash").hidden = true; const z = $("errZone"); z.hidden = false;
  const c = errorCopy(code, msg);
  z.innerHTML = `<div class="panel"><div class="errbox"><div class="em"></div><h3>${c.h}</h3><p>${c.p}</p></div></div>`;
  setStatus("error");
}

// ---------- events ----------
$("domForm").addEventListener("submit", (e) => {
  e.preventDefault(); fInt = "all"; fPos = "all"; fQ = "";
  document.querySelectorAll("#intentSeg button,#posSeg button").forEach((b) => b.classList.toggle("on", b.dataset.int === "all" || b.dataset.pos === "all"));
  const si = $("kwSearch"); if (si) si.value = "";
  go($("domInput").value);
});
$("refreshBtn").addEventListener("click", () => go($("domInput").value));
document.querySelectorAll("thead th.sortable").forEach((th) => th.addEventListener("click", () => {
  const k = th.dataset.k;
  if (sortK === k) sortDir *= -1; else { sortK = k; sortDir = (k === "keyword" || k === "intent") ? 1 : (k === "position" ? 1 : -1); }
  document.querySelectorAll("thead th").forEach((t) => { t.classList.remove("sorted"); t.querySelector(".arr").textContent = ""; });
  th.classList.add("sorted"); th.querySelector(".arr").textContent = sortDir > 0 ? "▲" : "▼"; renderTable();
}));
$("intentSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#intentSeg button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); fInt = b.dataset.int; renderTable(); });
$("posSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#posSeg button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); fPos = b.dataset.pos; renderTable(); });
$("kwSearch").addEventListener("input", (e) => { fQ = e.target.value.trim().toLowerCase(); renderTable(); });
$("tableNote").innerHTML = "Intent — <b>C</b> commercial · <b>T</b> transactional · <b>N</b> navigational · <b>I</b> informational. KD% is Semrush difficulty (0 = easiest to rank). Δ is position change vs the prior month.";
$("themeBtn").addEventListener("click", () => {
  const r = document.documentElement, cur = r.getAttribute("data-theme");
  const sysLight = window.matchMedia("(prefers-color-scheme:light)").matches;
  r.setAttribute("data-theme", cur === "light" ? "dark" : cur === "dark" ? "light" : (sysLight ? "dark" : "light"));
});
setInterval(() => { if (state && !busy) setStatus("live"); }, 60000);
setInterval(() => { if (!busy && document.visibilityState === "visible" && state) go(state.domain); }, 30 * 60 * 1000);

// first load — default domain
go($("domInput").value);
