/* =========================================================
   shop.js — supply depot between every two levels.
   Sells the required next tool (gated: must own to continue)
   plus cosmetic gear that grants real stat bumps. Rendered as
   blocky DOM rows for solid mobile tap targets.
   ========================================================= */
const Shop = (function () {
  let els = null;
  function cache() {
    if (els) return els;
    els = {
      coins: document.getElementById('shopCoins'),
      list: document.getElementById('shopList'),
      gate: document.getElementById('shopGate'),
      cont: document.getElementById('shopContinue')
    };
    return els;
  }

  // save: {coins, tools:[], cosmetics:[]}; requiredTool: tool id needed next.
  // persist(): write save to storage. onContinue(): leave shop.
  function open(save, requiredTool, persist, onContinue) {
    const e = cache();
    function owns(arr, id) { return arr.indexOf(id) !== -1; }

    function render() {
      e.coins.textContent = save.coins;
      e.list.innerHTML = '';
      // While the required tool is unowned, keep enough coins in reserve to
      // buy it — so cosmetics can never soft-lock the gate.
      const reserve = owns(save.tools, requiredTool) ? 0 : TOOLS[requiredTool].price;

      // required tool first (if not yet owned)
      const order = [];
      if (!owns(save.tools, requiredTool)) order.push({ kind: 'tool', id: requiredTool, req: true });
      for (const id in COSMETICS) if (!owns(save.cosmetics, id)) order.push({ kind: 'cos', id: id });

      if (order.length === 0) {
        const d = document.createElement('div');
        d.className = 'shop-row';
        d.innerHTML = '<div class="info"><div class="nm">Sold out!</div><div class="ds">You own all the gear. Go get \'em.</div></div>';
        e.list.appendChild(d);
      }

      order.forEach(function (item) {
        const data = item.kind === 'tool' ? TOOLS[item.id] : COSMETICS[item.id];
        const price = data.price;
        const row = document.createElement('div');
        row.className = 'shop-row' + (item.req ? ' req' : '');
        const desc = item.kind === 'tool'
          ? ('Required tool — ' + data.flavor)
          : data.desc;
        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = '<div class="nm">' + data.name + '</div><div class="ds">' + desc + ' &middot; ' + price + 'c</div>';
        const btn = document.createElement('button');
        // tool row spends freely; cosmetic rows must leave the tool reserve intact
        const limit = item.kind === 'tool' ? price : price + reserve;
        const canAfford = save.coins >= limit;
        if (!canAfford) {
          btn.className = 'cant';
          btn.textContent = (item.kind === 'cos' && save.coins >= price)
            ? 'TOOL 1ST' : 'NEED ' + (limit - save.coins);
        } else {
          btn.textContent = 'BUY';
        }
        btn.addEventListener('click', function () {
          if (save.coins < limit) return;
          save.coins -= price;
          if (item.kind === 'tool') save.tools.push(item.id);
          else save.cosmetics.push(item.id);
          persist();
          render();
        });
        row.appendChild(info); row.appendChild(btn);
        e.list.appendChild(row);
      });

      // gate the continue button on owning the required tool
      const ready = owns(save.tools, requiredTool);
      if (ready) {
        e.gate.textContent = '';
        e.cont.disabled = false;
        e.cont.style.filter = '';
      } else {
        e.gate.textContent = 'You need the ' + TOOLS[requiredTool].name + ' to go on.';
        e.cont.disabled = true;
        e.cont.style.filter = 'grayscale(1) brightness(.7)';
      }
    }

    render();
    e.cont.onclick = function () {
      if (save.tools.indexOf(requiredTool) === -1) return;
      onContinue();
    };
  }

  return { open };
})();
