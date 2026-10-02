// Our emblem, painted on the concrete tower of the developers' Little Bird picture (littlebird-2, 3840 x 2160): the
// wall's plane, the emblem's shapes on it, and the paint's recipe. Shared by the film (film.js: where the paint goes,
// the lock box) and by scripts/intro-svg.mjs, which draws the paint's layers once into public/images/intro/ (the
// site's CSP takes no picture made by the page). Constants only: nothing here depends on the screen.

const lerp = (a, b, f) => a + (b - a) * f;

// The big flat wall of the concrete tower (front face, x 1886..2301, top edge y 1192.7..1221.6, bottom edge
// 1333.5..1369.7, measured with edge profiles). Camera model of the picture from the two vanishing points of the
// tower (front face: top and bottom edges meet at -6207, 629; right face: 4392, 677): focal 4462 px, principal
// point at the centre, looking down about 5 degrees. The face is the plane O + u * EU + v * EV (u to the right, v
// down, same unit on both axes, so a square on the wall is a square in (u, v)); O is its top-left corner.
// Checked: the four corners reproject within 0.2 px; face 0.1016 x 0.0319 units.
export const WALL = {
  f: 4462,
  px: 1920,
  py: 1080,
  O: [(1885.5 - 1920) / 4462, (1192.66 - 1080) / 4462, 1],
  EU: [0.87555, 0.048587, -0.4807],
  EV: [-0.004509, 0.99571, 0.09243],
};
// Our emblem on it: centre (u, v) and side of the 1024 box, in wall units. It sits between the painted "4"
// (right edge x 1936) and the ladder (x 2104), with even margins on both sides (about 30 px) and above and below
// (about 11 px): painted extent x 1965..2073, y 1213..1334.
export const EMB = { u: 0.0338, v: 0.01594, size: 0.0329 };

// ---------------------------------------------------------------------------------------------------------
// The painted emblem: the wall plane to picture pixels, and the emblem's 1024 grid to the wall.
function wallToImg(u, v) {
  const { O, EU, EV, f, px, py } = WALL;
  const X = O[0] + u * EU[0] + v * EV[0];
  const Y = O[1] + u * EU[1] + v * EV[1];
  const Z = O[2] + u * EU[2] + v * EV[2];
  return { x: px + (f * X) / Z, y: py + (f * Y) / Z };
}
export function E2I(ex, ey) {
  return wallToImg(EMB.u + ((ex - 512) / 1024) * EMB.size, EMB.v + ((ey - 512) / 1024) * EMB.size);
}
function strokeOutline(pts, w) {
  const h = w / 2;
  const left = [];
  const right = [];
  const tang = (i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const n = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[0] - a[0]) / n, (b[1] - a[1]) / n];
  };
  for (let i = 0; i < pts.length; i++) {
    const [tx, ty] = tang(i);
    left.push([pts[i][0] - ty * h, pts[i][1] + tx * h]);
    right.push([pts[i][0] + ty * h, pts[i][1] - tx * h]);
  }
  const cap = (p, [tx, ty], a0, a1) => {
    const base = Math.atan2(ty, tx);
    const out = [];
    for (let s = 1; s < 16; s++) {
      const a = base + a0 + ((a1 - a0) * s) / 16;
      out.push([p[0] + h * Math.cos(a), p[1] + h * Math.sin(a)]);
    }
    return out;
  };
  const n = pts.length - 1;
  return [
    ...left,
    ...cap(pts[n], tang(n), Math.PI / 2, -Math.PI / 2),
    ...right.reverse(),
    ...cap(pts[0], tang(0), -Math.PI / 2, -1.5 * Math.PI),
  ];
}
function sampleLine(a, b, step) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
  const out = [];
  for (let i = 0; i <= n; i++) out.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]);
  return out;
}
function sampleArc(c, r, a0, a1, n) {
  const out = [];
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
  }
  return out;
}
// Our emblem (1024 grid): two rounded corner brackets and three capsules tilted about 22 degrees.
export function emblemPolys() {
  const bracketTR = [
    ...sampleLine([319, 137.5], [771, 137.5], 6),
    ...sampleArc([771, 251.5], 114, -Math.PI / 2, 0, 28),
    ...sampleLine([885, 251.5], [885, 715], 6),
  ];
  const bracketBL = [
    ...sampleLine([705, 886.5], [253, 886.5], 6),
    ...sampleArc([253, 772.5], 114, Math.PI / 2, Math.PI, 28),
    ...sampleLine([139, 772.5], [139, 309], 6),
  ];
  return [
    [strokeOutline(bracketTR, 44), 'bracket', 'b'],
    [strokeOutline(bracketBL, 44), 'bracket', 'b'],
    [strokeOutline(sampleLine([420.6, 396.8], [320.6, 616.6], 8), 80), 'green', 'c'],
    [strokeOutline(sampleLine([571.5, 366.8], [451.7, 656.4], 8), 82), 'red', 'c'],
    [strokeOutline(sampleLine([702.6, 396.8], [602.6, 616.6], 8), 80), 'blue', 'c'],
  ];
}
// Painted extent (outer edge of the strokes) in picture px, and the patch of the picture that receives it.
const EXT = (() => {
  const pts = emblemPolys().flatMap(([poly]) => poly.map(([x, y]) => E2I(x, y)));
  return {
    x1: Math.min(...pts.map((p) => p.x)),
    y1: Math.min(...pts.map((p) => p.y)),
    x2: Math.max(...pts.map((p) => p.x)),
    y2: Math.max(...pts.map((p) => p.y)),
  };
})();
export const PATCH = (() => {
  const m = 14;
  const x = Math.floor(EXT.x1 - m);
  const y = Math.floor(EXT.y1 - m);
  return { x, y, w: Math.ceil(EXT.x2 + m) - x, h: Math.ceil(EXT.y2 + m) - y };
})();
// The lock box of the emblem: the brackets' centre lines (117..906), in picture px.
export const EBOX = (() => {
  const pts = [];
  for (let i = 0; i <= 8; i++)
    for (const [x, y] of [
      [95 + (833 * i) / 8, 95],
      [95 + (833 * i) / 8, 928],
      [95, 95 + (833 * i) / 8],
      [928, 95 + (833 * i) / 8],
    ])
      pts.push(E2I(x, y));
  return {
    x1: Math.min(...pts.map((p) => p.x)),
    y1: Math.min(...pts.map((p) => p.y)),
    x2: Math.max(...pts.map((p) => p.x)),
    y2: Math.max(...pts.map((p) => p.y)),
  };
})();
export const EAIM = E2I(512, 512);

