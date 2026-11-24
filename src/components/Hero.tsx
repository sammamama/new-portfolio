import ParallaxLayer from "./ParallaxLayer";
import ParticleText from "./ParticleText";
import PixelCloud from "./PixelCloud";
import BlockMeadow from "./blocks/BlockMeadow";

export default function Hero() {
  return (
    <section id="top" className="relative h-svh min-h-[640px] w-full overflow-hidden">
      {/* the meadow sits inside the page gutters; its sky is transparent so the paper shows through */}
      <div className="absolute inset-x-6 top-6 bottom-3 md:inset-x-10 md:top-10 md:bottom-5">
        <BlockMeadow />
      </div>

      {/* pixel clouds drifting through the sky above the text */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[11%] [--cloud-px:4px] md:[--cloud-px:6px]">
        <div className="cloud-drift [--delay:-80s] [--dur:150s] [--rest:62vw]">
          <PixelCloud seed={3} cols={34} rows={12} />
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[19%] [--cloud-px:4px] md:[--cloud-px:5px]">
        <div className="cloud-drift [--delay:-25s] [--dur:120s] [--rest:14vw]">
          <PixelCloud seed={7} cols={26} rows={10} />
        </div>
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between px-6 pt-6 md:px-10">
        <a href="#top" className="font-display text-xl tracking-tight">
          Sam Sharma
        </a>
        <nav className="flex gap-4 sm:gap-6">
          <a className="label link text-ink" href="#work">
            Work
          </a>
          <a className="label link text-ink" href="#about">
            About
          </a>
          <a className="label link text-ink" href="#contact">
            Contact
          </a>
        </nav>
      </header>

      {/* name and role, centred on the screen */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-24 text-center md:pb-32">
        {/* text floats in front of the meadow, so it drifts a little with the pointer too */}
        <div className="relative">
        <ParallaxLayer x={16} y={6}>
          <h1 className="font-display text-[length:var(--text-display)] leading-none tracking-tight italic shine" data-text="Samridh Sharma">
            Samridh Sharma
          </h1>
        </ParallaxLayer>
        {/* one cloud rides along the top of the name, in front of it: its lower half overlaps the letters. It starts at the left edge on load. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 z-20 h-0 w-screen -translate-x-1/2 [--cloud-px:4px] md:[--cloud-px:6px]"
        >
          <div className="cloud-drift -translate-y-1/2 [--delay:0s] [--dur:95s] [--rest:70vw]">
            <PixelCloud seed={11} cols={30} rows={11} />
          </div>
        </div>
        </div>
        <ParallaxLayer x={10} y={4} className="pointer-events-auto mt-4">
          <ParticleText className="font-geist-mono text-[length:var(--text-lede)] leading-snug text-ink-soft">
            Design Specialist | Fullstack Generalist
          </ParticleText>
        </ParallaxLayer>
      </div>
    </section>
  );
}
