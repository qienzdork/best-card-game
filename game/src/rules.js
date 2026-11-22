// rules.js — the pure rules engine of Duel of Realms.
// No DOM here: this module only moves game state, so it can be tested
// headlessly. Two realm-lords duel across three lanes. Each round both
// lords share the round's mana (round 1 = 1, ... up to 10); on your turn
// you draw a card, play creatures onto lanes and cast spells; at the end
// of the turn your creatures attack — each strikes the opposing creature
// in its lane, or the enemy lord when the lane is empty. A creature cannot
// attack on the turn it is played (summoning sickness), and when two
// creatures meet both strike at once. First lord to 0 health loses. A
// lord whose deck runs out takes 2 fatigue damage per empty draw instead.

import { buildDeck, makeRng } from './cards.js';

export const LORD_HEALTH = 30;
export const MAX_MANA = 10;
export const LANES = 3;
export const HAND_LIMIT = 9;

/** A fresh game. `seed` drives both decks; `playerFirst` decides who opens. */
export function createGame(seed = 20261123, playerFirst = true) {
  const rng = makeRng(seed);
  const playerDeck = buildDeck(seed);
  const enemyDeck = buildDeck(seed + 7919);
  const game = {
    seed,
    turn: 1,
    phase: 'play', // 'play' | 'over'
    activeSide: playerFirst ? 'player' : 'enemy',
    winner: null, // 'player' | 'enemy' | null
    log: [],
    player: makeLord('player', 'You', 'ember', playerDeck),
    enemy: makeLord('enemy', 'Lord Vex', 'storm', enemyDeck),
  };
  drawCards(game.player, 4);
  drawCards(game.enemy, 4);
  game.player.maxMana = 1;
  game.player.mana = 1;
  game.enemy.maxMana = 1;
  game.enemy.mana = 1;
  addLog(game, 'The duel begins. Three lanes, two lords, one realm to rule.');
  return game;
}

function makeLord(side, name, realm, deck) {
  return {
    side, name, realm,
    health: LORD_HEALTH, maxHealth: LORD_HEALTH,
    mana: 0, maxMana: 0,
    deck, hand: [],
    board: [[], [], []], // one creature array per lane
    fatigue: 0,
  };
}

/** Draw `n` cards, taking fatigue damage when the deck is empty. */
export function drawCards(lord, n) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (lord.deck.length === 0) {
      lord.fatigue += 1;
      lord.health -= 2;
      drawn.push(null);
      continue;
    }
    const card = lord.deck.shift();
    if (lord.hand.length < HAND_LIMIT) lord.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/** The other side's lord object. */
export function opponentOf(game, side) {
  return side === 'player' ? game.enemy : game.player;
}

/** Whether `lord` may play the card at `handIndex` right now. */
export function canPlayCard(game, side, handIndex) {
  const lord = game[side];
  if (game.phase !== 'play' || game.activeSide !== side) return false;
  const card = lord.hand[handIndex];
  if (!card) return false;
  return card.cost <= lord.mana;
}

/** Play a creature from hand onto a lane, or cast a spell. Returns a result object. */
export function playCard(game, side, handIndex, lane = 0) {
  const lord = game[side];
  const foe = opponentOf(game, side);
  const card = lord.hand[handIndex];
  if (!card) return { ok: false, reason: 'no such card' };
  if (game.phase !== 'play' || game.activeSide !== side) return { ok: false, reason: 'not your turn' };
  if (card.cost > lord.mana) return { ok: false, reason: 'not enough mana' };

  lord.mana -= card.cost;
  lord.hand.splice(handIndex, 1);

  if (card.kind === 'creature') {
    const targetLane = Math.max(0, Math.min(LANES - 1, lane));
    if (lord.board[targetLane].length >= 3) {
      // Lane full: refund the card and the mana.
      lord.hand.splice(handIndex, 0, card);
      lord.mana += card.cost;
      return { ok: false, reason: 'lane is full' };
    }
    // Summoning sickness: a creature cannot attack on the turn it is played.
    lord.board[targetLane].push({ ...card, justSummoned: true });
    addLog(game, `${lord.name} summons ${card.name} to lane ${targetLane + 1}.`);
    checkEnd(game);
    return { ok: true, card, lane: targetLane };
  }

  // Spells resolve at once.
  const result = resolveSpell(game, lord, foe, card);
  addLog(game, `${lord.name} casts ${card.name}. ${result.note}`);
  checkEnd(game);
  return { ok: true, card, spell: result };
}

/** Apply a spell's effect. Returns { note } describing what happened. */
export function resolveSpell(game, lord, foe, card) {
  switch (card.effect) {
    case 'damageLord':
      foe.health -= card.value;
      return { note: `${foe.name} takes ${card.value} damage.` };
    case 'healLord':
      lord.health = Math.min(lord.maxHealth, lord.health + card.value);
      return { note: `${lord.name} recovers ${card.value} health.` };
    case 'damageCreature': {
      const target = strongestCreature(foe);
      if (!target) {
        foe.health -= card.value;
        return { note: `No creature to strike — ${foe.name} takes ${card.value} damage instead.` };
      }
      target.card.health -= card.value;
      if (target.card.health <= 0) removeCreature(foe, target.lane, target.index);
      return { note: `Lightning hits ${target.card.name} for ${card.value}.` };
    }
    case 'buffBoard':
      for (const lane of lord.board) {
        for (const c of lane) { c.attack += card.value; c.health += card.value; c.maxHealth += card.value; }
      }
      return { note: `${lord.name}'s creatures grow stronger.` };
    case 'drawCards':
      drawCards(lord, card.value);
      return { note: `${lord.name} draws ${card.value} cards.` };
    case 'damageAllEnemy': {
      let hit = 0;
      for (let lane = 0; lane < LANES; lane++) {
        for (let i = foe.board[lane].length - 1; i >= 0; i--) {
          foe.board[lane][i].health -= card.value;
          hit++;
          if (foe.board[lane][i].health <= 0) foe.board[lane].splice(i, 1);
        }
      }
      return { note: `The surge hits ${hit} enemy creature${hit === 1 ? '' : 's'}.` };
    }
    case 'manaAndDraw':
      lord.mana = Math.min(MAX_MANA, lord.mana + card.value);
      drawCards(lord, 1);
      return { note: `${lord.name} gains ${card.value} mana and draws a card.` };
    default:
      return { note: 'Nothing happens.' };
  }
}

