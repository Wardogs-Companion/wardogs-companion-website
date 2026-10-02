// Draws the intro's still SVG pictures into public/images/intro/: the emblem's paint layers (its colours, a mask picking
// out the brackets, its worn coverage, in the wall's own perspective) and the screen's grain. The film paints them onto
// its canvases (film.js, buildPaint and paintTexture). They depend only on the constants of src/scripts/intro/emblem.js,
// so they are made once, here, rather than by the page: the site's CSP takes no picture the page would make itself.
// Run it again after changing those constants: npm run intro:svg
import { mkdirSync, writeFileSync } from 'node:fs';
import { E2I, PAINT, PATCH, WEAR, emblemPolys } from '../src/scripts/intro/emblem.js';

// Paint albedo of one group of shapes ('b' brackets or 'c' capsules), opaque on black, each shape grown by a
// pixel so the soft coverage edge never mixes in black. Not flat: a fine grain and a broader mottling.
// With `sel`: plain white shapes (grown by 2 px) on transparent, to pick one group out of the other.
function paintColourSVG(group, sel) {
  const { x: ox, y: oy, w, h } = PATCH;
  const grey = (a, b) => `values="${a} 0 0 0 ${b} ${a} 0 0 0 ${b} ${a} 0 0 0 ${b} 0 0 0 0 1"`;
  const d = (poly) =>
    'M' +
    poly
      .map(([x, y]) => {
        const q = E2I(x, y);
        return `${(q.x - ox).toFixed(2)} ${(q.y - oy).toFixed(2)}`;
      })
      .join('L') +
    'Z';
  const polys = emblemPolys().filter((p) => p[2] === group);
  if (sel)
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      polys
        .map(
          ([poly]) =>
            `<path d="${d(poly)}" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`,
        )
        .join('') +
      '</svg>'
    );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><filter id="tex" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="5" result="g0"/><feColorMatrix in="g0" type="matrix" ${grey(PAINT.grain * 2, 1 - PAINT.grain)} result="g"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="12" result="m0"/><feColorMatrix in="m0" type="matrix" ${grey(PAINT.mottle * 2, 1 - PAINT.mottle)} result="m"/>` +
    '<feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="a"/>' +
    '<feComposite in="a" in2="m" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="b"/>' +
    '<feComposite in="b" in2="SourceGraphic" operator="in"/></filter></defs>' +
    `<rect width="${w}" height="${h}" fill="#000"/><g filter="url(#tex)">` +
    polys
      .map(
        ([poly, col]) =>
          `<path d="${d(poly)}" fill="${PAINT[col]}" stroke="${PAINT[col]}" stroke-width="2" stroke-linejoin="round"/>`,
      )
      .join('') +
    '</g></svg>'
  );
}

// Coverage (alpha only): the worn stencil (WEAR), one filter for the brackets, one for the capsules.
function paintMaskSVG() {
  const { x: ox, y: oy, w, h } = PATCH;
  const d = (poly) =>
    'M' +
    poly
      .map(([x, y]) => {
        const q = E2I(x, y);
        return `${(q.x - ox).toFixed(2)} ${(q.y - oy).toFixed(2)}`;
      })
      .join('L') +
    'Z';
  const f = (id, o) =>
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${o.chipF}" numOctaves="${o.oct}" seed="${o.seed}" result="n1"/>` +
    '<feColorMatrix in="n1" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0" result="nA"/>' +
    `<feComponentTransfer in="nA" result="chipMask"><feFuncA type="linear" slope="${o.chipS}" intercept="${o.chipI}"/></feComponentTransfer>` +
    `<feTurbulence type="fractalNoise" baseFrequency="${o.wearF}" numOctaves="3" seed="${o.wearSeed}" result="n2"/>` +
    '<feColorMatrix in="n2" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0" result="wA"/>' +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${o.edge}" result="eb"/>` +
    `<feComponentTransfer in="eb" result="interior"><feFuncA type="linear" slope="${o.inS}" intercept="${o.inI}"/></feComponentTransfer>` +
    '<feComposite in="chipMask" in2="interior" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="chip"/>' +
    '<feComposite in="SourceGraphic" in2="chip" operator="in" result="paint"/>' +
    `<feComposite in="wA" in2="wA" operator="arithmetic" k1="0" k2="${o.wearS}" k3="0" k4="${o.wearI}" result="wear"/>` +
    '<feComposite in="paint" in2="wear" operator="in" result="paintW"/>' +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${o.spray}" result="s0"/>` +
    `<feColorMatrix in="s0" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${o.sprayA} 0" result="spray"/>` +
    '<feMerge result="m"><feMergeNode in="spray"/><feMergeNode in="paintW"/></feMerge>' +
    `<feGaussianBlur in="m" stdDeviation="${o.soft}"/></filter>`;
  const polys = emblemPolys();
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    '<defs>' +
    f('pb', WEAR.b) +
    f('pc', WEAR.c) +
    '</defs>' +
    ['b', 'c']
      .map(
        (g) =>
          `<g filter="url(#p${g})">` +
          polys
            .filter((p) => p[2] === g)
            .map(([poly]) => `<path d="${d(poly)}" fill="#fff"/>`)
            .join('') +
          '</g>',
      )
      .join('') +
    '</svg>'
  );
}

// The screen's grain: a tile of fractal noise, laid over the scenery (paintTexture).
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='.14'/></svg>";

const out = new URL('../public/images/intro/', import.meta.url);
mkdirSync(out, { recursive: true });
const files = {
  'emblem-brackets.svg': paintColourSVG('b'),
  'emblem-capsules.svg': paintColourSVG('c'),
  'emblem-brackets-select.svg': paintColourSVG('b', true),
  'emblem-wear.svg': paintMaskSVG(),
  'grain.svg': GRAIN_SVG,
};
for (const [name, svg] of Object.entries(files)) writeFileSync(new URL(name, out), svg + '\n');
console.log(`intro-svg: ${Object.keys(files).length} files written to public/images/intro/`);
