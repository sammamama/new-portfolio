import { skills } from "@/lib/content";
import PixelScene from "./PixelScene";

export default function About() {
  return (
    <section id="about" className="px-6 pt-28 md:px-10 md:pt-40">
      {/* side by side from xl: the text column stretches to the square's height, skills pinned to its bottom edge */}
      <div className="grid gap-12 xl:grid-cols-[5fr_7fr] xl:gap-16">
        <div className="w-full min-w-0 max-w-xl xl:max-w-none">
          <PixelScene scene="sunset">
            <h2 className="absolute top-5 left-6 font-display text-[length:var(--text-display)] leading-none text-paper italic md:top-7 md:left-8">
              About
            </h2>
          </PixelScene>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-6">
          <div>
            <p className="font-display text-[length:var(--text-title)] leading-[1.15] italic">
              I find ways to express myself; creating with tech is what I am
              most skilled at.
            </p>
            <div className="mt-5 space-y-3 font-geist-mono text-sm leading-[1.7] md:text-base">
              <p>
                Hey, I am Samridh. If being born in the foothills of the
                Himalayas has taught me one thing, it is how much of a role
                beauty has in inculcating creativity in a person deeply affected
                by art.
              </p>
              <p>
                I feel I am a victim of the vicious beauty of the Himalayas, and
                I am sharing my work, and whatever I can do and feel is right,
                to express what is trying to find an outlet in me.
              </p>
              <p>I&apos;ll be sharing some things I&apos;ve created.</p>
            </div>
          </div>

          <div>
            <h3 className="label">Skills</h3>
            <ul className="mt-3 grid grid-cols-2 border-t border-line font-geist-mono text-xs sm:grid-cols-4 md:text-sm">
              {skills.map((s) => (
                <li
                  key={s.name}
                  className="flex min-w-0 items-center gap-2.5 border-b border-line py-2"
                >
                  {/* single-colour icon: the SVG is a mask, filled with ink */}
                  <span
                    aria-hidden
                    className="size-4 shrink-0 bg-ink"
                    style={
                      s.icon
                        ? { mask: `url(${s.icon}) center / contain no-repeat` }
                        : { visibility: "hidden" }
                    }
                  />
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
