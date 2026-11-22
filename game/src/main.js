// main.js — Duel of Realms bootstrap.
// Wires the rules engine to the renderer: starts games, handles clicks
// and keys, runs Lord Vex's turn with paced animations, and offers
// `?scene=` demo states (title | mid | win | loss) so the game can be
// screenshotted in each of its screens. Everything here is the game's
// own code — no network, no libraries.

import { createGame, playCard, endTurn } from './rules.js';
import { chooseAiTurn } from './ai.js';
import { buildShell, renderGame, showEnd } from './render.js';
import { sounds, ensureAudio, setMuted, isMuted } from './audio.js';

const root = document.getElementById('app');
const refs = buildShell(root);

const ui = {
  wins: 0,
  losses: 0,
  selectedHand: null,
  selectedLane: null,
  seenUids: new Set(),
  busy: false,
  onPlayAgain: () => startGame(),
};

let game = createGame(randomSeed());

function randomSeed() {
  return (Date.now() % 100000) | 0;
}

function refresh() {
  renderGame(refs, game, ui, {
    onHandCardClick: handleHandCardClick,
    onLaneClick: handleLaneClick,
  });
}

function startGame() {
  game = createGame(randomSeed());
  ui.selectedHand = null;
  ui.selectedLane = null;
  ui.seenUids = new Set();
  ui.busy = false;
  refs.titleOverlay.classList.add('hidden');
  refs.endOverlay.classList.add('hidden');
  refresh();
}

/** Click a hand card: select it, or cast it at once when it is a spell. */
function handleHandCardClick(index) {
  if (ui.busy || game.phase !== 'play' || game.activeSide !== 'player') return;
  ensureAudio();
  const card = game.player.hand[index];
  if (!card) return;
  if (card.kind === 'spell') {
    if (card.cost > game.player.mana) { sounds.hurt(); return; }
    const result = playCard(game, 'player', index);
    if (result.ok) {
      sounds.spell();
      ui.selectedHand = null;
      refresh();
      maybeEndCheck();
    }
    return;
  }
  ui.selectedHand = ui.selectedHand === index ? null : index;
  ui.selectedLane = null;
  sounds.click();
  refresh();
}

/** Click a lane while a creature is selected: place it there. */
function handleLaneClick(lane) {
  if (ui.busy || game.phase !== 'play' || game.activeSide !== 'player') return;
  if (ui.selectedHand === null) return;
  const result = playCard(game, 'player', ui.selectedHand, lane);
  if (!result.ok) {
    ui.selectedHand = null;
    refresh();
    return;
  }
  sounds.playCard();
  ui.selectedHand = null;
  ui.selectedLane = null;
  refresh();
  maybeEndCheck();
}

/** After the player's action, check for a win, else nothing — the player ends the turn when ready. */
function maybeEndCheck() {
  if (game.phase === 'over') showEndScreen();
}

function showEndScreen() {
  if (game.winner === 'player') { ui.wins += 1; sounds.win(); }
  else if (game.winner === 'enemy') { ui.losses += 1; sounds.lose(); }
  refresh();
  showEnd(refs, game, ui);
}

