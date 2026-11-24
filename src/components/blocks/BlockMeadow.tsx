"use client";

import { useEffect, useRef } from "react";
import type { Engine } from "./engine";

/** Hero meadow: the reference painting drawn in shade blocks (░ ▒ ▓ █), WebGL2. */
export default function BlockMeadow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

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

    (async () => {
      const probe = document.createElement("canvas").getContext("webgl2");
      if (!probe) return; // no WebGL2: the sky stays empty, the page still reads fine
      const [{ loadSources }, { createEngine }] = await Promise.all([import("./source"), import("./engine")]);
      const src = await loadSources();
      if (cancelled) return;
      engine = createEngine(canvas, src);
      fit();
      ro.observe(canvas);
      if (reduce) {
        engine.renderOnce();
        return;
      }
      io.observe(canvas);
      engine.start();
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    })();

    return () => {
      cancelled = true;
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
