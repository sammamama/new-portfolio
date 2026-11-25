import HeroLoader from "./HeroLoader";
import ParallaxLayer from "./ParallaxLayer";
import ParticleText from "./ParticleText";
import PixelButterflies from "./PixelButterflies";
import PixelCloud from "./PixelCloud";
import BlockMeadow from "./blocks/BlockMeadow";

export default function Hero() {
  return (
    // the loader covers the hero until the meadow and fonts are in; then every layer builds in (pixel-in)
    <section id="top" className="relative h-svh min-h-[640px] w-full overflow-hidden">
      {/* the meadow runs edge to edge on phones and sits inside the page gutters from md; its sky is transparent so the paper shows through */}
      <div className="absolute inset-x-0 top-6 bottom-0 md:inset-x-10 md:top-10 md:bottom-5">
        <BlockMeadow />
      </div>

      {/*
        Pixel clouds drifting through the sky above the text. All five clouds (these four plus the one
        crossing the name) share one 160s period and sit a fifth of a period apart (delays 0, -32, -64,
        -96, -128s), so they stay evenly spread across the sky forever and never bunch up on one side.
        Neighbours in the queue fly at different heights.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[6%] [--cloud-px:4px] md:[--cloud-px:5px]">
        <div className="cloud-drift [--delay:-32s] [--dur:160s] [--rest:8vw]">
          <div className="pixel-in [--in-delay:60ms]">
            <PixelCloud seed={19} cols={22} rows={8} />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[19%] [--cloud-px:4px] md:[--cloud-px:5px]">
        <div className="cloud-drift [--delay:-64s] [--dur:160s] [--rest:30vw]">
          <div className="pixel-in [--in-delay:140ms]">
            <PixelCloud seed={7} cols={26} rows={10} />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[11%] [--cloud-px:4px] md:[--cloud-px:6px]">
        <div className="cloud-drift [--delay:-96s] [--dur:160s] [--rest:50vw]">
          <div className="pixel-in [--in-delay:100ms]">
            <PixelCloud seed={3} cols={34} rows={12} />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[15%] [--cloud-px:4px] md:[--cloud-px:5px]">
        <div className="cloud-drift [--delay:-128s] [--dur:160s] [--rest:86vw]">
          <div className="pixel-in [--in-delay:180ms]">
            <PixelCloud seed={23} cols={20} rows={8} />
          </div>
        </div>
      </div>

      <header className="pixel-in relative z-10 mx-auto [--in-delay:200ms] flex max-w-[1400px] items-center justify-between px-6 pt-6 md:px-10">
        <a href="#top" className="font-display text-lg tracking-tight md:text-xl">
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
          <div className="relative">
            {/* padded so the italic overhang isn't clipped by the build-in mask */}
            <div className="pixel-in -mx-3 px-3 [--in-delay:0ms]">
              <h1 className="font-display text-[length:var(--text-display)] leading-none tracking-tight italic shine" data-text="Samridh Sharma">
                Samridh Sharma
              </h1>
            </div>
            <PixelButterflies />
          </div>
        </ParallaxLayer>
        {/* one cloud rides just above the name, clear of the letters and the butterflies. It starts at the left edge on load. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 left-1/2 z-20 h-0 w-screen -translate-x-1/2 [--cloud-px:4px] md:-top-12 md:[--cloud-px:6px]"
        >
          <div className="cloud-drift -translate-y-full [--delay:0s] [--dur:160s] [--rest:68vw]">
            <div className="pixel-in [--in-delay:80ms]">
              <PixelCloud seed={11} cols={30} rows={11} />
            </div>
          </div>
        </div>
        </div>
        <ParallaxLayer x={10} y={4} className="pointer-events-auto mt-4">
          <div className="pixel-in [--in-delay:120ms]">
            <ParticleText className="font-geist-mono text-[length:var(--text-lede)] leading-snug text-ink-soft">
              Design Specialist | Fullstack Generalist
            </ParticleText>
          </div>
        </ParallaxLayer>
      </div>

      <HeroLoader />
      <noscript>
        <style>{".pixel-loader{display:none}.pixel-in{-webkit-mask-image:none;mask-image:none}"}</style>
      </noscript>
    </section>
  );
}
