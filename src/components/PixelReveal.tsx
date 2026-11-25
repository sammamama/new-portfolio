"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CELL_W = 6; // css px, shade-block cell (same family as the meadow's 5×9)
const CELL_H = 10;
const STEPS = [8, 6, 4, 3, 2]; // css px block sizes on the way to sharp
const DURATION = 350; // ms, rest → sharp

/**
 * A screenshot that rests as shade blocks (░ ▒ ▓ █, two inks per cell, like the meadow) and resolves
 * to the real image when `active`: stepped pixel blocks, then a short fade. Cropped like
 * object-cover / object-top. Under reduced motion it switches instantly.
 */
export default function PixelReveal({
  src,
  alt,
  sizes,
  active,
}: {
  src: string;
  alt: string;
  sizes: string;
  active: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // a plain copy of the loaded image to sample from: a srcset <img> reports density-corrected
  // naturalWidth, which doesn't match what drawImage reads on hi-dpi screens
  const imgRef = useRef<HTMLImageElement | null>(null);
  const shownRef = useRef<HTMLImageElement | null>(null);
  const api = useRef<{ setTarget: (t: number) => void; build: () => void } | null>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!box || !canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0; // device px
    let H = 0;
    let dpr = 1;
    let rest: HTMLCanvasElement | null = null;
    const tiny = document.createElement("canvas");
    let p = 0; // 0 = shade blocks, 1 = sharp
    let target = activeRef.current ? 1 : 0;
    let raf = 0;
    let last = 0;

    /** source rect of the image for an object-cover / object-top crop into w × h */
    const crop = (img: HTMLImageElement, w: number, h: number) => {
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = w / s;
      const sh = h / s;
      return [(img.naturalWidth - sw) / 2, 0, sw, sh] as const;
    };

    function build() {
      const img = imgRef.current;
      if (!img || !img.complete || !img.naturalWidth) return;
      const r = box!.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(r.width * dpr);
      H = Math.round(r.height * dpr);
      canvas!.width = W;
      canvas!.height = H;

      // two sub-samples per cell each way, area-averaged by the browser's downscale
      const cols = Math.ceil(r.width / CELL_W);
      const rows = Math.ceil(r.height / CELL_H);
      const sc = document.createElement("canvas");
      sc.width = cols * 2;
      sc.height = rows * 2;
      const sctx = sc.getContext("2d", { willReadFrequently: true })!;
      sctx.imageSmoothingQuality = "high";
      const [sx, sy, sw, sh] = crop(img, cols * CELL_W, rows * CELL_H);
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, sc.width, sc.height);
      const d = sctx.getImageData(0, 0, sc.width, sc.height).data;

      const out = new ImageData(W, H);
      const o = new Uint32Array(out.data.buffer);
      const unit = Math.max(1, Math.round(dpr));
      const cw = CELL_W * dpr;
      const ch = CELL_H * dpr;
      const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
      const pack = (c: number[]) => (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];

      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) {
          const s: number[][] = [];
          for (let k = 0; k < 4; k++) {
            const i = ((cy * 2 + (k >> 1)) * sc.width + cx * 2 + (k & 1)) * 4;
            s.push([d[i], d[i + 1], d[i + 2]]);
          }
          const avg = [0, 1, 2].map((c) => (s[0][c] + s[1][c] + s[2][c] + s[3][c]) / 4);
          let hi = 0;
          let lo = 0;
          for (let k = 1; k < 4; k++) {
            if (lum(...(s[k] as [number, number, number])) > lum(...(s[hi] as [number, number, number]))) hi = k;
            if (lum(...(s[k] as [number, number, number])) < lum(...(s[lo] as [number, number, number]))) lo = k;
          }
          // always keep some spread, so flat areas still show their block texture
          const light = [0, 1, 2].map((c) => Math.min(255, Math.max(s[hi][c], avg[c] * 1.22 + 8)));
          const dark = [0, 1, 2].map((c) => Math.min(s[lo][c], avg[c] * 0.72));
          const la = lum(avg[0], avg[1], avg[2]);
          const ll = lum(light[0], light[1], light[2]);
          const ld = lum(dark[0], dark[1], dark[2]);
          const frac = Math.min(1, Math.max(0, (la - ld) / Math.max(1, ll - ld)));
          const h = (Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453) % 1;
          const lvl = Math.min(4, Math.floor(frac * 4 + Math.abs(h))); // share of light pixels
          const L = pack(light.map(Math.round));
          const D = pack(dark.map(Math.round));

          const x0 = Math.round(cx * cw);
          const x1 = Math.min(W, Math.round((cx + 1) * cw));
          const y0 = Math.round(cy * ch);
          const y1 = Math.min(H, Math.round((cy + 1) * ch));
          for (let y = y0; y < y1; y++) {
            const uy = Math.floor((y - y0) / unit);
            for (let x = x0; x < x1; x++) {
              const ux = Math.floor((x - x0) / unit);
              const sparse = (uy % 4 === 0 && ux % 2 === 0) || (uy % 4 === 2 && ux % 2 === 1); // ░
              const on =
                lvl <= 0 ? false : lvl === 1 ? sparse : lvl === 2 ? (ux + uy) % 2 === 0 : lvl === 3 ? !sparse : true;
              o[y * W + x] = on ? L : D;
            }
          }
        }

      rest = document.createElement("canvas");
      rest.width = W;
      rest.height = H;
      rest.getContext("2d")!.putImageData(out, 0, 0);
      draw();
      if (shownRef.current) shownRef.current.style.opacity = "1"; // the shade blocks now cover it
    }

    function draw() {
      const img = imgRef.current;
      if (!rest || !img) return;
      if (p <= 0) {
        ctx!.drawImage(rest, 0, 0);
        canvas!.style.opacity = "1";
        return;
      }
      if (p >= 1) {
        canvas!.style.opacity = "0";
        return;
      }
      // stepped pixel blocks on the way to sharp, then a short fade to the real image
      const b = STEPS[Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))] * dpr;
      tiny.width = Math.max(1, Math.round(W / b));
      tiny.height = Math.max(1, Math.round(H / b));
      const t = tiny.getContext("2d")!;
      const [sx, sy, sw, sh] = crop(img, W, H);
      t.drawImage(img, sx, sy, sw, sh, 0, 0, tiny.width, tiny.height);
      ctx!.imageSmoothingEnabled = false;
      ctx!.clearRect(0, 0, W, H);
      ctx!.drawImage(tiny, 0, 0, W, H);
      canvas!.style.opacity = String(p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25);
    }

    function tick(now: number) {
      const dt = last ? now - last : 16;
      last = now;
      p = target > p ? Math.min(target, p + dt / DURATION) : Math.max(target, p - dt / DURATION);
      draw();
      if (p !== target) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        last = 0;
      }
    }

    api.current = {
      build,
      setTarget(t) {
        target = t;
        if (reduce) {
          p = t;
          draw();
          return;
        }
        if (!raf) raf = requestAnimationFrame(tick);
      },
    };

    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(build, 120);
    });
    ro.observe(box);
    build();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      ro.disconnect();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    activeRef.current = active;
    api.current?.setTarget(active ? 1 : 0);
  }, [active]);

  return (
    <div ref={boxRef} className="absolute inset-0 bg-paper-sunk">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover object-top"
        style={{ opacity: 0 }}
        onLoad={(e) => {
          shownRef.current = e.currentTarget;
          const plain = new window.Image();
          plain.decoding = "async";
          plain.onload = () => {
            imgRef.current = plain;
            api.current?.build();
          };
          plain.src = e.currentTarget.currentSrc || e.currentTarget.src;
        }}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
