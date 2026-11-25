"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Project, kindLabel } from "@/lib/content";
import DitherFill from "./DitherFill";
import PixelReveal from "./PixelReveal";

/** the blinking ▶ menu cursor, drawn as pixels (2px each) */
function Cursor({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 4 7"
      shapeRendering="crispEdges"
      className={`h-[14px] w-[8px] shrink-0 fill-current ${on ? "cursor-blink" : "invisible"}`}
    >
      {[1, 2, 3, 4, 3, 2, 1].map((w, y) => (
        <rect key={y} x={0} y={y} width={w} height={1} />
      ))}
    </svg>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

// the bars are dithered pixel gradients rather than flat blue (title: deep → tarn, footer: tarn → deep)
const TITLE_DITHER = ["--tarn-deep", "--tarn-deep", "--tarn"];
const FOOT_DITHER = ["--tarn", "--tarn-deep", "--tarn-deep"];
const SELECT_DITHER = ["--tarn", "--tarn", "--tarn-deep"];

/** the selected project's links: pixel-frame buttons that invert to tarn; the only things that leave the page */
function Links({ p }: { p: Project }) {
  return (
    <div className="mt-5 flex gap-5 px-1">
      {[
        ["Visit", p.live],
        ["Code", p.code],
      ].map(([label, href]) =>
        href ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-frame px-4 py-1.5 font-pixel text-lg uppercase transition-colors duration-100 hover:bg-tarn hover:text-paper focus-visible:bg-tarn focus-visible:text-paper focus-visible:outline-none"
          >
            {label} ↗
          </a>
        ) : null,
      )}
    </div>
  );
}

/**
 * The work section as an 80s game select screen: chunky pixel frames, inverted title bars, a menu in
 * PP Mondwest with a blinking pixel ▶ cursor, and a preview of the selected project (its screenshot
 * loads as shade blocks, then resolves). Hover, click, tap or ↑ ↓ move the cursor; the menu never
 * leaves the page. Only the preview's VISIT / CODE buttons open links.
 */
export default function WorkMenu({ projects }: { projects: Project[] }) {
  const [sel, setSel] = useState(0);
  const [loaded, setLoaded] = useState(-1); // the selected screenshot resolves after a short "load"
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  // phone: the line you tap stays under your finger while the open line above it collapses
  const anchor = useRef<{ i: number; top: number } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(sel), 220);
    return () => window.clearTimeout(t);
  }, [sel]);

  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = null;
    const el = a && items.current[a.i];
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - a.top);
  }, [sel]);

  const move = (i: number) => {
    const n = (i + projects.length) % projects.length;
    setSel(n);
    items.current[n]?.focus();
  };

  const p = projects[sel];

  return (
    // margin leaves room for the frame, which is drawn outside the box
    <div className="pixel-frame mx-1 mt-16 bg-paper">
      {/* title bar */}
      <div className="relative isolate flex items-center justify-between overflow-hidden bg-tarn-deep px-4 py-2.5 font-pixel text-base text-paper uppercase md:px-6 md:text-lg">
        <DitherFill stops={TITLE_DITHER} />
        <span>Select a project</span>
        <span className="tabular-nums">
          {pad(sel + 1)}/{pad(projects.length)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* the menu */}
        <ul
          aria-label="Projects"
          className="border-tarn-deep py-4 [overflow-anchor:none] md:border-r-4 md:py-5"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") move(sel + 1);
            else if (e.key === "ArrowUp") move(sel - 1);
            else if (e.key === "Home") move(0);
            else if (e.key === "End") move(projects.length - 1);
            else return;
            e.preventDefault();
          }}
        >
          {projects.map((q, i) => {
            const on = i === sel;
            return (
              <li key={q.title}>
                <button
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  type="button"
                  aria-pressed={on}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setSel(i)}
                  // phone: only a tap changes the open line (focus would fire before the tap lands)
                  onFocus={() => window.matchMedia("(min-width: 768px)").matches && setSel(i)}
                  onClick={(e) => {
                    if (i === sel) return;
                    anchor.current = { i, top: e.currentTarget.getBoundingClientRect().top };
                    setSel(i);
                  }}
                  className={`relative isolate grid w-full grid-cols-[8px_auto_minmax(0,1fr)] items-baseline overflow-hidden gap-x-3 px-4 py-2 text-left font-pixel text-lg uppercase outline-none md:px-6 md:text-2xl ${
                    on ? "bg-tarn text-paper" : "text-ink"
                  }`}
                >
                  {on && <DitherFill stops={SELECT_DITHER} />}
                  <Cursor on={on} />
                  <span className={`shrink-0 ${on ? "" : "text-ink-faint"}`}>{pad(i + 1)}</span>
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="min-w-0 truncate">{q.title}</span>
                    <span aria-hidden="true" className="h-0 min-w-4 flex-1 border-b-2 border-dotted border-current opacity-50" />
                    <span className={`shrink-0 text-sm md:text-lg ${on ? "" : "text-ink-faint"}`}>
                      {kindLabel[q.kind]}
                    </span>
                  </span>
                  {q.caption && (
                    <span
                      className={`col-start-3 mt-1 max-w-[44ch] font-serif text-xs leading-snug normal-case md:text-sm ${
                        on ? "text-paper" : "text-ink-soft"
                      }`}
                    >
                      {q.caption}
                    </span>
                  )}
                </button>
                {/* phone: the open line's details unfold right below it, like a game submenu */}
                {on && (
                  <div className="px-4 pt-4 pb-6 md:hidden">
                    <div className="pixel-frame relative mx-1 aspect-[2.2/1] overflow-hidden">
                      <PixelReveal src={q.image} alt={`${q.title} screenshot`} sizes="100vw" active={loaded === i} />
                    </div>
                    <p className="mt-5 text-ink-soft">{q.summary}</p>
                    <p className="mt-3 font-mono text-xs text-ink-faint">{q.stack.slice(0, 3).join(" · ")}</p>
                    <Links p={q} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* the preview */}
        <div className="hidden p-8 md:block">
          <div className="pixel-frame relative mx-1 aspect-[2.2/1] overflow-hidden md:max-w-[calc(30vh*2.2)]">
            {projects.map((q, i) => (
              <div key={q.title} className={i === sel ? "" : "invisible"}>
                <PixelReveal
                  src={q.image}
                  alt={i === sel ? `${q.title} screenshot` : ""}
                  sizes="(min-width: 768px) 55vw, 100vw"
                  active={i === sel && loaded === sel}
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <span className="font-pixel text-base text-tarn uppercase md:text-lg">{kindLabel[p.kind]}</span>
            <h3 className="mt-1 font-pixel text-[length:var(--text-title)] leading-tight uppercase">{p.title}</h3>
            <p className="mt-3 max-w-[52ch] text-sm text-ink-soft md:text-base">{p.summary}</p>
            <p className="mt-3 font-mono text-xs text-ink-faint">{p.stack.slice(0, 3).join(" · ")}</p>
            <Links p={p} />
          </div>
        </div>
      </div>

      {/* controls hint */}
      <div className="relative isolate hidden justify-between overflow-hidden bg-tarn-deep px-6 py-2 font-pixel text-base text-paper uppercase md:flex">
        <DitherFill stops={FOOT_DITHER} />
        <span>↑ ↓ choose</span>
        <span className="cursor-blink">Press visit to start</span>
      </div>
    </div>
  );
}
