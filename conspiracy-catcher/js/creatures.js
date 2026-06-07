/* =========================================================
   creatures.js — the hunted.
   Creature: waits a beat near the player, then bolts right for
   its safety zone. Caught on a successful windup-in-range;
   escapes (restart) if it reaches safety first.
   Quest: hops/skitters and flees when you get close; catching
   it drops a coin bag (~10 coins).
   ========================================================= */

function Creature(type, x, groundY, speed, safetyX) {
  const sz = Spr.CREATURE_SIZE[type] || [16, 16];
  this.type = type;
  this.w = sz[0]; this.h = sz[1];
  this.x = x; this.y = groundY - this.h;
  this.groundY = groundY;
  this.speed = speed;
  this.safetyX = safetyX;
  this.facing = 1;
  this.state = 'wait';        // wait -> flee -> caught/escaped
  this.timer = 1.1;           // head-start beat
  this.t = 0;                 // anim clock
}
Creature.prototype.centerX = function () { return this.x + this.w / 2; };
Creature.prototype.centerY = function () { return this.y + this.h / 2; };

Creature.prototype.update = function (dt, player) {
  this.t += dt;
  if (this.state === 'caught' || this.state === 'escaped') return;
  if (this.state === 'wait') {
    this.timer -= dt;
    // tiny nervous jitter while waiting
    this.x += Math.sin(this.t * 8) * 6 * dt;
    if (this.timer <= 0 || player.centerX() > this.x - 24) this.state = 'flee';
    return;
  }
  // fleeing: dash toward safety
  this.facing = 1;
  this.x += this.speed * dt;
  // little vertical bob for fliers handled in sprite; ground types stay grounded
  this.y = this.groundY - this.h;
  if (this.x + this.w >= this.safetyX) { this.state = 'escaped'; }
};

Creature.prototype.draw = function (ctx) {
  if (this.state === 'caught') return;
  Spr.creature(ctx, this.type, this.x, this.y, this.facing, this.t);
};

/* ---------------- Quest creature ---------------- */
function Quest(type, x, groundY) {
  const sz = Spr.QUEST_SIZE[type] || [12, 12];
  this.type = type;
  this.w = sz[0]; this.h = sz[1];
  this.x = x; this.baseY = groundY - this.h; this.y = this.baseY;
  this.groundY = groundY;
  this.facing = -1;
  this.caught = false;
  this.t = 0;
  this.hopT = Math.random() * 1;
  this.vy = 0; this.hopping = false;
  this.homeX = x;
}
Quest.prototype.centerX = function () { return this.x + this.w / 2; };
Quest.prototype.centerY = function () { return this.y + this.h / 2; };

Quest.prototype.update = function (dt, player, level) {
  if (this.caught) return;
  this.t += dt;
  const dist = player.centerX() - this.centerX();
  const near = Math.abs(dist) < 70;
  // flee away from the player when near, else wander a little
  let dir = 0;
  if (near) dir = dist > 0 ? -1 : 1;     // run opposite the player
  // hop physics
  if (!this.hopping) {
    this.hopT -= dt;
    if (this.hopT <= 0 && (near || Math.random() < 0.4)) {
      this.hopping = true; this.vy = -150; this.hopT = near ? 0.35 : 0.9;
    }
  }
  if (this.hopping) {
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    this.x += dir * (near ? 80 : 24) * dt;
    if (this.y >= this.baseY) { this.y = this.baseY; this.hopping = false; this.vy = 0; }
  }
  if (dir !== 0) this.facing = dir;
  // keep within level bounds
  if (this.x < 8) this.x = 8;
  if (this.x + this.w > level.width - 8) this.x = level.width - 8 - this.w;
};

Quest.prototype.draw = function (ctx) {
  if (this.caught) return;
  Spr.quest(ctx, this.type, this.x, this.y, this.facing, this.t);
};
