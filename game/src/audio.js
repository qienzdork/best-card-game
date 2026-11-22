// audio.js — tiny WebAudio synth for Duel of Realms.
// No audio files: every sound is a short oscillator blip made in code.
// Sounds stay off until the player first interacts (browser autoplay
// rules), and a mute toggle silences them entirely.

let ctx = null;
let muted = false;

/** Create (or reuse) the audio context after a user gesture. */
export function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

/** One short tone: frequency in Hz, seconds long, triangle or sine wave. */
function blip(freq, seconds, type = 'triangle', volume = 0.12, when = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const start = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

/** Named game sounds, each a small chord or arpeggio of blips. */
export const sounds = {
  playCard() { blip(520, 0.09); blip(780, 0.12, 'triangle', 0.1, 0.05); },
  spell() { blip(880, 0.1, 'sine'); blip(1174, 0.14, 'sine', 0.09, 0.06); },
  attack() { blip(220, 0.08, 'square', 0.06); },
  hurt() { blip(160, 0.16, 'sawtooth', 0.07); },
  turn() { blip(660, 0.07); },
  draw() { blip(440, 0.05, 'sine', 0.06); },
  win() { [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.22, 'triangle', 0.12, i * 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => blip(f, 0.26, 'sine', 0.1, i * 0.13)); },
  click() { blip(700, 0.04, 'sine', 0.05); },
};
