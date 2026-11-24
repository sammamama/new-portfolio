# Meadow — design system

Portfolio of Samridh (Sam) Sharma, design specialist and fullstack generalist.

> **Pixel pastoral.** A quiet paper sky over a pixel landscape, with editorial type floating in between. Pixels are the craft, the serif is the voice, tarn blue is the only accent.

Live reference: `/system` (`src/app/system/page.tsx`). Tokens: `src/app/globals.css`.
Whenever this file changes, update both of those too, and the other way round.

---

## 1. Inspiration

| Source | What we take | What we leave |
|---|---|---|
| Reference painting: flower meadow, blue lake, hills, white sky | Composition (open sky up top, hill rising on the left, lake across the middle, blooms in front), full flower palette, the lake blue | Showing it as a picture. It ships only as the hidden source for the shade-block meadow (`public/meadow/`), never displayed directly. |
| Endex landing by Basit A. Khan (Figma + Framer + Unicorn Studio, x.com/basit_designs/status/2001326221880377397) | Dense glyph/dither textures where brightness drives density; thin editorial serif headlines with tiny mono UI; hairline grid frame | Dark theme, single-hue amber, the fintech tone |
| Pixel-art games and ANSI art | Block clouds, `░ ▒ ▓ █` shading, two-colour cells, crisp un-smoothed pixels | Retro nostalgia, game UI, pixel fonts for reading text |

## 2. Principles

1. **Sky first.** The hero is mostly paper sky. The landscape sits low; the name and role sit centred in the sky.
2. **Two textures, in tension.** Crisp pixel/dither surfaces (meadow, clouds, particle subtitle) against soft editorial type (Instrument Serif *italic*). Never make the text itself pixelated.
3. **A diorama, not a picture.** The hero is built in depth layers (§3), and every layer drifts with the pointer at its own depth.
4. **Two voices in the UI.** Ink for everything, tarn blue for emphasis. No other UI colour. Flower colours live only in the meadow.
5. **Reveal, then return to rest.** Hover makes things react (the lake ripples, flowers spread, the subtitle scatters), and they always spring back. Nothing needs a click; nothing stays broken.
6. **Slow ambient motion.** Clouds drift, the land sways, a shine passes every few seconds. Nothing loops fast, nothing flashes.
7. **Light only.** No dark mode. The paper sky is part of the brand.

## 3. Hero composition

The home hero (`src/components/Hero.tsx`) is the reference for the whole site. Back to front:

| Layer | What | Parallax |
|---|---|---|
| 0 | Paper sky (`paper`), no gradients | — |
| 1 | Two pixel clouds high in the sky (~11% and ~19% down), drifting left → right | — (they drift on their own) |
| 2 | Shade-block meadow canvas, inset in the page gutters, skyline about a third of the way down (§7) | Depth map: near bank up to ~24×9px, far hills less |
| 3 | Name "Samridh Sharma" (§5), centred, nudged up from the middle (`pb-24` / `md:pb-32` on the text container) | 16×6px |
| 3 | Subtitle "Design Specialist \| Fullstack Generalist" as particles (§9) | 10×4px |
| 4 | One pixel cloud riding along the top of the name (its lower half overlaps the letters), passing **in front of** it; it starts from the left edge on load | — |
| top | Nav: name in serif on the left, Work · About · Contact in small mono | — |

The hero holds no other copy: no greeting, no hint labels, no buttons.

## 4. Colour

### UI (ink + tarn)
| Token | Hex | Use |
|---|---|---|
| `paper` | `#FBFBF8` | Page background, the sky |
| `paper-sunk` | `#F3F2EC` | Alternate section ground |
| `line` | `#E4E2DA` | Hairlines, grid frame, dividers |
| `ink` | `#0B0B0C` | **Secondary.** All type, strong rules, icons |
| `ink-soft` | `#4A4A4F` | Body copy, ledes |
| `ink-faint` | `#8B8A86` | Labels, metadata |
| `tarn` | `#1F4FD8` | **Primary.** Links on hover, italic emphasis, focus ring, arrows, selection |
| `tarn-deep` | `#1238B8` | Pressed state, deep water |
| `tarn-bright` | `#4D7CF0` | Ripples, highlights |
| `tarn-mist` | `#DFE7FD` | Pixel clouds, rare tinted fills |

### Illustration only (full colour, never in UI)
`#12261C` deep moss · `#24502F` moss · `#5F7F2A` olive · `#A3B43A` sun-grass · `#F2B705` pollen · `#F2771B` marigold · `#E0531A` ember · `#EC4F8F` bloom · `#F39BC2` blush · `#7F9F5C` far hill · `#B4C486` far haze · `#1238B8` / `#1F4FD8` / `#4D7CF0` water · `#9BBCFF` glint · `#8A7CF0` lilac

