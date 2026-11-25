"use client";

import { useEffect, useRef } from "react";
import { HERO_SEEN_KEY, onMeadowReady, onReveal, revealHero } from "./heroReveal";

const CELLS = 10;
const MAX_MS = 6000; // a slow network never keeps the hero hidden for long

/*
 * Pixel loader over the hero: a row of meadow cells (10 × 18px, twice the meadow's 5 × 9) pulsing
 * ░ ▒ ▓ █ in a slow wave. No artificial waits anywhere: the hero builds in the moment it can.
 *
 * - First visit (assets not cached): the loader covers the hero until the meadow painting and the
 *   fonts are in. Then, in the same frame, it starts dissolving and the hero starts building in.
 * - Cached (remembered via localStorage, HERO_SEEN_KEY; a script in the root layout's <head> marks
 *   the page `data-hero-cached` before first paint): no loader at all. The text, clouds and
 *   butterflies build in from first paint in pure CSS, and the meadow plays its intro as soon as
 *   it is ready.
 */
export default function HeroLoader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const hero = el?.closest("section");
    if (!el || !hero) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cached = document.documentElement.hasAttribute("data-hero-cached");
    let done = false;

    const reveal = () => {
      if (done) return;
      done = true;
      try {
        localStorage.setItem(HERO_SEEN_KEY, "1");
      } catch {}
      revealHero();
    };

    // the loader hides itself once its dissolve has played
    const onEnd = (e: AnimationEvent) => {
      if (e.target === el && e.animationName === "pixel-out") el.hidden = true;
    };
    el.addEventListener("animationend", onEnd);

    const unReveal = onReveal(() => {
      hero.dataset.revealed = "";
      // no dissolve running (cached, reduced motion, or a return visit within the session): just go
      if (el.dataset.leaving === undefined) el.hidden = true;
    });

    // first visit: everything is in → dissolve and build in, together
    const ready = () => {
      if (done) return;
      if (!reduce) el.dataset.leaving = "";
      reveal();
    };

    let safety = 0;
    if (cached) reveal();
    else {
      let fonts = false;
      let meadow = false;
      const check = () => fonts && meadow && ready();
      document.fonts.ready.then(() => {
        fonts = true;
        check();
      });
      onMeadowReady(() => {
        meadow = true;
        check();
      });
      safety = window.setTimeout(ready, MAX_MS);
    }

    return () => {
      el.removeEventListener("animationend", onEnd);
      unReveal();
      clearTimeout(safety);
    };
  }, []);

  return (
    <div ref={ref} role="status" className="pixel-loader absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-paper">
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} className="pixel-loader-cell" style={{ animationDelay: `${i * 0.09}s` }} />
        ))}
      </div>
      <span className="label text-ink-faint">loading the meadow</span>
    </div>
  );
}
