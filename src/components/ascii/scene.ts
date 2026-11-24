/*
 * Procedural ASCII meadow — a loose, hand-tuned echo of the reference:
 * empty sky on top, a flowered hill rising on the left, soft far hills,
 * a sunlit meadow band, a blue tarn with a glint, and big foreground blooms.
 * Nothing is sampled from the source image; it is all noise + profiles.
 */

export const PALETTE = [
  "#12261c", //  0 deep moss
  "#24502f", //  1 moss
  "#5f7f2a", //  2 olive
  "#a3b43a", //  3 sun-grass
  "#f2b705", //  4 pollen
  "#f2771b", //  5 marigold
  "#e0531a", //  6 ember
  "#ec4f8f", //  7 bloom
  "#f39bc2", //  8 blush
  "#7f9f5c", //  9 far hill
  "#b4c486", // 10 far haze
  "#1238b8", // 11 tarn deep
  "#1f4fd8", // 12 tarn
  "#4d7cf0", // 13 tarn bright
  "#9bbcff", // 14 glint
  "#8a7cf0", // 15 lilac
] as const;

export const KIND = {
  land: 0,
  far: 1,
  water: 2,
  sparkle: 3,
  flower: 4,
  foliage: 5,
} as const;

export type Scene = {
  n: number;
  cw: number;
  chh: number;
  fontSize: number;
  x: Float32Array;
  y: Float32Array;
  glyph: string[];
  color: Uint8Array;
  kind: Uint8Array;
  phase: Float32Array;
  isWater: (px: number, py: number) => boolean;
};

/* ---------- tiny deterministic noise ---------- */
function hash(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
function vnoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  return lerp(
    lerp(hash(ix, iy, seed), hash(ix + 1, iy, seed), sx),
    lerp(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), sx),
    sy,
  );
}
function fbm(x: number, y: number, seed: number) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f, seed + i * 17);
    f *= 2;
    a *= 0.5;
  }
  return s / 0.9375;
}

/* ---------- landscape profiles (v = 0 top, 1 bottom) ---------- */
const leftHill = (u: number) =>
  0.3 + 0.27 * smooth(u / 0.55) + (fbm(u * 9, 0.5, 3) - 0.5) * 0.035;

const farHill = (u: number) => {
  const ridge = 0.05 * Math.exp(-(((u - 0.36) / 0.09) ** 2));
  const rise = 0.085 * smooth((u - 0.55) / 0.45);
  return 0.545 - ridge - rise + (fbm(u * 14, 1.5, 5) - 0.5) * 0.02;
};

const waterTop = (u: number) => 0.735 - 0.135 * u + (fbm(u * 10, 2.5, 7) - 0.5) * 0.012;

const waterBottom = (u: number) =>
  0.865 - 0.17 * smooth((u - 0.5) / 0.5) + (fbm(u * 18, 3.5, 9) - 0.5) * 0.04;

/* character ramps, light → dense */
const FOLIAGE = ".,:;i+=*x%#";
const DENSE = ";+=*x%#&";
const WATER = "≈~=≈~≈=~";
const PETALS = ["-", "\\", "|", "/", "-", "\\", "|", "/"];

function ramp(chars: string, t: number) {
  return chars[Math.min(chars.length - 1, Math.max(0, Math.floor(t * chars.length)))];
}

type Blob = { x: number; y: number; r: number; c: number };

