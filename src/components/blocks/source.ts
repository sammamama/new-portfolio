/** Loads the reference painting + its data map, and frames it in the hero. */

export type Sources = {
  img: ImageData; // painting, RGBA, sky transparent
  depth: ImageData; // R = depth, G = water mask, B = foreground mask
  aspect: number;
};

export type Fit = { x: number; y: number; w: number; h: number };

const IMG_URL = "/meadow/meadow.webp";
const DEPTH_URL = "/meadow/depth.png";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

function pixels(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

export async function loadSources(): Promise<Sources> {
  const [img, depth] = await Promise.all([loadImage(IMG_URL), loadImage(DEPTH_URL)]);
  return { img: pixels(img), depth: pixels(depth), aspect: img.width / img.height };
}

/**
 * Bottom-anchored framing, skyline at about a third of the way down the hero. Fit the width on wide screens; on portrait screens keep the landscape
 * (the lower ~70% of the painting) at least half the hero tall and crop the sides.
 */
const LAND_TOP = 0.3;

export function layout(src: Sources, cssW: number, cssH: number): Fit {
  let h = cssW / src.aspect;
  const minH = (cssH * 0.52) / 0.7;
  if (h < minH) h = minH;
  const w = h * src.aspect;
  // the land starts LAND_TOP of the way down the painting; keep that skyline at about half the hero,
  // letting the bottom of the painting crop off when needed
  const y = Math.max(cssH - h, cssH * 0.33 - LAND_TOP * h);
  return { x: (cssW - w) * 0.42, y, w, h };
}
