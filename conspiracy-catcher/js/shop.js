/* =========================================================
   shop.js — supply depot run by a sea-monster shopkeeper.
   The keeper (an octopus merchant) describes each item in a
   speech bubble, and a "photo" of the selected item shows in a
   side panel. Tap/hover a wares to hear about it. Still gated:
   you must own the required next tool to continue. Blocky DOM
   rows keep it tappable on mobile; two small pixel canvases
   (keeper + photo) animate from the main loop via Shop.tick().
   ========================================================= */
const Shop = (function () {
  let els = null, save = null, persist = null, reqTool = null, onCont = null;
  let current = null;          // {kind,id} shown in the photo panel
  let talkT = 0;               // mouth-talk timer
  let kCtx = null, pCtx = null, lastNow = 0;

  // the keeper's patter for each item
  const SPIEL = {
    net:        "The NET — give 'er a swing an' scoop yer beastie up close.",
    cage:       "The CAGE — slam it down over the critter. CLANG!",
    netgun:     "NET GUN — fires a net at close range. THWIP!",
    forcefield: "FORCE FIELD SHOOTER — bubbles 'em up all snug.",
    tranq:      "TRANQ DART GUN — one little dart an' they're snoozin'.",
    helmet:     "COMBAT HELMET — widens yer catchin' reach, arr.",
    boots:      "JUMP BOOTS — zip across the muck right quick.",
    backpack:   "RUCKSACK — scoops up coins from further off.",
    jacket:     "FIELD JACKET — a snappier catch swing for ye.",
    gloves:     "GRIP GLOVES — a wee bit more reach in yer grab.",
    goggles:    "NIGHT GOGGLES — leap higher an' see in the dark."
  };
  const GREET = "Glug glug! Welcome to me reef shop. Tap a wares an' I'll tell ye all about it!";

  function cache() {
    if (els) return els;
    els = {
      coins: document.getElementById('shopCoins'),
      list: document.getElementById('shopList'),
      gate: document.getElementById('shopGate'),
      cont: document.getElementById('shopContinue'),
      keeper: document.getElementById('shopKeeper'),
      photo: document.getElementById('shopPhoto'),
      speech: document.getElementById('shopSpeech'),
      label: document.getElementById('photoLabel')
    };
    kCtx = els.keeper.getContext('2d'); kCtx.imageSmoothingEnabled = false;
    pCtx = els.photo.getContext('2d'); pCtx.imageSmoothingEnabled = false;
    return els;
  }
  function owns(kind, id) { return (kind === 'tool' ? save.tools : save.cosmetics).indexOf(id) !== -1; }
  function data(kind, id) { return kind === 'tool' ? TOOLS[id] : COSMETICS[id]; }

  // keeper says his piece about an item + shows its photo
  function select(kind, id, greet) {
    current = { kind, id };
    talkT = 1.4;
    els.label.textContent = data(kind, id).name;
    if (greet) { els.speech.textContent = GREET; return; }
    let s = SPIEL[id] || '';
    if (kind === 'tool' && id === reqTool && !owns('tool', id)) s = "Ye'll be NEEDIN' this for the next hunt! " + s;
    if (owns(kind, id)) s += "  (Ye already got it, matey.)";
    else s += "  Just " + data(kind, id).price + " coins.";
    els.speech.textContent = s;
  }

  function render() {
    const e = els;
    e.coins.textContent = save.coins;
    e.list.innerHTML = '';
    const reserve = owns('tool', reqTool) ? 0 : TOOLS[reqTool].price;

    const order = [];
    if (!owns('tool', reqTool)) order.push({ kind: 'tool', id: reqTool, req: true });
    for (const id in COSMETICS) if (!owns('cos', id)) order.push({ kind: 'cos', id: id });

    if (order.length === 0) {
      const d = document.createElement('div');
      d.className = 'shop-row';
      d.innerHTML = '<div class="info"><div class="nm">Sold out!</div><div class="ds">Ye own all me wares. Off ye go!</div></div>';
      e.list.appendChild(d);
    }

    order.forEach(function (item) {
      const kind = item.kind === 'tool' ? 'tool' : 'cos';
      const d = data(kind, item.id), price = d.price;
      const row = document.createElement('div');
      row.className = 'shop-row' + (item.req ? ' req' : '');
      const info = document.createElement('div');
      info.className = 'info';
      const desc = kind === 'tool' ? ('Required tool — ' + d.flavor) : d.desc;
      info.innerHTML = '<div class="nm">' + d.name + '</div><div class="ds">' + desc + ' &middot; ' + price + 'c</div>';
      const btn = document.createElement('button');
      const limit = kind === 'tool' ? price : price + reserve;
      const afford = save.coins >= limit;
      btn.textContent = afford ? 'BUY' : (kind === 'cos' && save.coins >= price ? 'TOOL 1ST' : 'NEED ' + (limit - save.coins));
      if (!afford) btn.className = 'cant';
      // selecting (preview) — hover on desktop, tap the info on mobile
      row.addEventListener('pointerenter', function () { select(kind, item.id); });
      info.addEventListener('click', function () { select(kind, item.id); });
      btn.addEventListener('click', function () {
        select(kind, item.id);
        if (save.coins < limit) return;
        save.coins -= price;
        (kind === 'tool' ? save.tools : save.cosmetics).push(item.id);
        persist();
        render();
        select(kind, item.id);   // refresh keeper line to "ye got it"
      });
      row.appendChild(info); row.appendChild(btn);
      e.list.appendChild(row);
    });

    const ready = owns('tool', reqTool);
    e.gate.textContent = ready ? '' : "Ye need the " + TOOLS[reqTool].name + " to go on!";
    e.cont.disabled = !ready;
    e.cont.style.filter = ready ? '' : 'grayscale(1) brightness(.7)';
  }

  function open(s, requiredTool, p, onContinue) {
    save = s; reqTool = requiredTool; persist = p; onCont = onContinue;
    cache();
    render();
    // greet, but preview the required tool (or first item) in the photo panel
    const first = owns('tool', reqTool) ? Object.keys(COSMETICS).find(id => !owns('cos', id)) : reqTool;
    const firstKind = (first && COSMETICS[first]) ? 'cos' : 'tool';
    select(firstKind, first || 'net', true);
    els.cont.onclick = function () { if (owns('tool', reqTool)) onCont(); };
  }

  // animate keeper + item photo from the main loop while the shop is open
  function tick(now) {
    if (!kCtx) return;
    const t = now / 1000;
    talkT = Math.max(0, talkT - (now - lastNow) / 1000); lastNow = now;
    kCtx.clearRect(0, 0, 72, 72);
    Spr.keeper(kCtx, t, talkT > 0);
    pCtx.clearRect(0, 0, 64, 64);
    if (current) Spr.itemIcon(pCtx, current.id, t);
  }

  return { open, tick };
})();
