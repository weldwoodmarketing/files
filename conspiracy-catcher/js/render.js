/* =========================================================
   render.js — draws the play scene each frame.
   Layers: habitat background + parallax (screen space) →
   ground/props → safety zone → obstacles → coins/entities →
   catch FX → particles → HUD. Each creature gets its own
   natural-habitat backdrop and a themed obstacle.
   ========================================================= */
const BW = 320, BH = 180;
const Render = (function () {

  function fr(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const cl = v => Math.max(0, Math.min(255, v + amt));
    return '#' + ((1 << 24) | (cl((n >> 16) & 255) << 16) | (cl((n >> 8) & 255) << 8) | cl(n & 255)).toString(16).slice(1);
  }
  function rep(off, spacing, W, fn) { for (let i = -1; i < W / spacing + 2; i++) fn(off + i * spacing, i); }
  function tri(ctx, x, baseY, w, h, fill, light, dark) {
    ctx.fillStyle = fill; ctx.beginPath();
    ctx.moveTo(x, baseY); ctx.lineTo(x + w / 2, baseY - h); ctx.lineTo(x + w, baseY); ctx.closePath(); ctx.fill();
    if (light) { ctx.strokeStyle = light; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x + w / 2, baseY - h); ctx.stroke(); }
    if (dark) { ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w / 2, baseY - h); ctx.lineTo(x + w, baseY); ctx.stroke(); }
  }
  function stars(ctx, n) { ctx.fillStyle = '#fff'; for (let i = 0; i < n; i++) fr(ctx, (i * 73) % BW, (i * 31) % 78, 1, 1, '#fff'); }
  function moon(ctx, x, y, r, sky) {
    ctx.fillStyle = '#f4f0d8'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.4, r, 0, 7); ctx.fill();
  }
  function sun(ctx, x, y, r, glow, core) {
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 7); ctx.fill();
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  /* ---------------- habitat backdrops ---------------- */
  function pine(ctx, x, gy, h) {
    fr(ctx, x + 3, gy - 6, 2, 6, '#4a2f16');
    for (let k = 0; k < 3; k++) tri(ctx, x - 1, gy - 4 - k * (h / 3.2), 10, h / 2.4, k ? '#2f6a30' : '#357336', '#3f8040', '#1f4a20');
  }
  function bush(ctx, x, gy) {
    ctx.fillStyle = '#2a5a26'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + k * 6, gy - 3, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#377336'; ctx.beginPath(); ctx.arc(x + 6, gy - 5, 3, 0, 7); ctx.fill();
  }
  function mesa(ctx, x, gy) {
    fr(ctx, x, gy - 30, 70, 30, '#a85f2a'); fr(ctx, x, gy - 30, 70, 3, '#c97a3a');
    fr(ctx, x, gy - 30, 2, 30, shade('#a85f2a', -22)); fr(ctx, x + 68, gy - 30, 2, 30, shade('#a85f2a', -22));
  }
  function cactusBg(ctx, x, gy, i) {
    const h = 20 + (i % 3) * 6;
    fr(ctx, x, gy - h, 4, h, '#1f4a26'); fr(ctx, x, gy - h, 1, h, '#2f6a36');
    fr(ctx, x - 3, gy - h + 6, 3, 2, '#1f4a26'); fr(ctx, x - 3, gy - h + 4, 2, 4, '#1f4a26');
    fr(ctx, x + 4, gy - h + 10, 3, 2, '#1f4a26'); fr(ctx, x + 6, gy - h + 6, 2, 6, '#1f4a26');
  }
  function kelp(ctx, x, gy, t, i) {
    const sway = Math.sin(t * 2 + i) * 3, h = 30 + (i % 3) * 10;
    for (let s = 0; s < h; s += 4) fr(ctx, x + Math.round(Math.sin(t * 2 + i + s * 0.2) * 3), gy - s - 4, 3, 4, s % 8 ? '#1f6a4a' : '#277a55');
    fr(ctx, x + sway, gy - h, 3, 3, '#3a9a6a');
  }
  function fish(ctx, x, y) { ctx.fillStyle = 'rgba(20,70,80,0.7)'; ctx.fillRect(x, y, 5, 2); ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x - 3, y - 1); ctx.lineTo(x - 3, y + 3); ctx.fill(); }
  function cypress(ctx, x, gy, i) {
    const h = 60 + (i % 3) * 14;
    fr(ctx, x, gy - h, 5, h, '#1a2418'); fr(ctx, x, gy - h, 2, h, '#26321f');
    ctx.fillStyle = '#1f3322'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 2, gy - h + 4 + k * 4, 8 - k, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,140,110,0.4)'; ctx.lineWidth = 1; // hanging moss
    for (let m = 0; m < 3; m++) { ctx.beginPath(); ctx.moveTo(x - 4 + m * 6, gy - h + 16); ctx.lineTo(x - 4 + m * 6, gy - h + 26); ctx.stroke(); }
  }
  function palm(ctx, x, gy, i, t) {
    const h = 50 + (i % 2) * 16, neon = i % 2 ? '#ff4af0' : '#3fd0ff';
    for (let s = 0; s < h; s += 4) fr(ctx, x + Math.round(Math.sin(s * 0.08) * 6), gy - s - 4, 3, 4, '#1a1024');
    const tx = x + Math.round(Math.sin(h * 0.08) * 6);
    ctx.strokeStyle = neon; ctx.lineWidth = 1;
    for (let f = 0; f < 5; f++) { const a = -1.6 + f * 0.7; ctx.beginPath(); ctx.moveTo(tx + 1, gy - h); ctx.lineTo(tx + 1 + Math.cos(a) * 14, gy - h + Math.sin(a) * 10 + 4); ctx.stroke(); }
  }
  function neonSign(ctx, x, y, t, i) {
    const on = Math.sin(t * 6 + i) > -0.6, c = i % 2 ? '#ff3aa0' : '#3fe0ff';
    ctx.globalAlpha = on ? 1 : 0.35;
    ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(x, y, 14, 9);
    fr(ctx, x + 3, y + 3, 8, 3, on ? c : shade(c, -60));
    ctx.globalAlpha = 1;
  }
  function bridgeTower(ctx, x, gy) {
    fr(ctx, x, gy - 70, 4, 70, '#2a2740'); fr(ctx, x + 26, gy - 70, 4, 70, '#2a2740');
    ctx.strokeStyle = '#3a3650'; ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x + 2, gy - 10 - k * 11); ctx.lineTo(x + 28, gy - 21 - k * 11); ctx.moveTo(x + 28, gy - 10 - k * 11); ctx.lineTo(x + 2, gy - 21 - k * 11); ctx.stroke(); }
    // suspension cable swoop
    ctx.beginPath(); ctx.moveTo(x - 60, gy - 64); ctx.quadraticCurveTo(x + 15, gy - 30, x + 90, gy - 64); ctx.stroke();
  }
  function brickWall(ctx, off, gy, W) {
    fr(ctx, 0, 0, BW, gy, '#1a241c');
    ctx.strokeStyle = '#10180f'; ctx.lineWidth = 1;
    for (let y = 6; y < gy; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BW, y); ctx.stroke(); for (let x = ((y / 8) % 2 ? 0 : 8) + (off % 16); x < BW; x += 16) fr(ctx, x, y, 1, 8, '#10180f'); }
  }
  function arch(ctx, x, gy) { ctx.fillStyle = '#0a120c'; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 22); ctx.arc(x + 14, gy - 22, 14, Math.PI, 0); ctx.lineTo(x + 28, gy); ctx.fill(); }
  function ship(ctx, x, gy) { fr(ctx, x, gy - 8, 30, 8, '#243a48'); fr(ctx, x + 8, gy - 16, 14, 8, '#2f4a5a'); fr(ctx, x + 18, gy - 24, 3, 8, '#1a2832'); }
  function crane(ctx, x, gy) { fr(ctx, x + 6, gy - 40, 3, 40, '#2a4250'); fr(ctx, x + 6, gy - 40, 26, 3, '#2a4250'); fr(ctx, x + 30, gy - 40, 1, 14, '#2a4250'); }
  function hallDoor(ctx, x, gy) {
    fr(ctx, x, gy - 44, 20, 44, '#9a7a4a'); fr(ctx, x + 1, gy - 42, 18, 40, '#b8966a');
    fr(ctx, x + 3, gy - 38, 14, 16, '#a8865a'); fr(ctx, x + 3, gy - 20, 14, 14, '#a8865a');
    fr(ctx, x + 15, gy - 24, 2, 2, '#5a4628');
  }

  const BG = {
    forest(ctx, env, camX, W, gy, t) {
      sun(ctx, 46, 34, 12, '#fff2a0', '#ffe06a');
      rep(-camX * 0.2, 150, W, x => tri(ctx, x, gy - 4, 150, 40, '#2f5a2c', '#3f6e3a', '#235024'));
      rep(-camX * 0.45, 64, W, (x, i) => pine(ctx, x + (i % 2 ? 8 : 0), gy, 26 + (i % 3) * 5));
      rep(-camX * 0.7, 84, W, x => bush(ctx, x, gy));
    },
    bridge(ctx, env, camX, W, gy, t) {
      moon(ctx, 252, 24, 9, env.sky[0]); stars(ctx, 34);
      rep(-camX * 0.15, 120, W, x => tri(ctx, x, gy - 4, 120, 24, '#141a2c'));
      rep(-camX * 0.4, 180, W, x => bridgeTower(ctx, x, gy));
      fr(ctx, 0, gy - 12, BW, 12, 'rgba(200,205,220,0.10)');
    },
    desert(ctx, env, camX, W, gy, t) {
      sun(ctx, 60, 44, 16, '#f2683a', '#ffd070');
      rep(-camX * 0.2, 150, W, x => mesa(ctx, x, gy));
      rep(-camX * 0.45, 90, W, (x, i) => cactusBg(ctx, x, gy, i));
      ctx.fillStyle = '#caa04a'; rep(-camX * 0.6, 120, W, x => { ctx.beginPath(); ctx.ellipse(x + 60, gy, 70, 14, 0, Math.PI, 0); ctx.fill(); });
    },
    deep(ctx, env, camX, W, gy, t) {
      ctx.fillStyle = 'rgba(190,235,245,0.05)';
      rep(-camX * 0.1, 92, W, x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 26, 0); ctx.lineTo(x + 8, gy); ctx.lineTo(x - 10, gy); ctx.fill(); });
      rep(-camX * 0.25, 130, W, x => tri(ctx, x, gy - 2, 130, 28, '#0a3a44'));
      rep(-camX * 0.4, 170, W, (x, i) => fish(ctx, x, 44 + (i % 3) * 22));
      rep(-camX * 0.5, 72, W, (x, i) => kelp(ctx, x, gy, t, i));
      for (let i = 0; i < 28; i++) { const x = (i * 53) % BW, y = (BH - ((t * 14 + i * 41) % BH)) | 0; fr(ctx, x, y, 1, 1, 'rgba(220,245,250,0.5)'); if (i % 3 === 0) fr(ctx, x, y - 3, 1, 1, 'rgba(220,245,250,0.4)'); }
    },
    mars(ctx, env, camX, W, gy, t) {
      stars(ctx, 40); sun(ctx, 38, 28, 6, '#ffd0a0', '#fff0d8');
      ctx.fillStyle = '#3a6ad0'; ctx.beginPath(); ctx.arc(252, 30, 5, 0, 7); ctx.fill();
      fr(ctx, 250, 28, 2, 1, '#7aa0e0'); fr(ctx, 253, 31, 2, 1, '#2a8a4a');
      rep(-camX * 0.2, 140, W, x => tri(ctx, x, gy - 2, 140, 46, '#5a1f12', '#7a3320', '#3a140c'));
      ctx.fillStyle = '#7a2f1c'; rep(-camX * 0.4, 110, W, x => { ctx.beginPath(); ctx.ellipse(x + 44, gy - 1, 18, 5, 0, 0, 7); ctx.fill(); });
    },
    sewer(ctx, env, camX, W, gy, t) {
      brickWall(ctx, Math.round(-camX * 0.3), gy, W);
      fr(ctx, 0, 28, BW, 8, '#33423a'); fr(ctx, 0, 28, BW, 2, '#4a5a50'); fr(ctx, 0, 34, BW, 1, '#1a2620');
      rep(-camX * 0.3, 170, W, x => arch(ctx, x, gy));
      // drips
      for (let i = 0; i < 6; i++) { const x = (i * 57 - camX * 0.3); fr(ctx, (((x % BW) + BW) % BW) | 0, 36 + ((t * 30 + i * 20) % (gy - 40)), 1, 3, 'rgba(120,200,140,0.5)'); }
    },
    harbor(ctx, env, camX, W, gy, t) {
      ctx.fillStyle = '#cfe6ee'; ctx.beginPath(); ctx.arc(70, 30, 10, 0, 7); ctx.arc(84, 30, 12, 0, 7); ctx.fill();
      fr(ctx, 0, gy - 26, BW, 26, '#3a6a8a'); fr(ctx, 0, gy - 26, BW, 1, '#5a8aa8');
      rep(-camX * 0.2, 170, W, (x, i) => i % 2 ? ship(ctx, x, gy - 22) : crane(ctx, x, gy - 26));
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 10; i++) fr(ctx, (i * 31 - camX * 0.2) % BW + (i * 7 % 4), gy - 20 + (i % 3) * 5, 5, 1, 'rgba(255,255,255,0.35)');
    },
    swamp(ctx, env, camX, W, gy, t) {
      moon(ctx, 250, 26, 9, env.sky[0]); stars(ctx, 22);
      rep(-camX * 0.3, 110, W, (x, i) => cypress(ctx, x, gy, i));
      fr(ctx, 0, gy - 16, BW, 16, 'rgba(120,150,120,0.12)');
      for (let i = 0; i < 14; i++) { if (Math.sin(t * 2 + i) < 0.2) continue; const x = ((((i * 61 - camX * 0.5) % BW) + BW) % BW) | 0; fr(ctx, x, (78 + (i * 13 % 56) + Math.sin(t * 3 + i) * 4) | 0, 1, 1, '#d8f06a'); }
    },
    hallway(ctx, env, camX, W, gy, t) {
      fr(ctx, 0, 0, BW, 14, '#c8b884'); fr(ctx, 0, 14, BW, 2, '#9a8a55');           // ceiling
      rep(-camX * 0.5, 90, W, x => { fr(ctx, x + 30, 6, 22, 3, '#fff8c0'); fr(ctx, x + 30, 9, 22, 1, '#b8a85a'); }); // lights
      fr(ctx, 0, gy - 10, BW, 10, '#8a7a4a'); fr(ctx, 0, gy - 10, BW, 1, '#a89858');  // wainscot
      rep(-camX * 0.5, 90, W, x => hallDoor(ctx, x, gy - 10));
    },
    neon(ctx, env, camX, W, gy, t) {
      moon(ctx, 246, 24, 7, env.sky[0]); stars(ctx, 26);
      fr(ctx, 0, gy - 22, BW, 22, 'rgba(90,30,120,0.4)');
      rep(-camX * 0.55, 150, W, (x, i) => neonSign(ctx, x + 20, 46 + (i % 2) * 18, t, i));
      rep(-camX * 0.4, 100, W, (x, i) => palm(ctx, x, gy, i, t));
    }
  };

  function background(ctx, env, camX, W, gy, t) {
    const g = ctx.createLinearGradient(0, 0, 0, BH);
    g.addColorStop(0, env.sky[0]); g.addColorStop(1, env.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, BW, BH);
    (BG[env.bg] || BG.forest)(ctx, env, camX, W, gy, t);
  }

  /* ---------------- ground styles ---------------- */
  function ground(ctx, env, W, gy, t) {
    fr(ctx, 0, gy, W, BH - gy + 40, env.ground);
    fr(ctx, 0, gy, W, 2, env.groundTop);
    fr(ctx, 0, gy, W, 1, shade(env.groundTop, 30));
    const gs = env.gstyle;
    if (gs === 'planks' || gs === 'dock' || gs === 'boardwalk') {
      for (let x = 0; x < W; x += 22) { fr(ctx, x, gy + 3, 1, BH - gy, shade(env.ground, -30)); fr(ctx, x + 2, gy + 4, 2, 1, '#2a2014'); }
      for (let y = gy + 8; y < BH; y += 8) fr(ctx, 0, y, W, 1, shade(env.ground, -16));
      if (gs === 'boardwalk') fr(ctx, 0, gy, W, 1, '#ff4af0');
    } else if (gs === 'sand' || gs === 'seabed') {
      fr(ctx, 0, gy + 3, W, 2, shade(env.ground, -16));
      ctx.fillStyle = shade(env.ground, 18); for (let x = 4; x < W; x += 14) fr(ctx, x, gy + 7 + (x % 3) * 3, 4, 1, shade(env.ground, 18));
      if (gs === 'seabed') { ctx.fillStyle = shade(env.ground, -26); for (let x = 10; x < W; x += 40) { ctx.beginPath(); ctx.arc(x, gy + 12, 3, Math.PI, 0); ctx.fill(); } }
    } else if (gs === 'regolith') {
      ctx.fillStyle = shade(env.ground, -22); for (let x = 6; x < W; x += 24) ctx.fillRect(x, gy + 8 + (x % 4) * 3, 3, 2);
      ctx.fillStyle = shade(env.ground, 20); for (let x = 16; x < W; x += 30) ctx.fillRect(x, gy + 6, 2, 1);
    } else if (gs === 'muck') {
      fr(ctx, 0, gy, W, 3, '#2f6a3a'); fr(ctx, 0, gy + 3, W, 1, '#1c3a22');
      ctx.fillStyle = 'rgba(90,180,110,0.25)'; for (let x = 8; x < W; x += 26) fr(ctx, x, gy + 5, 6, 1, 'rgba(90,180,110,0.25)');
      for (let y = gy + 8; y < BH; y += 10) fr(ctx, 0, y, W, 1, '#2a2a30');
    } else if (gs === 'mud') {
      fr(ctx, 0, gy + 2, W, 2, shade(env.ground, -20));
      ctx.fillStyle = 'rgba(120,140,120,0.18)'; for (let x = 12; x < W; x += 34) fr(ctx, x, gy + 6 + (x % 3) * 3, 10, 1, 'rgba(120,140,120,0.18)');
    } else if (gs === 'tiles') {
      for (let x = 0; x < W; x += 16) for (let y = gy; y < BH; y += 16) fr(ctx, x, y, 16, 16, ((x / 16 + (y - gy) / 16) % 2) ? '#c8b878' : '#9a8a55');
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 16) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, BH); ctx.stroke(); }
    } else { // soil
      ctx.fillStyle = '#3a6a26'; for (let x = 0; x < W; x += 6) fr(ctx, x, gy - 1, 2, 2, (x % 12 ? '#3a6a26' : '#4a7a2a'));
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = 0; x < W; x += 16) { fr(ctx, x, gy + 6, 1, BH - gy, 'rgba(0,0,0,0.18)'); if ((x / 16) % 2 === 0) fr(ctx, x + 8, gy + 10, 2, 2, 'rgba(0,0,0,0.18)'); }
    }
  }

  function platform(ctx, p) { Spr.osRect(ctx, p.x, p.y, p.w, 6, '#7a5a2a', '#9a7a3a', '#523a1a'); }

  /* ---------------- safety zones (the den) ---------------- */
  function safety(ctx, env, x, gy, t) {
    const kind = env.safety;
    if (kind === 'cave') { ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(x + 24, gy, 26, 30, 0, Math.PI, 0); ctx.fill(); fr(ctx, x + 20, gy - 26, 2, 8, '#5a4a3a'); }
    else if (kind === 'fog') { ctx.fillStyle = 'rgba(220,222,232,0.72)'; for (let i = 0; i < 5; i++) ctx.fillRect(x - 6 + i * 10, gy - 30 + (i % 2) * 8, 22, 30); }
    else if (kind === 'burrow') { ctx.fillStyle = '#2a1c10'; ctx.beginPath(); ctx.ellipse(x + 18, gy + 2, 18, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.ellipse(x + 18, gy + 1, 18, 10, 0, Math.PI, 0); ctx.fill(); }
    else if (kind === 'trench') { ctx.fillStyle = '#03222e'; ctx.beginPath(); ctx.moveTo(x - 6, gy - 2); ctx.lineTo(x + 56, gy - 2); ctx.lineTo(x + 44, BH); ctx.lineTo(x + 6, BH); ctx.fill(); ctx.fillStyle = '#021219'; ctx.beginPath(); ctx.moveTo(x + 8, gy); ctx.lineTo(x + 42, gy); ctx.lineTo(x + 34, BH); ctx.lineTo(x + 16, BH); ctx.fill(); }
    else if (kind === 'ocean' || kind === 'lagoon') { fr(ctx, x, gy - 2, 200, BH, kind === 'lagoon' ? '#2a8a8a' : '#2a5a9a'); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 16; i++) fr(ctx, x + i * 12, gy + (i % 3) * 5, 6, 1, 'rgba(255,255,255,0.25)'); }
    else if (kind === 'ufo') {
      Spr.osRect(ctx, x, gy - 30, 48, 12, '#9aa4b0', '#c2ccd6', '#6a7480');
      ctx.fillStyle = '#3fd0e0'; ctx.beginPath(); ctx.ellipse(x + 24, gy - 30, 16, 8, 0, Math.PI, 0); ctx.fill();
      for (let i = 0; i < 4; i++) fr(ctx, x + 8 + i * 10, gy - 19, 2, 2, Math.sin(t * 6 + i) > 0 ? '#ffe06a' : '#b88a2a');
      ctx.fillStyle = 'rgba(63,208,224,0.22)'; ctx.beginPath(); ctx.moveTo(x + 8, gy - 18); ctx.lineTo(x + 40, gy - 18); ctx.lineTo(x + 48, gy); ctx.lineTo(x, gy); ctx.fill();
    }
    else if (kind === 'tunnel' || kind === 'doorway') {
      fr(ctx, x, gy - 34, 30, 34, '#0a0a0a');
      Spr.osRect(ctx, x - 3, gy - 38, 36, 6, '#5a5a5a', '#787878', '#3a3a3a');
      if (kind === 'doorway') { Spr.osRect(ctx, x - 3, gy - 38, 6, 40, '#9a7a4a', '#b8966a', '#6a5230'); Spr.osRect(ctx, x + 27, gy - 38, 6, 40, '#9a7a4a', '#b8966a', '#6a5230'); fr(ctx, x + 4, gy - 30, 22, 30, '#1a1408'); }
    }
    else if (kind === 'thicket') { ctx.fillStyle = '#0e2410'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(x + i * 8, gy - 8 - (i % 2) * 6, 12, 0, 7); ctx.fill(); } ctx.fillStyle = '#16331a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + 4 + i * 9, gy - 12, 6, 0, 7); ctx.fill(); } }
    else { fr(ctx, x, gy - 30, 24, 30, '#000'); }
  }

  /* ---------------- obstacles ---------------- */
  const OB_SIZE = {
    bramble: [16, 11], barrel: [11, 14], cactus: [11, 16], urchin: [13, 10], tentacle: [12, 17],
    pipe: [10, 14], crate: [13, 12], gator: [22, 7], cone: [10, 12], log: [18, 8]
  };
  function obstacle(ctx, type, x, gy, t) { (OB[type] || OB.crate)(ctx, x, gy, t); }
  const OB = {
    bramble(ctx, x, gy) {
      ctx.strokeStyle = '#24381a'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + 3 + i * 3, gy - 4, 5, 0.3, 3.5); ctx.stroke(); }
      ctx.fillStyle = '#2f4a22'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 1 + i * 2.4, gy - 9 + (i % 2) * 4, 2, 2);
      for (let i = 0; i < 4; i++) fr(ctx, x + 2 + i * 4, gy - 6 - (i % 2) * 3, 1, 1, '#888'); // thorns
      fr(ctx, x + 4, gy - 5, 2, 2, '#d23b2f'); fr(ctx, x + 10, gy - 8, 2, 2, '#d23b2f'); // berries
    },
    barrel(ctx, x, gy) {
      Spr.osRect(ctx, x, gy - 14, 11, 14, '#7a5226', '#9a6f3a', '#4e3417');
      fr(ctx, x, gy - 12, 11, 1, '#3a2814'); fr(ctx, x, gy - 5, 11, 1, '#3a2814');
      ctx.fillStyle = '#5a3c1c'; ctx.beginPath(); ctx.ellipse(x + 5, gy - 14, 5, 2, 0, 0, 7); ctx.fill();
      fr(ctx, x + 2, gy - 13, 1, 12, '#a87a40');
    },
    cactus(ctx, x, gy) {
      Spr.osRect(ctx, x + 3, gy - 16, 5, 16, '#2f7a36', '#46a050', '#1f5024');
      Spr.osRect(ctx, x, gy - 8, 3, 5, '#2f7a36', '#46a050', '#1f5024');
      Spr.osRect(ctx, x + 8, gy - 11, 3, 4, '#2f7a36', '#46a050', '#1f5024');
      for (let s = gy - 14; s < gy - 1; s += 3) { fr(ctx, x + 2, s, 1, 1, '#1f5024'); fr(ctx, x + 8, s, 1, 1, '#1f5024'); }
      fr(ctx, x + 4, gy - 17, 3, 2, '#f25fa0'); // flower
    },
    urchin(ctx, x, gy, t) {
      ctx.strokeStyle = '#2a1f4a'; ctx.lineWidth = 1;
      for (let a = 0; a < 12; a++) { const an = a * 0.52; ctx.beginPath(); ctx.moveTo(x + 6, gy - 4); ctx.lineTo(x + 6 + Math.cos(an) * 7, gy - 4 + Math.sin(an) * 5); ctx.stroke(); }
      ctx.fillStyle = '#4a2f6a'; ctx.beginPath(); ctx.arc(x + 6, gy - 4, 4, 0, 7); ctx.fill();
      fr(ctx, x + 5, gy - 5, 2, 1, '#7a5f9a');
    },
    tentacle(ctx, x, gy, t) {
      ctx.fillStyle = '#3a140c'; ctx.beginPath(); ctx.ellipse(x + 6, gy - 1, 8, 3, 0, 0, 7); ctx.fill(); // crater
      ctx.fillStyle = '#5a1f12'; ctx.beginPath(); ctx.ellipse(x + 6, gy - 2, 6, 2, 0, Math.PI, 0); ctx.fill();
      const sway = Math.sin(t * 3) * 2;
      for (let s = 0; s < 15; s += 3) fr(ctx, x + 4 + Math.round(Math.sin(t * 3 + s * 0.3) * 2), gy - 3 - s, 4 - (s > 9 ? 1 : 0), 3, s % 6 ? '#3f7a4a' : '#4f9a5a');
      fr(ctx, x + 4 + sway, gy - 18, 3, 2, '#7fd06a'); // glowing tip
      for (let s = 2; s < 14; s += 4) fr(ctx, x + 5, gy - 3 - s, 1, 1, '#a8e090');
    },
    pipe(ctx, x, gy, t) {
      Spr.osRect(ctx, x + 2, gy - 14, 6, 14, '#5a6068', '#7a828c', '#3a4046');
      Spr.osRect(ctx, x, gy - 14, 10, 4, '#6a727a', '#8a929c', '#444a50'); // flange
      fr(ctx, x + 3, gy - 13, 1, 12, '#8a929c');
      fr(ctx, x + 4, gy - 9 + ((t * 30) % 9), 1, 2, 'rgba(120,200,140,0.6)'); // drip
    },
    crate(ctx, x, gy) {
      Spr.osRect(ctx, x, gy - 12, 13, 12, '#8a6536', '#a8854a', '#5a4322');
      ctx.strokeStyle = '#5a4322'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 1, gy - 11); ctx.lineTo(x + 12, gy - 1); ctx.moveTo(x + 12, gy - 11); ctx.lineTo(x + 1, gy - 1); ctx.stroke();
      fr(ctx, x, gy - 12, 13, 1, '#a8854a'); fr(ctx, x, gy - 7, 13, 1, '#5a4322');
    },
    gator(ctx, x, gy, t) {
      const jaw = Math.max(0, Math.sin(t * 3)) * 3;
      Spr.osRect(ctx, x + 2, gy - 6, 14, 6, '#3a5a30', '#4f7440', '#264020'); // body
      ctx.fillStyle = '#3a5a30'; ctx.beginPath(); ctx.moveTo(x + 16, gy - 5); ctx.lineTo(x + 22, gy - 2); ctx.lineTo(x + 16, gy); ctx.fill(); // tail
      Spr.osRect(ctx, x - 4, gy - 5 - jaw, 8, 3, '#3a5a30', '#4f7440', '#264020'); // upper jaw
      Spr.osRect(ctx, x - 4, gy - 2, 8, 2, '#2f4a28', '#3f6034', '#1c3018'); // lower jaw
      fr(ctx, x - 3, gy - 4 - jaw, 4, 1, '#fff'); // teeth
      for (let i = 0; i < 4; i++) fr(ctx, x + 4 + i * 3, gy - 7, 1, 1, '#264020'); // back ridges
      fr(ctx, x + 3, gy - 7, 2, 2, '#f2c33c'); fr(ctx, x + 4, gy - 6, 1, 1, '#000'); // eye
    },
    cone(ctx, x, gy) {
      ctx.fillStyle = '#e8702a'; ctx.beginPath(); ctx.moveTo(x + 5, gy - 12); ctx.lineTo(x + 9, gy - 2); ctx.lineTo(x + 1, gy - 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 5, gy - 12); ctx.lineTo(x + 9, gy - 2); ctx.moveTo(x + 5, gy - 12); ctx.lineTo(x + 1, gy - 2); ctx.stroke();
      fr(ctx, x + 3, gy - 8, 4, 2, '#fff'); fr(ctx, x, gy - 2, 10, 2, '#c25a1a');
      fr(ctx, x + 4, gy - 11, 1, 2, '#ffb070');
    },
    log(ctx, x, gy) {
      Spr.osRect(ctx, x, gy - 7, 18, 7, '#5a4226', '#74552f', '#3a2a16');
      ctx.fillStyle = '#3a2a16'; ctx.beginPath(); ctx.ellipse(x + 1, gy - 4, 2, 3, 0, 0, 7); ctx.fill();
      fr(ctx, x + 3, gy - 6, 12, 1, '#74552f');
      ctx.fillStyle = '#3a7a3a'; for (let i = 0; i < 4; i++) fr(ctx, x + 3 + i * 4, gy - 8, 3, 2, '#3a7a3a'); // moss
    }
  };

  /* ---------------- catch FX + HUD ---------------- */
  function catchFX(ctx, x, y, kind, p) {
    ctx.save();
    if (kind === 'shot') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4 + p * 10, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(255,255,255,' + (1 - p) + ')'; ctx.beginPath(); ctx.arc(x, y, 3 + p * 8, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function text(ctx, s, x, y, col, scale) {
    scale = scale || 1; ctx.save(); ctx.font = (6 * scale) + 'px monospace'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y); ctx.restore();
  }
  function hud(ctx, g) {
    fr(ctx, 0, 0, BW, 14, 'rgba(0,0,0,0.45)');
    text(ctx, g.idx + 1 + '. ' + g.level.name, 4, 3, '#f2c33c');
    Spr.coin(ctx, BW - 70, 3, g.t); text(ctx, String(g.coins), BW - 62, 3, '#f2c33c');
    text(ctx, TOOLS[g.player.tool].name, 4, 168, '#cfe0ff');
    const bx = 92, by = 4, bw = 148, bh = 6;
    fr(ctx, bx - 1, by - 1, bw + 2, bh + 2, '#000'); fr(ctx, bx, by, bw, bh, '#223');
    const span = g.creature.safetyX;
    const pp = Math.min(1, g.player.centerX() / span), cp = Math.min(1, g.creature.centerX() / span);
    fr(ctx, bx + bw - 2, by - 1, 3, bh + 2, '#d23b2f');
    fr(ctx, bx + cp * (bw - 3), by, 3, bh, '#8aa83f');
    fr(ctx, bx + pp * (bw - 3), by, 3, bh, '#3fd0e0');
    if (g.message && g.messageT > 0) {
      ctx.globalAlpha = Math.min(1, g.messageT * 2); ctx.font = '16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000'; ctx.fillText(g.message, BW / 2 + 1, 61); ctx.fillStyle = '#f2c33c'; ctx.fillText(g.message, BW / 2, 60);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
  }

  return { background, ground, platform, safety, obstacle, OB_SIZE, catchFX, hud, text, shade };
})();
