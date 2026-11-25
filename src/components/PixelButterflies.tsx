"use client";

import { useEffect, useRef } from "react";

/*
 * Two pixel butterflies, one tarn and one bloom-pink, perched side by side on two neighbouring
 * letters of the hero name. When the pointer reaches the name they take off, each along its own
 * curved, fluttering path, and both settle together on another random pair of letters.
 * Perches are measured from the real glyphs, so they always sit on the ink.
 * Under reduced motion they just sit still.
 */

// 9 × 8 sprites. D outline · W wing · L wing spot · B body
const OPEN = [
  "...D.D...",
  "DD..B..DD",
  "DWWDBDWWD",
  "DWLWBWLWD",
  ".DWWBWWD.",
  ".DWLBLWD.",
  "DWWDBDWWD",
  ".DD...DD.",
];
const SHUT = [
  "...D.D...",
  "...DBD...",
  "..DWBWD..",
  "..DLBLD..",
  "..DWBWD..",
  "..DLBLD..",
  "..DWBWD..",
  "...D.D...",
];

type Palette = Record<"D" | "W" | "L" | "B", string>;
const TARN: Palette = { D: "fill-tarn-deep", W: "fill-tarn", L: "fill-tarn-mist", B: "fill-ink" };
const BLOOM: Palette = { D: "fill-bloom", W: "fill-blush", L: "fill-paper", B: "fill-ink" };

function Sprite({ rows, palette, className }: { rows: string[]; palette: Palette; className: string }) {
  return (
    <g className={className}>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className={palette[ch as keyof Palette]} />,
        ),
      )}
    </g>
  );
}

type Vec = [number, number];
type Spec = {
  palette: Palette;
  tilt: number; // resting angle, deg
  delay: number; // ms after the trigger before it takes off
  flutter: number; // sideways flutter, css px
  freq: number; // flutters per flight
  /** bezier control points from `a` to `b`, as offsets in units of the name's font size */
  ctrl: (a: Vec, b: Vec, em: number) => [Vec, Vec];
};

const BUTTERFLIES: Spec[] = [
  // swings out wide and high, then drops in from above
  { palette: TARN, tilt: -9, delay: 0, flutter: 10, freq: 5, ctrl: (a, b, em) => [[a[0] - 0.8 * em, a[1] - 1.6 * em], [b[0] + 0.5 * em, b[1] - 1.3 * em]] },
  // hops low and quick, then rises and circles in from the other side
  { palette: BLOOM, tilt: 11, delay: 180, flutter: 7, freq: 7, ctrl: (a, b, em) => [[a[0] + 0.9 * em, a[1] - 0.6 * em], [b[0] - 0.9 * em, b[1] - 2 * em]] },
];

const START = 0; // first perch: the "S" and "a" of Samridh
const SKIP = /[\s.i]/; // spaces, and the dot of the i is no place to land

