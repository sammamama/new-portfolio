import { type Fit, type Sources, layout } from "./source";

export type Engine = {
  resize: (w: number, h: number) => void;
  pointer: (x: number, y: number) => void;
  leave: () => void;
  start: () => void;
  stop: () => void;
  renderOnce: () => void;
  dispose: () => void;
};

const MAX_RIPPLES = 8;

const VERT = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/*
 * One pass, per pixel:
 *  1. find this pixel's cell; sample the painting at the cell centre (mip level ≈ cell size),
 *     displaced by breeze, water drift and ripples;
 *  2. solve how much ink the cell needs so that, over paper, it averages to the painting's colour:
 *     coverage = max over channels of (paper - colour) / paper, then quantise to a shade block
 *     ░ (25%) ▒ (50%) ▓ (75%) █ (100%) with a per-cell dither, and pick the ink colour that makes
 *     mix(paper, ink, coverage) = colour;
 *  3. draw the block's dot pattern.
 */
const FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tImg;
uniform sampler2D tDepth;
uniform vec2 uRes;      // device px
uniform vec2 uCell;     // device px
uniform float uUnit;    // block pattern pixel, device px
uniform vec4 uFit;      // painting rect, device px, top-left origin
uniform float uLod;
uniform float uTime;
uniform float uIntro;
uniform float uDpr;
uniform vec2 uPar;      // parallax, device px
uniform vec2 uMouse;    // device px, top-left origin
uniform float uPush;    // 0..1, eased: how much the flowers under the cursor spread
uniform float uRadius;  // device px
uniform vec4 uRip[${MAX_RIPPLES}];  // x, y (device px), start time, amplitude

out vec4 outColor;

const vec3 PAPER = vec3(0.984, 0.984, 0.973);   // --paper
const vec3 GLINT = vec3(0.302, 0.486, 0.941);   // --tarn-bright

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

