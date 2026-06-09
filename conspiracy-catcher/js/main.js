/* =========================================================
   main.js — boot, scaling, state machine, the play loop.
   States: title, intro, play, complete, shop, win.
   Gameplay renders on the canvas; the rest are DOM overlays.
   ========================================================= */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const GROUND_Y = 150;
  const SAVE_KEY = 'cc_save_v1';

  // ---------- persistence ----------
  function defaultSave() { return { coins: 0, tools: ['net'], cosmetics: [], level: 0 }; }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const s = JSON.parse(raw);
      if (!s.tools || s.tools.indexOf('net') === -1) s.tools = ['net'].concat(s.tools || []);
      s.cosmetics = s.cosmetics || [];
      s.coins = s.coins || 0;
      s.level = Math.min(s.level || 0, LEVELS.length - 1);
      return s;
    } catch (e) { return defaultSave(); }
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
  let save = load();

  // ---------- tiny audio ----------
  let actx = null;
  function beep(freq, dur, type) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.value = 0.04; o.connect(g); g.connect(actx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.stop(actx.currentTime + dur);
    } catch (e) {}
  }

  // ---------- DOM screens ----------
  const screens = {
    title: document.getElementById('titleScreen'),
    intro: document.getElementById('introScreen'),
    complete: document.getElementById('completeScreen'),
    shop: document.getElementById('shopScreen'),
    win: document.getElementById('winScreen')
  };
  const touchEl = document.getElementById('touch');
  let state = 'title';
  function show(st) {
    state = st;
    for (const k in screens) screens[k].classList.toggle('hidden', k !== st);
    touchEl.classList.toggle('hidden', st !== 'play');
  }

  // ---------- level runtime ----------
  let g = null;

  function buildLevel(idx) {
    const level = LEVELS[idx];
    const env = ENVS[level.env];
    const cos = new Set(save.cosmetics);
    const player = new Player(24, GROUND_Y, level.tool, cos, !!level.fast);

    // platforms — a few floating ledges to reward jumping
    const platforms = [];
    const pcount = 4 + (idx % 3);
    for (let i = 0; i < pcount; i++) {
      const px = 200 + i * ((level.width - 360) / pcount) + (Math.random() * 40 - 20);
      const py = GROUND_Y - (28 + (i % 2) * 26);
      platforms.push({ x: Math.round(px), y: Math.round(py), w: 40 + Math.round(Math.random() * 24) });
    }

    // coins: ground line + some on platforms (reward jumping)
    const coins = [];
    const groundCoins = 15;
    for (let i = 0; i < groundCoins; i++) {
      const cx = 90 + Math.random() * (level.width - 240);
      coins.push({ x: Math.round(cx), y: GROUND_Y - 9, got: false });
    }
    platforms.forEach(function (p) {
      const n = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < n; j++) coins.push({ x: p.x + 6 + j * 12, y: p.y - 9, got: false });
    });

    const safetyX = level.width - 70;
    const playerSpeed = player.stats.speed;
    // Creature speed is a fraction of the player's so the chase *converges*
    // but slowly — it should span most of the level, not end in two strides.
    // Higher levels close the gap slower (the fraction rises), so they're
    // harder; upgrades (boots) widen the margin again.
    const frac = 0.60 + idx * 0.012;            // 0.60 .. 0.708 (later = slower close = harder)
    const cSpeed = playerSpeed * frac;
    // A real head start so the run actually traverses coins/quests.
    const creatureStartX = Math.round(120 + level.width * 0.18);
    const creature = new Creature(level.creature, creatureStartX, GROUND_Y, cSpeed, safetyX);

    const quest = level.quest ? new Quest(level.quest, Math.round(level.width * 0.28), GROUND_Y) : null;

    // themed obstacles to jump over — spaced out, away from start and den.
    // A level may list one type or several (picked per obstacle).
    const obstacles = [];
    const obTypes = Array.isArray(level.obstacle) ? level.obstacle : [level.obstacle];
    for (let ox = 440; ox < level.width - 180; ox += 280 + Math.random() * 200) {
      const ty = obTypes[Math.floor(Math.random() * obTypes.length)];
      const sz = Render.OB_SIZE[ty] || [12, 12];
      obstacles.push({ type: ty, x: Math.round(ox), w: sz[0], h: sz[1] });
    }

    g = {
      idx: idx, level: level, env: env, width: level.width, groundY: GROUND_Y,
      player: player, creature: creature, quest: quest, obstacles: obstacles,
      platforms: platforms, coinItems: coins, particles: [],
      coins: save.coins,           // running total shown in the HUD
      camX: 0, t: 0,
      coinsAtStart: save.coins,
      phase: 'play', phaseT: 0, message: '', messageT: 0
    };
  }

  function startLevel(idx) {
    buildLevel(idx);
    document.getElementById('introNum').textContent = idx + 1;
    document.getElementById('introName').textContent = LEVELS[idx].name.toUpperCase();
    document.getElementById('introBlurb').textContent = LEVELS[idx].blurb;
    document.getElementById('introTool').textContent = TOOLS[LEVELS[idx].tool].name;
    show('intro');
  }
  function restartLevel(idx) {
    save.coins = g.coinsAtStart; persist();
    buildLevel(idx);
    show('play');
  }

  function spawnText(x, y, txt, col) {
    g.particles.push({ x: x, y: y, vy: -28, life: 0.9, max: 0.9, txt: txt, col: col || '#fff' });
  }
  function spawnPuff(x, y, col) {
    for (let i = 0; i < 6; i++) g.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 30, life: 0.4, max: 0.4, col: col || '#fff' });
  }

  // ---------- catch resolution ----------
  function inRange(p, target) {
    const dx = Math.abs(p.centerX() - target.centerX());
    const dy = Math.abs(p.centerY() - target.centerY());
    return dx <= p.stats.range + target.w / 2 && dy <= 28;
  }
  function resolveCatch() {
    const p = g.player;
    const cr = g.creature;
    if ((cr.state === 'flee' || cr.state === 'wait') && inRange(p, cr)) {
      cr.state = 'caught';
      g.phase = 'won'; g.phaseT = 1.0; g.message = 'GOT IT!';
      spawnPuff(cr.centerX(), cr.centerY(), '#fff');
      beep(660, 0.08); setTimeout(function () { beep(990, 0.12); }, 90);
      // award + advance progress
      save.coins += 8;
      g.coins = save.coins;
      save.level = Math.max(save.level, g.idx + 1);
      persist();
      return;
    }
    if (g.quest && !g.quest.caught && inRange(p, g.quest)) {
      g.quest.caught = true;
      save.coins += 10; g.coins = save.coins; persist();
      spawnText(g.quest.centerX(), g.quest.y - 4, 'BAG +10', '#f2c33c');
      spawnPuff(g.quest.centerX(), g.quest.centerY(), '#f2c33c');
      beep(520, 0.1);
      return;
    }
    // whiffed
    spawnText(p.centerX(), p.y - 2, 'MISS', '#d23b2f');
    beep(150, 0.08, 'sawtooth');
  }

  // ---------- play update ----------
  function updatePlay(dt, inp) {
    g.t += dt;
    const p = g.player;

    if (g.phase === 'play') {
      const wasGround = p.grounded;
      if (inp.jump && wasGround && !p.ducking) beep(300, 0.06);
      // start a catch swing
      if (inp.action && !p.catching) { p.startCatch(); beep(240, 0.05); }
      const ev = p.update(dt, inp, g);
      if (ev === 'catch-end') resolveCatch();

      if (g.phase === 'play') {
        g.creature.update(dt, p);
        if (g.quest) g.quest.update(dt, p, g);
        if (g.creature.state === 'escaped') {
          g.phase = 'lost'; g.phaseT = 1.1; g.message = 'IT GOT AWAY!';
          beep(120, 0.25, 'sawtooth');
        }
        // coin pickup
        const pr = p.stats.pickup;
        for (const c of g.coinItems) {
          if (c.got) continue;
          const dx = p.centerX() - (c.x + 3), dy = p.centerY() - (c.y + 3);
          if (dx * dx + dy * dy <= (pr + 5) * (pr + 5)) {
            c.got = true; save.coins++; g.coins = save.coins; persist();
            spawnText(c.x, c.y - 2, '+1', '#f2c33c'); beep(880, 0.05);
          }
        }
        // obstacle bonk — jump them; a hit roots + knocks you back briefly
        if (p.hitCool <= 0) {
          for (const ob of g.obstacles) {
            const oy = g.groundY - ob.h;
            if (p.x < ob.x + ob.w && p.x + p.w > ob.x && p.y + p.h > oy + 3) {
              p.stunT = 0.35; p.hitCool = 0.9; p.x = Math.max(0, p.x - 14);
              spawnText(p.centerX(), p.y - 2, 'OOF!', '#d23b2f');
              spawnPuff(p.centerX(), p.centerY(), '#caa'); beep(110, 0.12, 'sawtooth');
              break;
            }
          }
        }
      }
    } else {
      // won / lost transition: let the hero settle, freeze the rest
      p.update(dt, { left: false, right: false, duck: false, jump: false }, g);
      g.creature.t += dt; if (g.quest) g.quest.t += dt;
      g.phaseT -= dt;
      g.messageT = g.phaseT;
      if (g.phaseT <= 0) {
        if (g.phase === 'won') completeLevel();
        else restartLevel(g.idx);
        return;
      }
    }

    // particles
    for (let i = g.particles.length - 1; i >= 0; i--) {
      const pt = g.particles[i];
      pt.life -= dt;
      pt.y += (pt.vy || 0) * dt;
      if (pt.vx) pt.x += pt.vx * dt;
      if (pt.life <= 0) g.particles.splice(i, 1);
    }

    // camera
    g.camX = Math.max(0, Math.min(g.width - BW, p.centerX() - BW / 2));
  }

  function completeLevel() {
    const idx = g.idx;
    document.getElementById('completeTitle').textContent = 'GOT IT!';
    document.getElementById('completeBlurb').textContent = LEVELS[idx].name + ' is in the trunk.';
    document.getElementById('completeCoins').textContent = save.coins;
    show('complete');
  }

  // ---------- rendering ----------
  function drawPlay() {
    ctx.clearRect(0, 0, BW, BH);
    Render.background(ctx, g.env, g.camX, g.width, g.groundY, g.t);

    ctx.save();
    ctx.translate(-Math.round(g.camX), 0);
    Render.ground(ctx, g.env, g.width, g.groundY, g.t);
    g.platforms.forEach(function (p) { Render.platform(ctx, p); });
    Render.safety(ctx, g.env, g.creature.safetyX - 8, g.groundY, g.t);
    // themed obstacles (with contact shadows) sit on the ground
    for (const ob of g.obstacles) {
      Spr.shadow(ctx, ob.x + ob.w / 2, g.groundY, ob.w);
      Render.obstacle(ctx, ob.type, ob.x, g.groundY, g.t);
    }
    // soft contact shadows for depth (drawn over ground, under sprites)
    Spr.shadow(ctx, g.player.centerX(), g.groundY, 13);
    if (g.quest && !g.quest.caught) Spr.shadow(ctx, g.quest.centerX(), g.groundY, g.quest.w);
    if (g.creature.state !== 'caught' && Spr.GROUNDED[g.creature.type])
      Spr.shadow(ctx, g.creature.centerX(), g.groundY, g.creature.w * 0.8);
    for (const c of g.coinItems) if (!c.got) Spr.coin(ctx, c.x, c.y, g.t);
    if (g.quest) g.quest.draw(ctx);
    g.creature.draw(ctx);
    g.player.draw(ctx);
    // catch FX at the tool tip
    if (g.player.catching) {
      const dir = g.player.facing;
      Render.catchFX(ctx, g.player.centerX() + dir * 16, g.player.centerY() - 2,
        TOOLS[g.player.tool].catchKind === 'shot' ? 'shot' : 'swing',
        g.player.catchT / g.player.catchDur);
    }
    // particles (world space)
    for (const pt of g.particles) {
      if (pt.txt) Render.text(ctx, pt.txt, pt.x, pt.y, pt.col);
      else { ctx.globalAlpha = Math.max(0, pt.life / pt.max); ctx.fillStyle = pt.col; ctx.fillRect(pt.x, pt.y, 2, 2); ctx.globalAlpha = 1; }
    }
    ctx.restore();

    Render.hud(ctx, g);
  }

  // ---------- main loop ----------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    const inp = Input.consume();

    // let Enter/Space drive the focused menu's primary button
    if (Input.takeStart() && state !== 'play') {
      const map = { title: 'playBtn', intro: 'startBtn', complete: 'nextBtn', win: 'winBtn', shop: 'shopContinue' };
      const b = document.getElementById(map[state]);
      if (b && !b.disabled) b.click();
    }

    if (state === 'play' && g) { updatePlay(dt, inp); if (state === 'play') drawPlay(); }
    else if (state === 'shop') Shop.tick(now);
    requestAnimationFrame(frame);
  }

  // ---------- screen wiring ----------
  document.getElementById('playBtn').addEventListener('click', function () { startLevel(save.level); });
  document.getElementById('resetBtn').addEventListener('click', function () {
    save = defaultSave(); persist();
    document.getElementById('resetBtn').textContent = 'erased!';
  });
  document.getElementById('startBtn').addEventListener('click', function () { last = performance.now(); show('play'); });
  document.getElementById('winBtn').addEventListener('click', function () { save.level = 0; persist(); show('title'); });

  document.getElementById('nextBtn').addEventListener('click', function () {
    const idx = g.idx;
    if (idx >= LEVELS.length - 1) {
      document.getElementById('winCoins').textContent = save.coins;
      show('win'); return;
    }
    if (SHOP_AFTER.indexOf(idx) !== -1) {
      const nextIdx = idx + 1;
      show('shop');
      Shop.open(save, LEVELS[nextIdx].tool, persist, function () { startLevel(nextIdx); });
    } else {
      startLevel(idx + 1);
    }
  });

  // ---------- responsive scaling ----------
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const scale = Math.min(w / BW, h / BH);
    canvas.style.width = Math.floor(BW * scale) + 'px';
    canvas.style.height = Math.floor(BH * scale) + 'px';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  Input.bindTouch();
  show('title');
  requestAnimationFrame(frame);
})();
