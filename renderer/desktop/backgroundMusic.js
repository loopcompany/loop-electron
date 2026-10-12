/**
 * Background music: the Loop theme (./assets/loop-theme.mp3) plays quietly and
 * starts over each time it ends, for as long as the app is open.
 *
 * Kept cheap on purpose: one module-level <audio loop> element (no React
 * state, nothing re-renders while it plays), streamed from app:// with range
 * requests (electron/protocol.js) instead of decoded into memory up front.
 * Turning it off pauses it; the choice is remembered between runs
 * (`loop.music`). The window allows autoplay (electron/main.js
 * `autoplayPolicy`); if the page is ever opened somewhere that does not, it
 * starts on the first click or key press instead. It is held while the splash
 * logo motion plays its own sound (`holdBackgroundMusic`, Landing override).
 */
import { useSyncExternalStore } from 'react';
import { Asset } from 'expo-asset';

const STORAGE_KEY = 'loop.music';
const VOLUME = 0.35;
const FADE_MS = 1800;

let audio = null;
let enabled = readPreference();
let fadeTimer = null;
let waitingForGesture = false;
let held = false;
const listeners = new Set();

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.src = Asset.fromModule(require('./assets/loop-theme.mp3')).uri;
  }
  return audio;
}

// soft fade-in, so the music never starts with a jolt
function fadeIn(el) {
  clearInterval(fadeTimer);
  const steps = 18;
  let step = 0;
  el.volume = 0;
  fadeTimer = setInterval(() => {
    step += 1;
    el.volume = VOLUME * Math.min(1, step / steps);
    if (step >= steps) clearInterval(fadeTimer);
  }, FADE_MS / steps);
}

function play() {
  const el = getAudio();
  const started = el.play();
  if (started && started.catch) {
    started.then(() => fadeIn(el)).catch(playOnFirstGesture);
  } else {
    fadeIn(el);
  }
}

function playOnFirstGesture() {
  if (waitingForGesture) return;
  waitingForGesture = true;
  const start = () => {
    window.removeEventListener('pointerdown', start, true);
    window.removeEventListener('keydown', start, true);
    waitingForGesture = false;
    if (enabled && !held) play();
  };
  window.addEventListener('pointerdown', start, true);
  window.addEventListener('keydown', start, true);
}

/** Starts the music if the user has not turned it off. Safe to call more than once. */
export function startBackgroundMusic() {
  if (typeof window === 'undefined' || !enabled || held) return;
  if (audio && !audio.paused) return;
  play();
}

export function toggleBackgroundMusic() {
  enabled = !enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // only a preference
  }
  if (enabled) {
    if (!held) play();
  } else if (audio) {
    clearInterval(fadeTimer);
    audio.pause();
  }
  listeners.forEach((listener) => listener());
}

/**
 * Keeps the music silent (e.g. while the splash video plays its own sound).
 * Returns the release function, which starts the music if it is switched on —
 * shaped for `useEffect(() => holdBackgroundMusic(), [])`.
 */
export function holdBackgroundMusic() {
  held = true;
  if (audio && !audio.paused) {
    clearInterval(fadeTimer);
    audio.pause();
  }
  return () => {
    held = false;
    startBackgroundMusic();
  };
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** `true` while the music is switched on. */
export function useBackgroundMusic() {
  return useSyncExternalStore(subscribe, () => enabled, () => enabled);
}
