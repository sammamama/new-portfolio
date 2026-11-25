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
2. **Two textures, in tension.** Crisp pixel/dither surfaces (meadow, clouds, particle subtitle) against soft editorial type (Instrument Serif *italic*). Never make the text itself pixelated. One exception: the work menu is a game UI, so its menu lines, labels and project titles use PP Mondwest (descriptions stay in the body serif).
3. **A diorama, not a picture.** The hero is built in depth layers (§3), and every layer drifts with the pointer at its own depth.
4. **Two voices in the UI.** Ink for everything, tarn blue for emphasis. No other UI colour. Flower colours live only in the meadow, with one exception: the pink hero butterfly (§9).
5. **Reveal, then return to rest.** Hover makes things react (the lake ripples, the butterflies move to new letters, the subtitle scatters), and they always spring back. Nothing needs a click; nothing stays broken.
6. **Slow ambient motion.** Clouds drift, the land sways, a shine passes every few seconds. Nothing loops fast, nothing flashes.
7. **Light only.** No dark mode. The paper sky is part of the brand.

## 3. Hero composition

The home hero (`src/components/Hero.tsx`) is the reference for the whole site. Back to front:

| Layer | What | Parallax |
|---|---|---|
| 0 | Paper sky (`paper`), no gradients | — |
| 1 | Four pixel clouds high in the sky (6%, 11%, 15% and 19% down), drifting left → right; two are small and read as farther away | — (they drift on their own) |
| 2 | Shade-block meadow canvas, inset in the page gutters, skyline about a third of the way down (§7) | Depth map: near bank up to ~24×9px, far hills less |
| 3 | Name "Samridh Sharma" (§5), centred, nudged up from the middle (`pb-24` / `md:pb-32` on the text container) | 16×6px |
| 3 | Subtitle "Design Specialist \| Fullstack Generalist" as particles (§9) | 10×4px |
| 3 | Two pixel butterflies (§9) perched side by side on neighbouring letters of the name | moves with the name |
| 4 | One pixel cloud riding just above the name, clear of the letters and the butterflies; it starts from the left edge on load | — |
| top | Pixel loader (§9) covering the hero until it is ready | — |
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

**Butterflies** (hero name only): one in `tarn-deep` / `tarn` / `tarn-mist`, one in `bloom` / `blush` / `paper`, both with `ink` bodies. This is the only place flower colours leave the meadow.

Contrast: body text is `ink-soft` or darker on `paper`. Never set text in `ink-faint` smaller than the label size. Never set text in `tarn-bright`.

## 5. Typography

| Role | Face | Size token | Notes |
|---|---|---|---|
| Hero name | Instrument Serif 400 *italic* | `--text-display` clamp(2.25–5.5rem) | "Samridh Sharma" only. `ink`, `leading-none`, `tracking-tight`. Carries the shine (§8) |
| Hero subtitle | Geist Mono 400 | `--text-lede` | Role line only, `ink-soft`, drawn as particles (§9) |
| Display | Instrument Serif 400 | `--text-display` | Section titles, leading ≈ 0.95–1. One word in *italic* |
| Title | Instrument Serif 400 | `--text-title` clamp(1.375–2.75rem) | Project names, pull quotes |
| Lede | Instrument Serif 400 | `--text-lede` clamp(1–1.6rem) | Intros |
| Body | Newsreader | 1rem on phones, 1.125rem from `md` / 1.6 | Paragraphs, max ~60ch |
| UI / label | JetBrains Mono | `--text-label` 0.72rem, caps, +0.14em tracking | Nav, buttons, eyebrows `(02) — about`, meta, tech stacks |

