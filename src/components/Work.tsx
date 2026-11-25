import { projects } from "@/lib/content";
import WorkMenu from "./WorkMenu";

export default function Work() {
  return (
    <section id="work" className="px-6 pt-28 md:px-10 md:pt-40">
      <div className="flex items-end justify-between gap-6 border-b border-ink pb-5">
        <h2 className="font-display text-[length:var(--text-display)] leading-none">
          Selected <em>work</em>
        </h2>
      </div>

      <WorkMenu projects={projects} />
    </section>
  );
}
