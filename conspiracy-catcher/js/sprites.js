/* =========================================================
   sprites.js — code-defined pixel art with shading.
   Chunky blocks + hard black outlines at 320x180. Major masses
   use osRect(): a black-outlined block with a 1px top/left
   highlight and 1px bottom/right shadow for a beveled, shaded
   Keen look. Per-creature accents (fur, scales, glints, rim
   light) add detail. Sprites draw into a local box [0..w]x[0..h];
   the flip wrapper mirrors for facing so art is authored right.
   ========================================================= */
const Spr = (function () {

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  // flat outlined rect (kept for tiny parts / membranes)
  function oRect(ctx, x, y, w, h, fill, line) {
    rect(ctx, x, y, w, h, line || '#000');
    if (w > 2 && h > 2) rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
    else rect(ctx, x, y, w, h, fill);
  }

  // shaded outlined rect: black border, base fill, top/left highlight,
  // bottom/right shadow. The workhorse for giving mass a lit direction.
  function osRect(ctx, x, y, w, h, base, light, dark) {
    rect(ctx, x, y, w, h, '#000');
    if (w <= 2 || h <= 2) { rect(ctx, x + (w > 2 ? 1 : 0), y + (h > 2 ? 1 : 0), Math.max(1, w - 2), Math.max(1, h - 2), base); return; }
    const ix = x + 1, iy = y + 1, iw = w - 2, ih = h - 2;
    rect(ctx, ix, iy, iw, ih, base);
    if (light) { rect(ctx, ix, iy, iw, 1, light); rect(ctx, ix, iy, 1, ih, light); }
    if (dark) { rect(ctx, ix, iy + ih - 1, iw, 1, dark); rect(ctx, ix + iw - 1, iy, 1, ih, dark); }
  }

  function flip(ctx, x, y, w, facing, fn) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    fn();
    ctx.restore();
  }

  // soft contact shadow on the ground for depth (screen/world space, no flip)
  function shadow(ctx, cx, groundY, w) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(Math.round(cx), groundY + 1, Math.max(4, w * 0.5), 2.5, 0, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  /* ---------------- HERO (tough army guy) ---------------- */
  const SKIN = '#e0a878', SKIN_L = '#f4cb9a', SKIN_D = '#a8642f';
  const OLIVE = '#5a6e2a', OLIVE_L = '#8aa83f', OLIVE_D = '#3a4a18';
  const HELM = '#2c3a18', HELM_L = '#42551f', HELM_D = '#16220c';
  const BOOT = '#332615', BOOT_L = '#574027', BOOT_D = '#180f06';

  function hero(ctx, x, y, facing, opts) {
    opts = opts || {};
    const cos = opts.cosmetics || new Set();
    flip(ctx, x, y, 14, facing, function () {
      if (opts.ducking) { heroDuck(ctx, cos, opts); return; }
      const f = opts.frame || 0, jump = opts.jumping;

      // backpack (behind torso)
      if (cos.has('backpack')) { osRect(ctx, 0, 9, 4, 8, '#7a5326', '#a07440', '#4e3417'); rect(ctx, 1, 11, 2, 1, '#bb8d4c'); rect(ctx, 1, 14, 2, 1, '#5a3d1c'); }

      // legs
      const legs = jump ? [[3, 16], [8, 15]] : f === 1 ? [[2, 16], [8, 16]] : f === 2 ? [[4, 16], [8, 16]] : [[3, 16], [7, 16]];
      osRect(ctx, legs[0][0], legs[0][1], 4, 6, OLIVE, OLIVE_L, OLIVE_D);
      osRect(ctx, legs[1][0], legs[1][1], 4, 6, OLIVE, OLIVE_L, OLIVE_D);

      // boots (shaded; red if upgraded)
      const bb = cos.has('boots');
      const bC = bb ? '#c23a26' : BOOT, bL = bb ? '#e8694c' : BOOT_L, bD = bb ? '#7a1f12' : BOOT_D;
      osRect(ctx, legs[0][0] - 1, 20, 5, 2, bC, bL, bD);
      osRect(ctx, legs[1][0], 20, 5, 2, bC, bL, bD);

      // torso
      const jk = cos.has('jacket');
      osRect(ctx, 2, 9, 10, 8, jk ? '#3a5a8a' : OLIVE, jk ? '#5f86c0' : OLIVE_L, jk ? '#243f63' : OLIVE_D);
      rect(ctx, 3, 13, 8, 1, '#2e2110');                  // belt
      rect(ctx, 3, 13, 8, 1, '#3a2a14'); rect(ctx, 6, 14, 2, 1, '#d4b24a'); rect(ctx, 6, 14, 1, 1, '#f6df8c'); // buckle + glint
      if (!jk) { rect(ctx, 4, 10, 1, 3, OLIVE_D); rect(ctx, 9, 10, 1, 2, OLIVE_L); } // chest seam + light fold
      rect(ctx, 2, 9, 10, 1, '#000');                     // collar shade line

      // head
      osRect(ctx, 3, 2, 8, 7, SKIN, SKIN_L, SKIN_D);
      rect(ctx, 4, 8, 6, 1, SKIN_D);                      // jaw shadow
      rect(ctx, 9, 5, 1, 2, SKIN_D);                      // cheek/nose shade
      rect(ctx, 4, 4, 1, 1, SKIN_L);                      // cheek highlight
      // eyes / goggles
      if (cos.has('goggles')) { osRect(ctx, 3, 4, 8, 2, '#222', '#3a3a3a', '#000'); rect(ctx, 7, 4, 2, 1, '#5fe0f0'); rect(ctx, 8, 4, 1, 1, '#bff6ff'); }
      else { rect(ctx, 8, 4, 1, 2, '#1a120a'); rect(ctx, 8, 4, 1, 1, '#000'); }
      // helmet
      const hm = cos.has('helmet');
      osRect(ctx, 2, 0, 10, 4, hm ? '#4a5a6a' : HELM, hm ? '#7b8ea0' : HELM_L, hm ? '#2c3845' : HELM_D);
      rect(ctx, 2, 3, 12, 1, '#000');                     // brim
      rect(ctx, 3, 3, 10, 1, hm ? '#6a7a8a' : HELM_L);
      rect(ctx, 4, 1, 3, 1, hm ? '#cfe0ff' : '#5a6e2a');  // shine band
      rect(ctx, 11, 4, 1, 4, '#2e2110');                  // chin strap

      // front arm + tool
      armAndTool(ctx, opts, cos);
    });
  }

  function armAndTool(ctx, opts, cos) {
    const c = opts.catch || 0;
    const reach = Math.round(c * 4);
    const jk = cos.has('jacket');
    osRect(ctx, 9, 9, 3, 6, jk ? '#3a5a8a' : OLIVE, jk ? '#5f86c0' : OLIVE_L, jk ? '#243f63' : OLIVE_D);
    const hands = cos.has('gloves') ? '#f2c33c' : SKIN, handsD = cos.has('gloves') ? '#b8881a' : SKIN_D;
    rect(ctx, 10, 13, 2, 2, hands); rect(ctx, 10, 14, 2, 1, handsD);  // hand
    const t = opts.tool || 'net';
    const hx = 12 + reach, hy = 8 - Math.round(c * 3);
    if (t === 'net') {
      rect(ctx, hx, hy, 1, 8, '#5a3f1c'); rect(ctx, hx, hy, 1, 4, '#7a5a2a'); // shaded pole
      oRect(ctx, hx + 1, hy - 2, 5, 6, 'rgba(220,230,240,.45)', '#cfd8e2');
      rect(ctx, hx + 2, hy - 1, 1, 4, 'rgba(255,255,255,.5)');               // mesh sheen
    } else if (t === 'cage') {
      const drop = Math.round(c * 6);
      osRect(ctx, hx - 1, hy + drop, 8, 8, 'rgba(150,160,170,.25)', '#d4ddE6', '#7a828c');
      for (let i = 1; i < 4; i++) rect(ctx, hx - 1 + i * 2, hy + drop, 1, 8, '#c2cad4');
      for (let j = 1; j < 4; j++) rect(ctx, hx - 1, hy + drop + j * 2, 8, 1, '#c2cad4');
    } else if (t === 'netgun') {
      osRect(ctx, hx, hy + 2, 6, 4, '#4a4a4a', '#6e6e6e', '#222'); rect(ctx, hx + 5, hy + 3, 2, 1, '#1a1a1a');
      rect(ctx, hx, hy + 2, 4, 1, '#7a7a7a');
      if (c > 0.5) oRect(ctx, hx + 6, hy + 1, 5, 6, 'rgba(220,230,240,.4)', '#cfd8e2');
    } else if (t === 'forcefield') {
      osRect(ctx, hx, hy + 2, 5, 4, '#5a3f8a', '#8a6fc0', '#34245a'); rect(ctx, hx + 4, hy + 3, 2, 1, '#b89fff');
      if (c > 0.4) { ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx + 9, hy + 4, 3 + c * 2, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(154,216,255,.4)'; ctx.beginPath(); ctx.arc(hx + 9, hy + 4, 5 + c * 2, 0, 7); ctx.stroke(); }
    } else if (t === 'tranq') {
      osRect(ctx, hx, hy + 2, 8, 3, '#444', '#666', '#222'); rect(ctx, hx, hy + 2, 3, 1, '#2a2a2a'); rect(ctx, hx + 1, hy + 3, 5, 1, '#777');
      if (c > 0.5) { rect(ctx, hx + 8, hy + 3, 4, 1, '#f2c33c'); rect(ctx, hx + 11, hy + 3, 1, 1, '#fff'); }
    }
  }

  function heroDuck(ctx, cos, opts) {
    if (cos.has('backpack')) osRect(ctx, 0, 14, 4, 5, '#7a5326', '#a07440', '#4e3417');
    const jk = cos.has('jacket');
    osRect(ctx, 2, 14, 11, 8, jk ? '#3a5a8a' : OLIVE, jk ? '#5f86c0' : OLIVE_L, jk ? '#243f63' : OLIVE_D);
    rect(ctx, 2, 18, 11, 1, OLIVE_D);
    osRect(ctx, 2, 20, 5, 2, BOOT, BOOT_L, BOOT_D); osRect(ctx, 8, 20, 5, 2, BOOT, BOOT_L, BOOT_D);
    osRect(ctx, 4, 8, 8, 7, SKIN, SKIN_L, SKIN_D);
    if (cos.has('goggles')) { rect(ctx, 5, 10, 6, 2, '#222'); rect(ctx, 9, 10, 1, 1, '#5fe0f0'); }
    else rect(ctx, 9, 10, 1, 2, '#000');
    const hm = cos.has('helmet');
    osRect(ctx, 3, 6, 10, 4, hm ? '#4a5a6a' : HELM, hm ? '#7b8ea0' : HELM_L, hm ? '#2c3845' : HELM_D);
    rect(ctx, 4, 7, 6, 1, hm ? '#6a7a8a' : HELM_L);
    rect(ctx, 12, 13, 2, 2, cos.has('gloves') ? '#f2c33c' : SKIN);
  }

  /* ---------------- CRYPTIDS ---------------- */
  const CREATURE_SIZE = {
    bigfoot: [18, 26], mothman: [20, 20], chupacabra: [18, 14], nessie: [30, 22],
    grey: [14, 20], reptilian: [16, 22], kraken: [30, 24], jersey: [18, 24],
    door: [16, 26], flamingo: [16, 26]
  };
  // which creatures stand on the ground (get a contact shadow)
  const GROUNDED = { bigfoot: 1, chupacabra: 1, grey: 1, reptilian: 1, jersey: 1, door: 1, flamingo: 1 };

  function creature(ctx, type, x, y, facing, t) {
    const bob = Math.round(Math.sin(t * 6) * 1);
    flip(ctx, x, y + bob, (CREATURE_SIZE[type] || [16, 16])[0], facing, function () {
      (DRAW[type] || DRAW.bigfoot)(ctx, t);
    });
  }

  function glint(ctx, x, y) { rect(ctx, x, y, 1, 1, '#fff'); }

  const DRAW = {
    bigfoot(ctx) {
      osRect(ctx, 1, 4, 16, 20, '#6b4a2a', '#8a6238', '#48301a');
      rect(ctx, 5, 12, 8, 7, '#7d5832');                  // lit belly patch
      rect(ctx, 6, 12, 6, 1, '#9a7042');
      for (let i = 3; i < 15; i += 3) rect(ctx, i, 5, 1, 3, '#3c2a16'); // fur tufts
      osRect(ctx, 4, 0, 10, 8, '#5a3c20', '#754e2a', '#3a2614'); // head
      rect(ctx, 5, 1, 8, 1, '#754e2a');                   // brow highlight
      rect(ctx, 6, 4, 7, 1, '#2e1f10');                   // brow ridge shadow
      oRect(ctx, 6, 3, 3, 3, '#fff'); oRect(ctx, 10, 3, 3, 3, '#fff');
      rect(ctx, 7, 4, 1, 1, '#000'); rect(ctx, 11, 4, 1, 1, '#000'); glint(ctx, 7, 3); glint(ctx, 11, 3);
      rect(ctx, 8, 6, 2, 1, '#2e1f10');                   // nostrils/mouth
      osRect(ctx, 4, 22, 5, 3, '#3c2a16', '#523a1f', '#241608'); osRect(ctx, 10, 22, 5, 3, '#3c2a16', '#523a1f', '#241608');
      osRect(ctx, 0, 10, 3, 9, '#5a3c20', '#6f4a28', '#3a2614'); osRect(ctx, 15, 10, 3, 9, '#5a3c20', '#6f4a28', '#3a2614');
    },
    mothman(ctx, t) {
      const w = Math.sin(t * 10) * 2;
      osRect(ctx, 6, 4, 8, 14, '#3a3a44', '#52525f', '#222230');
      rect(ctx, 8, 6, 4, 6, '#4a4a58');                   // lit chest
      rect(ctx, 9, 6, 2, 1, '#5e5e6e');
      osRect(ctx, 0, 6 - w, 7, 9, '#2a2a33', '#3e3e4a', '#161620'); // wings
      osRect(ctx, 13, 6 + w, 7, 9, '#2a2a33', '#3e3e4a', '#161620');
      rect(ctx, 1, 8 - w, 5, 1, '#4a4a58'); rect(ctx, 14, 8 + w, 5, 1, '#1a1a24'); // wing edges
      oRect(ctx, 7, 2, 2, 3, '#ff5a4a'); oRect(ctx, 11, 2, 2, 3, '#ff5a4a'); // glowing eyes
      rect(ctx, 7, 2, 2, 1, '#ffb0a0'); rect(ctx, 11, 2, 2, 1, '#ffb0a0');
      rect(ctx, 7, 1, 6, 1, '#000');
    },
    chupacabra(ctx) {
      osRect(ctx, 2, 4, 14, 8, '#5a6650', '#74826a', '#3a4434');
      rect(ctx, 4, 8, 10, 3, '#6a785e');                  // lit belly
      for (let i = 3; i < 14; i += 3) { rect(ctx, i, 1, 1, 4, '#2a3026'); rect(ctx, i, 1, 1, 1, '#48543e'); } // spines + lit tips
      osRect(ctx, 11, 1, 6, 6, '#4a564a', '#5e6c5c', '#323c32'); // head
      oRect(ctx, 13, 3, 2, 2, '#ff4a3a'); rect(ctx, 14, 3, 1, 1, '#ffb0a0'); // glowing eye
      rect(ctx, 15, 5, 1, 1, '#2a3026');
      osRect(ctx, 3, 11, 2, 3, '#3a463a', '#4c5a4a', '#26302a'); osRect(ctx, 12, 11, 2, 3, '#3a463a', '#4c5a4a', '#26302a');
    },
    nessie(ctx, t) {
      osRect(ctx, 0, 14, 22, 8, '#2f7d54', '#46a070', '#1f5a3a');   // body
      const h = Math.round(Math.sin(t * 5) * 2);
      osRect(ctx, 6, 10 + h, 6, 5, '#2f7d54', '#46a070', '#1f5a3a'); // hump
      osRect(ctx, 20, 2, 7, 14, '#3a8a60', '#52a878', '#256044');    // neck
      rect(ctx, 21, 3, 1, 12, '#5cb886');                            // neck highlight
      osRect(ctx, 23, 0, 7, 6, '#3a8a60', '#52a878', '#256044');     // head
      rect(ctx, 27, 2, 1, 2, '#000'); glint(ctx, 27, 2); rect(ctx, 29, 3, 1, 1, '#256044'); // eye + nostril
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(2, 15, 6, 1); ctx.fillRect(12, 16, 6, 1); // ripples
    },
    grey(ctx) {
      osRect(ctx, 3, 0, 9, 9, '#bcc6c2', '#d8e0dc', '#8e9894'); // big head
      rect(ctx, 4, 1, 7, 1, '#e4ebE7');
      rect(ctx, 5, 7, 5, 1, '#90999a');                   // chin shade
      oRect(ctx, 4, 4, 3, 3, '#000'); oRect(ctx, 8, 4, 3, 3, '#000'); // almond eyes
      glint(ctx, 5, 4); glint(ctx, 9, 4);
      osRect(ctx, 5, 8, 5, 12, '#a8b2ae', '#c2ccc8', '#7c8682'); // body
      rect(ctx, 6, 9, 3, 6, '#b6c0bc');
      osRect(ctx, 3, 10, 2, 6, '#a8b2ae', '#c2ccc8', '#7c8682'); osRect(ctx, 10, 10, 2, 6, '#a8b2ae', '#c2ccc8', '#7c8682');
    },
    reptilian(ctx) {
      osRect(ctx, 3, 2, 10, 8, '#3f7a3a', '#58a050', '#285024'); // head
      rect(ctx, 4, 3, 8, 1, '#62ad58');
      osRect(ctx, 5, 4, 2, 2, '#f2d23c'); osRect(ctx, 9, 4, 2, 2, '#f2d23c'); // eyes
      rect(ctx, 6, 5, 1, 1, '#000'); rect(ctx, 10, 5, 1, 1, '#000');
      osRect(ctx, 4, 9, 8, 13, '#2f5a2c', '#447a40', '#1d3a1a'); // body
      for (let j = 11; j < 21; j += 3) { rect(ctx, 5, j, 6, 1, '#3f7038'); rect(ctx, 6, j, 4, 1, '#244a20'); } // belly ridges
      for (let i = 5; i < 12; i += 2) rect(ctx, i, 9, 1, 2, '#1f3a1c'); // back scales
      rect(ctx, 4, 21, 2, 1, '#1d3a1a'); rect(ctx, 10, 21, 2, 1, '#1d3a1a'); // claws
    },
    kraken(ctx, t) {
      osRect(ctx, 8, 2, 14, 12, '#6a3f8a', '#8a5faa', '#46285e'); // head
      rect(ctx, 10, 3, 9, 1, '#9a6fba');
      oRect(ctx, 11, 6, 2, 2, '#fff'); oRect(ctx, 17, 6, 2, 2, '#fff');
      rect(ctx, 12, 7, 1, 1, '#000'); rect(ctx, 18, 7, 1, 1, '#000'); glint(ctx, 11, 6); glint(ctx, 17, 6);
      for (let i = 0; i < 5; i++) {
        const ox = i * 6, wig = Math.round(Math.sin(t * 8 + i) * 2);
        osRect(ctx, ox, 14, 4, 10 + wig, '#7a4f9a', '#9a6fba', '#523072');
        for (let s = 16; s < 22 + wig; s += 3) rect(ctx, ox + 1, s, 1, 1, '#c49fd8'); // suckers
      }
    },
    jersey(ctx, t) {
      const w = Math.sin(t * 9) * 2;
      osRect(ctx, 6, 6, 7, 14, '#3a2a3a', '#544054', '#241624'); // body
      rect(ctx, 7, 7, 5, 5, '#4a364a');                   // lit chest
      osRect(ctx, 5, 0, 8, 7, '#4a3320', '#664830', '#2e1f12'); // head
      rect(ctx, 6, 1, 6, 1, '#664830');
      rect(ctx, 6, -2, 1, 3, '#3a2614'); rect(ctx, 11, -2, 1, 3, '#3a2614'); // horns
      rect(ctx, 6, -2, 1, 1, '#5a4028'); rect(ctx, 11, -2, 1, 1, '#5a4028');
      oRect(ctx, 8, 3, 2, 2, '#ff4a3a'); rect(ctx, 9, 3, 1, 1, '#ffb0a0'); // glowing eye
      osRect(ctx, 0, 8 - w, 7, 8, '#2a1f2a', '#3e2f3e', '#180f18'); // wings
      osRect(ctx, 12, 8 + w, 6, 8, '#2a1f2a', '#3e2f3e', '#180f18');
      osRect(ctx, 7, 18, 5, 4, '#2a1f2a', '#3e2f3e', '#180f18'); // legs
    },
    door(ctx, t) {
      osRect(ctx, 1, 0, 14, 26, '#8a5a2a', '#a8743a', '#5e3c1a'); // slab
      for (let i = 3; i < 13; i += 4) rect(ctx, i, 1, 1, 24, '#6e4620'); // wood grain
      osRect(ctx, 3, 2, 10, 11, '#6b4420', '#5e3a1a', '#86592c'); // recessed panels (inverted bevel)
      osRect(ctx, 3, 14, 10, 10, '#6b4420', '#5e3a1a', '#86592c');
      rect(ctx, 4, 3, 8, 1, '#4e3014'); rect(ctx, 4, 15, 8, 1, '#4e3014');
      oRect(ctx, 11, 12, 2, 2, '#f2c33c'); glint(ctx, 11, 12); // brass knob
      const s = Math.round(Math.sin(t * 8) * 1);
      osRect(ctx, 3, 24 + s, 4, 2, '#3a2a14', '#52401f', '#241608'); osRect(ctx, 9, 24 - s, 4, 2, '#3a2a14', '#52401f', '#241608');
    },
    flamingo(ctx, t) {
      osRect(ctx, 5, 4, 9, 9, '#f25fa0', '#ff8fc0', '#c43a78'); // body
      rect(ctx, 6, 5, 6, 1, '#ffa8d0');
      rect(ctx, 5, 4, 1, 9, '#ff9ec8'); rect(ctx, 13, 4, 1, 9, '#ff4a96'); // neon rim
      osRect(ctx, 8, 0, 5, 6, '#ff7ab0', '#ffa8d0', '#d2548c'); // head
      rect(ctx, 12, 2, 3, 1, '#f2c33c'); rect(ctx, 14, 2, 1, 1, '#a8730f'); // beak + tip
      rect(ctx, 11, 1, 1, 1, '#000'); glint(ctx, 11, 1);
      const k = Math.round(Math.sin(t * 6) * 2);
      rect(ctx, 7, 13, 1, 9 + k, '#f2c33c'); rect(ctx, 10, 13, 1, 9 - k, '#f2c33c'); // legs
      rect(ctx, 7, 17, 1, 1, '#a8730f'); rect(ctx, 10, 16, 1, 1, '#a8730f'); // knees
    }
  };

  /* ---------------- QUEST CREATURES ---------------- */
  const QUEST_SIZE = { rabbit: [12, 12], cat: [14, 10], chicken: [12, 14] };
  function quest(ctx, type, x, y, facing, t) {
    flip(ctx, x, y, (QUEST_SIZE[type] || [12, 12])[0], facing, function () {
      if (type === 'cat') {
        osRect(ctx, 1, 3, 12, 6, '#d98a2a', '#f0a843', '#a8651a'); // body
        rect(ctx, 2, 4, 10, 1, '#f0a843');
        rect(ctx, 4, 5, 1, 2, '#a8651a'); rect(ctx, 7, 4, 1, 3, '#a8651a'); // stripes
        osRect(ctx, 9, 0, 5, 5, '#d98a2a', '#f0a843', '#a8651a'); // head
        rect(ctx, 9, 0, 1, 2, '#000'); rect(ctx, 13, 0, 1, 2, '#000'); // ears
        rect(ctx, 11, 2, 1, 1, '#2a6'); glint(ctx, 11, 2);
        rect(ctx, 0, 4, 2, 1, '#d98a2a'); rect(ctx, 0, 3, 1, 1, '#f0a843'); // tail
      } else if (type === 'chicken') {
        osRect(ctx, 2, 4, 8, 8, '#f4f0e0', '#ffffff', '#cfc8b4'); // body
        rect(ctx, 3, 9, 6, 1, '#dcd6c2');                  // wing line
        osRect(ctx, 7, 0, 5, 6, '#f4f0e0', '#ffffff', '#cfc8b4'); // head
        oRect(ctx, 8, -1, 2, 2, '#d23b2f'); rect(ctx, 8, -1, 1, 1, '#ff6a5a'); // comb
        rect(ctx, 11, 3, 2, 1, '#f2c33c'); rect(ctx, 11, 4, 1, 1, '#c89a1a'); // beak
        rect(ctx, 9, 2, 1, 1, '#000'); glint(ctx, 9, 2);
        rect(ctx, 4, 12, 1, 2, '#f2c33c'); rect(ctx, 7, 12, 1, 2, '#f2c33c'); // legs
      } else { // rabbit
        osRect(ctx, 2, 4, 9, 7, '#e8e8ec', '#ffffff', '#bcbcc4'); // body
        osRect(ctx, 8, 2, 4, 5, '#e8e8ec', '#ffffff', '#bcbcc4'); // head
        rect(ctx, 8, -2, 1, 4, '#e8e8ec'); rect(ctx, 10, -2, 1, 4, '#e8e8ec'); // ears
        rect(ctx, 8, -2, 1, 2, '#f6c0d0'); rect(ctx, 10, -2, 1, 2, '#f6c0d0'); // inner ear
        rect(ctx, 10, 4, 1, 1, '#d23b2f'); glint(ctx, 10, 3);
        oRect(ctx, 0, 6, 3, 3, '#ffffff'); rect(ctx, 1, 7, 1, 1, '#dcdce2'); // fluffy tail
      }
    });
  }

  /* ---------------- ITEMS ---------------- */
  function coin(ctx, x, y, t) {
    const ph = Math.abs(Math.sin(t * 4 + x));
    const w = 1 + Math.round(ph * 4);
    const cx = x + 3, lx = Math.round(cx - (w - 1) / 2), iw = Math.max(1, w - 1);
    rect(ctx, Math.round(cx - w / 2), y, w, 6, '#000');   // outline
    rect(ctx, lx, y + 1, iw, 4, '#d89a1a');               // base
    rect(ctx, lx, y + 1, iw, 1, '#f9da4a');               // top highlight
    if (w > 2) rect(ctx, lx, y + 4, iw, 1, '#a8730f');    // bottom rim
    if (w > 3) { rect(ctx, cx - 1, y + 1, 1, 3, '#fff3b0'); rect(ctx, cx, y + 2, 1, 1, '#d89a1a'); } // glint + sheen
  }
  function bag(ctx, x, y) {
    osRect(ctx, x, y + 2, 8, 8, '#8a6a2a', '#a8843a', '#5e481c');
    rect(ctx, x + 2, y, 4, 3, '#6b4a22'); rect(ctx, x + 2, y, 4, 1, '#3a2814'); // tie
    rect(ctx, x + 3, y + 5, 2, 2, '#f2c33c'); glint(ctx, x + 3, y + 5);          // $ glint
  }

  return {
    rect, oRect, osRect, flip, shadow, hero, creature, quest, coin, bag,
    CREATURE_SIZE, QUEST_SIZE, GROUNDED
  };
})();
