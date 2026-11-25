/** Loads the reference painting + its data map, and frames it in the hero. */

export type Sources = {
  img: ImageBitmap; // painting, RGBA over paper (baked), sky transparent, straight alpha; uploaded as is
  depth: ImageData; // R = depth, G = water mask, B = foreground mask
  aspect: number;
};

export type Fit = { x: number; y: number; w: number; h: number };

// /meadow/* is served with a long immutable cache (next.config.ts): bump the version when an asset changes
export const IMG_URL = "/meadow/meadow.v2.webp";
export const DEPTH_URL = "/meadow/depth.png?v=2";

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
  // both are preloaded from the page head (Hero), so these usually resolve from memory
  const [img, depth] = await Promise.all([loadImage(IMG_URL), loadImage(DEPTH_URL)]);
  // decoded off the main thread, alpha kept straight so the paper colour under the transparent sky
  // survives the upload (a premultiplied decode would turn it black)
  const bitmap = await createImageBitmap(img, { premultiplyAlpha: "none" });
  // only the data map is read on the CPU (lake hit tests for the ripples)
  return { img: bitmap, depth: pixels(depth), aspect: bitmap.width / bitmap.height };
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
