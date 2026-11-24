import { projects } from "@/lib/content";

export default function Work() {
  return (
    <section id="work" className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
      <div className="mb-14 flex items-end justify-between gap-6 border-b border-ink pb-5">
        <h2 className="font-display text-[length:var(--text-display)] leading-none">
          Selected <em>work</em>
        </h2>
        <span className="label pb-2">(01) — {String(projects.length).padStart(2, "0")} projects</span>
      </div>

      <ol>
        {projects.map((p, i) => (
          <li key={p.title} className="group border-b border-line">
            <a
              href={p.live}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 py-8 md:grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-baseline md:gap-x-8"
            >
              <span className="label pt-2 md:pt-0">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-[length:var(--text-title)] leading-tight transition-colors duration-300 group-hover:text-tarn">
                {p.title}
              </h3>
              <p className="col-start-2 text-ink-soft md:col-start-auto">{p.summary}</p>
              <div className="col-start-2 flex items-center gap-4 md:col-start-auto md:justify-end">
                <span className="font-mono text-xs text-ink-faint">{p.stack.slice(0, 3).join(" · ")}</span>
                <span
                  aria-hidden
                  className="font-mono text-tarn transition-transform duration-300 group-hover:translate-x-1.5"
                >
                  ~&gt;
                </span>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
