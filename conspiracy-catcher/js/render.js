/* =========================================================
   render.js — draws the play scene each frame.
   Layers: sky + parallax → ground/tiles → safety zone →
   coins/quest/creature/player → catch FX → particles → HUD.
   All coordinates are world-space; the camera translate is
   applied by the caller for world layers, HUD draws in screen
   space.
   ========================================================= */
const BW = 320, BH = 180;
const Render = (function () {

  function sky(ctx, env) {
    const g = ctx.createLinearGradient(0, 0, 0, BH);
    g.addColorStop(0, env.sky[0]); g.addColorStop(1, env.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, BW, BH);
    // sun or moon + stars
    if (env.night) {
      ctx.fillStyle = '#f4f0d8';
      ctx.fillRect(250, 22, 16, 16);
      ctx.fillStyle = env.sky[0];
      ctx.fillRect(246, 20, 12, 12);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 53 % BW), sy = (i * 29 % 90);
        ctx.fillRect(sx, sy, 1, 1);
      }
    } else {
      ctx.fillStyle = '#fff2a0';
      ctx.beginPath(); ctx.arc(40, 34, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe06a';
      ctx.beginPath(); ctx.arc(40, 34, 10, 0, 7); ctx.fill();
    }
  }

  // parallax hills — camX scaled to two depths
  function hills(ctx, env, camX, levelWidth) {
    const far = -camX * 0.25, near = -camX * 0.5;
    ctx.fillStyle = env.hill2;
    for (let i = -1; i < levelWidth / 120 + 2; i++) {
      const bx = far + i * 120;
      tri(ctx, bx, 130, 120, 46);
    }
    ctx.fillStyle = env.hill;
    for (let i = -1; i < levelWidth / 90 + 2; i++) {
      const bx = near + i * 90 + 40;
      tri(ctx, bx, 138, 90, 38);
    }
  }
  function tri(ctx, x, baseY, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, baseY); ctx.lineTo(x + w / 2, baseY - h); ctx.lineTo(x + w, baseY);
    ctx.closePath(); ctx.fill();
  }

  function ground(ctx, env, camX, levelWidth, groundY) {
    // world-space ground; caller has NOT translated yet for bg, but
    // ground IS drawn in world space (caller translated). Here groundY..BH.
    ctx.fillStyle = env.ground;
    ctx.fillRect(0, groundY, levelWidth, BH - groundY + 40);
    ctx.fillStyle = env.groundTop;
    ctx.fillRect(0, groundY, levelWidth, 3);
    // chunky tile speckle
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < levelWidth; x += 16) {
      ctx.fillRect(x, groundY + 6, 1, BH - groundY);
      if ((x / 16) % 2 === 0) ctx.fillRect(x + 8, groundY + 10, 2, 2);
    }
  }

  function platform(ctx, p) {
    Spr.oRect(ctx, p.x, p.y, p.w, 6, '#7a5a2a');
    ctx.fillStyle = '#9a7a3a';
    ctx.fillRect(p.x + 1, p.y + 1, p.w - 2, 1);
  }

  // The safety zone the creature flees toward, drawn at world x.
  function safety(ctx, env, x, groundY) {
    const kind = env.safety;
    if (kind === 'cave') {
      ctx.fillStyle = '#1a1410';
      ctx.beginPath(); ctx.ellipse(x + 24, groundY, 26, 30, 0, Math.PI, 0); ctx.fill();
      Spr.oRect(ctx, x, groundY - 4, 4, 6, '#5a4a3a');
    } else if (kind === 'fog') {
      ctx.fillStyle = 'rgba(220,220,230,0.7)';
      for (let i = 0; i < 5; i++) ctx.fillRect(x - 6 + i * 10, groundY - 30 + (i % 2) * 8, 22, 30);
    } else if (kind === 'burrow') {
      ctx.fillStyle = '#2a1c10';
      ctx.beginPath(); ctx.ellipse(x + 18, groundY + 2, 18, 10, 0, 0, 7); ctx.fill();
    } else if (kind === 'water' || kind === 'ocean' || kind === 'lagoon') {
      ctx.fillStyle = kind === 'lagoon' ? '#2a8a8a' : '#2a5a9a';
      ctx.fillRect(x, groundY - 2, 200, BH);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 16; i++) ctx.fillRect(x + i * 12, groundY + (i % 3) * 5, 6, 1);
    } else if (kind === 'ufo') {
      Spr.oRect(ctx, x, groundY - 30, 48, 12, '#9aa4b0');
      ctx.fillStyle = '#3fd0e0'; ctx.beginPath(); ctx.ellipse(x + 24, groundY - 30, 16, 8, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(63,208,224,0.25)';
      ctx.beginPath(); ctx.moveTo(x + 8, groundY - 20); ctx.lineTo(x + 40, groundY - 20); ctx.lineTo(x + 48, groundY); ctx.lineTo(x, groundY); ctx.fill();
    } else if (kind === 'tunnel' || kind === 'doorway') {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(x, groundY - 34, 30, 34);
      Spr.oRect(ctx, x - 3, groundY - 38, 36, 6, '#5a5a5a');
      if (kind === 'doorway') { Spr.oRect(ctx, x - 3, groundY - 38, 6, 40, '#8a5a2a'); Spr.oRect(ctx, x + 27, groundY - 38, 6, 40, '#8a5a2a'); }
    } else if (kind === 'thicket') {
      ctx.fillStyle = '#0e2410';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + i * 9, groundY - 8 - (i % 2) * 6, 12, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = '#000'; ctx.fillRect(x, groundY - 30, 24, 30);
    }
  }

  // catch effect burst at (x,y) screen-space for a tool kind
  function catchFX(ctx, x, y, kind, p) {
    ctx.save();
    if (kind === 'shot') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 4 + p * 10, 0, 7); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - p) + ')';
      ctx.beginPath(); ctx.arc(x, y, 3 + p * 8, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---- HUD (screen space) ----
  function text(ctx, s, x, y, col, scale) {
    scale = scale || 1;
    ctx.save();
    ctx.font = (6 * scale) + 'px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = col || '#fff';
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  function hud(ctx, g) {
    // top bar
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, BW, 14);
    text(ctx, g.idx + 1 + '. ' + g.level.name, 4, 3, '#f2c33c');
    // coin counter (right)
    Spr.coin(ctx, BW - 70, 3, g.t);
    text(ctx, String(g.coins), BW - 62, 3, '#f2c33c');
    // tool
    text(ctx, TOOLS[g.player.tool].name, 4, 168, '#cfe0ff');

    // chase progress bar: player vs creature vs safety
    const bx = 90, by = 4, bw = 150, bh = 6;
    ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#223'; ctx.fillRect(bx, by, bw, bh);
    const span = g.creature.safetyX;
    const pp = Math.min(1, g.player.centerX() / span);
    const cp = Math.min(1, g.creature.centerX() / span);
    // den marker
    ctx.fillStyle = '#d23b2f'; ctx.fillRect(bx + bw - 2, by - 1, 3, bh + 2);
    // creature marker
    ctx.fillStyle = '#8aa83f'; ctx.fillRect(bx + cp * (bw - 3), by, 3, bh);
    // player marker
    ctx.fillStyle = '#3fd0e0'; ctx.fillRect(bx + pp * (bw - 3), by, 3, bh);

    // flash message
    if (g.message && g.messageT > 0) {
      ctx.globalAlpha = Math.min(1, g.messageT * 2);
      ctx.font = '16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000'; ctx.fillText(g.message, BW / 2 + 1, 60 + 1);
      ctx.fillStyle = '#f2c33c'; ctx.fillText(g.message, BW / 2, 60);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
  }

  return { sky, hills, ground, platform, safety, catchFX, hud, text };
})();