/** End Turn button: combat, then Vex plays his turn with paced steps. */
async function handleEndTurn() {
  if (ui.busy || game.phase !== 'play' || game.activeSide !== 'player') return;
  ui.busy = true;
  ui.selectedHand = null;
  ui.selectedLane = null;
  sounds.turn();
  endTurn(game);
  refresh();
  if (game.phase === 'over') { ui.busy = false; showEndScreen(); return; }
  await sleep(650);
  const actions = chooseAiTurn(game);
  for (const action of actions) {
    if (game.phase !== 'play') break;
    await sleep(420);
    if (action.spell) sounds.spell(); else sounds.playCard();
    refresh();
  }
  await sleep(500);
  sounds.attack();
  endTurn(game);
  refresh();
  ui.busy = false;
  if (game.phase === 'over') showEndScreen();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- wiring ---------------------------------------------------------------

refs.startBtn.addEventListener('click', () => {
  ensureAudio();
  sounds.playCard();
  startGame();
});
refs.endTurnBtn.addEventListener('click', handleEndTurn);
refs.muteBtn.addEventListener('click', () => {
  setMuted(!isMuted());
  refs.muteBtn.textContent = isMuted() ? '🔇' : '🔊';
});
refs.helpBtn.addEventListener('click', () => refs.helpOverlay.classList.remove('hidden'));
refs.closeHelpBtn.addEventListener('click', () => refs.helpOverlay.classList.add('hidden'));

document.addEventListener('keydown', (e) => {
  if (!refs.titleOverlay.classList.contains('hidden')) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refs.startBtn.click(); }
    return;
  }
  if (e.key === 'Enter') { handleEndTurn(); return; }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) handleHandCardClick(n - 1);
  if (e.key === 'Escape') { ui.selectedHand = null; refresh(); }
});

// --- demo scenes for screenshots (?scene=title | mid | win | loss) --------

function demoMidGame() {
  // A lively mid-game: both lords wounded, creatures on every lane.
  const demo = createGame(4242, true);
  demo.turn = 6;
  demo.player.maxMana = 6; demo.player.mana = 4;
  demo.enemy.maxMana = 6; demo.enemy.mana = 2;
  demo.player.health = 21; demo.enemy.health = 17;
  // Place real catalogue cards (taken from the demo decks) onto the lanes.
  const take = (side, id) => {
    const fromDeck = demo[side].deck.find((c) => c.id === id);
    if (fromDeck) return { ...fromDeck };
    const fromHand = demo[side].hand.find((c) => c.id === id);
    return fromHand ? { ...fromHand } : null;
  };
  const put = (side, id, lane, attack, health) => {
    const card = take(side, id);
    if (!card) return;
    card.attack = attack; card.health = health; card.maxHealth = Math.max(health, card.maxHealth || health);
    demo[side].board[lane].push(card);
  };
  put('player', 'flame-hound', 0, 3, 2);
  put('player', 'oak-warden', 1, 2, 5);
  put('player', 'ash-knight', 2, 4, 3);
  put('enemy', 'coral-guard', 0, 2, 3);
  put('enemy', 'briar-wolf', 1, 3, 2);
  put('enemy', 'wave-serpent', 2, 5, 4);
  demo.log = [
    'Turn 6 — Your move.',
    'Lord Vex summons Wave Serpent to lane 3.',
    'Your Ash Knight strikes Lord Vex for 4.',
    'Flame Hound trades blows with Coral Guard in lane 1.',
  ];
  return demo;
}

function demoEndGame(won) {
  const demo = createGame(777, true);
  demo.turn = 9;
  demo.player.maxMana = 8; demo.player.mana = 3;
  demo.enemy.maxMana = 8; demo.enemy.mana = 1;
  demo.player.health = won ? 12 : 0;
  demo.enemy.health = won ? 0 : 14;
  demo.phase = 'over';
  demo.winner = won ? 'player' : 'enemy';
  demo.log = won
    ? ['Inferno Drake strikes Lord Vex for 6.', 'Lord Vex falls. You win the duel!']
    : ['Tempest Titan strikes you for 8.', 'Your lord falls. Lord Vex wins the duel.'];
  return demo;
}

function applyScene() {
  const scene = new URLSearchParams(window.location.search).get('scene') || 'title';
  if (scene === 'mid') {
    game = demoMidGame();
    refs.titleOverlay.classList.add('hidden');
    refresh();
  } else if (scene === 'win' || scene === 'loss') {
    game = demoEndGame(scene === 'win');
    refs.titleOverlay.classList.add('hidden');
    ui.wins = scene === 'win' ? 1 : 0;
    ui.losses = scene === 'win' ? 0 : 1;
    refresh();
    showEnd(refs, game, ui);
  } else {
    refresh();
  }
}

applyScene();