export function buildScene(width: number, height: number, fontSize: number, seed = 11): Scene {
  const cw = fontSize * 0.6;
  const chh = fontSize * 1.06;
  const cols = Math.ceil(width / cw);
  const rows = Math.ceil(height / chh);
  const aspect = width / height;

  /* portrait screens: squeeze the landscape into the lower part so the sky stays open */
  const top = aspect < 0.9 ? 0.22 : aspect < 1.3 ? 0.08 : 0;
  const toV = (py: number) => (py / height - top) / (1 - top);

  const xs: number[] = [];
  const ys: number[] = [];
  const gs: string[] = [];
  const cs: number[] = [];
  const ks: number[] = [];
  const ps: number[] = [];
  const push = (px: number, py: number, g: string, c: number, k: number, p: number) => {
    xs.push(px);
    ys.push(py);
    gs.push(g);
    cs.push(c);
    ks.push(k);
    ps.push(p);
  };

  /* foreground blooms (pixel space) */
  const blobs: Blob[] = [];
  const blobColors = [5, 5, 6, 4, 4, 7, 7, 8, 15];
  const target = Math.round((width * height) / 9000);
  for (let i = 0, tries = 0; blobs.length < target && tries < target * 30; tries++, i++) {
    const u = hash(i, 1, seed);
    const v = hash(i, 2, seed);
    const vv = toV(v * height);
    if (vv < waterBottom(u) + 0.015) continue;
    const depth = clamp01((vv - 0.7) / 0.3);
    const r = fontSize * (1.1 + depth * 2.6 * (0.6 + hash(i, 3, seed) * 0.8));
    const bx = u * width;
    const by = v * height;
    if (blobs.some((b) => Math.hypot(b.x - bx, b.y - by) < (b.r + r) * 0.85)) continue;
    blobs.push({ x: bx, y: by, r, c: blobColors[Math.floor(hash(i, 4, seed) * blobColors.length)] });
  }

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const px = i * cw;
      const py = j * chh;
      const u = (i + 0.5) / cols;
      const v = toV(py + chh * 0.5);
      const X = u * aspect;
      const r0 = hash(i, j, seed);
      const phase = hash(i, j, seed + 99);

      const lh = leftHill(u);
      const fh = farHill(u);
      const sky = Math.min(lh, fh);
      if (v < sky) continue;

      const wt = waterTop(u);
      const wb = waterBottom(u);

      /* ---------- land above the water ---------- */
      if (v < wt) {
        // ragged skyline
        if (v - sky < 0.018 && r0 < 0.55) continue;

        const behindHill = v < lh;
        if (behindHill && v < fh + 0.05) {
          // far hills: hazy, sparse
          if (r0 < 0.35) continue;
          const n = fbm(X * 7, v * 9, seed + 2);
          const c = n > 0.55 ? 10 : 9;
          push(px, py, ramp(".:-=+", n * 0.9), c, KIND.far, phase);
          continue;
        }

        const t = clamp01((v - sky) / Math.max(0.02, wt - sky));
        const n = fbm(X * 5, v * 7, seed + 4);
        const fl = fbm(X * 16 + 10, v * 18, seed + 6);
        const lum = clamp01(0.18 + 0.5 * u * (1 - 0.4 * t) + (n - 0.5) * 0.6 + (1 - t) * 0.1);

        // flower threshold: more blooms on the hill crest and the sunlit strip by the water
        const thr = 0.6 - 0.08 * (1 - t) - (t > 0.72 ? 0.12 : 0) - 0.04 * u;
        if (fl > thr) {
          const pick = hash(i, j, seed + 7);
          const c = pick < 0.42 ? 4 : pick < 0.72 ? 5 : pick < 0.9 ? 7 : 8;
          const g = pick < 0.5 ? "*" : pick < 0.8 ? "o" : "@";
          push(px, py, g, c, KIND.flower, phase);
          continue;
        }
        if (r0 < 0.07) continue;
        const c = lum < 0.26 ? 0 : lum < 0.42 ? 1 : lum < 0.6 ? 2 : 3;
        push(px, py, ramp(FOLIAGE, 0.15 + (1 - lum) * 0.75), c, KIND.land, phase);
        continue;
      }

      /* ---------- water ---------- */
      if (v < wb) {
        const depth = (v - wt) / Math.max(0.02, wb - wt);
        const glint =
          Math.exp(-(((u - 0.53 - depth * 0.03) / 0.065) ** 2)) * clamp01(1 - (v - wt) / 0.17);
        if (glint > 0.25 && r0 < glint * 0.55) continue; // light gaps
        if (glint > 0.3 && r0 < glint * 0.95) {
          push(px, py, r0 < 0.6 ? "+" : "*", 14, KIND.sparkle, phase);
          continue;
        }
        if (r0 > 0.985) {
          push(px, py, "+", 14, KIND.sparkle, phase);
          continue;
        }
        const n = fbm(X * 3, v * 34, seed + 8);
        const c = n < 0.38 ? 11 : n < 0.68 ? 12 : 13;
        push(px, py, WATER[Math.floor(n * WATER.length) % WATER.length], c, KIND.water, phase);
        continue;
      }

      /* ---------- foreground blooms + foliage ---------- */
      const cx = px + cw * 0.5;
      const cy = py + chh * 0.5;
      let hit: Blob | null = null;
      let hd = 0;
      for (const b of blobs) {
        const d = Math.hypot(cx - b.x, (cy - b.y) * 1.15);
        if (d < b.r) {
          hit = b;
          hd = d / b.r;
          break;
        }
      }
      if (hit) {
        if (hd < 0.3) {
          push(px, py, hit.c === 4 ? "@" : "#", hit.c === 4 ? 6 : 4, KIND.flower, phase);
        } else {
          const a = Math.atan2(cy - hit.y, cx - hit.x);
          const idx = Math.round(((a + Math.PI) / (Math.PI * 2)) * 8) % 8;
          const g = hd > 0.85 ? "o" : PETALS[idx];
          push(px, py, g, hit.c, KIND.flower, phase);
        }
        continue;
      }
      if (r0 < 0.05) continue;
      const fv = clamp01((v - wb) / 0.2);
      if (r0 > 0.94) {
        push(px, py, "*", hash(i, j, seed + 3) < 0.5 ? 8 : 4, KIND.flower, phase);
        continue;
      }
      if (r0 > 0.88 && fv > 0.3) {
        push(px, py, "|", 1, KIND.foliage, phase);
        continue;
      }
      const n = fbm(X * 9, v * 12, seed + 10);
      const lum = clamp01(0.3 + (n - 0.5) * 0.8 + (1 - fv) * 0.2);
      const c = lum < 0.22 ? 0 : lum < 0.45 ? 1 : 2;
      push(px, py, ramp(DENSE, 1 - lum), c, KIND.foliage, phase);
    }
  }

  return {
    n: xs.length,
    cw,
    chh,
    fontSize,
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    glyph: gs,
    color: Uint8Array.from(cs),
    kind: Uint8Array.from(ks),
    phase: Float32Array.from(ps),
    isWater: (mx, my) => {
      const u = mx / width;
      const v = toV(my);
      return v > waterTop(u) && v < waterBottom(u);
    },
  };
}
