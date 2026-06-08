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
    bigfoot: [20, 28], mothman: [22, 22], chupacabra: [22, 16], nessie: [32, 22],
    grey: [14, 22], reptilian: [24, 22], kraken: [22, 28], jersey: [22, 24],
    door: [16, 26], flamingo: [16, 28]
  };
  // which creatures stand on the ground (get a contact shadow)
  const GROUNDED = { bigfoot: 1, chupacabra: 1, grey: 1, reptilian: 1, jersey: 1, door: 1, flamingo: 1, kraken: 1 };

  function creature(ctx, type, x, y, facing, t) {
    const bob = Math.round(Math.sin(t * 6) * 1);
    flip(ctx, x, y + bob, (CREATURE_SIZE[type] || [16, 16])[0], facing, function () {
      (DRAW[type] || DRAW.bigfoot)(ctx, t);
    });
  }

  function glint(ctx, x, y) { rect(ctx, x, y, 1, 1, '#fff'); }

  const DRAW = {
    bigfoot(ctx) {
      const B = '#6b4a2a', L = '#8a6238', D = '#46301a';
      // long shaggy arms down both sides
      osRect(ctx, 0, 9, 4, 13, B, L, D); osRect(ctx, 16, 9, 4, 13, B, L, D);
      rect(ctx, 1, 20, 3, 2, '#3c2a16'); rect(ctx, 17, 20, 3, 2, '#3c2a16'); // hands
      // two thick legs
      osRect(ctx, 5, 19, 5, 8, B, L, D); osRect(ctx, 10, 19, 5, 8, B, L, D);
      rect(ctx, 9, 20, 1, 7, D);                          // leg gap shadow
      // big flat feet
      osRect(ctx, 3, 26, 8, 2, '#3c2a16', '#523a1f', '#241608'); osRect(ctx, 10, 26, 8, 2, '#3c2a16', '#523a1f', '#241608');
      // hunched torso
      osRect(ctx, 3, 8, 14, 13, B, L, D);
      rect(ctx, 6, 12, 8, 7, '#7d5832'); rect(ctx, 7, 12, 6, 1, '#9a7042'); // lit belly patch
      // shaggy fur — vertical strands over body & arms
      for (let i = 4; i < 17; i += 2) rect(ctx, i, 9, 1, 4, D);
      rect(ctx, 1, 11, 1, 4, D); rect(ctx, 18, 11, 1, 4, D);
      rect(ctx, 3, 8, 1, 2, B); rect(ctx, 16, 8, 1, 2, B); // shoulder tufts
      // head
      osRect(ctx, 6, 0, 9, 9, '#5a3c20', '#754e2a', '#3a2614');
      rect(ctx, 5, 0, 1, 2, '#5a3c20'); rect(ctx, 15, 0, 1, 2, '#5a3c20'); // head fur
      rect(ctx, 7, 4, 7, 4, '#8a6238');                   // lighter muzzle
      rect(ctx, 6, 3, 8, 1, '#2e1f10');                   // brow ridge
      oRect(ctx, 7, 3, 3, 3, '#fff'); oRect(ctx, 11, 3, 3, 3, '#fff');
      rect(ctx, 8, 4, 1, 1, '#000'); rect(ctx, 12, 4, 1, 1, '#000'); glint(ctx, 8, 3); glint(ctx, 12, 3);
      rect(ctx, 9, 5, 1, 1, '#3a2614'); rect(ctx, 11, 5, 1, 1, '#3a2614'); // nostrils
      rect(ctx, 9, 7, 3, 1, '#2e1f10');                   // mouth
    },
    mothman(ctx, t) {
      const w = Math.sin(t * 10) * 2;
      const WB = '#2a2a33', WL = '#3e3e4a', WD = '#161620';
      // big spread wings with strut + scalloped lower edge
      osRect(ctx, 0, 4 - w, 8, 12, WB, WL, WD); osRect(ctx, 14, 4 + w, 8, 12, WB, WL, WD);
      rect(ctx, 1, 6 - w, 6, 1, WL); rect(ctx, 15, 6 + w, 6, 1, WL);        // leading edge
      rect(ctx, 2, 5 - w, 1, 9, WD); rect(ctx, 5, 5 - w, 1, 9, WD);          // wing struts
      rect(ctx, 16, 5 + w, 1, 9, WD); rect(ctx, 19, 5 + w, 1, 9, WD);
      // legs
      osRect(ctx, 8, 16, 3, 5, '#222230', '#36363f', '#14141c'); osRect(ctx, 11, 16, 3, 5, '#222230', '#36363f', '#14141c');
      // arms
      osRect(ctx, 5, 7, 3, 6, WB, WL, WD); osRect(ctx, 14, 7, 3, 6, WB, WL, WD);
      // torso
      osRect(ctx, 7, 4, 8, 13, '#3a3a44', '#52525f', '#222230');
      rect(ctx, 9, 6, 4, 7, '#4a4a58'); rect(ctx, 9, 6, 2, 1, '#5e5e6e');   // chest fuzz
      // head, antennae, glowing eyes
      rect(ctx, 9, 0, 1, 2, WD); rect(ctx, 12, 0, 1, 2, WD);                 // antennae
      osRect(ctx, 8, 1, 6, 4, '#33333d', '#46464f', '#1c1c26');
      oRect(ctx, 8, 2, 2, 2, '#ff5a4a'); oRect(ctx, 12, 2, 2, 2, '#ff5a4a'); // glowing eyes
      rect(ctx, 8, 2, 2, 1, '#ffb0a0'); rect(ctx, 12, 2, 2, 1, '#ffb0a0');
    },
    chupacabra(ctx) {
      const B = '#5a6650', L = '#74826a', D = '#3a4434';
      const LG = '#3a463a', LL = '#4c5a4a', LD = '#26302a';
      // four legs (two front, two back) with claws
      osRect(ctx, 3, 11, 3, 5, LG, LL, LD); osRect(ctx, 7, 11, 3, 4, LG, LL, LD);
      osRect(ctx, 13, 11, 3, 4, LG, LL, LD); osRect(ctx, 16, 11, 3, 5, LG, LL, LD);
      rect(ctx, 3, 15, 3, 1, '#cfcf6a'); rect(ctx, 16, 15, 3, 1, '#cfcf6a'); // claws
      // thin up-curling tail (back-left)
      osRect(ctx, 0, 6, 4, 2, B, L, D); rect(ctx, 0, 5, 1, 2, B);
      // arched body
      osRect(ctx, 3, 5, 15, 7, B, L, D);
      rect(ctx, 5, 9, 11, 2, '#6a785e');                  // lit belly
      // spiny back ridge
      for (let i = 4; i < 16; i += 2) { rect(ctx, i, 3, 1, 3, '#2a3026'); rect(ctx, i, 3, 1, 1, '#48543e'); }
      // head + snout (right)
      osRect(ctx, 15, 3, 7, 6, '#4a564a', '#5e6c5c', '#323c32');
      rect(ctx, 21, 5, 1, 2, D);                          // snout tip
      oRect(ctx, 17, 4, 2, 2, '#ff4a3a'); rect(ctx, 18, 4, 1, 1, '#ffb0a0'); // glowing eye
      rect(ctx, 19, 7, 3, 1, '#fff');                     // fangs
    },
    nessie(ctx, t) {
      const B = '#2f7d54', L = '#46a070', D = '#1f5a3a';
      const h = Math.round(Math.sin(t * 5) * 2);
      // long tapering tail to the left
      osRect(ctx, 0, 14, 7, 4, B, L, D); rect(ctx, 0, 13, 3, 2, B); rect(ctx, 1, 14, 4, 1, L);
      // body
      osRect(ctx, 6, 13, 15, 7, B, L, D);
      osRect(ctx, 9, 9 + h, 6, 5, B, L, D); rect(ctx, 10, 9 + h, 4, 1, L); // hump
      // flippers
      osRect(ctx, 7, 18, 4, 3, '#276845', '#3a8a60', '#1a4a30'); osRect(ctx, 14, 18, 4, 3, '#276845', '#3a8a60', '#1a4a30');
      // neck rising on the right + small head
      osRect(ctx, 20, 2, 7, 14, '#3a8a60', '#52a878', '#256044');
      rect(ctx, 21, 3, 1, 12, '#5cb886');                            // neck highlight
      osRect(ctx, 23, 0, 8, 6, '#3a8a60', '#52a878', '#256044');     // head
      rect(ctx, 30, 2, 1, 2, D);                                     // snout
      rect(ctx, 27, 2, 1, 2, '#000'); glint(ctx, 27, 2);
      // water ripples
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(2, 19, 7, 1); ctx.fillRect(12, 20, 7, 1);
    },
    grey(ctx) {
      const B = '#a8b2ae', L = '#c2ccc8', D = '#7c8682';
      // long thin limbs (arms + legs)
      osRect(ctx, 1, 9, 2, 7, B, L, D); osRect(ctx, 11, 9, 2, 7, B, L, D);
      rect(ctx, 1, 15, 2, 1, D); rect(ctx, 11, 15, 2, 1, D);          // hands
      osRect(ctx, 4, 16, 2, 6, B, L, D); osRect(ctx, 8, 16, 2, 6, B, L, D);
      rect(ctx, 4, 21, 2, 1, D); rect(ctx, 8, 21, 2, 1, D);           // feet
      // slender torso + neck
      osRect(ctx, 5, 8, 4, 9, B, L, D); rect(ctx, 6, 9, 2, 6, '#b6c0bc');
      rect(ctx, 6, 6, 2, 2, B);                                       // neck
      // big bulbous head, almond eyes
      osRect(ctx, 2, 0, 10, 8, '#bcc6c2', '#d8e0dc', '#8e9894');
      rect(ctx, 3, 1, 8, 1, '#e4ebe7');
      oRect(ctx, 3, 3, 3, 3, '#000'); oRect(ctx, 8, 3, 3, 3, '#000'); glint(ctx, 4, 3); glint(ctx, 9, 3);
      rect(ctx, 6, 6, 2, 1, '#90999a');                              // mouth slit
    },
    reptilian(ctx) {
      const B = '#2f5a2c', L = '#447a40', D = '#1d3a1a';
      // long tail curling down to the left
      osRect(ctx, 6, 15, 5, 3, B, L, D); osRect(ctx, 3, 17, 4, 3, B, L, D); osRect(ctx, 0, 19, 4, 2, B, L, D);
      rect(ctx, 1, 19, 2, 1, L);
      for (let i = 2; i < 9; i += 2) rect(ctx, i, 16, 1, 1, D); // tail scales
      // two legs with clawed feet
      osRect(ctx, 11, 15, 3, 6, B, L, D); osRect(ctx, 15, 15, 3, 6, B, L, D);
      rect(ctx, 11, 20, 4, 1, D); rect(ctx, 15, 20, 4, 1, D);
      rect(ctx, 11, 21, 1, 1, '#cfcf6a'); rect(ctx, 13, 21, 1, 1, '#cfcf6a'); rect(ctx, 17, 21, 1, 1, '#cfcf6a');
      // far arm (behind, darker)
      osRect(ctx, 8, 9, 3, 6, '#27491f', '#3a6630', '#173012');
      // upright torso with belly ridges + back spikes
      osRect(ctx, 10, 7, 9, 10, B, L, D);
      for (let j = 9; j < 16; j += 2) { rect(ctx, 11, j, 6, 1, '#3f7038'); rect(ctx, 12, j, 4, 1, '#244a20'); }
      for (let j = 7; j < 16; j += 2) rect(ctx, 9, j, 1, 1, D); // spine
      // near arm reaching forward + claws
      osRect(ctx, 17, 8, 3, 6, B, L, D); rect(ctx, 18, 13, 2, 1, '#cfcf6a');
      // head with snout + fangs
      osRect(ctx, 13, 0, 8, 7, B, L, D);
      for (let i = 14; i < 20; i += 2) rect(ctx, i, 0, 1, 1, D); // head crest
      rect(ctx, 20, 3, 3, 2, B); rect(ctx, 20, 3, 3, 1, L); rect(ctx, 22, 4, 1, 1, D); // snout
      osRect(ctx, 15, 2, 2, 2, '#f2d23c'); osRect(ctx, 18, 2, 2, 2, '#f2d23c'); // eyes
      rect(ctx, 15, 3, 1, 1, '#000'); rect(ctx, 18, 3, 1, 1, '#000');
      rect(ctx, 20, 5, 3, 1, '#fff');                     // teeth
    },
    kraken(ctx, t) {
      const B = '#7a3f9a', L = '#a060c4', D = '#4e2868';
      const A = '#8a4faa', AL = '#a878c8', AD = '#5e3478';
      // two side fins near the top of the mantle
      osRect(ctx, 2, 2, 5, 5, A, AL, AD); osRect(ctx, 15, 2, 5, 5, A, AL, AD);
      // pointed mantle
      rect(ctx, 9, 0, 4, 2, D);
      osRect(ctx, 7, 1, 8, 6, B, L, D);
      osRect(ctx, 5, 6, 12, 10, B, L, D);                 // head/mantle
      rect(ctx, 7, 7, 8, 1, L);
      // big squid eye + brow
      oRect(ctx, 7, 9, 4, 4, '#fff'); rect(ctx, 8, 10, 2, 2, '#000'); glint(ctx, 8, 10);
      rect(ctx, 7, 8, 5, 1, D); rect(ctx, 13, 9, 3, 3, '#3a1f4a'); // far-side shade
      // cluster of waving arms reaching to the ground
      for (let i = 0; i < 6; i++) {
        const ox = 2 + i * 3, wig = Math.round(Math.sin(t * 8 + i) * 2);
        osRect(ctx, ox, 15, 2, 11 + wig, A, AL, AD);
        for (let s = 17; s < 25 + wig; s += 3) rect(ctx, ox, s, 1, 1, '#d8b0e8'); // suckers
      }
      // two longer tentacles
      osRect(ctx, 1, 15, 2, 13, B, L, D); osRect(ctx, 19, 15, 2, 13, B, L, D);
    },
    jersey(ctx, t) {
      const w = Math.sin(t * 9) * 2;
      const B = '#3a2a3a', L = '#544054', D = '#241624';
      const WB = '#2a1f2a', WL = '#3e2f3e', WD = '#180f18';
      // bat wings spread both sides, with finger struts
      osRect(ctx, 0, 6 - w, 7, 9, WB, WL, WD); osRect(ctx, 15, 6 + w, 7, 9, WB, WL, WD);
      rect(ctx, 1, 8 - w, 5, 1, '#4a364a'); rect(ctx, 16, 8 + w, 5, 1, '#4a364a');
      rect(ctx, 3, 7 - w, 1, 7, WD); rect(ctx, 18, 7 + w, 1, 7, WD);
      // forked tail curling down-left
      osRect(ctx, 4, 16, 4, 2, B, L, D); osRect(ctx, 1, 17, 4, 2, B, L, D);
      rect(ctx, 0, 16, 2, 1, D); rect(ctx, 0, 19, 2, 1, D);   // fork tip
      // two legs with hooves
      osRect(ctx, 8, 17, 3, 5, B, L, D); osRect(ctx, 12, 17, 3, 5, B, L, D);
      rect(ctx, 8, 21, 3, 1, '#1a121a'); rect(ctx, 12, 21, 3, 1, '#1a121a');
      // torso + small clawed arm
      osRect(ctx, 7, 7, 8, 11, B, L, D); rect(ctx, 8, 8, 6, 4, '#4a364a');
      osRect(ctx, 14, 9, 3, 5, B, L, D); rect(ctx, 16, 13, 1, 1, '#cfcf6a');
      // horse-like head, horns, snout, glowing eye
      osRect(ctx, 11, 0, 8, 7, '#4a3320', '#664830', '#2e1f12');
      rect(ctx, 17, 3, 2, 2, '#4a3320');                      // snout
      rect(ctx, 12, -2, 1, 3, '#3a2614'); rect(ctx, 16, -2, 1, 3, '#3a2614'); // horns
      rect(ctx, 12, -2, 1, 1, '#5a4028'); rect(ctx, 16, -2, 1, 1, '#5a4028');
      oRect(ctx, 13, 2, 2, 2, '#ff4a3a'); rect(ctx, 14, 2, 1, 1, '#ffb0a0');
    },
    door(ctx, t) {
      const s = Math.round(Math.sin(t * 8) * 1);
      // little flailing stick arms
      rect(ctx, 0, 9, 1, 5, '#3a2a14'); rect(ctx, 0, 13, 2, 1, '#3a2a14');
      rect(ctx, 15, 9, 1, 5, '#3a2a14'); rect(ctx, 14, 13, 2, 1, '#3a2a14');
      // slab + grain + recessed panels
      osRect(ctx, 1, 0, 14, 24, '#8a5a2a', '#a8743a', '#5e3c1a');
      for (let i = 3; i < 13; i += 4) rect(ctx, i, 1, 1, 22, '#6e4620');
      osRect(ctx, 3, 2, 10, 10, '#6b4420', '#5e3a1a', '#86592c');
      osRect(ctx, 3, 13, 10, 9, '#6b4420', '#5e3a1a', '#86592c');
      rect(ctx, 4, 3, 8, 1, '#4e3014'); rect(ctx, 4, 14, 8, 1, '#4e3014');
      oRect(ctx, 11, 11, 2, 2, '#f2c33c'); glint(ctx, 11, 11); // brass knob
      // two little walking feet
      osRect(ctx, 3, 24 + s, 4, 2, '#3a2a14', '#52401f', '#241608'); osRect(ctx, 9, 24 - s, 4, 2, '#3a2a14', '#52401f', '#241608');
    },
    flamingo(ctx, t) {
      const B = '#f25fa0', L = '#ff8fc0', D = '#c43a78';
      const k = Math.round(Math.sin(t * 6) * 2);
      // long thin legs with backward-bending knees + feet
      rect(ctx, 6, 16, 1, 11 + k, '#f2c33c'); rect(ctx, 9, 16, 1, 11 - k, '#f2c33c');
      rect(ctx, 6, 21, 1, 1, '#a8730f'); rect(ctx, 9, 20, 1, 1, '#a8730f');   // knees
      rect(ctx, 5, 27 + k, 3, 1, '#f2c33c'); rect(ctx, 8, 27 - k, 3, 1, '#f2c33c'); // feet
      // plump body
      osRect(ctx, 4, 9, 9, 8, B, L, D); rect(ctx, 5, 10, 6, 1, L);
      rect(ctx, 4, 9, 1, 8, '#ff9ec8'); rect(ctx, 12, 9, 1, 8, '#ff4a96');   // neon rim
      // folded wing
      osRect(ctx, 5, 11, 6, 4, '#e34f90', '#ff7ab0', '#b8336e'); rect(ctx, 6, 12, 4, 1, '#ff9ec8');
      // long curved neck up to the head
      rect(ctx, 10, 5, 2, 5, B); rect(ctx, 11, 2, 2, 4, B); rect(ctx, 10, 5, 1, 5, L);
      osRect(ctx, 11, 0, 4, 4, '#ff7ab0', '#ffa8d0', '#d2548c');             // head
      rect(ctx, 14, 1, 2, 2, '#f2c33c'); rect(ctx, 15, 2, 1, 1, '#000'); rect(ctx, 15, 1, 1, 1, '#a8730f'); // hooked beak
      rect(ctx, 12, 1, 1, 1, '#000'); glint(ctx, 12, 1);
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