bool shade(int lvl, ivec2 u) {
  bool light = (u.y % 4 == 0 && u.x % 2 == 0) || (u.y % 4 == 2 && u.x % 2 == 1);  // ░
  if (lvl <= 0) return false;
  if (lvl == 1) return light;
  if (lvl == 2) return (u.x + u.y) % 2 == 0;                                      // ▒
  if (lvl == 3) return !light;                                                    // ▓
  return true;                                                                    // █
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(fc / uCell);
  vec2 local = fc - cell * uCell;
  vec2 c = (cell + 0.5) * uCell;
  float h = hash(cell);
  float h2 = hash(cell + 17.31);

  vec2 uv0 = (c - uFit.xy) / uFit.zw;
  if (uv0.x < 0.0 || uv0.x > 1.0 || uv0.y < 0.0 || uv0.y > 1.0) discard;
  vec3 dm = texture(tDepth, uv0).rgb;
  float depth = dm.r, water = dm.g, fg = dm.b;

  float t = uTime;
  // depth parallax: the near bank moves more than the far hills
  vec2 q = c - uPar * (0.15 + depth);
  // breeze over the land, stronger on the near blooms
  float gust = 0.5 + 0.5 * sin(t * 0.6 + c.x * 0.004 / uDpr - c.y * 0.006 / uDpr);
  q.x += (1.0 - water) * sin(t * 1.3 + c.x * 0.02 / uDpr + h * 6.283) * (0.6 + 3.0 * fg) * (0.4 + gust) * uDpr;
  // water drifts sideways in bands
  q.x += water * sin(t * 0.7 + c.y * 0.06 / uDpr) * 4.0 * uDpr;

  // ripples: flattened rings over the lake
  float crest = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRip[i];
    float age = t - r.z;
    if (age < 0.0 || age > 3.5) continue;
    vec2 d = c - r.xy;
    float dist = length(d * vec2(1.0, 2.2)) / uDpr;
    float front = age * 150.0;
    float ring = exp(-pow((dist - front) / 24.0, 2.0)) * exp(-age * 1.1) * r.w;
    float wave = sin((dist - front) * 0.18) * ring;
    q += normalize(d + 1e-4) * wave * 9.0 * uDpr * water;
    crest = max(crest, max(wave, 0.0) * water);
  }

  // flowers spread apart around the cursor: a soft lens that swells the blooms outward,
  // with a little per-cell scatter; the lake is left to its ripples
  vec2 dm2 = c - uMouse;
  float rr = 1.0 - smoothstep(0.0, uRadius, length(dm2 * vec2(1.0, 1.2)));
  float spread = uPush * rr * rr * (1.0 - water);
  if (spread > 0.001) {
    q = uMouse + (q - uMouse) * (1.0 - 0.6 * spread);
    q += (vec2(h, h2) - 0.5) * uCell * 2.5 * spread;
  }

  // four sub-samples per cell: the cell's own light and dark colours (ANSI-art style fg / bg)
  vec2 off = q - c;
  vec3 s[4];
  float l[4];
  float alpha = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 o = (vec2(float(i & 1), float(i >> 1)) - 0.5) * uCell * 0.5;
    vec2 uv = (c + o + off - uFit.xy) / uFit.zw;
    vec4 smp = textureLod(tImg, clamp(uv, 0.0, 1.0), uLod);
    vec3 col = mix(PAPER, smp.rgb, smp.a);
    float lm = dot(col, vec3(0.299, 0.587, 0.114));
    col = clamp(mix(vec3(lm), col, 1.2), 0.0, 1.0);   // a touch more saturation
    s[i] = col;
    l[i] = dot(col, vec3(0.299, 0.587, 0.114));
    alpha += smp.a * 0.25;
  }
  if (alpha < 0.04) discard;
  vec3 avg = (s[0] + s[1] + s[2] + s[3]) * 0.25;
  float la = dot(avg, vec3(0.299, 0.587, 0.114));
  int hi = 0, lo = 0;
  for (int i = 1; i < 4; i++) {
    if (l[i] > l[hi]) hi = i;
    if (l[i] < l[lo]) lo = i;
  }
  // always keep some spread, so even flat areas show their block texture
  vec3 light = max(s[hi], clamp(avg * 1.22 + 0.03, 0.0, 1.0));
  vec3 dark = min(s[lo], avg * 0.72);
  float ll = dot(light, vec3(0.299, 0.587, 0.114));
  float ld = dot(dark, vec3(0.299, 0.587, 0.114));
  float frac = clamp((la - ld) / max(ll - ld, 1e-3), 0.0, 1.0);
  int lvl = int(clamp(floor(frac * 4.0 + h2 * 0.999), 0.0, 4.0));  // share of light pixels

  // sun glints on the lake twinkle in tarn-bright
  if (water > 0.5 && la > 0.8) {
    float tw = 0.5 + 0.5 * sin(t * (1.2 + h * 2.4) + h * 40.0);
    light = mix(PAPER, GLINT, 0.25 + 0.75 * step(0.6, tw));
    lvl = tw > 0.75 ? 2 : 3;
  }
  if (crest > 0.08) {
    light = mix(light, GLINT, clamp(crest * 1.8, 0.0, 0.9));
    lvl = max(lvl, 2);
  }

  // intro: cells build up from a light stipple to full blocks
  float delay = h * 0.55 + (1.0 - uv0.y) * 0.35;
  float prog = clamp((uIntro - delay) / 0.5, 0.0, 1.0);
  dark = mix(PAPER, dark, prog * prog);
  light = mix(PAPER, light, prog);

  // feather the skyline: partly-sky cells keep only their ink
  dark = mix(PAPER, dark, smoothstep(0.04, 0.7, alpha));

  ivec2 u = ivec2(floor(local / uUnit));
  vec3 ink = shade(lvl, u) ? light : dark;
  if (distance(ink, PAPER) < 0.02) discard;
  outColor = vec4(ink, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

function texture(gl: WebGL2RenderingContext, data: ImageData, mips: boolean) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  if (mips) gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}