const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function PixelButterflies() {
  const layer = useRef<HTMLDivElement>(null);
  const flyers = useRef<(HTMLSpanElement | null)[]>([]);
  const frames = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    const el = layer.current;
    const host = el?.parentElement;
    const h1 = host?.querySelector("h1");
    const text = h1?.firstChild;
    if (!el || !host || !h1 || !text || text.nodeType !== Node.TEXT_NODE) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const label = text.textContent ?? "";

    // ---- where each letter's ink starts, in the host's coordinates
    let tops: { x: number; y: number }[] = [];
    let em = 16;
    const measure = () => {
      const cs = getComputedStyle(h1);
      em = parseFloat(cs.fontSize) || 16;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(label);
      const lh = parseFloat(cs.lineHeight) || em;
      const hr = host.getBoundingClientRect();
      const tr = h1.getBoundingClientRect();
      const baseline = tr.top - hr.top + (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      const range = document.createRange();
      tops = [...label].map((ch, i) => {
        range.setStart(text, i);
        range.setEnd(text, i + 1);
        const r = range.getBoundingClientRect();
        const rise = ctx.measureText(ch).actualBoundingBoxAscent;
        // italic: the top of a letter leans right of its box centre
        return { x: r.left - hr.left + r.width / 2 + rise * 0.18, y: baseline - rise };
      });
    };

    // the pair perches on letters i and i + 1
    const perch = (i: number): [Vec, Vec] => [
      [tops[i].x, tops[i].y],
      [tops[i + 1].x, tops[i + 1].y],
    ];
    const pairs = () => [...label].map((_, i) => i).filter((i) => i + 1 < label.length && !SKIP.test(label[i]) && !SKIP.test(label[i + 1]));

    const setWings = (i: number, open: boolean) => frames.current[i]?.setAttribute("data-open", open ? "1" : "0");
    const pos: Vec[] = BUTTERFLIES.map(() => [0, 0]); // where each one is right now, host coords
    const put = (i: number, [x, y]: Vec, rot: number) => {
      pos[i] = [x, y];
      const fl = flyers.current[i];
      if (fl) fl.style.transform = `translate(${x}px, ${y + 1}px) translate(-50%, -100%) rotate(${rot}deg)`;
    };

    let at = START;
    const settle = () => {
      perch(at).forEach((p, i) => put(i, p, BUTTERFLIES[i].tilt));
      el.style.opacity = "1";
    };

    let state: "perched" | "flying" = "perched";
    const ro = new ResizeObserver(() => {
      measure();
      if (state === "perched") settle();
    });
    document.fonts.ready.then(() => {
      measure();
      settle();
      ro.observe(h1);
    });

    if (reduce) return () => ro.disconnect();

    // ---- resting: an occasional slow wing close, only while on screen
    let visible = true;
    const idleTimers: number[] = [];
    const idle = (i: number) => {
      idleTimers[i] = window.setTimeout(() => {
        if (visible && state === "perched") {
          setWings(i, false);
          window.setTimeout(() => state === "perched" && setWings(i, true), 220);
        }
        idle(i);
      }, 2200 + Math.random() * 3200);
    };
    BUTTERFLIES.forEach((_, i) => idle(i));
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    // ---- flight
    let armed = true; // the pointer must leave the name before it can scare them again
    let start = 0;
    let dur = 2000;
    let raf = 0;
    let from: [Vec, Vec] = [[0, 0], [0, 0]];
    let to: [Vec, Vec] = from;
    let delays = BUTTERFLIES.map((s) => s.delay);
    let airborne = false; // this flight started mid-air (a redirect), not from a perch
    let lastScare = 0;

    const fly = (i: number, p: number, flap: boolean) => {
      const s = BUTTERFLIES[i];
      const a = from[i];
      const b = to[i];
      const [c1, c2] = s.ctrl(a, b, em);
      // from a perch: ease in and out. Redirected mid-air: keep moving, only ease out.
      const t = airborne ? 1 - (1 - p) * (1 - p) : ease(p);
      let x = bez(a[0], c1[0], c2[0], b[0], t);
      let y = bez(a[1], c1[1], c2[1], b[1], t);
      const t2 = Math.min(1, t + 0.01);
      const hx = bez(a[0], c1[0], c2[0], b[0], t2) - x || 0.001;
      const hy = bez(a[1], c1[1], c2[1], b[1], t2) - y;
      const len = Math.hypot(hx, hy) || 1;
      // flutter across the path, calm at both ends
      const wob = Math.sin(p * s.freq * Math.PI * 2) * s.flutter * Math.sin(Math.PI * p);
      x += (-hy / len) * wob;
      y += (hx / len) * wob;
      // turn to the heading on take-off, back to the resting tilt on landing
      const heading = (Math.atan2(hy, hx) * 180) / Math.PI + 90;
      const turn = Math.min(1, airborne ? 1 : p * 6, (1 - p) * 6);
      put(i, [x, y], s.tilt + (heading - s.tilt) * turn);
      setWings(i, flap);
    };

    const tick = (now: number) => {
      const t = now - start;
      const flap = Math.floor(now / 70) % 2 === 0;
      let done = true;
      BUTTERFLIES.forEach((_, i) => {
        const p = Math.min(1, Math.max(0, (t - delays[i]) / dur));
        if (p < 1) done = false;
        fly(i, p, p > 0 && p < 1 ? flap : true);
      });
      if (done) {
        state = "perched";
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    // perched: take off. Already flying: change course from wherever they are to a new pair.
    const takeOff = () => {
      measure();
      // `at` is the pair they sit on, or are heading for
      const options = pairs().filter((i) => Math.abs(i - at) > 1);
      if (!options.length) return;
      const next = options[Math.floor(Math.random() * options.length)];
      airborne = state === "flying";
      from = airborne ? [pos[0], pos[1]] : perch(at);
      delays = airborne ? BUTTERFLIES.map(() => 0) : BUTTERFLIES.map((s) => s.delay);
      to = perch(next);
      at = next;
      const dist = Math.max(...from.map((f, i) => Math.hypot(to[i][0] - f[0], to[i][1] - f[1])));
      dur = 1500 + Math.min(1200, dist * 2.5);
      state = "flying";
      lastScare = performance.now();
      start = lastScare;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (!tops.length) return;
      const r = host.getBoundingClientRect();
      const pad = r.height * 0.1; // the butterflies sit a little above the letters
      const onName = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - pad && e.clientY <= r.bottom;
      // in the air, only touching a butterfly scares it
      const reach = em * 0.15;
      const half = (flyers.current[0]?.offsetHeight ?? 0) / 2; // pos is the sprite's feet; test from its middle
      const nearFlyer =
        state === "flying" && pos.some(([x, y]) => Math.hypot(e.clientX - (r.left + x), e.clientY - (r.top + y - half)) < reach);
      if (!onName && !nearFlyer) {
        armed = true;
        return;
      }
      // entering the name (or a butterfly) scares them; a short cooldown stops jitter while chasing one
      if (!armed || performance.now() - lastScare < 450) return;
      armed = false;
      takeOff();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      ro.disconnect();
      io.disconnect();
      idleTimers.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // hidden until the first perch is measured, so they never flash in the corner
    <div ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 [--bf-px:2px] md:[--bf-px:3px]">
      {BUTTERFLIES.map((s, i) => (
        <span
          key={i}
          ref={(n) => {
            flyers.current[i] = n;
          }}
          className="pixel-in absolute top-0 left-0 block"
          style={{ ["--in-delay" as string]: `${260 + i * 80}ms` }}
        >
          <svg
            ref={(n) => {
              frames.current[i] = n;
            }}
            data-open="1"
            viewBox="0 0 9 8"
            shapeRendering="crispEdges"
            className="group block h-[calc(8*var(--bf-px))] w-[calc(9*var(--bf-px))]"
          >
            <Sprite rows={OPEN} palette={s.palette} className="group-data-[open=0]:hidden" />
            <Sprite rows={SHUT} palette={s.palette} className="hidden group-data-[open=0]:inline" />
          </svg>
        </span>
      ))}
    </div>
  );
}
