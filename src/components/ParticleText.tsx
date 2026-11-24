"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A line of text drawn as ink particles (one per device pixel). The cursor scatters them; they spring
 * back. The real text stays in the DOM (transparent) for layout, selection and screen readers.
 * Under reduced motion it's just the text.
 */
export default function ParticleText({ children, className = "" }: { children: string; className?: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PAD = 90; // room for the particles to spread into (css px)
    let dpr = 1;
    let W = 0;
    let H = 0;
    let n = 0;
    let home = new Float32Array(); // device px
    let pos = new Float32Array();
    let vel = new Float32Array();
    let alpha = new Uint8Array();
    let img: ImageData | null = null;
    let buf = new Uint32Array();
    let rgb = 0;
    const mouse = { x: -1e5, y: -1e5, px: -1e5, py: -1e5, on: false };
    let raf = 0;
    let settled = true;
    let cancelled = false;

    function build() {
      const r = el!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round((r.width + PAD * 2) * dpr);
      H = Math.round((r.height + PAD * 2) * dpr);
      canvas!.width = W;
      canvas!.height = H;
      // explicit CSS size: otherwise the canvas lays out at its device-pixel size on hi-dpi screens
      canvas!.style.width = `${r.width + PAD * 2}px`;
      canvas!.style.height = `${r.height + PAD * 2}px`;

      // draw each word where the DOM put it, then read the pixels back as particles
      const cs = getComputedStyle(el!);
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink-soft").trim() || "#4a4a4f";
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.scale(dpr, dpr);
      o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      o.fillStyle = "#000";
      o.textBaseline = "middle";
      const node = el!.firstChild;
      if (node && node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        const range = document.createRange();
        const re = /\S+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          const wr = range.getBoundingClientRect();
          o.fillText(m[0], wr.left - r.left + PAD, wr.top - r.top + wr.height / 2 + PAD);
        }
      }
      const data = o.getImageData(0, 0, W, H).data;
      const hx: number[] = [];
      const hy: number[] = [];
      const ha: number[] = [];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const a = data[(y * W + x) * 4 + 3];
          if (a > 24) {
            hx.push(x);
            hy.push(y);
            ha.push(a);
          }
        }
      n = hx.length;
      home = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        home[i * 2] = hx[i];
        home[i * 2 + 1] = hy[i];
      }
      pos = home.slice();
      vel = new Float32Array(n * 2);
      alpha = Uint8Array.from(ha);
      img = ctx!.createImageData(W, H);
      buf = new Uint32Array(img.data.buffer);
      const c = parseInt(ink.replace("#", ""), 16);
      rgb = (c & 0xff) << 16 | (c & 0xff00) | (c >> 16) & 0xff; // little-endian ABGR
      render();
    }

    function render() {
      if (!img) return;
      buf.fill(0);
      for (let i = 0; i < n; i++) {
        const x = Math.round(pos[i * 2]);
        const y = Math.round(pos[i * 2 + 1]);
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const k = y * W + x;
        const a = Math.max(buf[k] >>> 24, alpha[i]);
        buf[k] = ((a << 24) | rgb) >>> 0;
      }
      ctx!.putImageData(img, 0, 0);
    }

    function step() {
      const R = 70 * dpr;
      const R2 = R * R;
      const mvx = mouse.on ? mouse.x - mouse.px : 0;
      const mvy = mouse.on ? mouse.y - mouse.py : 0;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      let moving = false;
      for (let i = 0; i < n; i++) {
        const i2 = i * 2;
        let x = pos[i2];
        let y = pos[i2 + 1];
        let vx = vel[i2];
        let vy = vel[i2 + 1];
        if (mouse.on) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) + 0.01;
            let f = 1 - d / R;
            f *= f;
            vx += (dx / d) * f * 3.2 * dpr + mvx * f * 0.1;
            vy += (dy / d) * f * 3.2 * dpr + mvy * f * 0.1;
          }
        }
        vx = (vx + (home[i2] - x) * 0.045) * 0.86;
        vy = (vy + (home[i2 + 1] - y) * 0.045) * 0.86;
        x += vx;
        y += vy;
        if (Math.abs(vx) + Math.abs(vy) > 0.01 || Math.abs(x - home[i2]) + Math.abs(y - home[i2 + 1]) > 0.05) moving = true;
        else {
          x = home[i2];
          y = home[i2 + 1];
          vx = vy = 0;
        }
        pos[i2] = x;
        pos[i2 + 1] = y;
        vel[i2] = vx;
        vel[i2 + 1] = vy;
      }
      return moving;
    }

    function frame() {
      const moving = step();
      render();
      // keep animating while the cursor is near or anything is still settling
      if (moving || mouse.on) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        settled = true;
      }
    }

    const wake = () => {
      if (!raf) {
        settled = false;
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr;
      const y = (e.clientY - r.top) * dpr;
      const inside = x > -40 && y > -40 && x < W + 40 && y < H + 40;
      if (inside && !mouse.on) {
        mouse.px = x;
        mouse.py = y;
      }
      mouse.x = x;
      mouse.y = y;
      if (inside) {
        mouse.on = true;
        wake();
      } else mouse.on = false;
    };
    const onLeave = () => {
      mouse.on = false;
    };

    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => settled && build(), 100);
    });

    document.fonts.ready.then(() => {
      if (cancelled) return;
      build();
      setLive(true);
      ro.observe(el);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="relative">
      <p ref={textRef} className={className} style={live ? { color: "transparent" } : undefined}>
        {children}
      </p>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[90px]"
      />
    </div>
  );
}
