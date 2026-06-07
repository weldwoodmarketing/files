# 🛸 Conspiracy Theory Catcher

A chunky-pixel, side-scrolling **cryptid hunt**. You're a tough army guy chasing
mythical/conspiracy creatures across **10 levels** — each one bolts toward a
"safety" zone (cave, UFO, lagoon…) the moment it sees you. Get in range, swing
your tool through the windup, and **bag it before it escapes**. Miss it, or let
it reach safety, and the level restarts.

Built with vanilla **HTML5 Canvas + JavaScript** — no engine, no build step, no
dependencies. Renders at an internal **320×180** and scales up with crisp,
pixelated upscaling for that Commander-Keen EGA look.

## ▶️ Play

- **Hosted:** [ghostyandbones.com/conspiracy-catcher/](https://ghostyandbones.com/conspiracy-catcher/)
- **Local:** just open `index.html` in a browser. No server needed (the scripts
  are plain `<script>` tags, so `file://` works fine).

## 🎮 Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | `←` `→` / `A` `D` | D-pad ◀ ▶ (bottom-left) |
| Jump | `↑` / `W` | D-pad ▲ |
| Duck | `↓` / `S` | D-pad ▼ |
| Catch / use tool | `Space` | Round **CATCH** button (bottom-right) |
| Confirm menus | `Enter` / `Space` | Tap the button |

Mobile is a first-class target: on-screen D-pad + action button, no zoom/scroll
glitches (`touch-action: none`, no text select, no double-tap zoom).

## 🕹️ How to play

- **Chase right.** The screen doesn't auto-scroll — you move forward and the
  camera follows. The creature waits a beat, then sprints for its safety zone.
- **Catch = proximity + windup.** Each tool has a short range. Press CATCH when
  the creature is close; a brief swing/slam/shot plays. If it's still in range
  when the swing finishes, it's caught. If it slips out first, you whiff.
- **The "gun" tools are still short-range** — net gun, force field and tranq
  fire at close quarters, not across the screen.
- **Coins** litter the ground (some up high — jump for them). **Side quests**
  (a hopping rabbit, a stray cat, an escaped chicken) drop a **+10 coin bag**
  when caught.
- **Shop every two levels.** Spend coins on the **required next tool** (gated —
  you can't continue without it) and on **gear that actually buffs you**:
  helmet/gloves (+range), boots (+speed), jacket (faster swing), goggles
  (+jump), rucksack (+coin pickup). Equipped gear shows on your sprite.
- **Levels 7–10 are faster** — everything, including you.

Progress (coins, tools, gear, level reached) is saved to `localStorage`, so a
refresh won't wipe your run. *(Note: localStorage only persists when hosted or
opened as a real file — not inside a sandboxed inline preview.)*

## 🧱 The 10 levels

| # | Creature | Environment | Safety | Tool |
| --- | --- | --- | --- | --- |
| 1 | Bigfoot | Forest | Cave | Net |
| 2 | Mothman | Night bridge | Fog bank | Net |
| 3 | Chupacabra | Desert dusk | Burrow | Cage |
| 4 | Loch Ness Monster | Lakeside | Deep water | Cage |
| 5 | The Greys | Area 51 | UFO | Net Gun |
| 6 | Reptilians | Sewer | Tunnel | Net Gun |
| 7 | Kraken | Harbor | Ocean | Force Field |
| 8 | Jersey Devil | Pine swamp | Thicket | Force Field |
| 9 | The Walking Door | Liminal hallway | Doorway | Tranq Gun |
| 10 | Flamingo Man | Neon swamp | Lagoon | Tranq Gun |

## 🗂️ Project structure

```
conspiracy-catcher/
├── index.html          page shell + DOM overlay screens (title/intro/shop/etc.)
├── css/style.css       blocky EGA styling + touch controls
└── js/
    ├── sprites.js      code-drawn pixel art (hero, cryptids, items)
    ├── input.js        keyboard + touch, with one-frame press edges
    ├── levels.js       the 10-level data table, tools, cosmetics, env palettes
    ├── player.js       hero physics, stat derivation, catch windup
    ├── creatures.js    fleeing-cryptid AI + quest-creature AI
    ├── shop.js         supply-depot UI + gated buy logic
    ├── render.js       scene/HUD/parallax/safety-zone drawing
    └── main.js         boot, scaling, state machine, the play loop
```

### Adding an 11th creature

Append one row to `LEVELS` in `js/levels.js` (name, creature id, env, tool,
`cSpeed`, optional `quest`, `width`, `blurb`), add a draw function under `DRAW`
in `js/sprites.js` (plus a `CREATURE_SIZE` entry), and — if it needs a new
backdrop — one palette entry in `ENVS`. No engine wiring required.

## 🚀 Deploy

It's static files. Drop the `conspiracy-catcher/` folder anywhere that serves
static content (GitHub Pages, Netlify, etc.). On this repo it's reachable from
the arcade picker at the site root.
