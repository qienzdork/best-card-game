// render.js — draws Duel of Realms into the DOM.
// The board is plain HTML/CSS: a header, the enemy lord and hand-backs,
// three lanes (enemy row over player row), the player's lord, mana and
// hand, and a battle log. Cards are legible at thumbnail size: big cost,
// attack and health numbers, realm colour plus realm shape, never text
// alone. New cards arrive with a slide-and-flip deal animation.

import { REALMS } from './cards.js';
import { LANES } from './rules.js';

const REALM_GLYPHS = { ember: '🔥', tide: '💧', thorn: '🌿', storm: '⚡' };

/** Build the static shell once; returns refs to the live regions. */
export function buildShell(root) {
  root.innerHTML = `
    <div class="table">
      <header class="topbar">
        <div class="brand">⚔️ DUEL <span>OF REALMS</span></div>
        <div class="topbar-mid" id="turnBanner">Turn 1 — Your move</div>
        <div class="topbar-right">
          <span class="score" id="scoreLine">Duels won 0 · lost 0</span>
          <button class="icon-btn" id="muteBtn" title="Sound on/off">🔊</button>
          <button class="icon-btn" id="helpBtn" title="How to play">?</button>
        </div>
      </header>

      <section class="lord-row enemy-row" id="enemyRow"></section>

      <section class="lanes" id="lanes"></section>

      <section class="lord-row player-row" id="playerRow"></section>

      <section class="hand-zone">
        <div class="hand-label">Your hand <span id="deckCount"></span></div>
        <div class="hand" id="hand"></div>
        <div class="hand-actions">
          <button class="end-turn" id="endTurnBtn">END TURN ⏎</button>
          <div class="hint" id="hintLine">Click a card, then a lane.</div>
        </div>
      </section>

      <footer class="log" id="log"></footer>
    </div>

    <div class="overlay" id="titleOverlay">
      <div class="panel title-panel">
        <div class="title-gems"><span class="gem ember">▲</span><span class="gem tide">●</span><span class="gem thorn">◆</span><span class="gem storm">✦</span></div>
        <h1>DUEL OF REALMS</h1>
        <p class="tagline">Four realms. Three lanes. One lord left standing.</p>
        <div class="howto">
          <div><b>1 · DRAW &amp; MANA</b><span>Each turn you gain mana and draw a card.</span></div>
          <div><b>2 · PLAY CARDS</b><span>Creatures take a lane. Spells strike at once.</span></div>
          <div><b>3 · BATTLE</b><span>At turn's end your creatures attack — the foe in their lane, or the enemy lord.</span></div>
        </div>
        <button class="big-btn" id="startBtn">⚔️ BEGIN THE DUEL</button>
        <p class="fine">First lord to 0 health loses. Beat Lord Vex — he plays fair, and he remembers your tricks.</p>
      </div>
    </div>

    <div class="overlay hidden" id="endOverlay">
      <div class="panel end-panel" id="endPanel"></div>
    </div>

    <div class="overlay hidden" id="helpOverlay">
      <div class="panel help-panel">
        <h2>How to play</h2>
        <p><b>Goal:</b> reduce Lord Vex to 0 health before he does the same to you. Both lords start at 30.</p>
        <p><b>Mana:</b> blue crystals, top of your panel. They grow by 1 each turn, up to 10. Every card costs mana.</p>
        <p><b>Creatures:</b> click one in your hand, then click one of the three lanes. A lane holds at most 3 creatures.</p>
        <p><b>Spells:</b> click one in your hand to cast it at once — damage, healing, draw, or a board buff.</p>
        <p><b>Battle:</b> when you end your turn, your creatures attack. Each hits the enemy creature in its lane, or the enemy lord when the lane is empty. Creatures that take damage equal to their health fall. A creature cannot attack on the turn it is played.</p>
        <p><b>Realms:</b> <span class="realm-word ember">Ember ▲</span> hits hard, <span class="realm-word tide">Tide ●</span> heals and draws, <span class="realm-word thorn">Thorn ◆</span> endures, <span class="realm-word storm">Storm ✦</span> strikes from afar.</p>
        <p><b>Keys:</b> 1–9 select a hand card, Enter ends your turn.</p>
        <button class="big-btn" id="closeHelpBtn">GOT IT</button>
      </div>
    </div>
  `;
  return {
    turnBanner: root.querySelector('#turnBanner'),
    scoreLine: root.querySelector('#scoreLine'),
    muteBtn: root.querySelector('#muteBtn'),
    helpBtn: root.querySelector('#helpBtn'),
    enemyRow: root.querySelector('#enemyRow'),
    lanes: root.querySelector('#lanes'),
    playerRow: root.querySelector('#playerRow'),
    hand: root.querySelector('#hand'),
    deckCount: root.querySelector('#deckCount'),
    endTurnBtn: root.querySelector('#endTurnBtn'),
    hintLine: root.querySelector('#hintLine'),
    log: root.querySelector('#log'),
    titleOverlay: root.querySelector('#titleOverlay'),
    startBtn: root.querySelector('#startBtn'),
    endOverlay: root.querySelector('#endOverlay'),
    endPanel: root.querySelector('#endPanel'),
    helpOverlay: root.querySelector('#helpOverlay'),
    closeHelpBtn: root.querySelector('#closeHelpBtn'),
  };
}

