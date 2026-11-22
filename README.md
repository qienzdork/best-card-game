[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/qienzdork/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/qienzdork/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Duel of Realms — a card battler

Two realm-lords duel across three lanes. Each turn you gain mana and draw a card, play creatures onto lanes and cast spells, and at the end of your turn your creatures attack — the enemy creature in their lane, or the enemy lord when the lane is empty. First lord to 0 health loses.

Four original realms, each told apart by colour **and** shape: Ember ▲ (hard-hitting), Tide ● (healing and draw), Thorn ◆ (tough defenders), Storm ✦ (direct damage). 24 unique cards, 32-card decks, an AI opponent (Lord Vex) who spends mana on the best plays he can read — and whom you can read back.

## How to play

1. **Draw & mana** — each turn you gain mana (growing 1 → 10) and draw a card.
2. **Play cards** — click a creature in your hand, then click one of the three lanes (max 3 creatures per lane). Click a spell to cast it at once.
3. **Battle** — press END TURN: your creatures attack. Then Lord Vex takes his turn. A creature cannot attack on the turn it is played, and when two creatures meet both strike at once.
4. **Win** — reduce Lord Vex from 30 health to 0 before he does the same to you. An empty deck costs 2 fatigue damage per draw.

Keys: `1–9` select a hand card, `Enter` ends your turn, `Esc` cancels a selection. Sound is a tiny WebAudio synth (no audio files); the 🔊 button mutes it.

## Run it

Serve `game/` with any static server and open `index.html` in a desktop browser — no network, no build step:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

Screenshot scenes for testing: `?scene=title`, `?scene=mid`, `?scene=win`, `?scene=loss`.

## Layout

- `game/index.html` — the page; `game/style.css` — the table, cards and overlays
- `game/src/cards.js` — card catalogue, the four realms, deck building
- `game/src/rules.js` — pure rules engine (turns, mana, combat, spells, fatigue)
- `game/src/ai.js` — Lord Vex's move chooser
- `game/src/render.js` — DOM rendering, card faces, win/loss overlays
- `game/src/audio.js` — WebAudio synth sounds
- `game/src/main.js` — bootstrap, input, AI turn pacing, demo scenes
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's dossier library, copied from the kit unchanged

## License

MIT — see [LICENSE](LICENSE).
