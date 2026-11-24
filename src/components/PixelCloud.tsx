"use client";

import { useEffect, useRef } from "react";

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((c, i) => Math.round(c + (y[i] - c) * t)).join(",")})`;
}

/**
 * A pixel-art cloud: a few overlapping puffs on a flat base, drawn one canvas pixel per block and
 * scaled up crisply (image-rendering: pixelated). Shading matches the meadow's shade blocks:
 * ▒ paper/mist highlight on top, tarn-mist body, a deeper mist underside, with ▒ dither between bands.
 * Size is `cols` × `--cloud-px` CSS px.
 */
export default function PixelCloud({ seed = 1, cols = 30, rows = 12 }: { seed?: number; cols?: number; rows?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = cols;
    canvas.height = rows;

    const root = getComputedStyle(document.documentElement);
    const v = (n: string, f: string) => root.getPropertyValue(n).trim() || f;
    const paper = v("--paper", "#fbfbf8");
    const mist = v("--tarn-mist", "#dfe7fd");
    const bright = v("--tarn-bright", "#4d7cf0");
    // underside and outline: tarn-mist pulled toward tarn-bright
    const shade = mix(mist, bright, 0.18);
    const edge = mix(mist, bright, 0.3);

    // deterministic puffs
    let s = seed * 9301 + 49297;
    const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const base = rows - 1.5; // flat bottom
    const puffs = Array.from({ length: 4 }, (_, i) => {
      const t = (i + 0.5) / 4;
      // middle puffs tallest, so it reads as a cumulus rather than a slab;
      // never taller than the canvas allows
      let r = rows * (0.42 + rand() * 0.16) * (1 - Math.abs(t - 0.5) * 0.7);
      r = Math.min(r, (base - 0.5) / 1.42);
      // keep every puff fully inside the canvas, so no side gets cut flat
      const x = Math.min(cols - r - 0.5, Math.max(r + 0.5, cols * (0.14 + t * 0.72) + (rand() - 0.5) * 2));
      return { x, y: base - r * 0.55, r };
    });
    // the flat base only spans between the outer puffs, so the ends stay rounded
    const baseL = puffs[0].x;
    const baseR = puffs[puffs.length - 1].x;
    const inside = (x: number, y: number) => {
      if (y > base) return false;
      if (y > base - 2.2 && x > baseL && x < baseR) return true; // flat base band
      return puffs.some((p) => (x - p.x) ** 2 + ((y - p.y) * 1.15) ** 2 <= p.r * p.r);
    };

    ctx.clearRect(0, 0, cols, rows);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const cx = x + 0.5;
        const cy = y + 0.5;
        if (!inside(cx, cy)) continue;
        const edgeCell = !inside(cx, cy - 1) || !inside(cx - 1, cy) || !inside(cx + 1, cy) || !inside(cx, cy + 1);
        // height inside the cloud: 0 at its top, 1 at the base
        let top = cy;
        while (inside(cx, top - 1)) top--;
        const h = (cy - top) / Math.max(1, base - top);
        const checker = (x + y) % 2 === 0;
        let c = mist;
        if (h < 0.35) c = checker ? paper : mist; // ▒ sunlit top (never solid paper: it would vanish into the page)
        else if (h > 0.8) c = shade;
        else if (h > 0.65) c = checker ? mist : shade; // ▒ body → underside
        if (edgeCell && !inside(cx, cy + 1)) c = edge; // soft underline along the base
        else if (edgeCell && !inside(cx, cy - 1)) c = mist; // top outline, so the paper highlight reads
        else if (edgeCell) c = checker ? mist : edge;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
  }, [seed, cols, rows]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="block [image-rendering:pixelated]"
      style={{ width: `calc(${cols} * var(--cloud-px))`, height: `calc(${rows} * var(--cloud-px))` }}
    />
  );
}
