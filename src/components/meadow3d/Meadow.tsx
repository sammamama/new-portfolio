"use client";

import { useEffect, useRef, useState } from "react";
import AsciiMeadow from "../ascii/AsciiMeadow";
import type { Meadow as Engine } from "./engine";

/**
 * Hero meadow: Three.js scene → ASCII shader pass.
 * Falls back to the 2D procedural canvas (v0) when WebGL2 is unavailable.
 */
export default function Meadow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

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
    const onMove = (e: PointerEvent) => {
      const [x, y] = rel(e);
      engine?.pointer(x, y);
    };
    const onDown = (e: PointerEvent) => {
      const [x, y] = rel(e);
      engine?.splash(x, y);
    };
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
      if (!probe) {
        setFallback(true);
        return;
      }
      await document.fonts.ready;
      const { createMeadow } = await import("./engine");
      if (cancelled) return;
      try {
        const created = await createMeadow({ canvas, fontFamily: getComputedStyle(canvas).fontFamily || "monospace" });
        if (cancelled) {
          created.dispose();
          return;
        }
        engine = created;
      } catch {
        if (!cancelled) setFallback(true);
        return;
      }
      fit();
      ro.observe(canvas);
      if (reduce) {
        engine.renderOnce();
        return;
      }
      io.observe(canvas);
      engine.start();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      engine?.dispose();
    };
  }, []);

  if (fallback) return <AsciiMeadow className={className} />;

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full font-mono select-none ${className}`}
    />
  );
}
