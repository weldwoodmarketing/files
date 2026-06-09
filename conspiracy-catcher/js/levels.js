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

// Environment palettes + scene/ground style, keyed by env id. `bg` selects the
// habitat backdrop painter, `gstyle` the ground texture, `safety` the den drawn
// at the right edge.
const ENVS = {
  forest:  { bg: 'forest',  night: false, sky: ['#7ec8e3', '#cdebd0'], ground: '#6b4a22', groundTop: '#4a7a2a', gstyle: 'soil',      safety: 'cave' },
  bridge:  { bg: 'bridge',  night: true,  sky: ['#0c1020', '#2a2348'], ground: '#52432f', groundTop: '#6e5640', gstyle: 'planks',    safety: 'fog' },
  desert:  { bg: 'desert',  night: false, sky: ['#f0975a', '#f7d6a0'], ground: '#d9a45a', groundTop: '#caa04a', gstyle: 'sand',      safety: 'burrow' },
  deep:    { bg: 'deep',    night: true,  sky: ['#062a40', '#0e5e70'], ground: '#c8a868', groundTop: '#9c8a58', gstyle: 'seabed',    safety: 'trench', underwater: true },
  mars:    { bg: 'mars',    night: true,  sky: ['#160610', '#8a2f1a'], ground: '#a8442a', groundTop: '#c2552f', gstyle: 'regolith',  safety: 'ufo' },
  sewer:   { bg: 'sewer',   night: true,  sky: ['#0a120c', '#16241c'], ground: '#3a3a40', groundTop: '#2f6a3a', gstyle: 'muck',      safety: 'tunnel' },
  harbor:  { bg: 'harbor',  night: false, sky: ['#5a8ab0', '#bfe0ec'], ground: '#6a5a44', groundTop: '#7a6a50', gstyle: 'dock',      safety: 'ocean' },
  reef:    { bg: 'reef',    night: true,  sky: ['#06303a', '#03101a'], ground: '#26303a', groundTop: '#1f4a44', gstyle: 'reef',      safety: 'reefcave', underwater: true },
  swamp:   { bg: 'swamp',   night: true,  sky: ['#0f1a14', '#26402a'], ground: '#34301f', groundTop: '#3f4a2a', gstyle: 'mud',       safety: 'thicket' },
  hallway: { bg: 'hallway', night: false, sky: ['#d8c888', '#bfae74'], ground: '#9a8a55', groundTop: '#c8b878', gstyle: 'tiles',     safety: 'doorway' },
  neon:    { bg: 'neon',    night: true,  sky: ['#1a0c2a', '#52206e'], ground: '#241a30', groundTop: '#5a2f7a', gstyle: 'boardwalk', safety: 'lagoon' }
};

const LEVELS = [
  { name: 'Bigfoot',          creature: 'bigfoot',    env: 'forest',  tool: 'net',        cSpeed: 70, quest: 'rabbit',  obstacle: 'bramble',  width: 2200, blurb: 'A hairy giant lopes through the pines toward its cave.' },
  { name: 'Mothman',          creature: 'mothman',    env: 'bridge',  tool: 'net',        cSpeed: 74, quest: null,      obstacle: 'barrel',   width: 2300, blurb: 'Red eyes over the old bridge. It dives for the fog bank.' },
  { name: 'Chupacabra',       creature: 'chupacabra', env: 'desert',  tool: 'cage',       cSpeed: 76, quest: 'cat',     obstacle: 'cactus',   width: 2400, blurb: 'The goat-sucker bolts for its burrow at dusk.' },
  { name: 'Loch Ness Monster',creature: 'nessie',     env: 'deep',    tool: 'cage',       cSpeed: 78, quest: null,      obstacle: 'urchin',   width: 2400, blurb: 'Down in the loch, Nessie glides for the deep trench.' },
  { name: 'The Greys',        creature: 'grey',       env: 'mars',    tool: 'netgun',     cSpeed: 80, quest: null,      obstacle: 'tentacle', width: 2500, blurb: 'On the red planet, a Grey scurries back to its saucer.' },
  { name: 'Reptilians',       creature: 'reptilian',  env: 'sewer',   tool: 'netgun',     cSpeed: 82, quest: 'chicken', obstacle: 'pipe',     width: 2500, blurb: 'A lizard-man slips through the sewers to the tunnel.' },
  { name: 'Kraken',           creature: 'kraken',     env: 'reef',    tool: 'forcefield', cSpeed: 88, quest: null,      obstacle: ['seaweed', 'eel'], width: 2600, fast: true, blurb: 'Down in the dark coral reef, the Kraken slinks for its cave.' },
  { name: 'Jersey Devil',     creature: 'jersey',     env: 'swamp',   tool: 'forcefield', cSpeed: 90, quest: null,      obstacle: 'gator',    width: 2600, fast: true, blurb: 'The Devil crashes through the swamp toward the thicket.' },
  { name: 'The Walking Door', creature: 'door',       env: 'hallway', tool: 'tranq',      cSpeed: 92, quest: null,      obstacle: 'cone',     width: 2700, fast: true, blurb: 'A door. It has legs. Down the endless hall to the OTHER door.' },
  { name: 'Flamingo Man',     creature: 'flamingo',   env: 'neon',    tool: 'tranq',      cSpeed: 96, quest: 'rabbit',  obstacle: 'log',      width: 2800, fast: true, blurb: 'Neon legs in the swamp. Last one. To the lagoon it goes.' }
];

// Shops appear AFTER these 0-based level indices (i.e. after 2,4,6,8).
const SHOP_AFTER = [1, 3, 5, 7];
// Which tool becomes required next, per shop trigger index.
function requiredToolForLevel(idx) { return LEVELS[idx].tool; }