/** The strongest enemy creature (highest attack, then health), with its position. */
export function strongestCreature(lord) {
  let best = null;
  for (let lane = 0; lane < LANES; lane++) {
    for (let i = 0; i < lord.board[lane].length; i++) {
      const c = lord.board[lane][i];
      if (!best || c.attack > best.card.attack || (c.attack === best.card.attack && c.health > best.card.health)) {
        best = { card: c, lane, index: i };
      }
    }
  }
  return best;
}

function removeCreature(lord, lane, index) {
  lord.board[lane].splice(index, 1);
}

/**
 * Combat: the active side's creatures attack, lane by lane. Each creature
 * strikes the first opposing creature in its lane, or the enemy lord when
 * the lane is empty. When two creatures meet, both strike at once — a
 * creature that falls still lands its blow.
 */
export function resolveCombat(game, side) {
  const attacker = game[side];
  const defender = opponentOf(game, side);
  const events = [];
  for (let lane = 0; lane < LANES; lane++) {
    const attackers = attacker.board[lane].slice();
    const defenders = defender.board[lane];
    for (const creature of attackers) {
      if (creature.health <= 0) continue;
      if (creature.justSummoned) continue;
      if (defenders.length > 0) {
        const target = defenders[0];
        target.health -= creature.attack;
        creature.health -= target.attack;
        events.push(`${creature.name} trades blows with ${target.name} in lane ${lane + 1}.`);
        if (target.health <= 0) {
          const idx = defender.board[lane].indexOf(target);
          if (idx >= 0) defender.board[lane].splice(idx, 1);
          events.push(`${target.name} falls.`);
        }
        if (creature.health <= 0) {
          const idx = attacker.board[lane].indexOf(creature);
          if (idx >= 0) attacker.board[lane].splice(idx, 1);
          events.push(`${creature.name} falls.`);
        }
      } else {
        defender.health -= creature.attack;
        events.push(`${creature.name} strikes ${defender.name} for ${creature.attack}.`);
      }
    }
  }
  for (const e of events) addLog(game, e);
  checkEnd(game);
  return events;
}

/** End the active side's turn: combat, then pass the turn with fresh mana and a draw. */
export function endTurn(game) {
  if (game.phase !== 'play') return { ok: false, reason: 'game over' };
  const side = game.activeSide;
  resolveCombat(game, side);
  if (game.phase === 'over') return { ok: true };
  const next = opponentOf(game, side);
  game.activeSide = next.side;
  if (game.activeSide === 'player') game.turn += 1;
  // Summoning sickness wears off as a side's new turn begins.
  for (const lane of next.board) for (const c of lane) c.justSummoned = false;
  // Mana ramps per ROUND, not per turn: both lords share the round's mana
  // (turn 1 = 1 mana, turn 2 = 2, ... up to 10), so the second player is
  // never a crystal ahead just for moving second.
  if (game.activeSide === 'player') {
    const roundMana = Math.min(MAX_MANA, game.turn);
    game.player.maxMana = roundMana;
    game.enemy.maxMana = roundMana;
  }
  next.mana = next.maxMana;
  const drawn = drawCards(next, 1);
  if (drawn[0] === null) addLog(game, `${next.name} draws from an empty deck and suffers fatigue.`);
  addLog(game, `Turn ${game.turn} — ${next.name}'s move.`);
  checkEnd(game);
  return { ok: true };
}

/** Total attack power standing on a lord's board. */
export function boardPower(lord) {
  return lord.board.flat().reduce((sum, c) => sum + c.attack, 0);
}

/** A small summary for the HUD and the end screens. */
export function gameSummary(game) {
  return {
    turn: game.turn,
    phase: game.phase,
    winner: game.winner,
    playerHealth: game.player.health,
    enemyHealth: game.enemy.health,
    playerBoard: boardPower(game.player),
    enemyBoard: boardPower(game.enemy),
    playerCardsLeft: game.player.deck.length,
    enemyCardsLeft: game.enemy.deck.length,
  };
}

function checkEnd(game) {
  if (game.phase === 'over') return;
  if (game.enemy.health <= 0 && game.player.health <= 0) {
    game.winner = game.activeSide === 'player' ? 'player' : 'enemy';
    game.phase = 'over';
    addLog(game, 'Both lords fall — the duel is decided by the last blow.');
  } else if (game.enemy.health <= 0) {
    game.winner = 'player';
    game.phase = 'over';
    addLog(game, 'Lord Vex falls. You win the duel!');
  } else if (game.player.health <= 0) {
    game.winner = 'enemy';
    game.phase = 'over';
    addLog(game, 'Your lord falls. Lord Vex wins the duel.');
  }
}

function addLog(game, message) {
  game.log.push(message);
  if (game.log.length > 40) game.log.shift();
}
