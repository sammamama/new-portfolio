"use client";

import { useEffect, useRef } from "react";

// 4×4 Bayer matrix for ordered dithering (same as the pixel scenes)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/**
 * Fills its positioned parent with an ordered-dithered pixel gradient, left → right through `stops`
 * (CSS colour variables, e.g. "--tarn-deep"). Blocks are `px` CSS px and crisp (image-rendering:
 * pixelated). Static: drawn once per resize, no animation loop.
 */
export default function DitherFill({ stops, px = 4 }: { stops: string[]; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const box = canvas?.parentElement;
    if (!canvas || !ctx || !box) return;
    const root = getComputedStyle(document.documentElement);
    const colours = stops.map((v) => root.getPropertyValue(v).trim());

    const draw = () => {
      const cols = Math.ceil(box.clientWidth / px);
      const rows = Math.ceil(box.clientHeight / px);
      if (!cols || !rows) return;
      canvas.width = cols;
      canvas.height = rows;
      canvas.style.width = `${cols * px}px`;
      canvas.style.height = `${rows * px}px`;
      const seg = colours.length - 1;
      for (let x = 0; x < cols; x++) {
        const t = (x / Math.max(1, cols - 1)) * seg;
        const i = Math.min(seg - 1, Math.floor(t));
        const f = t - i;
        for (let y = 0; y < rows; y++) {
          ctx.fillStyle = f > BAYER[(y & 3) * 4 + (x & 3)] ? colours[i + 1] : colours[i];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [stops, px]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 -z-10 block [image-rendering:pixelated]"
    />
  );
}
