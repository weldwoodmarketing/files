# 🦶 Campsite Invaders 🪨🦝

A Space Invaders–style browser game where **Sasquatch defends the campsite from invading raccoons**. The raccoons march across the screen, drop closer each turn, and chuck acorns back at you — fight through all **100 levels** to win.

## ▶️ Play now

**[👉 Play at ghostyandbones.com](https://ghostyandbones.com/)**

> The whole game is a single self-contained file, [`index.html`](index.html) — you can also download it and open it in any browser.

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

A single self-contained HTML file — no build step, no dependencies. Rendered with the Canvas API. Just open `index.html` in a browser, or play the hosted version above.
