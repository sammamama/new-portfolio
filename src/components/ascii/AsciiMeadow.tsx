"use client";

import { useEffect, useRef } from "react";
import { buildScene, KIND, PALETTE, type Scene } from "./scene";

type Ripple = { x: number; y: number; t: number };

const REPEL_RADIUS = 120;
const REPEL_PUSH = 26;
const RIPPLE_SPEED = 240; // px / s
const RIPPLE_LIFE = 2.6; // s

export default function AsciiMeadow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = getComputedStyle(canvas).fontFamily || "monospace";

    let scene: Scene | null = null;
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let col = new Uint8Array(0);
    let gl: string[] = [];
    let W = 0;
    let H = 0;
    let raf = 0;
    let visible = true;
    const start = performance.now();

    const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
    const ripples: Ripple[] = [];
    let lastRip = { x: -1e4, y: -1e4 };

    function setup() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      if (!W || !H) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fontSize = Math.max(8, Math.min(14, W / 118));
      scene = buildScene(W, H, fontSize);
      ox = new Float32Array(scene.n);
      oy = new Float32Array(scene.n);
      col = new Uint8Array(scene.n);
      gl = new Array(scene.n);
      ctx!.font = `700 ${fontSize}px ${family}`;
      ctx!.textBaseline = "top";
      draw(performance.now());
    }

    function draw(now: number) {
      const s = scene;
      if (!s) return;
      const t = (now - start) / 1000;
      const animate = !reduce;

      mouse.x += (mouse.tx - mouse.x) * 0.2;
      mouse.y += (mouse.ty - mouse.y) * 0.2;
      for (let r = ripples.length - 1; r >= 0; r--) {
        if (t - ripples[r].t > RIPPLE_LIFE) ripples.splice(r, 1);
      }

      const R2 = REPEL_RADIUS * REPEL_RADIUS;
      for (let i = 0; i < s.n; i++) {
        const bx = s.x[i];
        const by = s.y[i];
        const k = s.kind[i];
        const ph = s.phase[i];
        let tx = 0;
        let ty = 0;
        let g = s.glyph[i];
        let c = s.color[i];

        if (animate) {
          // cursor repel
          const dx = bx - mouse.x;
          const dy = by - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / REPEL_RADIUS;
            const p = f * f * REPEL_PUSH;
            tx = (dx / d) * p;
            ty = (dy / d) * p;
          }

          if (k === KIND.water) {
            let w = 0;
            for (const rp of ripples) {
              const age = t - rp.t;
              const dd = Math.hypot(bx - rp.x, (by - rp.y) * 1.6) - age * RIPPLE_SPEED;
              if (dd > -90 && dd < 90) {
                w += Math.cos(dd * 0.11) * Math.exp(-(dd * dd) / 1800) * Math.exp(-age * 1.3);
              }
            }
            ty += w * 4;
            if (w > 0.45) {
              g = "≈";
              c = 14;
            } else if (w > 0.3) {
              g = "=";
              c = 13;
            } else if (w > 0.2) {
              g = "~";
              c = 13;
            } else if (w < -0.35) {
              g = "-";
              c = 11;
            } else if (Math.sin(t * 1.4 + ph * 6.283 + bx * 0.015) > 0.93) {
              g = "~";
              c = 13;
            }
          } else if (k === KIND.sparkle) {
            const tw = Math.sin(t * 2.2 + ph * 6.283);
            if (tw < -0.3) g = " ";
            else if (tw > 0.75) g = "*";
            else g = "+";
          } else if (k === KIND.flower || k === KIND.foliage) {
            tx += Math.sin(t * 1.1 + ph * 6.283 + by * 0.012) * (k === KIND.flower ? 1.4 : 0.7);
          } else if (k === KIND.land) {
            tx += Math.sin(t * 0.9 + by * 0.02 + bx * 0.004) * 0.5;
          }
        }

        ox[i] += (tx - ox[i]) * 0.14;
        oy[i] += (ty - oy[i]) * 0.14;
        gl[i] = g;
        col[i] = c;
      }

      ctx!.clearRect(0, 0, W, H);
      for (let c = 0; c < PALETTE.length; c++) {
        ctx!.fillStyle = PALETTE[c];
        for (let i = 0; i < s.n; i++) {
          if (col[i] !== c) continue;
          const g = gl[i];
          if (g === " ") continue;
          ctx!.fillText(g, s.x[i] + ox[i], s.y[i] + oy[i]);
        }
      }
    }

    function loop(now: number) {
      draw(now);
      raf = visible ? requestAnimationFrame(loop) : 0;
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.tx = x;
      mouse.ty = y;
      if (mouse.x < -1e3) {
        mouse.x = x;
        mouse.y = y;
      }
      if (scene?.isWater(x, y) && Math.hypot(x - lastRip.x, y - lastRip.y) > 46) {
        ripples.push({ x, y, t: (performance.now() - start) / 1000 });
        if (ripples.length > 10) ripples.shift();
        lastRip = { x, y };
      }
    }
    function onLeave() {
      mouse.tx = -1e4;
      mouse.ty = -1e4;
    }
    function onDown(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (scene?.isWater(x, y)) {
        ripples.push({ x, y, t: (performance.now() - start) / 1000 });
        ripples.push({ x, y, t: (performance.now() - start) / 1000 - 0.25 });
      }
    }

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setup, 120);
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    });

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      setup();
      ro.observe(canvas);
      if (!reduce) {
        io.observe(canvas);
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full font-mono select-none ${className}`}
    />
  );
}
