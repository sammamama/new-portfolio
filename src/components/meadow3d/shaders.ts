export const MAX_RIPPLES = 8;

/** AsciiEffect's default charset, light → heavy. On paper, dark pixels get the heavy glyphs. */
export const RAMP = " .:-=+*#%@";

const HASH = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/* ---------------- full-screen passes ---------------- */
export const QUAD_VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/*
 * Pass 0 (2·cols × 2·rows target): the painting as a 2.5D scene.
 *   tImg   RGBA painting, sky already transparent (sRGB values, no conversion)
 *   tDepth R = depth (0 far … 1 near), G = water mask, B = foreground mask
 * Depth drives a parallax shift toward the pointer; water gets a shimmer, ripples and twinkling
 * glints; near blooms sway. Output is premultiplied.
 */
export const PHOTO_FRAG = /* glsl */ `
uniform sampler2D tImg;
uniform sampler2D tDepth;
uniform vec2 uTarget;    // this render target, px
uniform vec2 uRes;       // canvas, device px
uniform vec2 uImgPos;    // image bottom-left on canvas, device px (GL origin)
uniform vec2 uImgSize;   // image size on canvas, device px
uniform vec2 uParallax;  // uv shift at depth 1
uniform float uTime;
uniform vec4 uRipples[${MAX_RIPPLES}]; // u, v, startTime, amplitude
${HASH}

void main() {
  vec2 px = gl_FragCoord.xy / uTarget * uRes;
  vec2 uv = (px - uImgPos) / uImgSize;
  float aspect = uImgSize.x / uImgSize.y;

  // parallax: near layers move more than far ones
  float depth = texture2D(tDepth, uv).r;
  uv += uParallax * (depth - 0.35);

  vec3 m = texture2D(tDepth, uv).rgb;
  float water = m.g;
  float front = m.b;

  // water: slow horizontal shimmer + pointer ripples (squashed vertically for perspective)
  vec2 off = vec2(sin(uv.y * 520.0 + uTime * 1.6) * 0.0009, 0.0) * water;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 4.0) continue;
    vec2 d = (uv - r.xy) * vec2(aspect, 3.2);
    float dist = length(d);
    float x = dist - age * 0.11;
    float wave = sin(x * 140.0) * exp(-x * x * 900.0) * exp(-age * 0.9) * r.w;
    off += (dist > 1e-4 ? d / dist : vec2(0.0)) * wave * 0.006 * vec2(1.0 / aspect, 1.0 / 3.2) * water;
  }

  // near blooms sway a little
  off.x += sin(uTime * 1.1 + uv.x * 24.0 + uv.y * 9.0) * 0.0016 * front * smoothstep(0.65, 1.0, depth);

  vec4 c = texture2D(tImg, uv + off);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) c = vec4(0.0);

  // glints twinkle
  float L = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float tw = hash12(floor(uv * vec2(260.0, 150.0)) + floor(uTime * 3.0));
  c.rgb += water * smoothstep(0.62, 0.9, L) * (tw - 0.45) * 0.5;

  gl_FragColor = vec4(c.rgb * c.a, c.a);
}
`;

/*
 * Pass 1 (cols × rows target): one texel per glyph cell.
 * Averages the scene under the cell (4 linear taps on a 2× target ≈ AsciiEffect's downscale)
 * and un-premultiplies. Alpha = coverage (0 = sky).
 */
