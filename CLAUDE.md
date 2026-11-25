@AGENTS.md

# new-portfolio

Personal portfolio for Samridh (Sam) Sharma: design specialist and fullstack generalist. Built with Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind v4 and npm. It deploys to **Vercel**.

Design direction: **pixel pastoral**. A paper sky over a shade-block pixel meadow, with editorial type (Instrument Serif italic + Geist Mono) floating in between, and tarn blue as the only UI accent. The hero is the reference for everything else. Full spec in `DESIGN.md`.

## Commands

```bash
npm run dev -- -p 3417   # port 3000 is taken on this machine
npm run build
npm run lint
npx tsc --noEmit
```

**Dev-server gotcha:** edits to `globals.css` often don't show up (stale CSS from the custom `@tailwindcss/turbopack` loader in `next.config.ts`). Stop the server, delete `.next`, start it again, then hard-refresh.

## Structure

- `src/app/layout.tsx`: fonts via `next/font` (display = Instrument Serif, serif = Newsreader, mono = JetBrains Mono, geist-mono = Geist Mono; pixel = PP Mondwest, used only in the work menu; hand = Caveat is retired but still loaded).
- `src/app/globals.css`: **design tokens** (colours, type scale) and the shared classes `.label`, `.link`, `.shine`, `.cloud-drift`, `.cursor-blink`, `.pixel-frame`, `.pixel-in` (hero build-in, with the `--shade-*` masks), `.pixel-loader`.
- `src/app/page.tsx`: the home page (Hero → Work → About → Footer (the footer is the contact section)).
- `src/app/system/page.tsx`: the live design-system reference page.
- `src/components/Hero.tsx`: the hero composition (layers, clouds, name, subtitle). See `DESIGN.md` §3.
- `src/components/blocks/`: the shade-block meadow. `source.ts` loads and frames the painting, `engine.ts` renders it (one WebGL2 pass) with ripples and parallax (no flower hover). (`ascii/` and `meadow3d/` are retired versions.)
- `src/components/ParallaxLayer.tsx`, `ParticleText.tsx`, `PixelCloud.tsx`, `PixelButterflies.tsx`: the hero's reusable pieces.
- `src/components/HeroLoader.tsx`, `heroReveal.ts`: the pixel loader and the load sequence (meadow ready → loader dissolves → hero builds in).
- `src/components/Work.tsx`, `WorkMenu.tsx`, `PixelReveal.tsx`: the work section as an 80s game select screen (menu + preview). Order and `kind` come from `content.ts`; screenshots live in `public/projects/`.
- `src/components/About.tsx`: the about section (Himalayan sunset scene + description + skills).
- `src/components/Footer.tsx`: the night-sky footer.
- `src/components/PixelScene.tsx` + `pixelScenes.ts`: shared renderer for the about and footer pixel scenes.
- `src/lib/content.ts`: all copy data (projects, socials, email). Edit content here, not in components.
- `public/meadow/`: the meadow source (built by `scripts/prep-meadow.py`). `public/fonts/`: PP Mondwest (personal-use licence).
- Content source: the old site at `D:\Coding\portfolio`. Reuse the facts, but not its design or wording.

## Rules

1. **Follow `DESIGN.md` strictly.**
   - Use only the tokens in `globals.css`. Don't add new colours, fonts, radii, shadows, gradients or one-off sizes.
   - The UI uses ink and tarn only. Flower colours stay inside the meadow (one exception: the pink hero butterfly); the sky family (tarn-mist clouds) stays in the hero sky.
   - Pixels are for surfaces (meadow, clouds, ornaments, particles), never for reading text. The one exception is the work menu (80s game UI: PP Mondwest, `.pixel-frame`). Instrument Serif has one weight: no bold serif.
   - Light theme only.
   - When the system has to change, update `DESIGN.md`, `globals.css` and `/system` together in the same change.
2. **Check UI changes in the browser before calling them done.**
   - Look at desktop (about 1440×860) and mobile (375×812, at 2× pixel ratio: hi-dpi bugs hide at 1×).
   - For hero or meadow changes, also test the hover reactions (lake ripples, butterflies, subtitle scatter), the loader and build-in, the parallax and the frame rate.
   - Make sure the dev overlay shows no console errors (for example, don't call `new Date()` in server components).
3. Read the Next 16 docs in `node_modules/next/dist/docs/` before using any API you're unsure of (see AGENTS.md).
4. Motion must respect `prefers-reduced-motion`, and canvases or WebGL must pause when off-screen or at rest.
5. Write copy in the voice from `DESIGN.md` §10: calm, warm, close to lowercase, concrete. Never invent facts about Sam. Ask when unsure.
6. Never invent an email address or contact detail.

## Status / next up

See the `DESIGN.md` roadmap: carry the hero style down the page (pixel ornaments, italic section titles, hairline grid frame, mono UI), remove the retired fonts, tune the meadow and clouds on real devices, `/work/[slug]` case studies, and fix the dev-server CSS caching.