- **Phones get a smaller step.** The fluid tokens have lower floors, and every fixed size has a mobile step with the desktop size from `md` (e.g. body 1rem → 1.125rem, About copy `text-sm` → `text-base`, menu lines `text-lg` → `text-2xl`). Desktop sizes never change for mobile's sake.
- Headlines stay thin and large. No bold serif anywhere (Instrument Serif has one weight; never synthesise bold).
- Italic Instrument Serif is the signature: the hero name, and one italic word in section titles. In running text, emphasis is *italic in tarn*.
- Mono is for small, factual things: the role line, labels, nav, tags.
- **Game UI face:** PP Mondwest (`--font-pixel`, `public/fonts/ppmondwest-regular.otf`), uppercase, only inside the work menu. Its licence says personal use only.
- **Retired face, still loaded:** Caveat (`--font-hand`, the old handwritten greeting). Not used on the page. Remove it from `layout.tsx` when convenient (roadmap).

## 6. Layout & grid frame

- Max content width 1400px, side gutters 24px on mobile and 40px from `md`.
- **Hairline frame:** 1px `line` vertical rules mark the content edges and run the full page height. Sections are split by full-width 1px rules where they cross. Section headers sit on a 1px `ink` rule.
- 12-column grid inside the frame. Typical splits: label column + content (1fr / 2fr), and the project row (index · title · summary · meta).
- Vertical rhythm: each section pads only its top (112px on mobile, 160px on desktop), so every gap between sections is one step, never doubled. The footer follows the same top step and closes the page with the gutter inset (24px, 40px from `md`) below its scene.
- Corners are square. No cards, no shadows, no rounded pills, no background gradients. The one exception is a 2px radius on the focus ring.
- Pixel things snap to whole blocks and render with `image-rendering: pixelated`. Never blur or smooth them.

## 7. The shade-block meadow

### Current (v3): the painting drawn in shade blocks `░ ▒ ▓ █`
Code: `src/components/blocks/` (`source.ts` loads and frames the painting, `engine.ts` is a single WebGL2 fragment pass, `BlockMeadow.tsx` is the React wrapper). Assets: `public/meadow/`, built by `scripts/prep-meadow.py`.
- **Source:** the reference painting. Its watermark is inpainted, its sky made transparent and its colour pre-blended over paper (`meadow.v2.webp`, 1600px; alpha kept). A data map (`depth.png`) stores R = depth (far hills → near bank), G = water mask and B = foreground mask. To change the scene, edit the painting and re-run `python scripts/prep-meadow.py <painting.png> public/meadow <debug-dir>`.
- **Framing:** on phones the canvas runs edge to edge (no side or bottom inset); from `md` it sits inside the page gutters (40px, with a slightly smaller bottom inset). The painting is width-fit with its skyline at about a third of the way down the hero; the bottom of the painting crops off when needed. On portrait screens the landscape is kept at least about half the hero tall and the sides are cropped.
- **Cells:** 5×9 CSS px (4×7 on mobile). Each cell is drawn like ANSI art: it takes four sub-samples of the painting and gets a **light** and a **dark** ink from them (always with some spread, so flat areas still show texture). The block weight (`░` 25%, `▒` 50%, `▓` 75%, `█`) is the share of light ink needed to match the cell's average colour, with a per-cell dither. The block patterns are drawn per device pixel, so they stay crisp.
- **Sky:** the painting's sky is transparent, so the paper shows through. Cells on the skyline fade their dark ink to paper, which feathers the edge.
- **Motion:** a breeze sways the land (more on the near blooms), the water drifts sideways in bands, and sun glints on the lake twinkle in `tarn-bright`. Cells build up from a light stipple to full blocks in ~1s, starting when the hero name is a quarter through its own build-in (150ms in). Nothing is drawn before that.
- **Interaction:** hover only, kept deliberately small.
  - Moving over the lake sends out flattened ripple rings whose crests light up in `tarn-bright`.
  - The flowers don't react to the cursor (the old flower-spread lens was removed). Only the lake does.
  - Depth drives a gentle parallax shift toward the pointer.
- **Loading:** the painting and data map are preloaded from the page head (`ReactDOM.preload`), served from `/meadow/*` with a one-year immutable cache (version them by name or query when they change), decoded off the main thread to a straight-alpha `ImageBitmap` and uploaded as is. Only the data map is read on the CPU (lake hit tests). The engine ships with the page, not as a lazy chunk.
- **Performance:** one full-screen triangle, five texture reads per pixel (the painting is mipmapped so each read averages about a quarter cell). DPR capped at 2, paused off-screen (IntersectionObserver). Without WebGL2 the sky simply stays empty.
- **Reduced motion:** render one static frame with no listeners.

