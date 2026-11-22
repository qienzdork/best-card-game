// cards.js — the card catalogue of Duel of Realms.
// Four realms, each told apart by colour AND shape, never by text alone:
//   Ember  (flame, red-orange) — fast, aggressive creatures
//   Tide   (drop, blue)        — defence, healing and card draw
//   Thorn  (leaf, green)       — tough, high-health creatures
//   Storm  (bolt, violet)      — direct damage and board control
// Every card is an original design for this game; no names, art or
// mechanics are copied from any existing card game.

export const REALMS = {
  ember: { name: 'Ember', symbol: '▲', glyph: '🔥', color: '#e8491d', dark: '#8f1d04', light: '#ff8a5c' },
  tide: { name: 'Tide', symbol: '●', glyph: '💧', color: '#1d7fe8', dark: '#0a3d7a', light: '#5cb3ff' },
  thorn: { name: 'Thorn', symbol: '◆', glyph: '🌿', color: '#2fae4e', dark: '#0f5c24', light: '#6fe08a' },
  storm: { name: 'Storm', symbol: '✦', glyph: '⚡', color: '#8a4fe8', dark: '#3d1a7a', light: '#b78cff' },
};

/** Every unique card in the game. Creatures fight on the lanes; spells resolve at once. */
export const CATALOGUE = [
  // Ember creatures — cheap and hungry.
  { id: 'ember-imp', name: 'Ember Imp', realm: 'ember', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'Quick and reckless.' },
  { id: 'flame-hound', name: 'Flame Hound', realm: 'ember', kind: 'creature', cost: 2, attack: 3, health: 2, text: 'Its bark is a spark.' },
  { id: 'ash-knight', name: 'Ash Knight', realm: 'ember', kind: 'creature', cost: 3, attack: 4, health: 3, text: 'Armour forged in cinders.' },
  { id: 'inferno-drake', name: 'Inferno Drake', realm: 'ember', kind: 'creature', cost: 5, attack: 6, health: 5, text: 'A small sun with wings.' },
  { id: 'cinder-giant', name: 'Cinder Giant', realm: 'ember', kind: 'creature', cost: 6, attack: 7, health: 7, text: 'Every step leaves embers.' },
  // Tide creatures — patient and deep.
  { id: 'tide-sprite', name: 'Tide Sprite', realm: 'tide', kind: 'creature', cost: 1, attack: 1, health: 2, text: 'It rides the smallest wave.' },
  { id: 'coral-guard', name: 'Coral Guard', realm: 'tide', kind: 'creature', cost: 2, attack: 2, health: 3, text: 'A wall that grew, not built.' },
  { id: 'wave-serpent', name: 'Wave Serpent', realm: 'tide', kind: 'creature', cost: 4, attack: 5, health: 4, text: 'The tide, given teeth.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', realm: 'tide', kind: 'creature', cost: 6, attack: 6, health: 8, text: 'Older than the shoreline.' },
  // Thorn creatures — roots that refuse to move.
  { id: 'thorn-sprout', name: 'Thorn Sprout', realm: 'thorn', kind: 'creature', cost: 1, attack: 1, health: 3, text: 'Small. Sharp. Stubborn.' },
  { id: 'briar-wolf', name: 'Briar Wolf', realm: 'thorn', kind: 'creature', cost: 2, attack: 3, health: 2, text: 'Its fur is a bramble.' },
  { id: 'oak-warden', name: 'Oak Warden', realm: 'thorn', kind: 'creature', cost: 3, attack: 2, health: 5, text: 'Guards the grove, always.' },
  { id: 'ancient-treant', name: 'Ancient Treant', realm: 'thorn', kind: 'creature', cost: 5, attack: 5, health: 7, text: 'It remembers the first seed.' },
  // Storm creatures — lightning that learned to walk.
  { id: 'spark-wisp', name: 'Spark Wisp', realm: 'storm', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'A blink of bad weather.' },
  { id: 'gale-falcon', name: 'Gale Falcon', realm: 'storm', kind: 'creature', cost: 2, attack: 3, health: 1, text: 'Faster than the thunder.' },
  { id: 'storm-rider', name: 'Storm Rider', realm: 'storm', kind: 'creature', cost: 4, attack: 4, health: 4, text: 'Rides the front of the gale.' },
  { id: 'tempest-titan', name: 'Tempest Titan', realm: 'storm', kind: 'creature', cost: 7, attack: 8, health: 6, text: 'The storm, standing up.' },
  // Spells — one-shot realm magic.
  { id: 'ember-burst', name: 'Ember Burst', realm: 'ember', kind: 'spell', cost: 2, text: 'Deal 3 damage to the enemy lord.', effect: 'damageLord', value: 3 },
  { id: 'healing-rain', name: 'Healing Rain', realm: 'tide', kind: 'spell', cost: 2, text: 'Restore 5 health to your lord.', effect: 'healLord', value: 5 },
  { id: 'lightning-strike', name: 'Lightning Strike', realm: 'storm', kind: 'spell', cost: 3, text: 'Deal 4 damage to the strongest enemy creature.', effect: 'damageCreature', value: 4 },
  { id: 'thorn-growth', name: 'Thorn Growth', realm: 'thorn', kind: 'spell', cost: 2, text: 'Your creatures gain +1 attack and +1 health.', effect: 'buffBoard', value: 1 },
  { id: 'tidal-draw', name: 'Tidal Draw', realm: 'tide', kind: 'spell', cost: 1, text: 'Draw 2 cards.', effect: 'drawCards', value: 2 },
  { id: 'storm-surge', name: 'Storm Surge', realm: 'storm', kind: 'spell', cost: 4, text: 'Deal 2 damage to all enemy creatures.', effect: 'damageAllEnemy', value: 2 },
  { id: 'realm-blessing', name: 'Realm Blessing', realm: 'ember', kind: 'spell', cost: 3, text: 'Gain 3 mana this turn and draw a card.', effect: 'manaAndDraw', value: 3 },
];

/** How many copies of each card go into a 30-card deck. */
const DECK_LIST = [
  ['ember-imp', 2], ['flame-hound', 2], ['ash-knight', 2], ['inferno-drake', 1], ['cinder-giant', 1],
  ['tide-sprite', 2], ['coral-guard', 2], ['wave-serpent', 1], ['deep-leviathan', 1],
  ['thorn-sprout', 2], ['briar-wolf', 1], ['oak-warden', 2], ['ancient-treant', 1],
  ['spark-wisp', 2], ['gale-falcon', 1], ['storm-rider', 1], ['tempest-titan', 1],
  ['ember-burst', 1], ['healing-rain', 1], ['lightning-strike', 1], ['thorn-growth', 1],
  ['tidal-draw', 1], ['storm-surge', 1], ['realm-blessing', 1],
];

/** A small seeded RNG (mulberry32) so games are reproducible from a seed. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle with the given RNG. */
export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A fresh 32-card deck: new card instances, shuffled. */
export function buildDeck(seed) {
  const rng = makeRng(seed);
  const cards = [];
  let uid = 0;
  for (const [id, count] of DECK_LIST) {
    const def = CATALOGUE.find((c) => c.id === id);
    for (let n = 0; n < count; n++) {
      cards.push({ ...def, uid: uid++, maxHealth: def.health ?? 0 });
    }
  }
  return shuffle(cards, rng);
}

/** Look a card definition up by id. */
export function cardDef(id) {
  return CATALOGUE.find((c) => c.id === id);
}