/** One card face. `opts` may mark it playable / selected / miniature. */
export function cardElement(card, opts = {}) {
  const realm = REALMS[card.realm];
  const el = document.createElement('div');
  el.className = `card realm-${card.realm}${opts.mini ? ' mini' : ''}${opts.playable ? ' playable' : ''}${opts.selected ? ' selected' : ''}${opts.justDealt ? ' dealt' : ''}`;
  el.dataset.uid = String(card.uid);
  const stats = card.kind === 'creature'
    ? `<div class="card-stats"><span class="atk">⚔ ${card.attack}</span><span class="hp">♥ ${card.health}</span></div>`
    : `<div class="card-stats spell-stats"><span class="spell-tag">✦ SPELL</span></div>`;
  el.innerHTML = `
    <div class="card-cost" style="background:${realm.color}">${card.cost}</div>
    <div class="card-realm" style="background:${realm.dark}">${realm.symbol} ${realm.name.toUpperCase()}</div>
    <div class="card-art">${REALM_GLYPHS[card.realm]}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-text">${card.text}</div>
    ${stats}
  `;
  if (opts.onClick) el.addEventListener('click', (e) => { e.stopPropagation(); opts.onClick(card); });
  return el;
}

/** A face-down card back for the enemy hand. */
function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.innerHTML = '<div class="back-glyph">✦</div><div class="back-word">REALM</div>';
  return el;
}

/** A lord panel: portrait, name, big health bar and numbers. */
function lordPanel(lord, isEnemy, manaVisible) {
  const realm = REALMS[lord.realm];
  const pct = Math.max(0, (lord.health / lord.maxHealth) * 100);
  const hpClass = pct > 50 ? 'hp-good' : pct > 25 ? 'hp-warn' : 'hp-low';
  const mana = manaVisible
    ? `<div class="mana-row">${Array.from({ length: 10 }, (_, i) => `<span class="mana-crystal${i < lord.mana ? ' full' : ''}${i < lord.maxMana ? '' : ' locked'}">◆</span>`).join('')}</div>
       <div class="mana-num">${lord.mana}/${lord.maxMana} mana</div>`
    : '';
  return `
    <div class="lord ${isEnemy ? 'enemy-lord' : 'player-lord'}">
      <div class="lord-face" style="background:${realm.dark}">${isEnemy ? '👑' : '🛡️'}</div>
      <div class="lord-info">
        <div class="lord-name">${lord.name} <span class="lord-realm" style="color:${realm.light}">${realm.symbol} ${realm.name}</span></div>
        <div class="hp-bar"><div class="hp-fill ${hpClass}" style="width:${pct}%"></div><span class="hp-num">♥ ${Math.max(0, lord.health)} / ${lord.maxHealth}</span></div>
        ${mana}
      </div>
      <div class="lord-deck">🂠 ${lord.deck.length} cards left</div>
    </div>
  `;
}

/**
 * Full re-render of the live board. `ui` carries the transient selection
 * ({ selectedHand, selectedLane }) and `cb` the click handlers.
 */