## 8. Motion

| What | How |
|---|---|
| Pointer parallax | Eased lerp (0.05 per frame) toward a target set by the pointer position; returns to centre when the pointer leaves the window. Nearer layers move more (meadow near bank > name > subtitle > far hills) |
| Hover reactions | Spring physics or eased strength (opens at ~0.12 per frame, closes at ~0.06): ripples, particle scatter |
| Menu cursor | `.cursor-blink`: the work menu's pixel ▶ blinks with hard steps (1.1s); still under reduced motion |
| Clouds | `.cloud-drift`: linear, left → right, loop forever. All five hero clouds share one 160s period and sit a fifth of a period apart (delays 0, −32, −64, −96, −128s), so they stay evenly spread and never bunch up on one side; neighbours fly at different heights. Keep the shared period when adding clouds |
| Loader | `.pixel-loader-cell`: ten tarn cells pulse empty → ░ → ▒ → ▓ → █ and back (1.2s, hard steps) in a wave. It only shows on a first visit (assets not cached yet): after one full load a localStorage flag is set, and a script in `<head>` marks later loads `data-hero-cached` before first paint, which hides it. No minimum hold: the moment the painting and fonts are in, it dissolves █ → ▓ → ▒ → ░ (0.4s) while the hero builds in underneath. It gives up after 6s |
| Hero build-in | `.pixel-in`: every load, with no waiting. Cached: starts at first paint in pure CSS (`[data-hero-cached]`), before any JS. First visit: starts the instant the loader begins to dissolve (`[data-revealed]`). Each layer steps empty → ░ → ▒ → ▓ → █ (0.6s, hard steps), staggered with `--in-delay`: name 0, clouds 60–180ms, subtitle 120ms, nav 200ms, butterflies 260ms+. The meadow plays its own stipple intro as soon as it is ready |
| Butterflies | Wings flap every 70ms in flight; at rest a slow close every few seconds. Eased bezier flights (1.5–2.7s) with a sideways flutter |
| Shine | `.shine` on the hero name: a thin, slanted `paper` line sweeps left → right (~4s), then rests (~2s), on a 6s cycle. It covers the middle 60% of the line height: 65% opacity in its top half, fading to 0 over its bottom half. Built as a masked `::after` copy of the text (needs `data-text`) |
| Meadow intro | Cells build from a light stipple to full blocks over ~1s, starting 150ms into the name's build-in |
| Links | Underlines grow from the left (0.35s) and turn ink → tarn. The `~>` arrow nudges 6px right |
| Page reveals | Soft and short (≤ 500ms). No blur-in cascades |

- Everything respects `prefers-reduced-motion`: the meadow renders one still frame, clouds stand still, the shine is hidden, parallax is off, the subtitle is plain text, the butterflies sit still, the loader holds at ▒ and the hero appears without the build-in.
- Canvases and WebGL pause when off-screen. Particle and hover loops stop when everything is at rest.

## 9. Components

