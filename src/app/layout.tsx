import type { Metadata } from "next";
import { HERO_SEEN_KEY } from "@/components/heroReveal";
import { Caveat, Geist_Mono, Instrument_Serif, JetBrains_Mono, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/*
 * Handwriting face — PLACEHOLDER.
 * Swap for Sam's own handwriting once exported:
 *   import localFont from "next/font/local";
 *   const hand = localFont({ src: "../fonts/sam-hand.woff2", variable: "--font-hand-face" });
 */
const hand = Caveat({
  variable: "--font-hand-face",
  subsets: ["latin"],
  weight: ["500", "700"],
});

// PP Mondwest (Pangram Pangram) — hero name only
const pixel = localFont({
  src: "../../public/fonts/ppmondwest-regular.otf",
  variable: "--font-pixel-face",
  weight: "400",
  display: "swap",
});

const display = Instrument_Serif({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// hero subtitle
const geistMono = Geist_Mono({
  variable: "--font-geist-mono-face",
  subsets: ["latin"],
});

const serif = Newsreader({
  variable: "--font-serif-face",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // share images and other URL metadata resolve against the real domain
  metadataBase: new URL("https://samridh-sharma.com"),
  title: "Sam Sharma — full-stack developer",
  description:
    "Samridh (Sam) Sharma — full-stack developer building calm, crafted web apps with Next.js, React and TypeScript.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the head script below may add data-hero-cached before React hydrates
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hand.variable} ${pixel.variable} ${display.variable} ${serif.variable} ${mono.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Runs before first paint: if the hero has fully loaded here before, its assets are cached,
            so skip the pixel loader and the build-in (see HeroLoader). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("${HERO_SEEN_KEY}"))document.documentElement.setAttribute("data-hero-cached","")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
