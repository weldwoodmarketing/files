/* =========================================================
   input.js — unified keyboard + touch input.
   Exposes held state and one-frame "pressed" edges that the
   game consumes each tick via Input.consume().
   ========================================================= */
const Input = (function () {
  const held = { left: false, right: false, jump: false, duck: false, action: false };
  // edges set true on press, cleared after the game reads them
  const edge = { jump: false, action: false };

  function press(btn) {
    if (held[btn]) return;
    held[btn] = true;
    if (btn === 'jump') edge.jump = true;
    if (btn === 'action') edge.action = true;
  }
  function release(btn) { held[btn] = false; }

  // ---- Keyboard ----
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'action',
    ArrowDown: 'duck', KeyS: 'duck',
    Enter: 'start'
  };
  let startPressed = false;
  window.addEventListener('keydown', function (e) {
    const b = KEYMAP[e.code];
    if (!b) return;
    e.preventDefault();
    if (b === 'start') { startPressed = true; return; }
    // Space doubles as catch; also let it act as "start" on menus
    if (e.code === 'Space') startPressed = true;
    press(b);
  }, { passive: false });
  window.addEventListener('keyup', function (e) {
    const b = KEYMAP[e.code];
    if (!b || b === 'start') return;
    release(b);
  });

  // ---- Touch buttons ----
  function bindTouch() {
    document.querySelectorAll('[data-btn]').forEach(function (el) {
      const b = el.getAttribute('data-btn');
      const down = function (e) { e.preventDefault(); press(b); };
      const up = function (e) { e.preventDefault(); release(b); };
      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: false });
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
  }

  // Returns a snapshot for this tick and clears edges.
  function consume() {
    const snap = {
      left: held.left, right: held.right, duck: held.duck,
      jumpHeld: held.jump,
      jump: edge.jump, action: edge.action
    };
    edge.jump = false; edge.action = false;
    return snap;
  }
  function takeStart() { const s = startPressed; startPressed = false; return s; }

  return { bindTouch, consume, takeStart, held };
})();
