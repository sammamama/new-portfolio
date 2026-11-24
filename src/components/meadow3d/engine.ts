import * as THREE from "three";
import { ASCII_FRAG, CELL_FRAG, GLOW_FRAG, MAX_RIPPLES, PHOTO_FRAG, QUAD_VERT, RAMP } from "./shaders";

export type Meadow = {
  resize: (w: number, h: number) => void;
  pointer: (x: number, y: number) => void;
  leave: () => void;
  splash: (x: number, y: number) => void;
  start: () => void;
  stop: () => void;
  renderOnce: () => void;
  dispose: () => void;
};

const IMG_URL = "/meadow/meadow.webp";
const DEPTH_URL = "/meadow/depth.png";

/** One row of glyphs, each drawn into an exact device-px cell; sampled with nearest filtering. */
function makeAtlas(fontFamily: string, cw: number, ch: number) {
  const c = document.createElement("canvas");
  c.width = cw * RAMP.length;
  c.height = ch;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `500 ${Math.round(ch * 0.92)}px ${fontFamily}`;
  for (let i = 0; i < RAMP.length; i++) g.fillText(RAMP[i], cw * i + cw / 2, ch / 2 + ch * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

function rawTexture(img: HTMLImageElement) {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.NoColorSpace; // sample the sRGB values as they are
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/**
 * Hero meadow: the reference painting as a 2.5D scene (depth map → parallax, water ripples,
 * swaying blooms), drawn through a GPU port of three.js AsciiEffect.
 */
export async function createMeadow(opts: { canvas: HTMLCanvasElement; fontFamily: string }): Promise<Meadow> {
  const { canvas, fontFamily } = opts;
  const [img, depthImg] = await Promise.all([loadImage(IMG_URL), loadImage(DEPTH_URL)]);

  // CPU copy of the water mask, so the pointer only ripples the lake
  const probe = document.createElement("canvas");
  probe.width = depthImg.width;
  probe.height = depthImg.height;
  const pctx = probe.getContext("2d", { willReadFrequently: true })!;
  pctx.drawImage(depthImg, 0, 0);
  const maskData = pctx.getImageData(0, 0, probe.width, probe.height).data;
  const waterAt = (u: number, v: number) => {
    if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
    const x = Math.min(probe.width - 1, Math.floor(u * probe.width));
    const y = Math.min(probe.height - 1, Math.floor((1 - v) * probe.height));
    return maskData[(y * probe.width + x) * 4 + 1] / 255;
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  const imgTex = rawTexture(img);
  const depthTex = rawTexture(depthImg);
  const imgAspect = img.width / img.height;
  const time = { value: 0 };

  /* render targets */
  const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const cellRT = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  const glowRT = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  const shared = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uCell: { value: new THREE.Vector2(7, 11) },
    uGrid: { value: new THREE.Vector2(1, 1) },
  };
  const pass = (frag: string, uniforms: Record<string, THREE.IUniform>) =>
    new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: frag,
      uniforms,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });

  const ripples = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0));
  let rippleIdx = 0;
  const photoUniforms = {
    tImg: { value: imgTex },
    tDepth: { value: depthTex },
    uTarget: { value: new THREE.Vector2(1, 1) },
    uRes: shared.uRes,
    uImgPos: { value: new THREE.Vector2(0, 0) },
    uImgSize: { value: new THREE.Vector2(1, 1) },
    uParallax: { value: new THREE.Vector2(0, 0) },
    uTime: time,
    uRipples: { value: ripples },
  };
  const photoMat = pass(PHOTO_FRAG, photoUniforms);
  const cellMat = pass(CELL_FRAG, { tScene: { value: sceneRT.texture }, uRes: shared.uRes, uCell: shared.uCell });
  const glowMat = pass(GLOW_FRAG, { tCell: { value: cellRT.texture }, uGrid: shared.uGrid });
  let atlas = makeAtlas(fontFamily, 7, 11);
  const asciiUniforms = {
    ...shared,
    tCell: { value: cellRT.texture },
    tGlow: { value: glowRT.texture },
    tAtlas: { value: atlas },
    uMouse: { value: new THREE.Vector2(-1e4, -1e4) },
    uRadius: { value: 120 },
    uPush: { value: 0 },
    uGlow: { value: 0.3 },
    uGlyphs: { value: RAMP.length },
    uTime: time,
  };
  const asciiMat = pass(ASCII_FRAG, asciiUniforms);

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMat);
  quad.frustumCulled = false;
  const post = new THREE.Scene();
  post.add(quad);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* state */
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  // image placement in CSS px (top-left origin)
  const fit = { x: 0, y: 0, w: 1, h: 1 };
  const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, active: 0, activeT: 0 };
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  let lastRipple = { u: 1e4, v: 1e4 };
  const t0 = performance.now();
  let raf = 0;

  /*
   * Framing: bottom-anchored. Fit the width on wide screens; on narrow/portrait screens keep the
   * landscape (the lower ~70% of the painting) at least half the hero tall and crop the sides.
   */
  function layout() {
    let h = cssW / imgAspect;
    const minH = (cssH * 0.52) / 0.7;
    if (h < minH) h = minH;
    const w = h * imgAspect;
    fit.w = w;
    fit.h = h;
    fit.x = (cssW - w) * 0.42; // keep a little more of the hill than the right bank when cropping
    fit.y = cssH - h;
    photoUniforms.uImgSize.value.set(w * dpr, h * dpr);
    photoUniforms.uImgPos.value.set(fit.x * dpr, 0);
  }

  const toUV = (x: number, y: number) => ({ u: (x - fit.x) / fit.w, v: 1 - (y - fit.y) / fit.h });

  function addRipple(u: number, v: number, amp: number) {
    ripples[rippleIdx].set(u, v, time.value, amp);
    rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
  }

  function draw(fixed?: number) {
    time.value = fixed ?? (performance.now() - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.14;
    mouse.y += (mouse.ty - mouse.y) * 0.14;
    mouse.active += (mouse.activeT - mouse.active) * 0.08;
    asciiUniforms.uMouse.value.set(mouse.x * dpr, (cssH - mouse.y) * dpr);
    asciiUniforms.uPush.value = 34 * dpr * mouse.active;
    parallax.x += (parallax.tx - parallax.x) * 0.05;
    parallax.y += (parallax.ty - parallax.y) * 0.05;
    photoUniforms.uParallax.value.set(-parallax.x * 0.018, parallax.y * 0.01);

    quad.material = photoMat;
    renderer.setRenderTarget(sceneRT);
    renderer.render(post, ortho);

    quad.material = cellMat;
    renderer.setRenderTarget(cellRT);
    renderer.render(post, ortho);

    quad.material = glowMat;
    renderer.setRenderTarget(glowRT);
    renderer.render(post, ortho);

    quad.material = asciiMat;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(post, ortho);
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  return {
    resize(w, h) {
      cssW = Math.max(1, w);
      cssH = Math.max(1, h);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(cssW, cssH, false);
      const resW = Math.round(cssW * dpr);
      const resH = Math.round(cssH * dpr);
      const cw = cssW < 640 ? 6 : 7;
      const cellW = Math.round(cw * dpr);
      const cellH = Math.round(cw * 1.6 * dpr);
      const cols = Math.ceil(resW / cellW);
      const rows = Math.ceil(resH / cellH);
      sceneRT.setSize(cols * 2, rows * 2);
      cellRT.setSize(cols, rows);
      glowRT.setSize(cols, rows);
      photoUniforms.uTarget.value.set(cols * 2, rows * 2);
      shared.uRes.value.set(resW, resH);
      shared.uCell.value.set(cellW, cellH);
      shared.uGrid.value.set(cols, rows);
      atlas.dispose();
      atlas = makeAtlas(fontFamily, cellW, cellH);
      asciiUniforms.tAtlas.value = atlas;
      asciiUniforms.uRadius.value = 120 * dpr;
      layout();
    },
    pointer(x, y) {
      if (mouse.activeT === 0) {
        mouse.x = x;
        mouse.y = y;
      }
      mouse.tx = x;
      mouse.ty = y;
      mouse.activeT = 1;
      parallax.tx = (x / cssW) * 2 - 1;
      parallax.ty = (y / cssH) * 2 - 1;
      const { u, v } = toUV(x, y);
      if (waterAt(u, v) > 0.5 && Math.hypot((u - lastRipple.u) * imgAspect, v - lastRipple.v) > 0.03) {
        addRipple(u, v, 1);
        lastRipple = { u, v };
      }
    },
    leave() {
      mouse.activeT = 0;
      parallax.tx = 0;
      parallax.ty = 0;
    },
    splash(x, y) {
      const { u, v } = toUV(x, y);
      if (waterAt(u, v) > 0.5) {
        addRipple(u, v, 2.4);
        lastRipple = { u, v };
      }
    },
    start() {
      if (!raf) raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    renderOnce() {
      draw(2);
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      quad.geometry.dispose();
      [photoMat, cellMat, glowMat, asciiMat].forEach((m) => m.dispose());
      [imgTex, depthTex, atlas].forEach((t) => t.dispose());
      sceneRT.dispose();
      cellRT.dispose();
      glowRT.dispose();
      renderer.dispose();
    },
  };
}
