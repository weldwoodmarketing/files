# 🎮 Ghosty &amp; Bones Arcade

Two free, self-contained browser games. The homepage at **[ghostyandbones.com](https://ghostyandbones.com/)** is a game picker — choose one and play, no download required.

| Game | Page | About |
| --- | --- | --- |
| 🦶 **Campsite Invaders** | [`campsite-invaders.html`](campsite-invaders.html) | Space-Invaders action, 100 levels, ages 8+ |
| 🐚 **Seashell Shore Dash** | [`seashell-shore-dash.html`](seashell-shore-dash.html) | Beach seashell collecting, 10 levels, ages 4–8 |

The picker lives in [`index.html`](index.html). Each game is its own single self-contained HTML file — you can also download any of them and open it directly in a browser.

---

# 🦶 Campsite Invaders 🪨🦝

A Space Invaders–style browser game where **Sasquatch defends the campsite from invading raccoons**. The raccoons march across the screen, drop closer each turn, and chuck acorns back at you — fight through all **100 levels** to win.

## ▶️ Play now

**[👉 Play at ghostyandbones.com](https://ghostyandbones.com/)** → pick **Campsite Invaders** (direct link: [`campsite-invaders.html`](campsite-invaders.html)).

## 🎮 Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | `←` `→` or `A` `D` | Drag |
| Throw rock | `Space` | Tap |
| Start / restart | `Enter` or the button | Tap the button |

## 🌲 How to play

- You're **Sasquatch** at the bottom of the screen — hurl your ammo upward at the raccoons.
- Clear every raccoon (and the level's bosses) to advance. There are **100 levels** across **10 tiers** of 10, and a short **story** plays between each tier. Each tier cycles through a day — early morning to night.
- **Evolving ammo** — your weapon changes every 10 levels: rocks → rockets → poop → evil raccoon heads → axes → flaming pillows → dogs → rainbows → whales → angels (each with a wilder powered form: lasers, flaming bananas, bombs, UFOs, dragons, dinosaurs, cats, sad clouds, cheeseburgers, crayons).
- **Power-ups:** only a couple of raccoons per level carry a green power-up; grab one to add another projectile to every throw — at **5** your ammo goes **SUPER**. A boss also drops one every 10 hits (**17 hits after level 50**).
- **Hawks (level 71+):** hawks glide across the sky and randomly drop either an acorn or a 💥 **power-shot** power-up that makes your ammo *way* stronger for 10 seconds.
- **Stacking bosses:** every level has a crowned boss that gets tougher each level, and **one extra boss is added every tier** — up to **10 bosses at once** in levels 91–100.
- **Night meteors:** on every 10th level (night), the raccoons stop throwing acorns and **meteors rain down** instead — they destroy any raccoon they pass through, wound bosses, and cost you a life if one lands on Bigfoot.
- **Invincibility:** beat a boss and it drops a ⭐ star that makes Bigfoot **invincible for 7 seconds**.
- **Extra trees:** clear a level to earn a bonus life (🌲), up to 6 — and **two trees per level after level 40**.
- **Lose a life** if an acorn (or meteor) hits you. **Game over** if any raccoon or boss reaches the campsite.
- Your **high score** is saved in your browser.

## 🛠️ Tech

A single self-contained HTML file — no build step, no dependencies. Rendered with the Canvas API. Just open `campsite-invaders.html` in a browser, or play the hosted version above.

---

# 🐚 Seashell Shore Dash 👧🌊

A gentle side-scrolling beach game for **ages 4–8**. A little girl with brown **bubble braids** dashes along the shore while the ocean rolls by. The top of the screen shows an **order of 10 seashells** — run into the matching shell to collect it, and **jump over** every other shell. The shore scrolls a little faster on each of the **10 levels**.

## ▶️ Play

Open [`seashell-shore-dash.html`](seashell-shore-dash.html) in any browser, or visit **[ghostyandbones.com/seashell-shore-dash.html](https://ghostyandbones.com/seashell-shore-dash.html)**.

## 🎮 Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Jump | `Space` · `↑` · `Enter` | Tap anywhere |
| Start / next / retry | `Space` or the button | Tap |

## 🏖️ How to play

- The screen **always moves left to right**, so be quick!
- The order panel up top lists **10 shells**; the glowing one (with a bouncing arrow) is the one to grab next.
- **Run into** the matching shell to collect it — it gets a green check.
- **Jump over** any shell that doesn't match. Touching a wrong shell costs a ❤️ (you have 3 per level).
- Collect all 10 in order to finish the level. Beat all **10 levels** to win — each one is a touch faster than the last.

A single self-contained HTML file, Canvas API, no dependencies.