**Sky family** (hero only): the pixel clouds use `tarn-mist`, `paper`, and tarn-mist mixed toward `tarn-bright` (18% for the underside, 30% for the outline). No other sky colours; gradients behind the hero were tried and dropped.

Contrast: body text is `ink-soft` or darker on `paper`. Never set text in `ink-faint` smaller than the label size. Never set text in `tarn-bright`.

## 5. Typography

| Role | Face | Size token | Notes |
|---|---|---|---|
| Hero name | Instrument Serif 400 *italic* | `--text-display` clamp(2.75–5.5rem) | "Samridh Sharma" only. `ink`, `leading-none`, `tracking-tight`. Carries the shine (§8) |
| Hero subtitle | Geist Mono 400 | `--text-lede` | Role line only, `ink-soft`, drawn as particles (§9) |
| Display | Instrument Serif 400 | `--text-display` | Section titles, leading ≈ 0.95–1. One word in *italic* |
| Title | Instrument Serif 400 | `--text-title` clamp(1.75–2.75rem) | Project names, pull quotes |
| Lede | Instrument Serif 400 | `--text-lede` clamp(1.25–1.6rem) | Intros |
| Body | Newsreader | 1.125rem / 1.6 | Paragraphs, max ~60ch |
| UI / label | JetBrains Mono | `--text-label` 0.72rem, caps, +0.14em tracking | Nav, buttons, eyebrows `(02) — about`, meta, tech stacks |

- Headlines stay thin and large. No bold serif anywhere (Instrument Serif has one weight; never synthesise bold).
- Italic Instrument Serif is the signature: the hero name, and one italic word in section titles. In running text, emphasis is *italic in tarn*.
- Mono is for small, factual things: the role line, labels, nav, tags.
- **Retired faces, still loaded:** Caveat (`--font-hand`, the old handwritten greeting) and PP Mondwest (`--font-pixel`, `public/fonts/ppmondwest-regular.otf`; its licence says personal use only). Neither is used on the page. Remove them from `layout.tsx` when convenient (roadmap).

## 6. Layout & grid frame

- Max content width 1400px, side gutters 24px on mobile and 40px from `md`.
- **Hairline frame:** 1px `line` vertical rules mark the content edges and run the full page height. Sections are split by full-width 1px rules where they cross. Section headers sit on a 1px `ink` rule.
- 12-column grid inside the frame. Typical splits: label column + content (1fr / 2fr), and the project row (index · title · summary · meta).
- Vertical rhythm: section padding 112px on mobile and 160px on desktop.
- Corners are square. No cards, no shadows, no rounded pills, no background gradients. The one exception is a 2px radius on the focus ring.
- Pixel things snap to whole blocks and render with `image-rendering: pixelated`. Never blur or smooth them.

## 7. The shade-block meadow

### Current (v3): the painting drawn in shade blocks `░ ▒ ▓ █`
Code: `src/components/blocks/` (`source.ts` loads and frames the painting, `engine.ts` is a single WebGL2 fragment pass, `BlockMeadow.tsx` is the React wrapper). Assets: `public/meadow/`, built by `scripts/prep-meadow.py`.
- **Source:** the reference painting. Its watermark is inpainted and its sky made transparent (`meadow.webp`, 1600px). A data map (`depth.png`) stores R = depth (far hills → near bank), G = water mask and B = foreground mask. To change the scene, edit the painting and re-run `python scripts/prep-meadow.py <painting.png> public/meadow <debug-dir>`.
- **Framing:** the canvas sits inside the page gutters (24px / 40px from `md`, with a slightly smaller bottom inset). The painting is width-fit with its skyline at about a third of the way down the hero; the bottom of the painting crops off when needed. On portrait screens the landscape is kept at least about half the hero tall and the sides are cropped.
- **Cells:** 5×9 CSS px (4×7 on mobile). Each cell is drawn like ANSI art: it takes four sub-samples of the painting and gets a **light** and a **dark** ink from them (always with some spread, so flat areas still show texture). The block weight (`░` 25%, `▒` 50%, `▓` 75%, `█`) is the share of light ink needed to match the cell's average colour, with a per-cell dither. The block patterns are drawn per device pixel, so they stay crisp.
- **Sky:** the painting's sky is transparent, so the paper shows through. Cells on the skyline fade their dark ink to paper, which feathers the edge.
- **Motion:** a breeze sways the land (more on the near blooms), the water drifts sideways in bands, and sun glints on the lake twinkle in `tarn-bright`. On load, cells build up from a light stipple to full blocks (~1.5s).
- **Interaction:** hover only, kept deliberately small.
  - Moving over the lake sends out flattened ripple rings whose crests light up in `tarn-bright`.
  - Hovering over flowers (saturated warm or pink paint under the cursor) makes them spread: a soft lens swells the blooms outward around the cursor (about 110px, 70px on mobile) with a little per-cell scatter, and eases back when the cursor leaves them. Nothing else reacts to the cursor.
  - Depth drives a gentle parallax shift toward the pointer.
