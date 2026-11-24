import type { Metadata } from "next";
import { PALETTE } from "@/components/ascii/scene";

export const metadata: Metadata = { title: "Meadow — design system" };

const core = [
  ["paper", "var(--paper)", "#FBFBF8", "Page background, the empty sky"],
  ["paper-sunk", "var(--paper-sunk)", "#F3F2EC", "Alternate section ground"],
  ["line", "var(--line)", "#E4E2DA", "Hairlines, dividers"],
  ["ink", "var(--ink)", "#0B0B0C", "Secondary — all type, rules, UI"],
  ["ink-soft", "var(--ink-soft)", "#4A4A4F", "Body copy, ledes"],
  ["ink-faint", "var(--ink-faint)", "#8B8A86", "Labels, meta"],
  ["tarn", "var(--tarn)", "#1F4FD8", "Primary — links, emphasis, focus"],
  ["tarn-deep", "var(--tarn-deep)", "#1238B8", "Pressed / deep water"],
  ["tarn-bright", "var(--tarn-bright)", "#4D7CF0", "Ripples, highlights"],
  ["tarn-mist", "var(--tarn-mist)", "#DFE7FD", "Tinted fills (sparingly)"],
];

const type = [
  ["Hero name", "font-display italic tracking-tight", "var(--text-display)", "Samridh Sharma", "Instrument Serif italic — the hero name, with the shine."],
  ["Hero subtitle", "font-geist-mono", "var(--text-lede)", "Design Specialist | Fullstack Generalist", "Geist Mono — the role line, drawn as particles."],
  ["Display", "font-display", "var(--text-display)", "Selected work", "Instrument Serif — section titles."],
  ["Title", "font-display", "var(--text-title)", "Adore You", "Instrument Serif — project names, pull quotes."],
  ["Lede", "font-display", "var(--text-lede)", "Calm, carefully built things.", "Instrument Serif — intros."],
  ["Body", "font-serif", "1.125rem", "I build web apps end to end.", "Newsreader — paragraphs."],
  ["Label", "label", "var(--text-label)", "(01) — work", "JetBrains Mono, caps, tracked — eyebrows & meta."],
];

export default function System() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16 md:px-10">
      <span className="label">Meadow · v0.4</span>
      <h1 className="mt-4 font-display text-[length:var(--text-display)] leading-none">
        Design <em className="text-tarn">system</em>
      </h1>
      <p className="mt-6 max-w-[60ch] text-ink-soft">
        Quiet paper, black ink, one lake-blue voice. Colour belongs to the shade-block meadow; the interface itself stays
        monochrome plus tarn. Lots of empty sky.
      </p>

      <h2 className="mt-20 border-b border-ink pb-3 font-display text-3xl">Colour</h2>
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {core.map(([name, v, hex, use]) => (
          <div key={name}>
            <div className="h-20 rounded-sm border border-line" style={{ background: v }} />
            <p className="mt-2 font-mono text-sm">{name}</p>
            <p className="font-mono text-xs text-ink-faint">{hex}</p>
            <p className="mt-1 text-sm text-ink-soft">{use}</p>
          </div>
        ))}
      </div>

      <h3 className="label mt-12">Illustration palette — meadow blocks only, never UI</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {PALETTE.map((c) => (
          <span key={c} className="font-mono text-2xl leading-none" style={{ color: c }} title={c}>
            @
          </span>
        ))}
      </div>

      <h2 className="mt-20 border-b border-ink pb-3 font-display text-3xl">Type</h2>
      <div className="divide-y divide-line">
        {type.map(([name, cls, size, sample, note]) => (
          <div key={name} className="grid gap-2 py-8 md:grid-cols-[10rem_1fr] md:items-baseline">
            <div>
              <p className="label">{name}</p>
              <p className="mt-1 text-sm text-ink-faint">{note}</p>
            </div>
            <p className={`${cls} leading-none`} style={{ fontSize: size }}>
              {sample}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-20 border-b border-ink pb-3 font-display text-3xl">Elements</h2>
      <div className="mt-8 flex flex-wrap items-center gap-10 text-xl">
        <a className="link" href="#">
          Text link
        </a>
        <span className="font-mono text-tarn">~&gt; arrow glyph</span>
        <em className="font-display text-3xl text-tarn">italic emphasis</em>
        <span className="label">(04) — label</span>
      </div>

      <h2 className="mt-20 border-b border-ink pb-3 font-display text-3xl">Rules</h2>
      <ul className="mt-6 max-w-[70ch] list-disc space-y-2 pl-5 text-ink-soft">
        <li>Pixel pastoral: a paper sky over a pixel meadow, with editorial type floating in between.</li>
        <li>Pixels are for surfaces (meadow, clouds, ornaments, particles), never for reading text.</li>
        <li>Tarn is the only accent in UI — links, italic emphasis, focus, hover states.</li>
        <li>Flower colours (marigold, pollen, bloom, moss) stay inside the meadow; tarn-mist clouds stay in the sky.</li>
        <li>The hero is a diorama: clouds, meadow, name, subtitle and one front cloud, each drifting at its own depth.</li>
        <li>
          The meadow is the reference painting drawn in shade blocks{" "}
          <span className="font-mono text-ink">░ ▒ ▓ █</span>. Hovering the lake makes it ripple, hovering the flowers
          makes them spread, and the role line scatters into particles. Everything springs back.
        </li>
        <li>Instrument Serif has one weight: no bold serif. Italic is the signature.</li>
        <li>Motion is slow and springy; all of it switches off under reduced-motion.</li>
      </ul>
    </main>
  );
}
