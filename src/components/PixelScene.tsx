"use client";

import { useEffect, useRef, useState } from "react";
import { scenes, type SceneName } from "./pixelScenes";

/*
 * A pixel-art scene (see pixelScenes.ts), drawn one canvas pixel per block and scaled up crisply
 * (image-rendering: pixelated), so blocks always land on whole CSS pixels. The box is `ratio` tall
 * (height / width; [mobile, from md]) and snaps to a whole number of blocks.
 *
 * Motion is stepped at ~8fps like an old game, paused off-screen; one still frame under reduced motion.
 */
export default function PixelScene({
  scene,
  ratio = 1,
  children,
}: {
  scene: SceneName;
  ratio?: number | [number, number];
  children?: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState({ cols: 0, rows: 0, px: 6 });
  const [rMobile, rDesktop] = typeof ratio === "number" ? [ratio, ratio] : ratio;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      const px = w < 420 ? 4 : 6;
      const r = w < 768 ? rMobile : rDesktop;
      const cols = Math.floor(w / px);
      const rows = Math.max(1, Math.floor((w * r) / px));
      setGrid((g) => (g.cols === cols && g.rows === rows && g.px === px ? g : { cols, rows, px }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rMobile, rDesktop]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const { cols, rows } = grid;
    if (!canvas || !ctx || cols < 8 || rows < 8) return;
    canvas.width = cols;
    canvas.height = rows;
    const img = ctx.createImageData(cols, rows);
    const draw = scenes[scene];
    const render = (frame: number) => {
      draw(img.data, cols, rows, frame);
      ctx.putImageData(img, 0, 0);
    };

    let frame = 0;
    render(frame);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 125) return; // stepped, ~8fps
      last = now;
      render(++frame);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [grid, scene]);

  const w = grid.cols * grid.px;
  const h = grid.rows * grid.px;
  return (
    // once snapped, the box takes the canvas's exact height, so neighbours can align to its edges
    <div
      ref={wrap}
      className="w-full"
      style={h ? { height: h } : { aspectRatio: `1 / ${rDesktop}` }}
    >
      <div className="relative" style={{ width: w || "100%", height: h || "100%" }}>
        <canvas ref={ref} aria-hidden="true" className="block h-full w-full [image-rendering:pixelated]" />
        {children}
      </div>
    </div>
  );
}