/**
 * Hero meadow drawn in shade blocks (░ ▒ ▓ █). Each cell's block weight and ink are solved so the
 * cell averages to the painting's colour over paper. Hovering the lake sends out ripples;
 * depth drives a parallax shift toward the pointer.
 */
export function createEngine(canvas: HTMLCanvasElement, src: Sources): Engine {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) throw new Error("no webgl2");

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
  gl.useProgram(prog);
  const vao = gl.createVertexArray()!;

  const names = ["tImg", "tDepth", "uRes", "uCell", "uUnit", "uFit", "uLod", "uTime", "uIntro", "uDpr", "uPar", "uMouse", "uPush", "uRadius", "uRip"] as const;
  const U = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<(typeof names)[number], WebGLUniformLocation | null>;

  // flatten the transparent sky onto paper first, so mip levels don't bleed black into the skyline
  const flat = new ImageData(new Uint8ClampedArray(src.img.data), src.img.width, src.img.height);
  const paper = [251, 251, 248];
  for (let i = 0; i < flat.data.length; i += 4) {
    const a = flat.data[i + 3] / 255;
    for (let ch = 0; ch < 3; ch++) flat.data[i + ch] = flat.data[i + ch] * a + paper[ch] * (1 - a);
  }
  gl.activeTexture(gl.TEXTURE0);
  const imgTex = texture(gl, flat, true);
  gl.activeTexture(gl.TEXTURE1);
  const depthTex = texture(gl, src.depth, false);
  gl.uniform1i(U.tImg, 0);
  gl.uniform1i(U.tDepth, 1);
  gl.clearColor(0, 0, 0, 0);

  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let fit: Fit = { x: 0, y: 0, w: 1, h: 1 };

  const ripples = new Float32Array(MAX_RIPPLES * 4);
  for (let i = 0; i < MAX_RIPPLES; i++) ripples[i * 4 + 2] = -99;
  let rippleIdx = 0;
  let lastRipple = { x: -1e4, y: -1e4 };

  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, push: 0, pushT: 0 };
  const t0 = performance.now();
  let lastT = t0;
  let introStart = -1;
  let raf = 0;
  const now = () => (performance.now() - t0) / 1000;

  const waterAt = (x: number, y: number) => {
    const d = src.depth;
    const ix = Math.floor(((x - fit.x) / fit.w) * d.width);
    const iy = Math.floor(((y - fit.y) / fit.h) * d.height);
    if (ix < 0 || iy < 0 || ix >= d.width || iy >= d.height) return 0;
    return d.data[(iy * d.width + ix) * 4 + 1] / 255;
  };

  /** Is the cursor over blooms? Saturated warm / pink paint, averaged over a small patch. */
  const flowersAt = (x: number, y: number) => {
    const im = src.img;
    const cx = Math.floor(((x - fit.x) / fit.w) * im.width);
    const cy = Math.floor(((y - fit.y) / fit.h) * im.height);
    if (cx < 0 || cy < 0 || cx >= im.width || cy >= im.height) return 0;
    if (waterAt(x, y) > 0.5) return 0;
    let hits = 0;
    let total = 0;
    for (let oy = -6; oy <= 6; oy += 3)
      for (let ox = -6; ox <= 6; ox += 3) {
        const px = Math.min(im.width - 1, Math.max(0, cx + ox));
        const py = Math.min(im.height - 1, Math.max(0, cy + oy));
        const k = (py * im.width + px) * 4;
        const r = im.data[k], g = im.data[k + 1], b = im.data[k + 2], a = im.data[k + 3];
        total++;
        if (a < 128) continue;
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const sat = mx ? (mx - mn) / mx : 0;
        if (mx > 150 && sat > 0.45 && r >= Math.max(g, b) * 0.95) hits++;
      }
    return hits / total;
  };

  function addRipple(x: number, y: number, amp: number) {
    ripples.set([x * dpr, y * dpr, now(), amp], rippleIdx * 4);
    rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
  }

  function setStatic() {
    const narrow = cssW < 640;
    const cw = Math.round((narrow ? 4 : 5) * dpr);
    const ch = Math.round((narrow ? 7 : 9) * dpr);
    gl!.uniform2f(U.uRes, canvas.width, canvas.height);
    gl!.uniform2f(U.uCell, cw, ch);
    gl!.uniform1f(U.uUnit, Math.max(1, Math.round(dpr)));
    gl!.uniform4f(U.uFit, fit.x * dpr, fit.y * dpr, fit.w * dpr, fit.h * dpr);
    // one mip level per halving: average the painting over about one cell
    const imgPxPerCell = (Math.max(cw, ch) * src.img.width) / (fit.w * dpr);
    gl!.uniform1f(U.uLod, Math.max(0, Math.log2(imgPxPerCell * 0.5)));
    gl!.uniform1f(U.uDpr, dpr);
    gl!.uniform1f(U.uRadius, (narrow ? 70 : 110) * dpr);
  }

  function draw(t: number, intro: number) {
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.useProgram(prog);
    gl!.bindVertexArray(vao);
    gl!.uniform1f(U.uTime, t);
    gl!.uniform1f(U.uIntro, intro);
    gl!.uniform2f(U.uPar, parallax.x * dpr, parallax.y * dpr);
    gl!.uniform2f(U.uMouse, mouse.x * dpr, mouse.y * dpr);
    gl!.uniform1f(U.uPush, mouse.push);
    gl!.uniform4fv(U.uRip, ripples);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function frame() {
    const tNow = performance.now();
    const k = Math.min(2.5, (tNow - lastT) / 16.667);
    lastT = tNow;
    const ease = 1 - Math.pow(1 - 0.05, k);
    parallax.x += (parallax.tx - parallax.x) * ease;
    parallax.y += (parallax.ty - parallax.y) * ease;
    const follow = 1 - Math.pow(1 - 0.2, k);
    mouse.x += (mouse.tx - mouse.x) * follow;
    mouse.y += (mouse.ty - mouse.y) * follow;
    // springy: opens a little quicker than it closes
    const rate = mouse.pushT > mouse.push ? 0.12 : 0.06;
    mouse.push += (mouse.pushT - mouse.push) * (1 - Math.pow(1 - rate, k));
    const t = now();
    if (introStart < 0) introStart = t;
    draw(t, (t - introStart) / 1.3);
    raf = requestAnimationFrame(frame);
  }

  return {
    resize(w, h) {
      cssW = Math.max(1, w);
      cssH = Math.max(1, h);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      fit = layout(src, cssW, cssH);
      setStatic();
    },
    pointer(x, y) {
      if (mouse.push < 0.01) {
        mouse.x = x;
        mouse.y = y;
      }
      mouse.tx = x;
      mouse.ty = y;
      mouse.pushT = flowersAt(x, y) > 0.2 ? 1 : 0;
      parallax.tx = -((x / cssW) * 2 - 1) * 24;
      parallax.ty = -((y / cssH) * 2 - 1) * 9;
      // only the lake reacts: a ripple every ~34px of travel over the water
      if (waterAt(x, y) > 0.5 && Math.hypot(x - lastRipple.x, (y - lastRipple.y) * 2) > 34) {
        addRipple(x, y, 1);
        lastRipple = { x, y };
      }
    },
    leave() {
      mouse.pushT = 0;
      parallax.tx = 0;
      parallax.ty = 0;
    },
    start() {
      if (raf) return;
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    renderOnce() {
      draw(2, 10);
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteTexture(imgTex);
      gl.deleteTexture(depthTex);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
}
