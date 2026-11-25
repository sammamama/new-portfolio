/*
 * Pixel scenes for PixelScene: each draws one frame into an RGBA buffer, one pixel per block.
 * Colours come from the illustration palette (DESIGN.md §4) plus ink and paper; gradients are
 * ordered-dithered bands, never smooth.
 */

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((c, i) => Math.round(c + (b[i] - c) * t)) as RGB;

const C = {
  paper: hex("#FBFBF8"),
  mist: hex("#DFE7FD"),
  ink: hex("#0B0B0C"),
  deep: hex("#1238B8"),
  tarn: hex("#1F4FD8"),
  bright: hex("#4D7CF0"),
  glint: hex("#9BBCFF"),
  lilac: hex("#8A7CF0"),
  blush: hex("#F39BC2"),
  marigold: hex("#F2771B"),
  ember: hex("#E0531A"),
  pollen: hex("#F2B705"),
  deepMoss: hex("#12261C"),
  moss: hex("#24502F"),
};

// 4×4 Bayer matrix for ordered dithering
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
const hash = (a: number, b: number, c = 0) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Dithered gradient through colour stops [position 0–1, colour]. */
function dither(stops: [number, RGB][], t: number, x: number, y: number): RGB {
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    const [p0, c0] = stops[i - 1];
    if (t <= p1) return (t - p0) / (p1 - p0) > bayer(x, y) ? c1 : c0;
  }
  return stops[stops.length - 1][1];
}

/**
 * A mountain range as a ridge line: the highest of a few sharp peaks (|x| falloff), roughened per column.
 * Peaks are [x 0–1, height 0–1, half-width 0–1]; the result is a y in grid rows (smaller = higher).
 */
function range(peaks: [number, number, number][], base: number, rough: number, seed: number) {
  return (x: number, cols: number, rows: number) => {
    const u = x / cols;
    let h = 0;
    for (const [px, ph, pw] of peaks) h = Math.max(h, ph * (1 - Math.abs(u - px) / pw));
    h += (hash(Math.floor(x / 2), seed) - 0.5) * rough;
    return Math.round(rows * (base - h));
  };
}

export type Scene = (d: Uint8ClampedArray, cols: number, rows: number, frame: number) => void;

function put(d: Uint8ClampedArray, cols: number, x: number, y: number, c: RGB) {
  const i = (y * cols + x) * 4;
  d[i] = c[0];
  d[i + 1] = c[1];
  d[i + 2] = c[2];
  d[i + 3] = 255;
}

/* ───────────── sunset over the Himalayas (about) ───────────── */

const SUNSET_SKY: [number, RGB][] = [
  [0, C.deep],
  [0.28, C.lilac],
  [0.62, C.blush],
  [0.88, C.marigold],
  [1, C.ember],
];
const FAR = mix(C.lilac, C.deep, 0.25);
const FAR_SNOW = mix(C.blush, C.paper, 0.35);
const MID = mix(C.lilac, C.deepMoss, 0.55);
const MID_SNOW = mix(C.blush, C.lilac, 0.25);
const NEAR = mix(C.lilac, C.deepMoss, 0.78);
const FRONT = mix(C.deepMoss, C.ink, 0.45);

// a wide, low saddle between x ≈ 0.5 and 0.68, where the sun goes down
const farRange = range([[0.1, 0.3, 0.2], [0.33, 0.37, 0.17], [0.86, 0.34, 0.18], [1.05, 0.28, 0.2]], 0.66, 0.012, 1);
const midRange = range([[-0.02, 0.27, 0.24], [0.3, 0.2, 0.16], [0.88, 0.24, 0.2]], 0.74, 0.02, 2);
const nearRange = range([[0.12, 0.13, 0.3], [0.62, 0.1, 0.25], [0.95, 0.14, 0.2]], 0.84, 0.025, 3);
const frontRange = range([[0.3, 0.06, 0.45], [0.85, 0.08, 0.3]], 0.95, 0.02, 4);

export const sunset: Scene = (d, cols, rows, frame) => {
  const n = Math.min(cols, rows);
  const sunX = cols * 0.59;
  const sunY = rows * 0.63;
  const sunR = n * 0.13;
  const birds = [
    [0.22, 0.3],
    [0.27, 0.27],
  ].map(([bx, by], i) => [Math.round((bx * cols + frame * 0.15 * (i + 1)) % cols), Math.round(by * rows)]);

  for (let x = 0; x < cols; x++) {
    const far = farRange(x, cols, rows);
    const mid = midRange(x, cols, rows);
    const near = nearRange(x, cols, rows);
    const front = frontRange(x, cols, rows);
    for (let y = 0; y < rows; y++) {
      let c = dither(SUNSET_SKY, y / (rows * 0.72), x, y);
      const ds = Math.hypot(x + 0.5 - sunX, y + 0.5 - sunY);
      if (ds < sunR) c = ds > sunR - 1.2 ? C.marigold : C.pollen;
      else if (ds < sunR + 2.5 && bayer(x, y) < 0.45) c = C.marigold; // ▒ glow

      if (y >= far) {
        const s = y - far;
        c = far < rows * 0.44 && (s < rows * 0.03 || (s < rows * 0.06 && bayer(x, y) < 0.5)) ? FAR_SNOW : FAR;
      }
      // valley mist between the far and middle ranges, drifting slowly
      const mistY = rows * 0.6;
      if (y >= far && Math.abs(y - mistY) < rows * 0.03 && hash(Math.floor((x + frame * 0.25) / 6), y) < 0.55)
        c = bayer(x, y) < 0.5 ? C.blush : FAR;
      if (y >= mid) {
        const s = y - mid;
        c = mid < rows * 0.54 && (s < rows * 0.02 || (s < rows * 0.04 && bayer(x, y) < 0.5)) ? MID_SNOW : MID;
      }
      if (y >= near) c = NEAR;
      if (y >= front) c = bayer(x, y) < 0.15 ? NEAR : FRONT;
      put(d, cols, x, y, c);
    }
  }
  // two small birds, a pixel "v" each
  for (const [bx, by] of birds) {
    const flap = (frame >> 2) % 2;
    for (const [ox, oy] of [[-1, -flap], [0, 0], [1, -flap]]) {
      const x = bx + ox;
      const y = by + oy;
      if (x >= 0 && x < cols && y >= 0 && y < rows) put(d, cols, x, y, C.ink);
    }
  }
};

