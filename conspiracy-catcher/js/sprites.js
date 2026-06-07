/* =========================================================
   sprites.js — code-defined pixel art.
   Everything is drawn with chunky blocks + hard black outlines
   at the game's internal 320x180 resolution. Sprites draw into
   a local box [0..w]x[0..h]; the flip wrapper handles facing so
   art is only authored facing right.
   ========================================================= */
const Spr = (function () {

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  // outlined rect: black border with a filled interior (chunky Keen look)
  function oRect(ctx, x, y, w, h, fill, line) {
    rect(ctx, x, y, w, h, line || '#000');
    if (w > 2 && h > 2) rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
    else rect(ctx, x, y, w, h, fill);
  }

  // Draw fn into a local box, optionally mirrored for facing===-1.
  function flip(ctx, x, y, w, facing, fn) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    fn();
    ctx.restore();
  }

  /* ---------------- HERO (tough army guy) ----------------
     Local box 14 wide. Standing height 22 (feet at 22).
     opts: {frame, ducking, jumping, cosmetics(Set), tool, catch:0..1}
  */
  const SKIN = '#e0a878', SKIN_D = '#b06b3a';
  const OLIVE = '#5a6e2a', OLIVE_D = '#3c4a18', OLIVE_L = '#8aa83f';
  const HELM = '#2c3a18', HELM_C = '#3f5224';
  const BOOT = '#2a1f12';

  function hero(ctx, x, y, facing, opts) {
    opts = opts || {};
    const cos = opts.cosmetics || new Set();
    flip(ctx, x, y, 14, facing, function () {
      if (opts.ducking) { heroDuck(ctx, cos, opts); return; }
      const f = opts.frame || 0;          // 0 stand, 1/2 walk
      const jump = opts.jumping;
      // back item (backpack) — drawn first so it sits behind torso
      if (cos.has('backpack')) oRect(ctx, 0, 9, 4, 7, '#6b4a22');
      // legs
      if (jump) {
        oRect(ctx, 3, 16, 4, 5, OLIVE_D);
        oRect(ctx, 8, 15, 4, 5, OLIVE_D);
      } else if (f === 1) {
        oRect(ctx, 2, 16, 4, 6, OLIVE_D); oRect(ctx, 8, 16, 4, 5, OLIVE_D);
      } else if (f === 2) {
        oRect(ctx, 4, 16, 4, 5, OLIVE_D); oRect(ctx, 8, 16, 4, 6, OLIVE_D);
      } else {
        oRect(ctx, 3, 16, 4, 6, OLIVE_D); oRect(ctx, 7, 16, 4, 6, OLIVE_D);
      }
      // boots
      const bootCol = cos.has('boots') ? '#c23a26' : BOOT;
      rect(ctx, 2, 20, 6, 2, '#000'); rect(ctx, 7, 20, 6, 2, '#000');
      rect(ctx, 2, 20, 5, 1, bootCol); rect(ctx, 8, 20, 4, 1, bootCol);
      // torso
      oRect(ctx, 2, 9, 10, 8, cos.has('jacket') ? '#3a5a8a' : OLIVE);
      rect(ctx, 3, 13, 8, 1, '#3a2a14');                 // belt
      rect(ctx, 6, 14, 1, 1, '#c9a23a');                 // buckle
      if (!cos.has('jacket')) rect(ctx, 4, 10, 1, 2, OLIVE_L); // pocket hint
      // head
      oRect(ctx, 3, 2, 8, 7, SKIN);
      rect(ctx, 4, 8, 6, 1, SKIN_D);                     // jaw shade
      // eyes / goggles
      if (cos.has('goggles')) { rect(ctx, 4, 4, 6, 2, '#000'); rect(ctx, 7, 4, 2, 1, '#3fd0e0'); }
      else { rect(ctx, 8, 4, 1, 2, '#000'); }
      // helmet
      const hc = cos.has('helmet') ? '#4a5a6a' : HELM;
      oRect(ctx, 2, 0, 10, 4, hc);
      rect(ctx, 2, 3, 12, 1, '#000');                    // brim line
      rect(ctx, 3, 3, 10, 1, cos.has('helmet') ? '#6a7a8a' : HELM_C);
      if (cos.has('helmet')) rect(ctx, 6, 1, 2, 1, '#cfe0ff'); // shine
      // front arm + tool
      const hands = cos.has('gloves') ? '#f2c33c' : SKIN;
      armAndTool(ctx, opts, hands);
    });
  }

  function armAndTool(ctx, opts, hands) {
    const c = opts.catch || 0;            // 0..1 windup progress
    // arm reaches further forward as the catch swings
    const reach = Math.round(c * 4);
    oRect(ctx, 9, 9, 3, 6, opts.cosmetics && opts.cosmetics.has('jacket') ? '#3a5a8a' : OLIVE);
    rect(ctx, 10, 13, 2, 2, hands);       // hand
    const t = opts.tool || 'net';
    const hx = 12 + reach, hy = 8 - Math.round(c * 3);
    if (t === 'net') {
      rect(ctx, hx, hy, 1, 8, '#7a5a2a');                 // pole
      ctx.strokeStyle = '#dfe7ef'; ctx.lineWidth = 1;
      oRect(ctx, hx + 1, hy - 2, 5, 6, 'rgba(220,230,240,.5)', '#cfd8e2');
    } else if (t === 'cage') {
      const drop = Math.round(c * 6);
      oRect(ctx, hx - 1, hy + drop, 8, 8, 'rgba(180,190,200,.25)', '#b9c2cc');
      for (let i = 1; i < 4; i++) rect(ctx, hx - 1 + i * 2, hy + drop, 1, 8, '#b9c2cc');
      for (let j = 1; j < 4; j++) rect(ctx, hx - 1, hy + drop + j * 2, 8, 1, '#b9c2cc');
    } else if (t === 'netgun') {
      oRect(ctx, hx, hy + 2, 6, 4, '#444'); rect(ctx, hx + 5, hy + 3, 2, 1, '#222');
      if (c > 0.5) { oRect(ctx, hx + 6, hy + 1, 5, 6, 'rgba(220,230,240,.4)', '#cfd8e2'); }
    } else if (t === 'forcefield') {
      oRect(ctx, hx, hy + 2, 5, 4, '#5a3f8a'); rect(ctx, hx + 4, hy + 3, 2, 1, '#9a7fd0');
      if (c > 0.4) { ctx.strokeStyle = '#9ad8ff'; ctx.beginPath(); ctx.arc(hx + 9, hy + 4, 3 + c * 2, 0, 7); ctx.stroke(); }
    } else if (t === 'tranq') {
      rect(ctx, hx, hy + 3, 8, 2, '#3a3a3a'); rect(ctx, hx, hy + 2, 3, 1, '#222');
      if (c > 0.5) rect(ctx, hx + 8, hy + 3, 4, 1, '#f2c33c'); // dart streak
    }
  }

  function heroDuck(ctx, cos, opts) {
    // squashed: total height ~15, feet at 22
    if (cos.has('backpack')) oRect(ctx, 0, 14, 4, 5, '#6b4a22');
    oRect(ctx, 2, 14, 11, 8, cos.has('jacket') ? '#3a5a8a' : OLIVE);
    rect(ctx, 2, 20, 5, 2, BOOT); rect(ctx, 8, 20, 5, 2, BOOT);
    oRect(ctx, 4, 8, 8, 7, SKIN);
    if (cos.has('goggles')) rect(ctx, 5, 10, 6, 2, '#000'); else rect(ctx, 9, 10, 1, 2, '#000');
    oRect(ctx, 3, 6, 10, 4, cos.has('helmet') ? '#4a5a6a' : HELM);
    // tool tucked
    rect(ctx, 12, 13, 2, 2, cos.has('gloves') ? '#f2c33c' : SKIN);
  }

  /* ---------------- CRYPTIDS ----------------
     drawCreature(ctx, type, x, y, facing, t) — t is time(s) for idle bob.
     Each returns roughly its [w,h] via CREATURE_SIZE.
  */
  const CREATURE_SIZE = {
    bigfoot: [18, 26], mothman: [20, 20], chupacabra: [18, 14], nessie: [30, 22],
    grey: [14, 20], reptilian: [16, 22], kraken: [30, 24], jersey: [18, 24],
    door: [16, 26], flamingo: [16, 26]
  };

  function creature(ctx, type, x, y, facing, t) {
    const bob = Math.round(Math.sin(t * 6) * 1);
    flip(ctx, x, y + bob, (CREATURE_SIZE[type] || [16, 16])[0], facing, function () {
      (DRAW[type] || DRAW.bigfoot)(ctx, t);
    });
  }

  const DRAW = {
    bigfoot(ctx) {
      oRect(ctx, 1, 4, 16, 20, '#6b4a2a');
      oRect(ctx, 4, 0, 10, 8, '#5a3c20');               // head
      rect(ctx, 6, 3, 2, 2, '#fff'); rect(ctx, 10, 3, 2, 2, '#fff');
      rect(ctx, 7, 4, 1, 1, '#000'); rect(ctx, 11, 4, 1, 1, '#000');
      rect(ctx, 4, 22, 5, 2, '#3c2a16'); rect(ctx, 10, 22, 5, 2, '#3c2a16');
      rect(ctx, 0, 10, 3, 8, '#5a3c20'); rect(ctx, 15, 10, 3, 8, '#5a3c20'); // arms
    },
    mothman(ctx, t) {
      const w = Math.sin(t * 10) * 2;
      oRect(ctx, 6, 4, 8, 14, '#3a3a44');
      oRect(ctx, 0, 6 - w, 7, 9, '#2a2a33'); oRect(ctx, 13, 6 + w, 7, 9, '#2a2a33'); // wings
      rect(ctx, 7, 2, 2, 3, '#d23b2f'); rect(ctx, 11, 2, 2, 3, '#d23b2f');           // red eyes
      rect(ctx, 7, 1, 6, 1, '#000');
    },
    chupacabra(ctx) {
      oRect(ctx, 2, 4, 14, 8, '#5a6650');
      oRect(ctx, 12, 1, 6, 6, '#4a564a');               // head
      rect(ctx, 14, 3, 1, 2, '#d23b2f');
      for (let i = 3; i < 14; i += 3) rect(ctx, i, 2, 1, 3, '#2a3026'); // spines
      rect(ctx, 3, 11, 2, 3, '#3a463a'); rect(ctx, 12, 11, 2, 3, '#3a463a');
    },
    nessie(ctx, t) {
      oRect(ctx, 0, 14, 22, 8, '#2f7d54');              // body in water
      oRect(ctx, 20, 2, 7, 14, '#3a8a60');              // neck
      oRect(ctx, 23, 0, 7, 6, '#3a8a60');               // head
      rect(ctx, 27, 2, 1, 2, '#000');
      const h = Math.round(Math.sin(t * 5) * 2);
      oRect(ctx, 6, 10 + h, 6, 5, '#2f7d54');           // hump
    },
    grey(ctx) {
      oRect(ctx, 3, 0, 9, 9, '#b8c2bf');                // big head
      rect(ctx, 4, 4, 3, 3, '#000'); rect(ctx, 8, 4, 3, 3, '#000'); // black almond eyes
      oRect(ctx, 5, 8, 5, 12, '#aab4b0');               // skinny body
      rect(ctx, 3, 10, 2, 6, '#aab4b0'); rect(ctx, 10, 10, 2, 6, '#aab4b0');
    },
    reptilian(ctx) {
      oRect(ctx, 3, 2, 10, 8, '#3f7a3a');               // head
      rect(ctx, 5, 5, 2, 2, '#f2c33c'); rect(ctx, 9, 5, 2, 2, '#f2c33c');
      rect(ctx, 6, 6, 1, 1, '#000'); rect(ctx, 10, 6, 1, 1, '#000');
      oRect(ctx, 4, 9, 8, 13, '#2f5a2c');
      for (let i = 5; i < 12; i += 2) rect(ctx, i, 9, 1, 2, '#1f3a1c');
    },
    kraken(ctx, t) {
      oRect(ctx, 8, 2, 14, 12, '#6a3f8a');              // head
      rect(ctx, 11, 6, 2, 2, '#fff'); rect(ctx, 17, 6, 2, 2, '#fff');
      rect(ctx, 12, 7, 1, 1, '#000'); rect(ctx, 18, 7, 1, 1, '#000');
      for (let i = 0; i < 5; i++) {                     // tentacles
        const ox = i * 6, wig = Math.round(Math.sin(t * 8 + i) * 2);
        oRect(ctx, ox, 14, 4, 10 + wig, '#7a4f9a');
      }
    },
    jersey(ctx, t) {
      const w = Math.sin(t * 9) * 2;
      oRect(ctx, 6, 6, 7, 14, '#3a2a3a');               // body
      oRect(ctx, 5, 0, 8, 7, '#4a3320');                // horse-ish head
      rect(ctx, 6, -2, 1, 3, '#4a3320'); rect(ctx, 11, -2, 1, 3, '#4a3320'); // horns
      rect(ctx, 9, 3, 2, 2, '#d23b2f');
      oRect(ctx, 0, 8 - w, 7, 8, '#2a1f2a'); oRect(ctx, 12, 8 + w, 6, 8, '#2a1f2a'); // wings
      rect(ctx, 7, 18, 5, 4, '#2a1f2a');
    },
    door(ctx, t) {
      oRect(ctx, 1, 0, 14, 26, '#8a5a2a');              // the walking door
      oRect(ctx, 3, 2, 10, 11, '#6b4420'); oRect(ctx, 3, 14, 10, 10, '#6b4420');
      rect(ctx, 11, 12, 2, 2, '#f2c33c');               // knob
      const s = Math.round(Math.sin(t * 8) * 1);
      rect(ctx, 3, 24 + s, 4, 2, '#3a2a14'); rect(ctx, 9, 24 - s, 4, 2, '#3a2a14'); // tiny feet
    },
    flamingo(ctx, t) {
      oRect(ctx, 5, 4, 9, 9, '#f25fa0');                // body
      oRect(ctx, 8, 0, 5, 6, '#ff7ab0');                // head
      rect(ctx, 12, 2, 3, 1, '#f2c33c');                // beak
      rect(ctx, 12, 3, 2, 1, '#000');
      rect(ctx, 11, 1, 1, 1, '#000');
      const k = Math.round(Math.sin(t * 6) * 2);
      rect(ctx, 7, 13, 1, 9 + k, '#f2c33c'); rect(ctx, 10, 13, 1, 9 - k, '#f2c33c'); // legs
    }
  };

  /* ---------------- QUEST CREATURES ---------------- */
  const QUEST_SIZE = { rabbit: [12, 12], cat: [14, 10], chicken: [12, 14] };
  function quest(ctx, type, x, y, facing, t) {
    flip(ctx, x, y, (QUEST_SIZE[type] || [12, 12])[0], facing, function () {
      if (type === 'cat') {
        oRect(ctx, 1, 3, 12, 6, '#d98a2a');
        oRect(ctx, 9, 0, 5, 5, '#d98a2a');
        rect(ctx, 9, 0, 1, 2, '#000'); rect(ctx, 13, 0, 1, 2, '#000'); // ears
        rect(ctx, 11, 2, 1, 1, '#2a6'); rect(ctx, 0, 4, 2, 1, '#d98a2a');
      } else if (type === 'chicken') {
        oRect(ctx, 2, 4, 8, 8, '#f4f0e0');
        oRect(ctx, 7, 0, 5, 6, '#f4f0e0');
        rect(ctx, 8, -1, 2, 2, '#d23b2f');             // comb
        rect(ctx, 11, 3, 2, 1, '#f2c33c');             // beak
        rect(ctx, 9, 2, 1, 1, '#000');
        rect(ctx, 4, 12, 1, 2, '#f2c33c'); rect(ctx, 7, 12, 1, 2, '#f2c33c');
      } else { // rabbit
        oRect(ctx, 2, 4, 9, 7, '#e8e8ec');
        oRect(ctx, 8, 2, 4, 5, '#e8e8ec');
        rect(ctx, 8, -2, 1, 4, '#e8e8ec'); rect(ctx, 10, -2, 1, 4, '#e8e8ec'); // ears
        rect(ctx, 10, 4, 1, 1, '#d23b2f'); rect(ctx, 0, 7, 2, 2, '#fff');      // eye, tail
      }
    });
  }

  /* ---------------- ITEMS ---------------- */
  function coin(ctx, x, y, t) {
    const ph = Math.abs(Math.sin(t * 4 + x));
    const w = 1 + Math.round(ph * 4);
    rect(ctx, x + 3 - w / 2, y, w, 6, '#000');
    rect(ctx, x + 3 - (w - 1) / 2, y + 1, Math.max(1, w - 1), 4, '#f2c33c');
    if (w > 3) rect(ctx, x + 3, y + 1, 1, 4, '#fff7c8');
  }
  function bag(ctx, x, y) {
    oRect(ctx, x, y + 2, 8, 8, '#8a6a2a');
    rect(ctx, x + 2, y, 4, 3, '#6b4a22');
    rect(ctx, x + 3, y + 5, 2, 2, '#f2c33c');
  }

  return {
    rect, oRect, flip, hero, creature, quest, coin, bag,
    CREATURE_SIZE, QUEST_SIZE
  };
})();
