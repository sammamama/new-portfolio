/*
 * Hero load sequence, shared between the meadow, the loader and anything else that waits on it:
 *  1. the meadow has its painting and a WebGL context  → markMeadowReady()
 *  2. the hero is revealed (after the loader dissolves,
 *     or straight away when cached and it never showed) → revealHero()
 *  3. the hero builds in (meadow intro, pixel-in layers) ← onReveal()
 * Callbacks registered after the fact run straight away.
 */

/** localStorage key set after the hero has fully loaded once; a head script in layout.tsx reads it. */
export const HERO_SEEN_KEY = "meadow-seen-v1";

type Fn = () => void;

let meadowReady = false;
let revealed = false;
const meadowWaiters: Fn[] = [];
const revealWaiters: Fn[] = [];

export function markMeadowReady() {
  if (meadowReady) return;
  meadowReady = true;
  meadowWaiters.splice(0).forEach((f) => f());
}

export function onMeadowReady(f: Fn) {
  if (meadowReady) f();
  else meadowWaiters.push(f);
}

export function revealHero() {
  if (revealed) return;
  revealed = true;
  revealWaiters.splice(0).forEach((f) => f());
}

/** Runs `f` once the hero is revealed. Returns an unsubscribe. */
export function onReveal(f: Fn): Fn {
  if (revealed) {
    f();
    return () => {};
  }
  revealWaiters.push(f);
  return () => {
    const i = revealWaiters.indexOf(f);
    if (i >= 0) revealWaiters.splice(i, 1);
  };
}