- **Nav:** name on the left in serif; Work · About · Contact on the right in small mono.
- **Parallax layer** (`src/components/ParallaxLayer.tsx`): wraps any element so it drifts against the pointer by `x` × `y` px. Use it for anything floating over the meadow.
- **Particle text** (`src/components/ParticleText.tsx`): a line of text drawn as ink particles, one per device pixel, in `ink-soft`. The cursor scatters them within about 70px and they spring back. The real text stays in the DOM (transparent) for screen readers and selection. Under reduced motion it is plain text. Use it for one short line per page at most.
- **Pixel cloud** (`src/components/PixelCloud.tsx`): procedural pixel-art cumulus, one canvas pixel per block (`--cloud-px`: 4px on mobile, 5–6px from `md`). `tarn-mist` body, ▒ paper/mist dithered top, deeper mist underside, mist outline. Puffs always stay inside the canvas, so the ends are rounded. Pair it with `.cloud-drift` (`--dur`, `--delay`, `--rest`).
- **Pixel butterflies** (`src/components/PixelButterflies.tsx`): two 9×8 pixel sprites (2px pixels on mobile, 3px from `md`), colours in §4, perched side by side on two neighbouring letters of the hero name (they start on the "S" and "a" of Samridh). Perches come from the real glyph tops (canvas `measureText` + DOM ranges), so they sit on the ink. Pointer onto the name (or within ~0.15em of a flying butterfly) and they take off along two different curved, fluttering paths to the same new random pair of letters, more than one letter away. If it happens mid-flight they change course from where they are. They never open anything and never leave the name.
- **Pixel loader** (`src/components/HeroLoader.tsx`, `heroReveal.ts`): a paper overlay on the hero with a row of ten meadow cells (10×18px, twice the meadow's 5×9) in `tarn` and the label "loading the meadow". First visit only: it covers the hero until the meadow painting and the fonts are in, then dissolves while `data-revealed` starts the build-in and the meadow intro, and stores `meadow-seen-v1` in localStorage. Later loads are marked `data-hero-cached` on `<html>` by a head script in `layout.tsx` before first paint: no loader, the build-in runs from first paint, and the meadow intro plays as soon as it is ready. Bump the key's version when the meadow assets change.
- **Shade masks** (`--shade-0` … `--shade-4` in `globals.css`): the meadow's ░ ▒ ▓ █ dot patterns as 4×4 mask tiles at 2px per dot. A mask clips to its box, so put `.pixel-in` on a wrapper that holds everything the layer draws.
- **Label:** `(NN) — name`, mono caps, `ink-faint`.
- **Link:** text with a growing underline that turns tarn on hover. External links end with `↗`.
- **Button:** small mono label inside a 1px ink hairline box, square corners. Hover fills ink and turns the text paper. The primary variant uses a tarn hairline.
- **Work menu** (`src/components/Work.tsx`, `WorkMenu.tsx`): the work section is an 80s game select screen, and the first section after the hero. The section runs full width with the hero meadow's side inset (24px, 40px from `md`), and the whole menu fits within 90vh on desktop (the screenshot is capped at 30vh tall). One `.pixel-frame` box in `tarn-deep` (Sega blue): inverted title bar (`DitherFill`: a static 4px Bayer-dithered `tarn-deep` → `tarn` gradient instead of a flat fill, the footer bar mirrored) (`SELECT A PROJECT`, `NN/NN` counter), a 4px `tarn-deep` rule between the menu and the preview, and an inverted footer (`↑↓ CHOOSE`, a blinking `PRESS VISIT TO START`). Menu: one line per project in PP Mondwest, uppercase: pixel ▶ cursor (2px pixels, `.cursor-blink`), number, name, dotted leader, kind. The selected line is a dithered highlight bar (`DitherFill`, `tarn` → `tarn-deep`) with `paper` text. Hover, focus, click, tap or ↑ ↓ / Home / End move the cursor; the menu never opens a link. Preview: screenshot in a `.pixel-frame` (pixel reveal, resolves ~220ms after selection), kind (Mondwest, tarn), title (Mondwest, `--text-title`), summary (body serif), stack (mono), then `VISIT ↗` / `CODE ↗` pixel-frame buttons that invert to tarn on hover; only these open links. On phones (below `md`) the menu is an accordion, like a game submenu: there is no side preview; tapping a line opens its screenshot, summary, stack and buttons right below it and closes the others, keeping the tapped line where it was on screen. On phones only a tap changes the open line (not focus). Order is hand-picked in `content.ts` (roughly by weight: product first, play last).
- **Pixel frame** (`.pixel-frame` in `globals.css`): a chunky 8-bit border with notched corners, drawn as four hard box-shadows outside the box (`--px`, default 4px; `--frame`, default `tarn-deep`, Sega blue). Leave `--px` of margin around it. Use it only inside the work menu's game UI.
- **Pixel reveal** (`src/components/PixelReveal.tsx`): project screenshots rest as shade blocks (6×10px cells, two inks per cell, same technique as the meadow). On hover or keyboard focus they resolve to the real image in ~350ms: stepped pixel blocks (8 → 2px), then a short fade. They pixelate again on leave. On touch screens a tile resolves while it is at least 60% in view. Under reduced motion it switches instantly. Screenshots never show sharp before their blocks are ready.
- **About section** (`src/components/About.tsx`): sits after the work section, full width with the hero meadow's side inset (24px, 40px from `md`). Left: a square pixel scene (`PixelScene scene="sunset"`) of the sun setting into a wide saddle in the Himalayas, with "About" in Instrument Serif italic (`--text-display`, `paper`) set in its sky. Layered ranges with sunlit snow caps, a dithered `tarn-deep` → lilac → blush → marigold → ember sky, valley mist drifting, two small ink birds. Right: a `--text-title` italic serif title, the description in Geist Mono, all `ink` with no tarn emphasis (an exception to the usual body serif, asked for by Sam), and the Skills grid pinned to the bottom so it lines up with the square's bottom edge (from `xl`; stacked below). Skills come from `content.ts` in Geist Mono, in a hairline grid (4 columns, 2 on small screens), each with a 16px simple-icons logo (`public/skills/`, CC0) used as a CSS mask filled with `ink`.
- **Footer** (`src/components/Footer.tsx`): the page ends at night. A wide pixel scene (`PixelScene scene="night"`, about 0.4 of its width tall, 1.1 on mobile) inside the page gutters: a near-black → `tarn-deep` sky full of stars (paper, mist and glint, a few bright crosses, a faint lilac milky-way band, twinkling, a shooting star every ~12s), three dark mountain ranges with faint snow, and one warm pollen window on the near ridge. It also serves as the contact section (`id="contact"`): "Let's make something useful." in Instrument Serif (`--text-display`) and the social links (and the email, once there is one) sit low over the dark ridges in `paper`. Links hover to `tarn-mist` there, since tarn would sink into the night.
- **Pixel scene** (`src/components/PixelScene.tsx`, scenes in `pixelScenes.ts`): one canvas pixel per block (6px, 4px under 420px wide), snapped to whole blocks and scaled with `image-rendering: pixelated`. Illustration colours only, gradients as ordered (Bayer) dither. Motion is stepped at ~8fps, paused off-screen, one still frame under reduced motion. Add new scenes to `pixelScenes.ts`.
- **Section header:** display title with one italic word, plus a count label on the right, on a 1px ink rule.
- **Pixel ornaments:** short `░▒▓` runs or `~ ~~ ~` mono wave lines in tarn as section dividers, used sparingly. They echo the meadow and never carry meaning.

## 10. Voice

Calm, warm and personal, close to lowercase. Short sentences that are a little poetic but always concrete.
- Yes: "calm, carefully built things for the web" and "I care most about the part people touch: *how it feels*."
- No: buzzwords ("synergy", "cutting-edge"), exclamation marks, inflated claims.
- Write about projects in terms of what they do for people first, then the stack.
- The hero is the exception: just the name and the role line, nothing else.

## 11. Roadmap

1. Carry the hero style down the page: pixel ornaments between sections, italic-serif section titles, the hairline grid frame and the mono UI pass. (The work section is done as the work menu; the about section has its pixel lake but still uses placeholder copy.)
2. Remove the retired font (Caveat) and its token.
3. Tune the meadow and clouds on real devices (frame rate, cell size, cloud size).
4. Case-study pages at `/work/[slug]` covering problem, process, visuals and outcome, in the same paper + pixel language.
5. Add a public email to the contact section.
6. Fix the dev-server CSS caching (try `@tailwindcss/postcss` instead of the custom `@tailwindcss/turbopack` loader).

## Appendix: retired meadow versions

v2 (particles) was removed. v1 (`src/components/meadow3d/`, ASCII shader pass) and v0 (`src/components/ascii/`, procedural ASCII canvas) are no longer used by the hero. `ascii/scene.ts` still exports the illustration `PALETTE` shown on `/system`.
