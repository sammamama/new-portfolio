# new-portfolio

Personal portfolio of Samridh (Sam) Sharma: design specialist and fullstack generalist.

**Pixel pastoral:** a quiet paper sky over a pixel meadow drawn in shade blocks (`░ ▒ ▓ █`), with editorial type floating in between. Hover the lake and it ripples, hover the flowers and they spread, hover the role line and it scatters into particles. Clouds drift by, and one of them crosses in front of the name.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 and WebGL2. Deployed on Vercel.

## Run it

```bash
npm install
npm run dev -- -p 3417
```

Open [http://localhost:3417](http://localhost:3417). If a CSS change doesn't show up, stop the server, delete `.next` and start it again.

```bash
npm run build      # production build
npm run lint
npx tsc --noEmit
```

## Where things live

- `DESIGN.md`: the design system (principles, hero composition, colour, type, motion, components). Start here.
- `/system`: the live design-system reference page.
- `src/components/Hero.tsx`: the hero.
- `src/components/blocks/`: the shade-block meadow (WebGL2).
- `src/lib/content.ts`: all the copy.
- `scripts/prep-meadow.py`: rebuilds the meadow source from the reference painting.