// Paint. Albedo: aged, slightly faded versions of the symbol's colours. The wall is a pinkish concrete
// (about 180,139,131) in a soft, almost neutral evening light: the light is measured on the white "4" already
// painted on the same wall (237,218,213): a white paint there = albedo x wall luminance x tint x gain. So the
// paint takes the wall's own light and stains (its luminance), not its pink colour, and our off-white lands
// just under the "4", as an older coat of the same kind of paint.
export const PAINT = {
  bracket: '#f3eee4',
  green: '#4f9a5c',
  red: '#bf4d40',
  blue: '#3a74bd',
  // Light on the wall = grey of the photo (broad light and stains from a blurred copy, plus `tex` of the wall's
  // fine texture: pores, rivets, slab joints), x tint, x gain.
  gain: 1.6,
  gainB: 1.72,
  tint: 'rgb(255,235,229)',
  blur: 1.6,
  tex: 0.7,
  // The off-white brackets a little brighter (a thicker coat, like the "4"); saturation of the brackets and of the
  // capsules (old paint).
  satB: 0.9,
  satC: 0.84,
  // Dark grime of the wall carried over the paint (multiply of a brightened grey copy of the photo).
  grime: 0.55,
  // Fine relief of the concrete (high-pass of the photo: strength, radius, contrast) over the paint.
  hp: 0.7,
  hpR: 1.8,
  hpC: 2,
  grain: 0.08,
  mottle: 0.12,
  opacity: 0.93,
};
// Coverage (alpha only), a worn stencil at this emblem's size (about 108 x 120 px): chipped along the edges (noise
// against the distance to the edge), worn thin in broad patches, the capsules with a few worn spots, a faint
// overspray, and the crisp edge of the paint already on this wall (the "4" goes from wall to paint in about one
// pixel).
export const WEAR = {
  b: {
    chipF: 0.16,
    oct: 3,
    seed: 11,
    chipS: 12,
    chipI: -3.3,
    wearF: 0.05,
    wearSeed: 4,
    edge: 0.9,
    inS: 6.7,
    inI: -5,
    wearS: 1.3,
    wearI: 0.5,
    spray: 0.7,
    sprayA: 0.05,
    soft: 0.35,
  },
  c: {
    chipF: 0.21,
    oct: 3,
    seed: 23,
    chipS: 10,
    chipI: -3.0,
    wearF: 0.07,
    wearSeed: 7,
    edge: 1.0,
    inS: 5,
    inI: -3.4,
    wearS: 4.2,
    wearI: -0.3,
    spray: 0.7,
    sprayA: 0.05,
    soft: 0.35,
  },
};
