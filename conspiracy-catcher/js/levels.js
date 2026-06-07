/* =========================================================
   levels.js — the data-driven heart of the game.
   Add an 11th creature by appending one row to LEVELS plus a
   sprite in sprites.js and (optionally) an ENV palette.
   ========================================================= */

// Tools, in progression order. `unlock` = level index (0-based) where it's first required.
const TOOLS = {
  net:        { name: 'Net',                    flavor: 'swing',          price: 0,  catchKind: 'swing' },
  cage:       { name: 'Cage',                   flavor: 'slam down',      price: 25, catchKind: 'slam' },
  netgun:     { name: 'Net Gun',                flavor: 'fire a net',     price: 35, catchKind: 'shot' },
  forcefield: { name: 'Force Field Shooter',    flavor: 'bubble trap',    price: 45, catchKind: 'shot' },
  tranq:      { name: 'Tranquilizer Dart Gun',  flavor: 'dart to sleep',  price: 55, catchKind: 'shot' }
};

// Cosmetic gear — every piece grants a real stat bump and shows on the hero.
const COSMETICS = {
  helmet:   { name: 'Combat Helmet', desc: '+8 catch range',   price: 30, stat: { range: 8 } },
  boots:    { name: 'Jump Boots',    desc: '+ move speed',      price: 30, stat: { speed: 20 } },
  backpack: { name: 'Rucksack',      desc: '+ coin pickup',     price: 18, stat: { pickup: 12 } },
  jacket:   { name: 'Field Jacket',  desc: 'faster catch swing', price: 35, stat: { windup: -100 } },
  gloves:   { name: 'Grip Gloves',   desc: '+6 catch range',    price: 24, stat: { range: 6 } },
  goggles:  { name: 'Night Goggles', desc: '+ jump height',     price: 28, stat: { jump: 45 } }
};

// Environment palettes (parallax + ground + safety object), keyed by env id.
const ENVS = {
  forest:  { night: false, sky: ['#7ec8e3', '#bfe6c8'], hill: '#3f7a3a', hill2: '#2f5a2c', ground: '#6b4a22', groundTop: '#4a7a2a', safety: 'cave' },
  bridge:  { night: true,  sky: ['#10121f', '#2a2348'], hill: '#1f2336', hill2: '#141728', ground: '#3a3340', groundTop: '#4a4350', safety: 'fog' },
  desert:  { night: false, sky: ['#f2a25f', '#f4d29a'], hill: '#c97a3a', hill2: '#a85f2a', ground: '#d9a45a', groundTop: '#caa04a', safety: 'burrow' },
  lake:    { night: false, sky: ['#5fb0e0', '#bfe0ef'], hill: '#3a6a8a', hill2: '#2a4a6a', ground: '#5a7a3a', groundTop: '#6a8a3a', safety: 'water' },
  base:    { night: true,  sky: ['#0a0c18', '#241f3a'], hill: '#1a1c2c', hill2: '#101220', ground: '#4a4636', groundTop: '#5a5640', safety: 'ufo' },
  sewer:   { night: true,  sky: ['#0c1410', '#16241c'], hill: '#1a2a20', hill2: '#0e1812', ground: '#2a3a2c', groundTop: '#3a4a36', safety: 'tunnel' },
  harbor:  { night: false, sky: ['#3a6a8a', '#7aa8c0'], hill: '#2a4a5a', hill2: '#1a3343', ground: '#5a5a4a', groundTop: '#6a6a55', safety: 'ocean' },
  swamp:   { night: true,  sky: ['#101a14', '#1f3326'], hill: '#1a2a1c', hill2: '#0e1810', ground: '#3a3a26', groundTop: '#4a4a30', safety: 'thicket' },
  liminal: { night: false, sky: ['#d9c98a', '#e8dca8'], hill: '#c2b070', hill2: '#a89858', ground: '#b8a868', groundTop: '#c8b878', safety: 'doorway' },
  neon:    { night: true,  sky: ['#1a0c2a', '#3a1f5a'], hill: '#2a1040', hill2: '#1a0a2a', ground: '#2a1a3a', groundTop: '#5a2f7a', safety: 'lagoon' }
};

const LEVELS = [
  { name: 'Bigfoot',          creature: 'bigfoot',    env: 'forest',  tool: 'net',        cSpeed: 70, quest: 'rabbit',  width: 2200, blurb: 'A hairy giant lopes through the pines toward its cave.' },
  { name: 'Mothman',          creature: 'mothman',    env: 'bridge',  tool: 'net',        cSpeed: 74, quest: null,      width: 2300, blurb: 'Red eyes over the old bridge. It dives for the fog bank.' },
  { name: 'Chupacabra',       creature: 'chupacabra', env: 'desert',  tool: 'cage',       cSpeed: 76, quest: 'cat',     width: 2400, blurb: 'The goat-sucker bolts for its burrow at dusk.' },
  { name: 'Loch Ness Monster',creature: 'nessie',     env: 'lake',    tool: 'cage',       cSpeed: 78, quest: null,      width: 2400, blurb: 'Nessie surfaces, then makes for the deep water.' },
  { name: 'The Greys',        creature: 'grey',       env: 'base',    tool: 'netgun',     cSpeed: 80, quest: null,      width: 2500, blurb: 'A little grey scampers across the base toward its UFO.' },
  { name: 'Reptilians',       creature: 'reptilian',  env: 'sewer',   tool: 'netgun',     cSpeed: 82, quest: 'chicken', width: 2500, blurb: 'A lizard-man slips through the sewers to the tunnel.' },
  { name: 'Kraken',           creature: 'kraken',     env: 'harbor',  tool: 'forcefield', cSpeed: 88, quest: null,      width: 2600, fast: true, blurb: 'Tentacles on the docks! It surges back to the ocean.' },
  { name: 'Jersey Devil',     creature: 'jersey',     env: 'swamp',   tool: 'forcefield', cSpeed: 90, quest: null,      width: 2600, fast: true, blurb: 'The Devil crashes through the pines toward the thicket.' },
  { name: 'The Walking Door', creature: 'door',       env: 'liminal', tool: 'tranq',      cSpeed: 92, quest: null,      width: 2700, fast: true, blurb: 'A door. It has legs. It wants the OTHER doorway.' },
  { name: 'Flamingo Man',     creature: 'flamingo',   env: 'neon',    tool: 'tranq',      cSpeed: 96, quest: 'rabbit',  width: 2800, fast: true, blurb: 'Neon legs in the swamp. Last one. To the lagoon it goes.' }
];

// Shops appear AFTER these 0-based level indices (i.e. after 2,4,6,8).
const SHOP_AFTER = [1, 3, 5, 7];
// Which tool becomes required next, per shop trigger index.
function requiredToolForLevel(idx) { return LEVELS[idx].tool; }
