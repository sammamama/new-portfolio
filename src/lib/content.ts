export type Project = {
  title: string;
  year?: string;
  summary: string;
  stack: string[];
  live: string;
  code?: string;
};

export const projects: Project[] = [
  {
    title: "Adore You",
    summary:
      "Turn a song into a gift. People personalise a track and send it to someone they love — payments, accounts and a soft, animated unwrap.",
    stack: ["Next.js", "Stripe", "Better Auth", "Tailwind", "Framer Motion"],
    live: "https://adoreyou.app/",
    code: "https://github.com/sammamama/adoreyou",
  },
  {
    title: "LyricForge",
    summary:
      "An AI songwriting SaaS: describe a mood, get full lyrics and streamed audio back. Auth, dashboards and real-time generation.",
    stack: ["Next.js", "TypeScript", "Prisma", "Postgres"],
    live: "https://lyricforge.xyz/",
    code: "https://github.com/sammamama/lyrics-forge",
  },
  {
    title: "Sthaptya",
    summary:
      "A site for a Himalayan architecture practice — hospitality, residential and commercial work, with enquiries built in.",
    stack: ["React", "TypeScript", "Tailwind"],
    live: "https://sthaptya.vercel.app/",
    code: "https://github.com/sammamama/sthaptya",
  },
  {
    title: "Cécile Gardens",
    summary:
      "Home for a Melbourne-based country singer-songwriter: songs, gigs, gallery, merch and bookings in one place.",
    stack: ["Next.js", "Tailwind"],
    live: "http://cecilegardens.com/",
  },
  {
    title: "Web3 Noobie",
    summary:
      "A hands-on Solana playground for beginners — devnet faucet, SOL transfers and launching your first token.",
    stack: ["Next.js", "Solana", "TypeScript"],
    live: "https://web3-noobie.vercel.app/",
    code: "https://github.com/sammamama/web3-noobie",
  },
  {
    title: "Jap Archi",
    summary:
      "A quiet studio portfolio for Japanese-inspired spaces, with 3D model viewing and slow, spatial storytelling.",
    stack: ["Next.js", "Three.js"],
    live: "https://jap-archi.vercel.app/",
    code: "https://github.com/sammamama/jap-archi",
  },
  {
    title: "Glass Den",
    summary:
      "Fine dining with a prison-cell twist — a moody restaurant site with a digital menu and chef's picks.",
    stack: ["React", "Tailwind"],
    live: "https://glass-den.vercel.app/",
    code: "https://github.com/sammamama/glass-den",
  },
  {
    title: "Snapifi",
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

/* TODO(sam): add the email address you want public, e.g. "hello@yourdomain.com" */
export const email: string | null = null;
