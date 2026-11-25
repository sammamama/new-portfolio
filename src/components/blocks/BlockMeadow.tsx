"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { markMeadowReady, onReveal } from "../heroReveal";
// static, not lazy: the engine ships with the page instead of a second round trip after hydration
import { type Engine, createEngine } from "./engine";
import { DEPTH_URL, IMG_URL, loadSources } from "./source";

// the meadow starts building in when the hero title is a quarter through its own build-in (0.6s)
const TITLE_QUARTER_MS = 150;

/** ms until the title's build-in is a quarter done: it may already be running (cached pages start it in CSS) */
function untilTitleQuarter() {
  const wrap = document.querySelector("#top h1")?.closest(".pixel-in");
  const anim = wrap?.getAnimations().find((a) => (a as CSSAnimation).animationName === "pixel-in");
  const t = anim?.currentTime;
  return typeof t === "number" ? Math.max(0, TITLE_QUARTER_MS - t) : TITLE_QUARTER_MS;
}

/** Hero meadow: the reference painting drawn in shade blocks (░ ▒ ▓ █), WebGL2. */
export default function BlockMeadow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // <link rel="preload"> in the head: the painting downloads alongside the page's JS, not after it
  preload(IMG_URL, { as: "image", fetchPriority: "high" });
  preload(DEPTH_URL, { as: "image" });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let engine: Engine | null = null;
    let cancelled = false;
    let visible = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rel = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onMove = (e: PointerEvent) => engine?.pointer(...rel(e));
    const onLeave = () => engine?.leave();

    const fit = () => {
      if (!engine) return;
      const r = canvas.getBoundingClientRect();
      engine.resize(r.width, r.height);
      if (reduce || !visible) engine.renderOnce();
    };
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 100);
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!engine || reduce) return;
      if (visible) engine.start();
      else engine.stop();
    });

    let unReveal = () => {};
    let startTimer = 0;
    (async () => {
      try {
        const src = await loadSources(); // preloaded from the page head, usually already in memory
        if (cancelled) return;
        engine = createEngine(canvas, src); // throws without WebGL2: the sky stays empty, the page reads fine
        fit();
        ro.observe(canvas);
      } catch {
        // a failed load must not hold the loader up; the sky just stays empty
        return;
      } finally {
        if (!cancelled) markMeadowReady();
      }
      // nothing is drawn before the reveal; then the intro starts once the title is a quarter in
      unReveal = onReveal(() => {
        if (!engine || cancelled) return;
        if (reduce) {
          engine.renderOnce();
          return;
        }
        startTimer = window.setTimeout(() => {
          if (!engine || cancelled) return;
          io.observe(canvas);
          engine.start();
          window.addEventListener("pointermove", onMove, { passive: true });
          document.documentElement.addEventListener("pointerleave", onLeave);
        }, untilTitleQuarter());
      });
    })();

    return () => {
      cancelled = true;
      unReveal();
      window.clearTimeout(startTimer);
      window.clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      engine?.dispose();
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden="true" className={`pointer-events-none block h-full w-full select-none ${className}`} />
  );
}