export function renderGame(refs, game, ui, cb) {
  const isPlayerTurn = game.activeSide === 'player' && game.phase === 'play';
  refs.turnBanner.textContent = game.phase === 'over'
    ? (game.winner === 'player' ? '🏆 Victory!' : '💀 Defeat')
    : isPlayerTurn
      ? `Turn ${game.turn} — Your move`
      : `Turn ${game.turn} — Lord Vex is thinking…`;
  refs.turnBanner.classList.toggle('enemy-turn', !isPlayerTurn && game.phase === 'play');
  refs.scoreLine.textContent = `Duels won ${ui.wins} · lost ${ui.losses}`;

  // Enemy lord + hand-backs.
  refs.enemyRow.innerHTML = lordPanel(game.enemy, true, false);
  const backs = document.createElement('div');
  backs.className = 'enemy-hand';
  const shown = Math.min(game.enemy.hand.length, 7);
  for (let i = 0; i < shown; i++) backs.appendChild(cardBackElement());
  const count = document.createElement('span');
  count.className = 'enemy-hand-count';
  count.textContent = `${game.enemy.hand.length} cards`;
  backs.appendChild(count);
  refs.enemyRow.appendChild(backs);

  // Lanes.
  refs.lanes.innerHTML = '';
  for (let lane = 0; lane < LANES; lane++) {
    const laneEl = document.createElement('div');
    laneEl.className = `lane${ui.selectedLane === lane ? ' lane-target' : ''}`;
    laneEl.innerHTML = `<div class="lane-label">LANE ${lane + 1}</div>`;
    const enemyRow = document.createElement('div');
    enemyRow.className = 'lane-row enemy-lane-row';
    for (const c of game.enemy.board[lane]) enemyRow.appendChild(cardElement(c, { mini: true }));
    const playerRow = document.createElement('div');
    playerRow.className = 'lane-row player-lane-row';
    for (const c of game.player.board[lane]) playerRow.appendChild(cardElement(c, { mini: true }));
    laneEl.appendChild(enemyRow);
    laneEl.appendChild(playerRow);
    laneEl.addEventListener('click', () => cb.onLaneClick(lane));
    refs.lanes.appendChild(laneEl);
  }

  // Player lord + mana.
  refs.playerRow.innerHTML = lordPanel(game.player, false, true);

  // Player hand.
  refs.hand.innerHTML = '';
  game.player.hand.forEach((card, i) => {
    const playable = isPlayerTurn && card.cost <= game.player.mana;
    refs.hand.appendChild(cardElement(card, {
      playable,
      selected: ui.selectedHand === i,
      justDealt: !ui.seenUids.has(card.uid),
      onClick: () => cb.onHandCardClick(i),
    }));
    ui.seenUids.add(card.uid);
  });
  refs.deckCount.textContent = `· ${game.player.deck.length} left in deck`;
  refs.endTurnBtn.disabled = !isPlayerTurn;
  refs.hintLine.textContent = game.phase === 'over'
    ? 'The duel is over.'
    : !isPlayerTurn
      ? 'Lord Vex is taking his turn…'
      : ui.selectedHand === null
        ? 'Click a card, then a lane — or cast a spell.'
        : 'Now click a lane to place it. Click the card again to cancel.';

  // Log: last few lines.
  refs.log.innerHTML = game.log.slice(-4).map((line) => `<div>▸ ${escapeHtml(line)}</div>`).join('');
}

/** The win / loss overlay, with a confetti flourish on victory. */
export function showEnd(refs, game, ui) {
  const won = game.winner === 'player';
  const confetti = won
    ? `<div class="confetti">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.35}s;--c:${['#e8491d', '#1d7fe8', '#2fae4e', '#8a4fe8', '#ffd23f'][i % 5]}"></i>`).join('')}</div>`
    : '';
  refs.endPanel.innerHTML = `
    ${confetti}
    <div class="end-title ${won ? 'win' : 'lose'}">${won ? '🏆 VICTORY!' : '💀 DEFEAT'}</div>
    <p class="end-sub">${won
      ? 'Lord Vex bows to you. The realms are yours — this time.'
      : 'Lord Vex claims the realms. Demand a rematch.'}</p>
    <div class="end-stats">
      <div><b>${game.turn}</b><span>turns</span></div>
      <div><b>${Math.max(0, game.player.health)}</b><span>your health</span></div>
      <div><b>${Math.max(0, game.enemy.health)}</b><span>Vex health</span></div>
      <div><b>${ui.wins}–${ui.losses}</b><span>duels W–L</span></div>
    </div>
    <button class="big-btn" id="againBtn">⚔️ PLAY AGAIN</button>
  `;
  refs.endOverlay.classList.remove('hidden');
  refs.endPanel.querySelector('#againBtn').addEventListener('click', () => {
    refs.endOverlay.classList.add('hidden');
    ui.onPlayAgain();
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
