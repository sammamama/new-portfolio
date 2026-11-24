"use client";

import { useEffect, useRef } from "react";

/**
 * Shifts its children against the pointer, eased, like the meadow's depth parallax.
 * `x` / `y` are the max shift in CSS px. Off under reduced motion.
 */
export default function ParallaxLayer({
  children,
  className = "",
  x = 12,
  y = 4,
}: {
  children: React.ReactNode;
  className?: string;
  x?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const k = Math.min(2.5, (now - last) / 16.667);
      last = now;
      const e = 1 - Math.pow(1 - 0.05, k); // same easing as the meadow
      cur.x += (target.x - cur.x) * e;
      cur.y += (target.y - cur.y) * e;
      el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
      if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.02) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const onMove = (ev: PointerEvent) => {
      target.x = -((ev.clientX / window.innerWidth) * 2 - 1) * x;
      target.y = -((ev.clientY / window.innerHeight) * 2 - 1) * y;
      wake();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      wake();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
