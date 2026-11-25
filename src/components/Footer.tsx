import { email, socials } from "@/lib/content";
import PixelScene from "./PixelScene";

/**
 * The page ends at night: a starry pixel sky over the mountains, with the contact line and links set
 * low over the dark ridges. All text is paper (tarn would sink into the night sky).
 */
export default function Footer() {
  return (
    <footer id="contact" className="px-6 pt-28 pb-6 md:px-10 md:pt-40 md:pb-10">
      <PixelScene scene="night" ratio={[1.1, 0.4]}>
        <div className="absolute inset-x-5 bottom-5 text-paper md:inset-x-8 md:bottom-8">
          <h2 className="font-display text-[length:var(--text-display)] leading-[0.95]">
            Let&apos;s make something useful.
          </h2>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-base md:mt-6 md:gap-x-8 md:text-xl">
            {email && (
              <a className="link font-display text-2xl hover:text-tarn-mist! md:text-3xl" href={`mailto:${email}`}>
                {email}
              </a>
            )}
            {socials.map((s) => (
              <a
                key={s.label}
                className="link hover:text-tarn-mist!"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>
      </PixelScene>
    </footer>
  );
}
