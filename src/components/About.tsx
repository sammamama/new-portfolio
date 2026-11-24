const stack = [
  ["Front", "Next.js, React, TypeScript, Tailwind, Framer Motion"],
  ["Back", "Node.js, Prisma, Postgres, MongoDB"],
  ["Also", "Three.js, Solana / Web3, Stripe, auth"],
];

export default function About() {
  return (
    <section id="about" className="bg-paper-sunk">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-28 md:grid-cols-[1fr_2fr] md:px-10 md:py-40">
        <div>
          <span className="label">(02) — about</span>
          <p aria-hidden className="mt-6 font-mono text-sm leading-tight text-tarn">
            ~ ~~ ~ ~~~ ~
            <br />
            &nbsp;~~ ~ ~~ ~
          </p>
        </div>

        <div>
          <p className="font-display text-[length:var(--text-title)] leading-[1.2]">
            I&apos;m Samridh — most people call me Sam. I build web apps end to end, and I care most about the part
            people actually touch: <em className="text-tarn">how it feels</em>.
          </p>
          <div className="mt-10 max-w-[60ch] space-y-5 text-ink-soft">
            <p>
              Right now I&apos;m growing Adore You, a small product for gifting songs. Before that I shipped sites for
              an architecture studio, a musician and a restaurant, plus a handful of side projects I made simply
              because they were fun to build.
            </p>
            <p>
              I&apos;m looking for a full-stack or front-end role on a team that sweats the details — where I can
              own features from schema to the last hover state.
            </p>
          </div>

          <dl className="mt-12 divide-y divide-line border-y border-line">
            {stack.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6rem_1fr] gap-4 py-4">
                <dt className="label pt-1">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
