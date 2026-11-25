/** product = the serious one, side = a calmer side project, freelance = client work, play = for fun */
export type ProjectKind = "product" | "side" | "freelance" | "play";

export const kindLabel: Record<ProjectKind, string> = {
  product: "product",
  side: "side project",
  freelance: "freelance",
  play: "play",
};

export type Project = {
  title: string;
  kind: ProjectKind;
  /** screenshot in /public/projects */
  image: string;
  year?: string;
  summary: string;
  stack: string[];
  live: string;
  code?: string;
  /** optional one-liner shown under the name in the work menu */
  caption?: string;
};

// the work section lists projects in this order (hand-picked; Cécile Gardens sits second)
export const projects: Project[] = [
  {
    title: "Adore You",
    kind: "product",
    image: "/projects/adoreyou.png",
    summary:
      "Turn a song into a gift. People personalise a track and send it to someone they love — payments, accounts and a soft, animated unwrap.",
    stack: ["Next.js", "Stripe", "Better Auth", "Tailwind", "Framer Motion"],
    live: "https://adoreyou.app/",
    code: "https://github.com/sammamama/adoreyou",
    caption: "My flagship product, shipped to real users. The best gift your loved ones will ever receive.",
  },
  {
    title: "Cécile Gardens",
    kind: "freelance",
    image: "/projects/cecile.png",
    summary:
      "Home for a Melbourne-based country singer-songwriter: songs, gigs, gallery, merch and bookings in one place.",
    stack: ["Next.js", "Tailwind"],
    live: "http://cecilegardens.com/",
  },
  {
    title: "LyricForge",
    kind: "side",
    image: "/projects/lyricforge.png",
    summary:
      "An AI songwriting SaaS: describe a mood, get full lyrics and streamed audio back. Auth, dashboards and real-time generation.",
    stack: ["Next.js", "TypeScript", "Prisma", "Postgres"],
    live: "https://lyricforge.xyz/",
    code: "https://github.com/sammamama/lyrics-forge",
  },
  {
    title: "Sthaptya",
    kind: "freelance",
    image: "/projects/sthaptya.png",
    summary:
      "A site for a Himalayan architecture practice — hospitality, residential and commercial work, with enquiries built in.",
    stack: ["React", "TypeScript", "Tailwind"],
    live: "https://sthaptya.vercel.app/",
    code: "https://github.com/sammamama/sthaptya",
  },
  {
    title: "Web3 Noobie",
    kind: "play",
    image: "/projects/web-3noobie.png",
    summary:
      "A hands-on Solana playground for beginners — devnet faucet, SOL transfers and launching your first token.",
    stack: ["Next.js", "Solana", "TypeScript"],
    live: "https://web3-noobie.vercel.app/",
    code: "https://github.com/sammamama/web3-noobie",
  },
  {
    title: "Glass Den",
    kind: "play",
    image: "/projects/glass-den.png",
    summary:
      "Fine dining with a prison-cell twist — a moody restaurant site with a digital menu and chef's picks.",
    stack: ["React", "Tailwind"],
    live: "https://glass-den.vercel.app/",
    code: "https://github.com/sammamama/glass-den",
  },
  {
    title: "Snapifi",
    kind: "play",
    image: "/projects/snapifi.png",
    summary:
      "Make code look good. Write, theme and export snippets as images with custom fonts and palettes.",
    stack: ["React", "TypeScript"],
    live: "https://snapifi.vercel.app/",
    code: "https://github.com/sammamama/snapifi",
  },
];

export const socials = [
  { label: "GitHub", href: "https://github.com/sammamama" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/samridh-sharma-0201a8259/" },
  { label: "X", href: "https://x.com/samm_ammm" },
];


export const email: string | null = "samridhsame@gmail.com";

// "Technologies Known" from samridh-sharma.com, in the same order. Icons live in public/skills/ (simple-icons, CC0), drawn in ink via CSS mask.
export const skills: { name: string; icon?: string }[] = [
  { name: "TypeScript", icon: "/skills/typescript.svg" },
  { name: "JavaScript", icon: "/skills/javascript.svg" },
  { name: "React", icon: "/skills/react.svg" },
  { name: "NextJS", icon: "/skills/nextjs.svg" },
  { name: "Node.js", icon: "/skills/nodejs.svg" },
  { name: "MongoDB", icon: "/skills/mongodb.svg" },
  { name: "Prisma", icon: "/skills/prisma.svg" },
  { name: "PostgreSQL", icon: "/skills/postgresql.svg" },
  { name: "Redis", icon: "/skills/redis.svg" },
  { name: "Tailwind", icon: "/skills/tailwind.svg" },
  { name: "Three.js", icon: "/skills/threejs.svg" },
  { name: "Framer", icon: "/skills/framer.svg" },
  { name: "Solana", icon: "/skills/solana.svg" },
  { name: "Docker", icon: "/skills/docker.svg" },
  { name: "Vercel", icon: "/skills/vercel.svg" },
  { name: "Git", icon: "/skills/git.svg" },
];