export const CELL_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform vec2 uRes;   // canvas, device px
uniform vec2 uCell;  // device px
void main() {
  vec2 c = gl_FragCoord.xy * uCell;           // cell centre in device px
  vec2 o = uCell * 0.25;
  vec4 s = texture2D(tScene, (c + vec2(-o.x, -o.y)) / uRes)
         + texture2D(tScene, (c + vec2( o.x, -o.y)) / uRes)
         + texture2D(tScene, (c + vec2(-o.x,  o.y)) / uRes)
         + texture2D(tScene, (c + vec2( o.x,  o.y)) / uRes);
  s *= 0.25;
  vec3 rgb = s.a > 0.001 ? s.rgb / s.a : vec3(0.0);
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), s.a);
}
`;

/*
 * Pass 2 (cols × rows target): glow source. Bright cells (the sun glint, sunlit petals)
 * are blurred into a soft halo in their own colour.
 */
export const GLOW_FRAG = /* glsl */ `
uniform sampler2D tCell;
uniform vec2 uGrid; // cols, rows
float bright(vec4 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float L = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float tint = max(smoothstep(-0.01, 0.06, c.b - c.r), smoothstep(0.08, 0.22, mx - mn));
  return smoothstep(0.8, 0.95, L) * tint * step(0.5, c.a);
}
void main() {
  vec3 acc = vec3(0.0);
  float w = 0.0;
  float m = 0.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 o = vec2(float(i), float(j));
      vec4 c = texture2D(tCell, (gl_FragCoord.xy + o) / uGrid);
      float k = exp(-dot(o, o) * 0.35);
      float b = bright(c) * k;
      acc += c.rgb * b;
      w += b;
      m += k;
    }
  }
  gl_FragColor = vec4(w > 0.0 ? acc / w : vec3(0.0), w / m);
}
`;

/*
 * Pass 3 (canvas): the AsciiEffect look on the GPU.
 *   brightness → glyph from " .:-=+*#%@" (dark = heavy, on paper)
 *   each glyph keeps its cell's colour
 *   sky (alpha 0) is left transparent so the paper shows through
 *   cursor pushes the picture away; bright cells sparkle and glow
 */
export const ASCII_FRAG = /* glsl */ `
uniform sampler2D tCell;
uniform sampler2D tGlow;
uniform sampler2D tAtlas;
uniform vec2 uRes;     // device px
uniform vec2 uCell;    // device px
uniform vec2 uGrid;    // cols, rows
uniform vec2 uMouse;   // device px, GL origin (bottom-left)
uniform float uRadius; // device px
uniform float uPush;   // device px
uniform float uGlow;
uniform float uGlyphs;
uniform float uTime;
${HASH}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 cell = floor(px / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 uv = fract(px / uCell);

  // cursor repel: cells near the pointer show the picture from further away
  vec2 d = center - uMouse;
  float dist = length(d);
  float f = clamp(1.0 - dist / uRadius, 0.0, 1.0);
  vec2 src = center - (dist > 0.5 ? d / dist * f * f * uPush : vec2(0.0));
  vec2 srcCell = floor(src / uCell);
  vec4 c = texture2D(tCell, (srcCell + 0.5) / uGrid);

  float glyph = 0.0;
  vec3 col = c.rgb;
  if (c.a > 0.5) {
    float L = luma(c.rgb);
    // glyph weight follows how vivid the cell is (HSV value with a nudge for saturation):
    // sunlit petals, grass and water → dense glyphs; shadows → sparse dots. Colour does the rest.
    float V = max(c.r, max(c.g, c.b));
    float S = V - min(c.r, min(c.g, c.b));
    float weight = clamp(0.12 + pow(V, 1.4) * 0.78 + S * 0.2, 0.0, 1.0);
    float idx = clamp(floor(weight * uGlyphs), 1.0, uGlyphs - 1.0);

    // bright cells (glint, sunlit petals) flip to a sparkle glyph so they don't vanish on paper
    float tint = max(smoothstep(-0.01, 0.06, c.b - c.r), smoothstep(0.08, 0.2, S));
    float hot = smoothstep(0.7, 0.85, L) * tint;
    if (hot > 0.5) idx = hash12(srcCell + floor(uTime * 3.0)) > 0.5 ? 6.0 : 5.0;

    // ink on paper: push saturation, deepen a touch, never lighter than the paper can show
    col = clamp(mix(vec3(L), col, 1.35), 0.0, 1.0);
    col = mix(col, vec3(0.25, 0.42, 0.9), hot);
    col = min(col, vec3(0.9));

    vec2 a = vec2((idx + clamp(uv.x, 0.0, 0.999)) / uGlyphs, uv.y);
    glyph = texture2D(tAtlas, a).a * smoothstep(0.5, 0.75, c.a);
  }

  // soft halo under bright glyphs, in their own colour (not additive: it has to show on white)
  vec4 g = texture2D(tGlow, px / uCell / uGrid);
  vec3 hc = clamp(mix(vec3(luma(g.rgb)), g.rgb, 1.4), 0.0, 1.0) * 0.9;
  float ha = clamp(g.a * uGlow, 0.0, 0.5) * (1.0 - glyph);

  float alpha = glyph + ha;
  vec3 rgb = col * glyph + hc * ha;
  gl_FragColor = vec4(rgb, alpha); // premultiplied
}
`;
