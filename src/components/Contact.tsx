import { email, socials } from "@/lib/content";

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-[1400px] px-6 pt-28 pb-16 md:px-10 md:pt-40">
      <span className="label">(03) — contact</span>
      <h2 className="mt-6 max-w-[14ch] font-display text-[length:var(--text-display)] leading-[0.95]">
        Let&apos;s make something <em className="text-tarn">calm</em> &amp; useful.
      </h2>

      <div className="mt-14 flex flex-wrap items-baseline gap-x-10 gap-y-4 text-xl">
        {email && (
          <a className="link font-display text-3xl" href={`mailto:${email}`}>
            {email}
          </a>
        )}
        {socials.map((s) => (
          <a key={s.label} className="link" href={s.href} target="_blank" rel="noopener noreferrer">
            {s.label} ↗
          </a>
        ))}
      </div>

      <footer className="mt-32 flex flex-wrap justify-between gap-4 border-t border-ink pt-5">
        <span className="label">© 2026 Samridh Sharma</span>
        <a href="#top" className="label link">
          back to the meadow ↑
        </a>
      </footer>
    </section>
  );
}
