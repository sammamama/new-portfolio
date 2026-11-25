"""
Prepare the hero meadow source from the reference painting.

Outputs (into OUT):
  meadow.v2.webp  RGBA colour over paper (alpha kept), sky made transparent, watermark inpainted
                  (bump the version in the name and in blocks/source.ts when the painting changes)
  depth.png    R = depth (0 far .. 255 near), G = water mask, B = foreground mask, A = 255
Debug images go to DBG.
"""
import sys
import numpy as np
import cv2
from scipy import ndimage as ndi

SRC, OUT, DBG = sys.argv[1], sys.argv[2], sys.argv[3]
W_OUT = 1600

img = cv2.imread(SRC, cv2.IMREAD_COLOR)  # BGR
H, W = img.shape[:2]

# ---------- 1. watermark (bottom-right "Qwen" logo) ----------
x0, y0, x1, y1 = 2370, 1395, 2700, 1505
box = img[y0:y1, x0:x1]
gray = cv2.cvtColor(box, cv2.COLOR_BGR2GRAY).astype(np.int16)
hsv = cv2.cvtColor(box, cv2.COLOR_BGR2HSV)
med_g = cv2.medianBlur(gray.astype(np.uint8), 31).astype(np.int16)
med_s = cv2.medianBlur(hsv[..., 1], 31).astype(np.int16)
wm = ((gray - med_g) > 18) & (hsv[..., 1].astype(np.int16) < med_s + 10)
wm = cv2.dilate(wm.astype(np.uint8) * 255, np.ones((5, 5), np.uint8), iterations=2)
mask = np.zeros((H, W), np.uint8)
mask[y0:y1, x0:x1] = wm
img = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
cv2.imwrite(f"{DBG}/wm_after.png", img[y0 - 40 : y1 + 30, x0 - 120 : W])
cv2.imwrite(f"{DBG}/wm_mask.png", mask[y0 - 40 : y1 + 30, x0 - 120 : W])

b, g, r = [img[..., i].astype(np.int16) for i in range(3)]

# ---------- 2. sky: near-white region connected to the top edge ----------
whiteish = np.minimum(np.minimum(r, g), b) > 232
lab, _ = ndi.label(whiteish)
top_ids = np.unique(lab[0][lab[0] > 0])
sky = np.isin(lab, top_ids)
sky = ndi.binary_opening(sky, iterations=2)
sky = ndi.binary_fill_holes(sky)
# land top per column (first non-sky row), smoothed
land_top = np.argmax(~sky, axis=0).astype(np.float32)
land_top = ndi.median_filter(land_top, size=41)

# ---------- 3. water: saturated blue + the glint inside it ----------
blue = (b > 120) & (b - r > 60) & (b - g > 15)
blue = ndi.binary_opening(blue, iterations=2)
lab, n = ndi.label(blue)
sizes = ndi.sum(blue, lab, range(1, n + 1))
water = lab == (1 + int(np.argmax(sizes)))
water = ndi.binary_closing(water, structure=np.ones((25, 25)))
water = ndi.binary_fill_holes(water)
cols = np.arange(W)
has = water.any(axis=0)
w_top = np.where(has, np.argmax(water, axis=0), np.nan).astype(np.float32)
w_bot = np.where(has, H - 1 - np.argmax(water[::-1], axis=0), np.nan).astype(np.float32)
for arr in (w_top, w_bot):
    bad = np.isnan(arr)
    arr[bad] = np.interp(cols[bad], cols[~bad], arr[~bad])
w_top = ndi.median_filter(w_top, size=241)
w_bot = ndi.median_filter(w_bot, size=61)

# ---------- 4. depth ----------
yy = np.arange(H, dtype=np.float32)[:, None]
lt = land_top[None, :]
wt = w_top[None, :]
wb = w_bot[None, :]
back = 0.08 + 0.27 * np.clip((yy - lt) / np.maximum(wt - lt, 1), 0, 1)       # far hills .. far shore
lake = 0.35 + 0.30 * np.clip((yy - wt) / np.maximum(wb - wt, 1), 0, 1)       # across the water
front = 0.7 + 0.3 * np.clip((yy - wb) / np.maximum(H - wb, 1), 0, 1)         # near bank
depth = np.where(yy < wt, back, np.where(yy <= wb, lake, front))
# foreground blooms that overlap the lake are near too: bright warm/pink pixels below mid-lake
warm = ((r > 170) & (r > b + 40)) | ((r > 180) & (b > 150) & (g < 150))
mid = (wt + wb) / 2
fg_over = warm & (yy > mid) & ~ndi.binary_erosion(water, iterations=3)
fg_over = ndi.binary_opening(fg_over, iterations=2)
fg_over = ndi.binary_dilation(fg_over, iterations=4)
depth = np.where(fg_over, np.maximum(depth, 0.8), depth)
depth = cv2.GaussianBlur(depth.astype(np.float32), (0, 0), 6)
depth[sky] = 0

water_m = ((yy >= wt) & (yy <= wb) & ~fg_over & ~sky).astype(np.float32)
water_m = cv2.GaussianBlur(water_m, (0, 0), 2)
front_m = ((yy > wb) | fg_over).astype(np.float32) * (~sky)
front_m = cv2.GaussianBlur(front_m, (0, 0), 3)

# ---------- 5. write ----------
alpha = (~sky).astype(np.float32)
alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2)
rgba = np.dstack([img, (alpha * 255).astype(np.uint8)])
h_out = round(H * W_OUT / W)
rgba_s = cv2.resize(rgba, (W_OUT, h_out), interpolation=cv2.INTER_AREA)
# bake the colour over paper (alpha kept), so mip levels never bleed black into the skyline and the
# browser doesn't have to do it per pixel on every load: rgb = rgb * a + paper * (1 - a)
PAPER_BGR = np.array([248, 251, 251], np.float32)  # --paper #FBFBF8
a = rgba_s[..., 3:4].astype(np.float32) / 255
rgba_s[..., :3] = np.clip(rgba_s[..., :3].astype(np.float32) * a + PAPER_BGR * (1 - a), 0, 255).astype(np.uint8)
# versioned name: /meadow/* is served with a long immutable cache, so a changed painting needs a new name
cv2.imwrite(f"{OUT}/meadow.v2.webp", rgba_s, [cv2.IMWRITE_WEBP_QUALITY, 86])

dw, dh = W_OUT // 2, h_out // 2
data = np.dstack(
    [
        (front_m * 255).astype(np.uint8),  # B (cv2 is BGR)
        (water_m * 255).astype(np.uint8),  # G
        (np.clip(depth, 0, 1) * 255).astype(np.uint8),  # R
    ]
)
data = cv2.resize(data, (dw, dh), interpolation=cv2.INTER_AREA)
cv2.imwrite(f"{OUT}/depth.png", data)

dbg = cv2.resize(data, (dw, dh))
cv2.imwrite(f"{DBG}/depth_dbg.png", dbg)
print("size", W, H, "->", W_OUT, h_out, "| sky %.2f water %.2f" % (sky.mean(), water.mean()))
