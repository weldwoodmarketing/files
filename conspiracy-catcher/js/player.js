/* =========================================================
   player.js — the tough army guy.
   Stats are derived from base values + equipped cosmetics, then
   the level's "fast" flag scales movement for levels 7-10.
   ========================================================= */
const GRAVITY = 560;          // px/s^2
const BASE_STATS = { speed: 92, jump: 215, range: 30, windup: 240, pickup: 11 };

function computeStats(cosmetics, fast) {
  const s = Object.assign({}, BASE_STATS);
  cosmetics.forEach(function (id) {
    const c = COSMETICS[id];
    if (!c || !c.stat) return;
    for (const k in c.stat) s[k] += c.stat[k];
  });
  if (fast) { s.speed = Math.round(s.speed * 1.32); s.jump = Math.round(s.jump * 1.08); }
  return s;
}

function Player(x, groundY, tool, cosmetics, fast) {
  this.w = 14; this.h = 22;
  this.x = x; this.y = groundY - this.h;
  this.vx = 0; this.vy = 0;
  this.facing = 1;
  this.grounded = true;
  this.ducking = false;
  this.tool = tool;
  this.cosmetics = cosmetics;          // a Set
  this.stats = computeStats(cosmetics, fast);
  this.walkT = 0;                      // walk animation timer
  this.frame = 0;
  // catch windup
  this.catching = false;
  this.catchT = 0;
  this.catchDur = this.stats.windup / 1000;
}

Player.prototype.centerX = function () { return this.x + this.w / 2; };
Player.prototype.centerY = function () { return this.y + this.h / 2; };

// Begin a catch swing. Returns the windup duration (s).
Player.prototype.startCatch = function () {
  this.catching = true;
  this.catchT = 0;
  this.catchDur = this.stats.windup / 1000;
};

Player.prototype.update = function (dt, inp, level) {
  const st = this.stats;

  // --- horizontal (you keep chasing through the swing; only ducking roots you).
  //     The catch resolves at the END of the windup, so timing the tap is the
  //     skill — not being frozen in place while the creature walks away. ---
  const canMove = !this.ducking;
  let move = 0;
  if (canMove) {
    if (inp.left) move -= 1;
    if (inp.right) move += 1;
  }
  this.vx = move * st.speed;
  if (move !== 0) this.facing = move;
  this.x += this.vx * dt;

  // --- duck (only on ground) ---
  this.ducking = inp.duck && this.grounded && !this.catching;

  // --- jump ---
  if (inp.jump && this.grounded && !this.ducking && !this.catching) {
    this.vy = -st.jump;
    this.grounded = false;
  }
  this.vy += GRAVITY * dt;
  this.y += this.vy * dt;

  // --- ground + platform collisions ---
  this.grounded = false;
  const feet = this.y + this.h;
  if (feet >= level.groundY) { this.y = level.groundY - this.h; this.vy = 0; this.grounded = true; }
  // one-way platform tops
  for (const p of level.platforms) {
    if (this.vy >= 0) {
      const prevFeet = feet - this.vy * dt;
      if (this.x + this.w > p.x && this.x < p.x + p.w &&
          prevFeet <= p.y + 2 && feet >= p.y) {
        this.y = p.y - this.h; this.vy = 0; this.grounded = true;
      }
    }
  }

  // --- bounds ---
  if (this.x < 0) this.x = 0;
  if (this.x + this.w > level.width) this.x = level.width - this.w;

  // --- animation frame ---
  if (this.grounded && Math.abs(this.vx) > 1) {
    this.walkT += dt * 10;
    this.frame = 1 + (Math.floor(this.walkT) % 2);
  } else { this.frame = 0; this.walkT = 0; }

  // --- catch windup advance ---
  if (this.catching) {
    this.catchT += dt;
    if (this.catchT >= this.catchDur) { this.catching = false; return 'catch-end'; }
  }
  return null;
};

Player.prototype.draw = function (ctx) {
  Spr.hero(ctx, this.x, this.y, this.facing, {
    frame: this.frame,
    ducking: this.ducking,
    jumping: !this.grounded,
    cosmetics: this.cosmetics,
    tool: this.tool,
    catch: this.catching ? (this.catchT / this.catchDur) : 0
  });
};