- **Performance:** one full-screen triangle, five texture reads per pixel (the painting is mipmapped so each read averages about a quarter cell). DPR capped at 2, paused off-screen (IntersectionObserver). Without WebGL2 the sky simply stays empty.
- **Reduced motion:** render one static frame with no listeners.

## 8. Motion

| What | How |
|---|---|
| Pointer parallax | Eased lerp (0.05 per frame) toward a target set by the pointer position; returns to centre when the pointer leaves the window. Nearer layers move more (meadow near bank > name > subtitle > far hills) |
| Hover reactions | Spring physics or eased strength (opens at ~0.12 per frame, closes at ~0.06): ripples, flower spread, particle scatter |
| Clouds | `.cloud-drift`: linear, left → right, 95–150s per crossing, staggered with negative delays, loop forever |
| Shine | `.shine` on the hero name: a thin, slanted `paper` line sweeps left → right (~4s), then rests (~2s), on a 6s cycle. It covers the middle 60% of the line height: 65% opacity in its top half, fading to 0 over its bottom half. Built as a masked `::after` copy of the text (needs `data-text`) |
| Meadow intro | Cells build from a light stipple to full blocks over ~1.5s |
| Links | Underlines grow from the left (0.35s) and turn ink → tarn. The `~>` arrow nudges 6px right |
| Page reveals | Soft and short (≤ 500ms). No blur-in cascades |

- Everything respects `prefers-reduced-motion`: the meadow renders one still frame, clouds stand still, the shine is hidden, parallax is off, and the subtitle is plain text.
- Canvases and WebGL pause when off-screen. Particle and hover loops stop when everything is at rest.

## 9. Components

- **Nav:** name on the left in serif; Work · About · Contact on the right in small mono.
- **Parallax layer** (`src/components/ParallaxLayer.tsx`): wraps any element so it drifts against the pointer by `x` × `y` px. Use it for anything floating over the meadow.
- **Particle text** (`src/components/ParticleText.tsx`): a line of text drawn as ink particles, one per device pixel, in `ink-soft`. The cursor scatters them within about 70px and they spring back. The real text stays in the DOM (transparent) for screen readers and selection. Under reduced motion it is plain text. Use it for one short line per page at most.
- **Pixel cloud** (`src/components/PixelCloud.tsx`): procedural pixel-art cumulus, one canvas pixel per block (`--cloud-px`: 4px on mobile, 5–6px from `md`). `tarn-mist` body, ▒ paper/mist dithered top, deeper mist underside, mist outline. Puffs always stay inside the canvas, so the ends are rounded. Pair it with `.cloud-drift` (`--dur`, `--delay`, `--rest`).
- **Label:** `(NN) — name`, mono caps, `ink-faint`.
- **Link:** text with a growing underline that turns tarn on hover. External links end with `↗`.
- **Button:** small mono label inside a 1px ink hairline box, square corners. Hover fills ink and turns the text paper. The primary variant uses a tarn hairline.
- **Project row:** index · title (serif, turns tarn on hover) · summary · stack (mono, at most 3) · `~>`.
- **Section header:** display title with one italic word, plus a count label on the right, on a 1px ink rule.
- **Pixel ornaments:** short `░▒▓` runs or `~ ~~ ~` mono wave lines in tarn as section dividers, used sparingly. They echo the meadow and never carry meaning.

## 10. Voice

Calm, warm and personal, close to lowercase. Short sentences that are a little poetic but always concrete.
- Yes: "calm, carefully built things for the web" and "I care most about the part people touch: *how it feels*."
- No: buzzwords ("synergy", "cutting-edge"), exclamation marks, inflated claims.
- Write about projects in terms of what they do for people first, then the stack.
- The hero is the exception: just the name and the role line, nothing else.

## 11. Roadmap

1. Carry the hero style down the page: pixel ornaments between sections, italic-serif section titles, the hairline grid frame and the mono UI pass.
2. Remove the retired fonts (Caveat, PP Mondwest) and their tokens.
3. Tune the meadow and clouds on real devices (frame rate, cell size, cloud size).
4. Case-study pages at `/work/[slug]` covering problem, process, visuals and outcome, in the same paper + pixel language.
5. Add a public email to the contact section.
6. Fix the dev-server CSS caching (try `@tailwindcss/postcss` instead of the custom `@tailwindcss/turbopack` loader).

## Appendix: retired meadow versions

v2 (particles) was removed. v1 (`src/components/meadow3d/`, ASCII shader pass) and v0 (`src/components/ascii/`, procedural ASCII canvas) are no longer used by the hero. `ascii/scene.ts` still exports the illustration `PALETTE` shown on `/system`.
