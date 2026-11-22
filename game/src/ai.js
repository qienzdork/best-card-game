// ai.js — Lord Vex, the AI opponent.
// Vex plays like a readable rival, not a black box: it spends its mana on
// the best-value plays it can afford, fills the emptiest lane first, saves
// a heal for when it is hurting, and strikes where the player's board is
// weakest. Its choices are visible in the log, so the player can read
// them and counter them.

import { canPlayCard, playCard, boardPower, strongestCreature } from './rules.js';

/**
 * Play one full AI turn: keep playing affordable cards until mana runs out
 * or nothing good remains. Returns the list of actions taken, each as
 * { card, lane } for the renderer to animate.
 */
export function chooseAiTurn(game) {
  const actions = [];
  const lord = game.enemy;
  let guard = 0;
  while (guard++ < 20) {
    const choice = pickBestPlay(game, lord);
    if (!choice) break;
    const result = playCard(game, 'enemy', choice.handIndex, choice.lane);
    if (!result.ok) break;
    actions.push({ card: result.card, lane: result.lane ?? 0, spell: !!result.spell });
  }
  return actions;
}

/** The single best play available right now, or null when nothing is worth it. */
function pickBestPlay(game, lord) {
  let best = null;
  for (let handIndex = 0; handIndex < lord.hand.length; handIndex++) {
    const card = lord.hand[handIndex];
    if (!canPlayCard(game, 'enemy', handIndex)) continue;
    const score = scoreCard(game, lord, card);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { handIndex, lane: bestLaneFor(game, lord, card), score };
  }
  return best;
}

/** Heuristic value of playing a card now. */
function scoreCard(game, lord, card) {
  const foe = game.player;
  if (card.kind === 'spell') {
    switch (card.effect) {
      case 'damageLord':
        return 3 + card.value * 0.8;
      case 'healLord':
        return lord.health <= 15 ? 6 : lord.health <= 22 ? 2.5 : 0;
      case 'damageCreature': {
        const target = strongestCreature(foe);
        if (!target) return 2;
        return target.card.health <= card.value ? 6 : 3.5;
      }
      case 'buffBoard':
        return boardPower(lord) >= 4 ? 5 : 0.5;
      case 'drawCards':
        return lord.hand.length <= 2 ? 4 : 1;
      case 'damageAllEnemy':
        return boardPower(foe) >= 6 ? 6 : boardPower(foe) >= 3 ? 3 : 0;
      case 'manaAndDraw':
        return lord.mana >= card.cost && lord.hand.length <= 3 ? 4 : 1.5;
      default:
        return 1;
    }
  }
  // Creatures: value grows with stats per mana, and with lane pressure.
  const stats = card.attack + card.health;
  let score = (stats / Math.max(1, card.cost)) * 2 + stats * 0.2;
  if (foe.health <= card.attack + boardPower(lord)) score += 4; // lethal pressure
  if (card.health >= 5) score += 1; // a wall is worth keeping
  return score;
}

/** Which lane a creature should go to: the emptiest lane, preferring one where it wins the fight. */
function bestLaneFor(game, lord, card) {
  const foe = game.player;
  let bestLane = 0;
  let bestScore = -Infinity;
  for (let lane = 0; lane < 3; lane++) {
    if (lord.board[lane].length >= 3) continue;
    const foes = foe.board[lane];
    let score = 3 - lord.board[lane].length; // emptier is better
    if (foes.length === 0) score += 2; // an open lane hits the lord
    else {
      const target = foes[0];
      if (card.attack >= target.health && card.health > target.attack) score += 3; // wins the trade
      else if (card.health <= target.attack) score -= 1; // dies for nothing
    }
    if (score > bestScore) { bestScore = score; bestLane = lane; }
  }
  return bestLane;
}

/** A quick greedy player used by the headless playthrough test: plays everything affordable. */
export function chooseGreedyPlayerTurn(game) {
  const actions = [];
  const lord = game.player;
  let guard = 0;
  while (guard++ < 20) {
    let played = false;
    for (let handIndex = 0; handIndex < lord.hand.length; handIndex++) {
      const card = lord.hand[handIndex];
      if (!canPlayCard(game, 'player', handIndex)) continue;
      const result = playCard(game, 'player', handIndex, bestLaneFor(game, lord, card));
      if (result.ok) {
        actions.push({ card: result.card, lane: result.lane ?? 0 });
        played = true;
        break;
      }
    }
    if (!played) break;
  }
  return actions;
}