/* ───────────── night over the mountains (footer) ───────────── */

const NIGHT_SKY: [number, RGB][] = [
  [0, mix(C.ink, C.deep, 0.15)],
  [0.55, mix(C.ink, C.deep, 0.4)],
  [0.85, mix(mix(C.ink, C.deep, 0.55), C.lilac, 0.15)],
  [1, mix(mix(C.ink, C.deep, 0.6), C.lilac, 0.3)],
];
const N_FAR = mix(C.deep, C.ink, 0.62);
const N_FAR_SNOW = mix(C.glint, C.ink, 0.5);
const N_MID = mix(C.deep, C.ink, 0.78);
const N_NEAR = mix(C.deep, C.ink, 0.9);

const nFar = range([[0.08, 0.26, 0.12], [0.27, 0.34, 0.14], [0.5, 0.24, 0.1], [0.7, 0.36, 0.15], [0.93, 0.28, 0.12]], 0.72, 0.012, 5);
const nMid = range([[0.15, 0.18, 0.2], [0.45, 0.22, 0.18], [0.82, 0.19, 0.22]], 0.8, 0.02, 6);
const nNear = range([[0.05, 0.1, 0.3], [0.38, 0.06, 0.25], [0.72, 0.11, 0.3]], 0.9, 0.025, 7);

export const night: Scene = (d, cols, rows, frame) => {
  const horizon = rows * 0.72;
  // a shooting star every ~12s (at 8fps), crossing for ~1s
  const cycle = frame % 96;
  const shoot = cycle < 9 ? { x: cols * (0.2 + hash(Math.floor(frame / 96), 1) * 0.5) + cycle * 3, y: rows * 0.1 + cycle * 1.2 } : null;

  for (let x = 0; x < cols; x++) {
    const far = nFar(x, cols, rows);
    const mid = nMid(x, cols, rows);
    const near = nNear(x, cols, rows);
    for (let y = 0; y < rows; y++) {
      let c = dither(NIGHT_SKY, y / horizon, x, y);

      // the milky way: a soft diagonal band with a faint lilac dust and many more stars
      const band = Math.abs(y - (rows * 0.75 - x * (rows * 0.6) / cols)) / (rows * 0.12);
      if (band < 1 && bayer(x, y) < 0.18 * (1 - band)) c = mix(c, C.lilac, 0.35);
      const h = hash(x, y);
      const density = (0.03 + (band < 1 ? 0.07 * (1 - band) : 0)) * (1 - (y / horizon) * 0.6);
      if (h < density) {
        const tier = hash(y, x, 3);
        const twinkle = hash(x, y, Math.floor(frame / 3)) < 0.12;
        c = tier < 0.15 ? C.paper : tier < 0.5 ? C.mist : C.glint;
        if (twinkle) c = mix(c, NIGHT_SKY[1][1], 0.6);
      }
      // a few bright stars drawn as small crosses
      if (hash(Math.floor(x / 3), Math.floor(y / 3), 9) < 0.008 && x % 3 === 1 && y % 3 === 1) c = C.paper;

      if (y >= far) c = y - far < rows * 0.035 && far < rows * 0.5 && bayer(x, y) < 0.6 ? N_FAR_SNOW : N_FAR;
      if (y >= mid) c = N_MID;
      if (y >= near) c = N_NEAR;
      put(d, cols, x, y, c);
    }
  }
  // bright-star crosses: arms around the centres marked above (sky only)
  for (let y = 1; y < horizon; y += 3)
    for (let x = 1; x < cols; x += 3)
      if (hash(Math.floor(x / 3), Math.floor(y / 3), 9) < 0.008 && y < nFar(x, cols, rows) - 2)
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(d, cols, x + ox, y + oy, C.glint);

  // one warm window on the near ridge
  const wx = Math.round(cols * 0.62);
  const wy = nNear(wx, cols, rows) + 2;
  if (wy < rows - 1) put(d, cols, wx, wy, C.pollen);

  if (shoot)
    for (let i = 0; i < 6; i++) {
      const x = Math.round(shoot.x - i * 2.5);
      const y = Math.round(shoot.y - i);
      if (x >= 0 && x < cols && y >= 0 && y < rows) put(d, cols, x, y, i < 2 ? C.paper : C.glint);
    }
};

export const scenes = { sunset, night };
export type SceneName = keyof typeof scenes;
