// The home page's console: the tower's computer, rebuilt from the game's pictures, that the visitor switches on and
// reads (src/components/Station.astro). mountStation(ROOT) runs it inside its root element, #station, and returns what
// the page needs to share the screen with the intro film (src/scripts/home.js).
import { stationTexts } from '../../i18n/station';
import { SECTIONS as SECTION_IDS, sectionPath } from './sections.js';
import { TWITCH_EXTENSION } from './links.js';
import { createConsoleSounds, fetchConsoleSounds } from './sounds.js';
import dataZones from './data/zones.json';
import dataPieces from './data/pieces.json';
import dataKeys from './data/keys.json';
import dataGlass from './data/glass.json';
import dataScreens from './data/screens.json';
import dataKnob from './data/knob.json';
import dataLenses from './data/lenses.json';
import dataLights from './data/lights-calibration.json';

/**
 * The console's state (loading, ready, error), on its root, for its own rules, and on the page's root element
 * (data-station), for the page under it (station.css: held still while the console is loading or ready). Not found
 * from the page's rules by :has(): Chromium then restyles the whole page at each change in the console.
 * @param {HTMLElement} root the console's root (#station)
 * @param {'loading' | 'ready' | 'error'} state
 */
export function stationState(root, state) {
  root.dataset.state = state;
  document.documentElement.dataset.station = state;
}

/**
 * @param {HTMLElement} ROOT the console's root (#station)
 * @param {{ held?: boolean }} [options] held: the console waits, built but not started, until start() (the intro
 *   film plays over it first)
 * @returns {{ start: () => void, hold: () => void }} start: the console opens (or opens again), as it would alone;
 *   hold: it stands, drawing nothing, answering no key, silent (the film replayed over it)
 */
export function mountStation(ROOT, { held: heldAtStart = false } = {}) {
  // the root claimed: the page's style sheet no longer gives it up by itself (station.css: unclaimed)
  stationState(ROOT, 'loading');
  // onHold (see start, hold); begun: opened since the page loaded; buildGo: held from the start, the console builds only
  // once start() is called (its build is long: under the film it would stall it)
  let onHold = heldAtStart,
    begun = false,
    buildGo = null;
  // a load that takes too long (a very slow connection) gives the page back to the presentation: LOAD_LIMIT ms, counted
  // from when the console is asked to open (not while it is built under the film)
  const LOAD_LIMIT = 15000;
  let loadTimer = 0,
    loadGivenUp = false;
  // ?ct=<s>: the console still, as it is s after it opens (an inspection tool, as the intro's ?t=)
  const stillT = (() => {
    const v = new URLSearchParams(location.search).get('ct');
    return v !== null && Number.isFinite(+v) ? Math.max(0, +v) : null;
  })();
  // ===================================================================================================================
  // Settings
  // ===================================================================================================================
  // the pictures: the console media, fetched by the build (src/integrations/game-media.mjs), each one's name marked
  // .game. (.gitignore keeps such files out of the repository)
  const WEB = ROOT.dataset.media;
  const media = (file) => WEB + file.replace(/\.webp$/, '.game.webp');
  // Reduced motion: the system's setting, followed as it changes, or the visitor's own choice ([ animations ], kept for
  // the visit with the system's setting it was made under), whichever came last: the system's setting changed since, live
  // or between two loads, drops the choice. One state for the whole page: no frame loop, every move at its end at once
  // (motionSet), the CSS's moves off (#station.reduce)
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)'),
    REDUCE_PREF = 'wardogs.reduce';
  const motionPref = {
    // (true: reduced, false: not, null: none made, or made under another setting of the system)
    get: () => {
      try {
        const v = sessionStorage.getItem(REDUCE_PREF);
        return v?.[1] === String(+REDUCE.matches) ? v[0] === '1' : null;
      } catch {
        return null;
      }
    },
    set: (on) => {
      try {
        if (on === null) sessionStorage.removeItem(REDUCE_PREF);
        else sessionStorage.setItem(REDUCE_PREF, `${+on}${+REDUCE.matches}`);
      } catch {
        /* private mode: the system's at the next visit */
      }
    },
  };
  let reduce = motionPref.get() ?? REDUCE.matches;
  ROOT.classList.toggle('reduce', reduce);
  // The game's factions (the app's order and colours, src/profile/model.ts) and the one the visitor joined, or none
  // (null), shown in its own places (its emblem and name on A2 and A3, C3, its echo ringed, the terminal, the radar's and
  // the echoes' tags, on a phone the factions' strip), the console's screens and frames keeping their own colours (its
  // green is the site's theme). Kept by the browser from one visit to the next, behind factionPref alone (a personal
  // space may take it over one day): the faction and the date it was joined, forgotten 13 months on (FACTION_KEEP), as
  // the extension keeps its own display preferences; a value it does not know is none. factionAt: when it was last joined or left
  // (scene time), its emblem and name coming up from then (none with motion reduced).
  const FACTIONS = [
    { id: 'lonestar', name: 'LONESTAR', colour: '#69b8ff' },
    { id: 'valkyra', name: 'VALKYRA', colour: '#ff6966' },
    { id: 'manticore', name: 'MANTICORE', colour: '#69d58c' },
  ];
  const factionOf = (id) => FACTIONS.find((f) => f.id === id) ?? null,
    FACTION_PREF = 'wardogs.faction',
    FACTION_KEEP = 396 * 24 * 3600 * 1000; // (13 months)
  const factionPref = {
    get: () => {
      try {
        const v = localStorage.getItem(FACTION_PREF);
        if (v === null) return null;
        const { id, at } = JSON.parse(v);
        if (factionOf(id) && Date.now() - at < FACTION_KEEP) return id;
        localStorage.removeItem(FACTION_PREF); // (too old, or not a value of this site's: forgotten)
      } catch {
        try {
          localStorage.removeItem(FACTION_PREF);
        } catch {
          /* storage blocked */
        }
      }
      return null;
    },
    set: (id) => {
      try {
        if (id === null) localStorage.removeItem(FACTION_PREF);
        else localStorage.setItem(FACTION_PREF, JSON.stringify({ id, at: Date.now() }));
      } catch {
        /* private mode: none at the next visit */
      }
    },
  };
  let faction = factionPref.get(),
    factionAt = -Infinity;
  // Without a graphics card (acceleration turned off, a virtual machine, a blocked driver) the browser draws every frame
  // with the processor, and a full-screen zoom is too much for it: the arrival then leaves the walk-in out (LITE).
  function softwareRendering() {
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (!gl) return true;
      const info = gl.getExtension('WEBGL_debug_renderer_info'),
        renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /swiftshader|basic render|llvmpipe|software/i.test(renderer);
    } catch {
      return true;
    }
  }
  const liteParam = new URLSearchParams(location.search).get('lite');
  const LITE = liteParam === '1' ? true : liteParam === '0' ? false : softwareRendering();
  const TXT = stationTexts;
  const LANG = ROOT.dataset.lang === 'fr' ? 'fr' : 'en'; // the page's
  // the screenshots' tile says how many there are, counted from its page (a capture more: the count follows)
  for (const X of Object.values(TXT)) {
    const n = X.pages.screenshots[0][1].body[0][1].flatMap(([, , g]) => g).length;
    for (const m of X.menu) m[1] = m[1].replace('{shots}', n);
  }
  const T = () => TXT[LANG];

  // ===================================================================================================================
  // Helpers
  // ===================================================================================================================
  const $ = (id) => document.getElementById('st-' + id);
  // the focus on nothing in particular: the page itself, or the console's root (focused once the intro film is gone,
  // and still focused after a click in the room)
  const unfocused = (el) => el === document.body || el === document.documentElement || el === ROOT;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10); // ease in and out, flat at both ends
  // tiny seeded random, so the static drawings never change between frames
  function rng(seed) {
    let a = seed | 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // style writes only when the value changes (the arrival runs every frame); custom properties included
  const lastStyle = new WeakMap();
  function setStyle(el, prop, value) {
    let m = lastStyle.get(el);
    if (!m) lastStyle.set(el, (m = {}));
    if (m[prop] === value) return;
    m[prop] = value;
    if (prop.startsWith('--')) el.style.setProperty(prop, value);
    else el.style[prop] = value;
  }

  // ===================================================================================================================
  // Camera: the framing is always fully visible (contain); the arrival flies in from a far view
  // ===================================================================================================================
  const world = $('world');
  const FRAMING = { x: 193, y: 155, w: 1797, h: 898 };
  const PHONE_ROWS = { top: 95 }; // portrait: the view never goes above this world row (the room's dark edge)
  const FAR = { x: -420, y: -250, w: 3032, h: 1761 }; // far: the console small in the middle of the dark room
  const FAR_PORTRAIT = { w: 2800, c: [1096, 600] }; // far on a phone: the width shown, and its centre
  // k: 0 = far, 1 = the framing; r: 0 = the framing, 1 = the reading screen close up; bob: the sway of the steps, x
  // and y (px) and roll (deg); pose: what camera() set last (s, tx, ty)
  const CAM = { k: 1, r: 0, bob: [0, 0, 0], pose: null };
  // In portrait (a phone, a tablet), bay D's working part whole (contain): ENTER CODE from its lamp strip down to the
  // keypad, the phone and the main power button (fitted to the width, on a tablet the keypad and the button would
  // fall under the window's foot); between the site's top line and, at the bottom, the sections' bar and the legal
  // lines (BANDS, screen px; the bottom one measured, measureBands); never above PHONE_ROWS.top
  const BAY_D = { x: 1452, y: 500, w: 478, h: 560 };
  const BANDS = { top: 56, bottom: 0, bar: 0, foot: 0 }; // (bottom: the bar and the factions' strip, for the framing; bar: the bar alone, for a page read; foot: in landscape, the controls' row)
  // the camera at rest, on the framing: scale and offset of the world on a vw x vh screen
  function framing(vw, vh) {
    const portrait = vw / vh < 0.9;
    if (portrait) {
      const h = vh - BANDS.top - BANDS.bottom,
        s = Math.min(vw / BAY_D.w, h / BAY_D.h);
      return {
        portrait,
        s,
        tx: vw / 2 - (BAY_D.x + BAY_D.w / 2) * s,
        ty: Math.min(-PHONE_ROWS.top * s, BANDS.top + h / 2 - (BAY_D.y + BAY_D.h / 2) * s),
      };
    }
    // (a low window, a phone's in landscape: the room above the controls' row, never under it, BANDS.foot)
    const h = vh < 500 ? vh - BANDS.foot : vh,
      s = Math.min(vw / FRAMING.w, h / FRAMING.h);
    return {
      portrait,
      s,
      tx: vw / 2 - (FRAMING.x + FRAMING.w / 2) * s,
      ty: h / 2 - (FRAMING.y + FRAMING.h / 2) * s,
    };
  }
  // The bottom band in portrait: the sections' bar (SECTIONS.h high) sits SECTIONS.gap above the legal lines, which
  // wrap with the width and the language: measured as laid out (on a resize, a language, the intro's credit handed over);
  // the factions' strip SECTIONS.gap above the bar, its height from its CSS (--h: lower in a short window)
  const SECTIONS = { h: 48, gap: 10 };
  function measureBands() {
    const legalTop = $('legal').getBoundingClientRect().top;
    const above = innerHeight - legalTop + SECTIONS.gap; // (the bar's bottom, from the window's foot)
    const strip = parseFloat(getComputedStyle($('factions')).getPropertyValue('--h')) + SECTIONS.gap;
    BANDS.bar = above + SECTIONS.h + SECTIONS.gap;
    BANDS.bottom = BANDS.bar + strip;
    setStyle($('sections'), 'bottom', above + 'px');
    if (strip) setStyle($('factions'), 'bottom', above + SECTIONS.h + SECTIONS.gap + 'px');
    // in landscape, the foot the legal lines and the controls' row take ([ animations ] [ sound ]): framing keeps a low
    // window's room above it, the keypad and the power out from under them
    BANDS.foot =
      innerHeight -
      Math.min(legalTop, ROOT.querySelector('.ctrl').getBoundingClientRect().top) +
      SECTIONS.gap;
  }
  // at rest, the world lands on whole device pixels: at the scale it was rasterised at, the browser then only copies it
  // (no resampling), which keeps a page without a graphics card light
  const devicePx = (v) => Math.round(v * devicePixelRatio) / devicePixelRatio;
  // The reading screen close up: one goes into it, its glass (READ_GLASS, its screen's quad) covering the whole window,
  // whatever its shape (no frame nor black bands at its sides: they look odd); centred on the glass. The screen
  // becomes the page: the site's lines (the languages, the legal lines) lie on its glass, which is dark, and its
  // content keeps clear of them.
  const READ_GLASS = [1062, 548, 1426, 779];
  function readPose(vw, vh) {
    const [gx0, gy0, gx1, gy1] = READ_GLASS,
      s = Math.max(vw / (gx1 - gx0), vh / (gy1 - gy0));
    return { s, tx: vw / 2 - ((gx0 + gx1) / 2) * s, ty: vh / 2 - ((gy0 + gy1) / 2) * s };
  }
  // two poses (s, tx, ty) blended: the scale in log, the world point under the window's centre in a straight line
  function between(a, b, k, vw, vh) {
    const at = (p) => [(vw / 2 - p.tx) / p.s, (vh / 2 - p.ty) / p.s],
      ca = at(a),
      cb = at(b),
      s = a.s * Math.pow(b.s / a.s, k);
    return {
      s,
      tx: vw / 2 - (ca[0] + (cb[0] - ca[0]) * k) * s,
      ty: vh / 2 - (ca[1] + (cb[1] - ca[1]) * k) * s,
    };
  }
  function camera() {
    const vw = innerWidth,
      vh = innerHeight,
      f = framing(vw, vh);
    let p = f;
    if (CAM.k < 1) {
      // (the walk-in: from far)
      const s0 = f.portrait ? vw / FAR_PORTRAIT.w : Math.min(vw / FAR.w, vh / FAR.h),
        c0 = f.portrait ? FAR_PORTRAIT.c : [FAR.x + FAR.w / 2, FAR.y + FAR.h / 2];
      p = between({ s: s0, tx: vw / 2 - c0[0] * s0, ty: vh / 2 - c0[1] * s0 }, f, CAM.k, vw, vh);
    }
    if (CAM.r > 0) p = between(f, readPose(vw, vh), CAM.r, vw, vh); // (towards the reading screen)
    let { s, tx, ty } = p;
    const [bx, by, br] = CAM.bob;
    if (!(bx || by || br) && (CAM.r === 0 || CAM.r === 1)) {
      tx = devicePx(tx);
      ty = devicePx(ty);
    } // (at rest: on whole device pixels)
    CAM.pose = { s, tx, ty };
    world.style.transform =
      bx || by || br
        ? `translate(${vw / 2 + bx}px, ${vh / 2 + by}px) rotate(${br}deg) translate(${tx - vw / 2}px, ${ty - vh / 2}px) scale(${s})`
        : `translate(${tx}px, ${ty}px) scale(${s})`;
  }
  // The room pictures exist at 1x (2192 px, the console's canvas), 1.5x and 2x: the smallest one that is sharp at the
  // framing on the screen the page opens on is loaded (2x only where it shows, on large or dense screens).
  function roomSize() {
    const need = framing(innerWidth, innerHeight).s * devicePixelRatio;
    return need <= 1.05 ? '1x' : need <= 1.55 ? '1.5x' : '2x';
  }
  // After a resize the kept raster no longer matches the new scale: drop the hint for one painted frame (hence two
  // animation frames) so the browser rasterises the world again at its new size, then put it back. During the walk-in
  // this waits until the camera has reached the framing (otherwise the far scale would be kept).
  let resizeTimer = 0,
    rerasterPending = false;
  const walking = () => !LITE && arrivalT !== null && arrivalT < ARR.walk;
  function rerasterWorld() {
    rerasterPending = false;
    world.style.willChange = 'auto';
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        world.style.willChange = '';
      }),
    );
  }
  // everything placed from the framing, again: the camera, the power button's target, the other targets. On a resize, a
  // language, the intro's credit handed over: in portrait the framing depends on the legal lines' height.
  function layout() {
    measureBands();
    camera();
    placePowerTarget();
    if (CTT.knob) placeTargets();
    placeCall();
    if (READ.id !== null) {
      if (reading()) screenRes(SCR.principal, readScale());
      if (PAGE.id !== null) {
        pagePlace();
        pageSweep(PAGE.k);
        pageSpy();
        if (PAGE.at !== null) pageTops();
      }
      readApply();
      drawTower();
    } // (the reading pose again; its page's room, and its sweep's clip in it)
  }
  addEventListener('resize', () => {
    layout();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (walking() || READ.id !== null) rerasterPending = true;
      else rerasterWorld();
    }, 200); // (at the framing: after the walk-in, after a reading)
  });

  // ===================================================================================================================
  // Screens: a box projected onto its quad (homography, rectangle w x h -> quad TL TR BR BL), with a canvas
  // ===================================================================================================================
  function adj(m) {
    return [
      m[4] * m[8] - m[5] * m[7],
      m[2] * m[7] - m[1] * m[8],
      m[1] * m[5] - m[2] * m[4],
      m[5] * m[6] - m[3] * m[8],
      m[0] * m[8] - m[2] * m[6],
      m[2] * m[3] - m[0] * m[5],
      m[3] * m[7] - m[4] * m[6],
      m[1] * m[6] - m[0] * m[7],
      m[0] * m[4] - m[1] * m[3],
    ];
  }
  function mm(a, b) {
    const c = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j];
        c[3 * i + j] = s;
      }
    return c;
  }
  function mv(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
    ];
  }
  function basis(p) {
    const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1];
    const v = mv(adj(m), [p[3][0], p[3][1], 1]);
    return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
  }
  function project(el, w, h, q) {
    const src = basis([
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ]),
      dst = basis([q[0], q[1], q[3], q[2]]); // basis wants TL TR BL BR
    let t = mm(dst, adj(src));
    t = t.map((x) => x / t[8]);
    el.style.transform = `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(',')})`;
  }
  const SCR = {};
  const SCREEN_IDS = [
    'haut',
    'carte',
    'crt-b',
    'principal',
    'code',
    'a1',
    'a2',
    'a3',
    'b1',
    'c1',
    'c2',
    'c3',
  ];
  const CANVAS_SCALE = 2; // 2x, like the largest room picture: sharp at the framing on most screens; the reading screen brought close is redrawn larger (screenRes, readScale)
  function makeScreen(z) {
    const xs = z.quad.map((p) => p[0]),
      ys = z.quad.map((p) => p[1]);
    const w = Math.round(Math.max(...xs) - Math.min(...xs)),
      h = Math.round(Math.max(...ys) - Math.min(...ys));
    const el = document.createElement('div');
    el.className = 'scr';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    if (z.id === 'carte' || z.id === 'crt-b') el.classList.add('vec');
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * CANVAS_SCALE);
    cv.height = Math.round(h * CANVAS_SCALE);
    const tube = document.createElement('div');
    tube.className = 'tube';
    tube.append(cv);
    const warm = document.createElement('div');
    warm.className = 'warm';
    warm.style.setProperty('--glow', TUBE[z.id].glow);
    el.append(tube, warm);
    const beam = document.createElement('i');
    beam.className = 'beam';
    beam.style.setProperty('--beam', z.id === 'carte' ? 'rgba(214,228,255,.95)' : 'rgba(230,255,240,.95)');
    el.append(beam);
    $('screens').append(el);
    project(el, w, h, z.quad);
    const c = cv.getContext('2d');
    c.scale(CANVAS_SCALE, CANVAS_SCALE);
    // u: seconds since the screen got power (Infinity: fully on), b: how bright it is (0..1)
    return (SCR[z.id] = { el, tube, warm, beam, c, w, h, z, u: Infinity, b: 1 });
  }

  // ---- drawing ----
  const INK = '#d6dcd3',
    DIM = 'rgba(214,220,211,.42)',
    FAINT = 'rgba(214,220,211,.14)',
    WHITE = '#f7f8f8',
    MINT = '#9ffbc1';
  const FONT_TERM = '"Barlow Semi Condensed", Bahnschrift, "Arial Narrow", sans-serif',
    FONT_MONO = 'Consolas, monospace';
  const NAME = 'Wardogs Companion'; // (the project's name, not the game's capitals; the same in both languages)
  function glass(c, w, h, base = '#070a08') {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
  }
  // an empty screen that is on: dark glass with a faint phosphor glow
  function emptyOn(s) {
    const { c, w, h } = s;
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, '#141a16');
    g.addColorStop(1, '#0a0d0b');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
  function box(c, x, y, w, h) {
    c.strokeStyle = DIM;
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function grid(c, x, y, w, h, nx, ny) {
    c.strokeStyle = FAINT;
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 1; i < nx; i++) {
      const gx = Math.round(x + (w * i) / nx) + 0.5;
      c.moveTo(gx, y);
      c.lineTo(gx, y + h);
    }
    for (let j = 1; j < ny; j++) {
      const gy = Math.round(y + (h * j) / ny) + 0.5;
      c.moveTo(x, gy);
      c.lineTo(x + w, gy);
    }
    c.stroke();
  }
  function txt(c, s, x, y, size, color = INK, align = 'left', weight = 600) {
    c.font = `${weight} ${size}px ${FONT_TERM}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillText(s, x, y);
  }
  function mono(c, s, x, y, size, color = DIM, align = 'left', weight = 400) {
    c.font = `${weight} ${size}px ${FONT_MONO}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillText(s, x, y);
  }

  // telemetry: two small charts, on the scene clock (the time shown on
  // the top screen is the time the page opened plus the scene time), so a frame-by-frame capture is repeatable; the scene
  // standing (no frames: a page read at rest, motion reduced), that opening moves on by as long (frame), so that the time
  // shown is the time of day again once it goes on, and T+ the time spent
  let OPENED = Date.now();
  const TEL_PANELS = 2; // (the charts: SIGNAL, VISITED; drawTelemetry)

  // The top screen is the site menu: its entries in the middle, telemetry on both sides (the charts in one column: the
  // room to the entries). Its fixed part (frames,
  // menu) is drawn once per language on its own canvas; each tick copies it, then draws what moves.
  function topLayout(w, h) {
    const pad = 14,
      H = h - 2 * pad,
      lw = 170,
      mw = 98,
      mx = w - pad - mw,
      ax = pad * 2 + lw,
      aw = mx - pad - ax;
    const cw = mw,
      ch = (H - pad * (TEL_PANELS - 1)) / TEL_PANELS;
    const charts = Array.from({ length: TEL_PANELS }, (_, i) => ({ x: mx, y: pad + i * (ch + pad) }));
    // the menu's entries, side by side under the heading (their tiles: drawn here, and the posts over them)
    const gap = 14,
      n = T().menu.length,
      tw = (aw - (n - 1) * gap) / n;
    const cards = T().menu.map((_, i) => ({ x: ax + i * (tw + gap), y: pad + 26, w: tw, h: H - 26 }));
    return { pad, H, lw, mx, cw, ch, ax, aw, charts, cards };
  }
  function drawTopBase(s) {
    const { w, h } = s;
    // (and the same without the subtitles, s.bare: where a tile's subtitle gives way to the keypad's entry)
    for (const [key, subs] of [
      ['base', true],
      ['bare', false],
    ]) {
      s[key] ??= document.createElement('canvas');
      s[key].width = s.c.canvas.width;
      s[key].height = s.c.canvas.height;
      const c = s[key].getContext('2d');
      c.setTransform(CANVAS_SCALE, 0, 0, CANVAS_SCALE, 0, 0);
      drawMenuParts(c, w, h, Infinity, 0, subs);
    }
  }
  // The menu's fixed parts, built up q s after the screen cleared (Infinity: built; the intro's language): the frames
  // open from their centre, left to right; the heading and the codes type in; the titles decode letter by letter, one
  // tile after the other; the subtitles type; the underlines grow from their middle; the charts' grids fade in.
  const BUILD = { open: 0.32, step: 0.06, end: 1.6 };
  function drawMenuParts(c, w, h, q, t, subs = true) {
    const L = topLayout(w, h),
      done = q === Infinity,
      k = (a, d) => (done ? 1 : clamp01((q - a) / d));
    const ease = (x) => 1 - (1 - x) ** 3;
    glass(c, w, h);
    // a frame opening from its centre: its width first, its height a moment later
    const frame = (x, y, bw, bh, a) => {
      const e = ease(k(a, BUILD.open)),
        f = ease(k(a + 0.08, BUILD.open));
      if (e <= 0) return;
      if (e >= 1 && f >= 1) {
        box(c, x, y, bw, bh);
        return;
      }
      const fw = Math.max(2, bw * e),
        fh = Math.max(2, bh * f);
      box(c, x + (bw - fw) / 2, y + (bh - fh) / 2, fw, fh);
    };
    const typed = (str, a, d) => str.slice(0, Math.round(str.length * k(a, d)));
    frame(L.pad, L.pad, L.lw, L.H, 0);
    L.charts.forEach(({ x, y }, i) => {
      frame(x, y, L.cw, L.ch, 0.5 + i * BUILD.step);
      const g = k(0.75 + i * BUILD.step, 0.3);
      if (g > 0) {
        c.save();
        c.globalAlpha = g;
        grid(c, x, y, L.cw, L.ch, 6, 3);
        c.restore();
      }
    });
    mono(c, typed(T().menuHead, 0.15, 0.3), L.ax + 2, L.pad + 12, 12);
    // what to do, in the heading's line, between the heading and the clock: typed in after the heading, in the ink of
    // the terminal's current line (a line says what to do, on the screen itself: nothing laid over the room)
    const hint = touchOnly ? T().menuHintTouch : T().menuHint;
    c.font = `400 11.5px ${FONT_MONO}`;
    mono(
      c,
      typed(hint, 0.45, 0.7),
      L.ax + L.aw / 2 - 16 - c.measureText(hint).width / 2,
      L.pad + 12,
      11.5,
      INK,
    );
    // the menu entries, in the tower screen's language: white titles (one size for all: the largest at which the longest
    // fits its tile), mint index, code, pictogram and underline
    c.font = `700 34px ${FONT_TERM}`;
    const size =
      34 * Math.min(1, ...T().menu.map(([title], i) => (L.cards[i].w - 36) / c.measureText(title).width));
    T().menu.forEach(([title, sub, code], i) => {
      const { x, y: ty, w: tw, h: th } = L.cards[i],
        a = 0.15 + i * 0.12;
      frame(x, ty, tw, th, a);
      mono(c, typed('0' + (i + 1), a + 0.3, 0.1), x + 12, ty + 24, 13, MINT);
      mono(c, typed('CODE ' + code, a + 0.3, 0.25), x + tw - 12, ty + 24, 13, MINT, 'right');
      c.font = `700 34px ${FONT_TERM}`;
      const tWidth = c.measureText(title).width;
      const pk = ease(k(a + 0.3, 0.4)); // (its pictogram, in as the code types)
      if (pk > 0) {
        c.save();
        c.globalAlpha = pk;
        picto(c, MENU_IDS[i], x + tw / 2, ty + th * 0.3, Math.min(36, th * 0.17));
        c.restore();
      }
      const dp = k(a + 0.35, 0.55);
      if (dp > 0) {
        c.save();
        c.shadowColor = 'rgba(255,255,255,.3)';
        c.shadowBlur = 3;
        if (dp >= 1) txt(c, title, x + tw / 2, ty + th * 0.55, size, WHITE, 'center', 700);
        else
          txt(
            c,
            decoding(title, dp, 40 + i, t),
            x + tw / 2 - (tWidth * size) / 68,
            ty + th * 0.55,
            size,
            WHITE,
            'left',
            700,
          );
        c.restore();
      }
      if (subs) txt(c, typed(sub, a + 0.7, 0.4), x + tw / 2, ty + th * 0.55 + 30, 15, DIM, 'center', 400);
      const u = ease(k(a + 0.85, 0.35));
      if (u > 0) {
        c.fillStyle = MINT;
        c.fillRect(x + tw * (0.5 - 0.3 * u), ty + th - 26, tw * 0.6 * u, 5);
      }
    });
  }
  // a section's pictogram, its mark over its title on the top screen: one line, the codes' mint, centred on (x, y), s
  // high (the extension: our emblem, as on the tower's screen, in the mint alone; the screenshots: a camera; the Discord:
  // its logo, as drawn by Discord; about: an i in its ring); the same on the sections' bar, in its ink, without the
  // phosphor's glow, its line finer (ink, glow, line)
  const DISCORD_D =
    'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z';
  const DISCORD_LOGO = new Path2D(DISCORD_D);
  const SOCIAL_MARKS = {
    discord: ['0 0 24 24', DISCORD_D],
    github: [
      '0 0 16 16',
      'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z',
    ],
  };
  // a mark as an icon of the page (an outline, the screen's mint; screen readers skip it: its link says where it leads)
  function markIcon(id, cls) {
    const [vb, d] = SOCIAL_MARKS[id],
      ns = 'http://www.w3.org/2000/svg',
      svg = document.createElementNS(ns, 'svg'),
      path = document.createElementNS(ns, 'path');
    svg.setAttribute('viewBox', vb);
    svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    path.setAttribute('d', d);
    svg.append(path);
    return svg;
  }
  function picto(c, id, x, y, s, { ink = MINT, glow = true, line = 2 } = {}) {
    c.save();
    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.lineWidth = line;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    if (glow) {
      c.shadowColor = 'rgba(159, 251, 193, .35)';
      c.shadowBlur = 3;
    }
    if (id === 'extension') {
      // (our emblem)
      emblem(c, x, y, s * 1.12, ink);
    } else if (id === 'screenshots') {
      // (a camera: its body, its viewfinder, its lens)
      const w = s * 1.3,
        h = s * 0.82,
        x0 = x - w / 2,
        y0 = y - h / 2 + s * 0.08;
      c.beginPath();
      c.roundRect(x0, y0, w, h, s * 0.1);
      c.stroke();
      c.beginPath();
      c.moveTo(x0 + w * 0.26, y0);
      c.lineTo(x0 + w * 0.34, y0 - s * 0.16);
      c.lineTo(x0 + w * 0.6, y0 - s * 0.16);
      c.lineTo(x0 + w * 0.68, y0);
      c.stroke();
      c.beginPath();
      c.arc(x, y0 + h * 0.52, s * 0.25, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x, y0 + h * 0.52, s * 0.1, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x0 + w * 0.86, y0 + h * 0.2, s * 0.035, 0, Math.PI * 2);
      c.fill();
    } else if (id === 'discord') {
      // (Discord's own logo, its outline: 24 units wide)
      const k = (s * 1.3) / 24;
      c.translate(x - 12 * k, y - 12 * k);
      c.scale(k, k);
      c.lineWidth = line / k;
      c.stroke(DISCORD_LOGO);
    } else if (id === 'about') {
      // (an i in its ring)
      c.beginPath();
      c.arc(x, y, s * 0.48, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x, y - s * 0.21, s * 0.045, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(x, y - s * 0.06);
      c.lineTo(x, y + s * 0.26);
      c.stroke();
    }
    c.restore();
  }
  // The two charts, without overloading the screen: what the visitor does, told calmly, at the screens' pace.
  // SIGNAL, an oscilloscope's trace, quiet, stirs while a tile of the menu is pointed at and with each key pressed
  // (drawn from the scene clock and seeded noise). VISITED, a cell per section, numbered as its tile: lit once the
  // section has been opened during the visit (TEL.visited, kept by the tab: a page reloaded keeps them), its corners
  // closing in as it lights (as a module locks); under them, the visit's time (T+: since the tab's first opening of
  // the console, kept too). Both revealed left to right as the terminal builds them (reveal).
  const TEL = {
    sel: -1,
    selAt: -Infinity,
    last: null,
    codes: 0,
    visited: new Map(),
    key: 'wardogs.console.visited',
    sinceKey: 'wardogs.console.since',
    since: OPENED,
    lock: 0.35,
  };
  try {
    for (const id of JSON.parse(sessionStorage.getItem(TEL.key) || '[]')) TEL.visited.set(id, -Infinity);
    TEL.since = +sessionStorage.getItem(TEL.sinceKey) || OPENED;
    sessionStorage.setItem(TEL.sinceKey, String(TEL.since));
  } catch {
    /* private mode: none kept, the time from this opening */
  }
  // a section opened (its tile, its code, the bar, the phone): its cell lit, for the visit
  function telVisit(id) {
    if (MENU_IDS.includes(id)) TEL.last = id; // (the terminal's VISIT: the last page read)
    if (TEL.visited.has(id) || !MENU_IDS.includes(id)) return;
    TEL.visited.set(id, reduce ? -Infinity : sceneT);
    topDirty = true;
    wake(); // (with reduced motion lit at once, as one from before: so it stays, motion back or not)
    try {
      sessionStorage.setItem(TEL.key, JSON.stringify([...TEL.visited.keys()]));
    } catch {
      /* private mode */
    }
  }
  function drawTelemetry(c, L, t, reveal = 1) {
    if (menuSel !== TEL.sel) {
      TEL.sel = menuSel;
      TEL.selAt = t;
    }
    const X = T(),
      stir =
        (TEL.sel >= 0 ? Math.min(1, (t - TEL.selAt) / 0.3) : Math.max(0, 1 - (t - TEL.selAt) / 0.6)) * 0.45 +
        PAD.hits.reduce((a, th) => a + (t >= th ? Math.exp(-(t - th) / 0.45) : 0), 0) * 0.5;
    L.charts.forEach(({ x, y }, i) => {
      c.save();
      c.beginPath();
      c.rect(x, y, L.cw * reveal, L.ch);
      c.clip();
      mono(c, i ? X.chartVisited : X.chartSignal, x + 6, y + 14, 10);
      const gx = x + 6,
        gy = y + 22,
        gw = L.cw - 12,
        gh = L.ch - 30;
      if (i === 0) {
        // (the trace: two waves and a little noise, its height the stir)
        const amp = Math.min(1, 0.16 + stir),
          n = 40;
        c.strokeStyle = INK;
        c.lineWidth = 1.2;
        c.beginPath();
        for (let j = 0; j <= n; j++) {
          const u = j / n,
            noise = ((hash(j * 131 + Math.floor(t * 15) * 7919) % 1000) / 1000 - 0.5) * 0.25;
          const v =
            amp *
            (0.62 * Math.sin(2 * Math.PI * (u * 2.2 - t * 0.55)) +
              0.38 * Math.sin(2 * Math.PI * (u * 5.3 + t * 0.9)) +
              noise * amp);
          const px = gx + gw * u,
            py = gy + gh / 2 - (v * gh) / 2;
          j ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      } else {
        // (the cells, two a row, numbered as the tiles; the visit's time under them)
        const cols = 2,
          gap = 6,
          w = (gw - gap) / cols,
          h = Math.min(26, (gh - 24 - gap) / 2);
        MENU_IDS.forEach((id, j) => {
          const cx = gx + (j % cols) * (w + gap),
            cy = gy + Math.floor(j / cols) * (h + gap),
            at = TEL.visited.get(id);
          const e = at === undefined ? 0 : reduce ? 1 : clamp01((t - at) / TEL.lock),
            lit = e > 0;
          c.fillStyle = '#0b0d0c';
          c.fillRect(cx, cy, w, h); // (the chart's grid not through it)
          if (lit) {
            c.fillStyle = `rgba(159, 251, 193, ${(0.12 * e).toFixed(3)})`;
            c.fillRect(cx, cy, w, h);
          }
          c.strokeStyle = lit ? `rgba(159, 251, 193, ${(0.4 + 0.5 * e).toFixed(3)})` : FAINT;
          c.lineWidth = 1;
          c.strokeRect(cx + 0.5, cy + 0.5, w - 1, h - 1);
          mono(c, two(j + 1), cx + w / 2, cy + h / 2 + 4, 11, lit ? MINT : DIM, 'center');
          if (lit && e < 1) {
            // (its corners closing in, green as a lock, as it lights)
            const o = (1 - e) * 7,
              k = 5;
            c.strokeStyle = '#69d58c';
            c.lineWidth = 1.5;
            c.beginPath(); // (the lock's green, as --ready)
            for (const [sx, sy] of [
              [0, 0],
              [1, 0],
              [0, 1],
              [1, 1],
            ]) {
              const px = sx ? cx + w + o : cx - o,
                py = sy ? cy + h + o : cy - o,
                dx = sx ? -k : k,
                dy = sy ? -k : k;
              c.moveTo(px + dx, py);
              c.lineTo(px, py);
              c.lineTo(px, py + dy);
            }
            c.stroke();
          }
        });
        const sec = Math.max(0, Math.floor((OPENED - TEL.since) / 1000 + t)),
          hms = [sec / 3600, (sec % 3600) / 60, sec % 60]
            .map((v) => String(Math.floor(v)).padStart(2, '0'))
            .join(':');
        mono(c, 'T+ ' + hms, gx, gy + gh, 11, INK);
      }
      c.restore();
    });
  }

  // ===================================================================================================================
  // The station's terminal. The main power feeds the computer first (its screen is the top one): it boots in full
  // screen and drives the rest, and one sees it do so: its log (each line decoding letter by letter, three scrambled
  // glyphs ahead, as in the intro), a status board whose bars fill as each part comes up, an overall bar. Once every
  // screen is warm: SYSTEM READY blinks twice, a scan line wipes the boot screen down into the menu, and the log goes on
  // in the menu's left column as a small terminal: now and then a command is typed, and a few facts come back (from the
  // app's README; SPECIAL ACCESS, the hidden code's clue). Everything is a function of termT, the time since the
  // press, so a capture is repeatable.
  // ===================================================================================================================
  const AMBER = '#e9c46a';
  const BOOT = {
    cps: 60, // letters per second as a line decodes
    hold: 1.6, // s between SYSTEM READY and the wipe into the menu
    blank: 0.14, // the screen empty for a moment between the boot and the menu (a change of screen)
    type: 11, // letters per second when the operator types a command
    firstBlock: 2.5, // s after the wipe before the first command
    gap: [6.5, 9.5], // s between two commands (irregular, from a hash)
    out: 0.25,
    step: 0.14, // the answer's first line after the command, then one line every step s
    every: 1 / 30, // the top screen's redraw while it boots (letters decode at 20 Hz)
  };
  let termT = -Infinity; // s since the press (-Infinity before; it keeps counting once the arrival is over)
  // (a scrambled letter: a capital or a figure, from a hash; the same for the tags' letters)
  const GLYPHS = 'ABCDEFGHKLMNPRSTUVXYZ0123456789';
  const hash = (a) => {
    let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return x >>> 0;
  };
  // a text decoding: p (0..1) of it settled from the left, three scrambled glyphs ahead, the rest not printed yet
  function decoding(str, p, salt, t) {
    const n = str.length,
      shown = Math.floor(p * (n + 3)),
      bucket = Math.floor(t * 20);
    let out = '';
    for (let i = 0; i < Math.min(n, shown); i++)
      out +=
        i < shown - 3 || str[i] === ' ' || str[i] === '.'
          ? str[i]
          : GLYPHS[hash(i * 131 + salt * 977 + bucket * 7919) % GLYPHS.length];
    return out;
  }
  // The boot, built once the timings are known: each line has its time (s after the press) and its states over time;
  // each part of the status board has its progress (0..1) as a function of the time.
  let BOOTLOG = null;
  function bootLog() {
    if (BOOTLOG) return BOOTLOG;
    const lampsEnd = PANEL.test[1] + PANEL.ripple,
      MAIN = { A: 'carte', B: 'crt-b', C: 'principal', D: 'code' };
    const radar = tubeStart('carte') + TUBE.carte.heat + TUBE.carte.signal * TUBE.carte.rise;
    const catalogue = [RELAY.C + 0.6, RELAY.C + 2.6],
      uplink = [RELAY.D + 1.4, READY_ALL];
    const ready = READY_ALL + 0.7;
    const lines = [
      { at: 0.3, k: 'boot' },
      { at: 0.55, k: 'power', st: [[0.55, 'on']] },
      { at: 0.8, k: 'mem', count: [0.8, 1.8, 4096, 'K'], st: [[1.8, 'ok']] },
      {
        at: 1.05,
        k: 'lamps',
        st: [
          [1.05, 'run'],
          [lampsEnd, 'ok'],
        ],
      },
      ...['A', 'B', 'C', 'D'].map((b) => ({
        at: RELAY[b],
        k: 'bay',
        b,
        st: [
          [RELAY[b], 'warm'],
          [readyAt(MAIN[b]), 'ok'],
        ],
      })),
      { at: radar, k: 'radar', st: [[radar + 0.4, 'sweep']] },
      {
        at: catalogue[0],
        k: 'catalogue',
        count: [catalogue[0], catalogue[1], 273, ''],
        st: [[catalogue[1], 'ok']],
      },
      { at: readyAt('code') - 0.3, k: 'keypad', st: [[readyAt('code'), 'standby']] },
      { at: uplink[0], k: 'decrypt', decrypt: uplink, st: [[uplink[1], 'ok']] },
      { at: ready, k: 'ready', ready: true },
    ].sort((a, b) => a.at - b.at);
    const board = [
      ['power', (p) => (p >= 0 ? 1 : 0)],
      ['lamps', (p) => clamp01((p - PANEL.test[0]) / (lampsEnd - PANEL.test[0]))],
      ...['A', 'B', 'C', 'D'].map((b) => [
        `bay ${b}`,
        (p) => clamp01((p - RELAY[b]) / (readyAt(MAIN[b]) - RELAY[b])),
      ]),
      ['radar', (p) => clamp01((p - radar) / GAIN_RISE)],
      ['link', (p) => clamp01((p - uplink[0]) / (uplink[1] - uplink[0]))],
    ];
    return (BOOTLOG = {
      lines,
      board,
      ready,
      menuAt: ready + BOOT.hold,
      doneAt: ready + BOOT.hold + BOOT.blank + BUILD.end,
    });
  }
  // a log line's text at time p: its label (with a counter or a decryption in progress), dots, and its current state
  function bootText(l, p) {
    const X = T().term;
    let label = l.k === 'bay' ? `${X.bay} ${l.b}` : X[l.k];
    if (l.count) {
      const [a, b, n, unit] = l.count,
        v = Math.round(n * clamp01((p - a) / (b - a)));
      label += ` ${String(v).padStart(String(n).length, '0')}${unit}`;
    }
    if (l.decrypt && p < l.decrypt[1])
      label = X.decrypt + ' ' + decoding('A7F3 9C21 E0B4', ((p - l.decrypt[0]) * 3) % 1, 7, p);
    else if (l.decrypt) label = X.uplink;
    const st = (l.st || []).filter(([a]) => p >= a).pop();
    return { label, state: st ? st[1] : null };
  }
  const STATE_COLOUR = { ok: MINT, on: INK, run: AMBER, warm: AMBER, sweep: MINT, standby: MINT, off: AMBER };
  // the line as drawn: label padded with dots to width, then the state; the whole decoding from its time
  function drawLogLine(c, l, p, x, y, width, size, colour, t) {
    const X = T().term,
      { label, state } = bootText(l, p),
      stTxt = state ? X[state] : '';
    const full =
      l.ready || !l.st
        ? label
        : label + ' ' + '.'.repeat(Math.max(2, width - label.length - stTxt.length - 2)) + ' ';
    const dp = clamp01(((p - l.at) * BOOT.cps) / Math.max(1, full.length + 3));
    mono(c, decoding(full, dp, l.at * 100, t), x, y, size, colour);
    if (stTxt && dp >= 1) {
      const cw = c.measureText('0').width;
      mono(c, stTxt, x + full.length * cw, y, size, STATE_COLOUR[state] || INK);
    }
  }
  // the boot screen, in full: header, log on the left, status board and overall bar on the right
  function drawBoot(c, w, h, p, t) {
    const X = T().term,
      B = bootLog(),
      pad = 14;
    glass(c, w, h);
    // header: the station's name, the state, the clock
    txt(c, X.title, pad, pad + 14, 15, INK, 'left', 600);
    mono(
      c,
      p >= B.ready ? X.ready : X.booting,
      w - pad - 92,
      pad + 13,
      12,
      p >= B.ready ? MINT : AMBER,
      'right',
    );
    mono(c, new Date(OPENED + t * 1000).toTimeString().slice(0, 8), w - pad, pad + 13, 12, DIM, 'right');
    c.fillStyle = FAINT;
    c.fillRect(pad, pad + 22, w - 2 * pad, 1);
    // the log: the lines printed by now, the last ones at the bottom
    const lx = pad + 2,
      top = pad + 44,
      rowH = 17,
      rows = Math.floor((h - top - pad + 4) / rowH);
    const readyNow = p >= B.ready,
      blink = readyNow && [0.25, 0.45].some((b) => p - B.ready >= b && p - B.ready < b + 0.1);
    const shown = B.lines.filter((l) => p >= l.at),
      first = Math.max(0, shown.length - (readyNow ? rows - 1 : rows));
    c.font = `400 12px ${FONT_MONO}`;
    shown.slice(first).forEach((l, i) => {
      const y = top + i * rowH,
        last = i === shown.length - first - 1;
      mono(c, `[${l.at.toFixed(2).padStart(6, ' ')}]`, lx, y, 12, FAINT);
      if (l.ready) {
        if (!blink) drawLogLine(c, l, p, lx + 72, y, 44, 12, MINT, t);
      } else drawLogLine(c, l, p, lx + 72, y, 44, 12, last ? INK : DIM, t);
    });
    // the cursor, steady, after the last line once the system is ready
    if (readyNow && !blink) {
      const cy = top + (shown.length - first) * rowH;
      mono(c, '>', lx + 72, cy, 12, MINT);
      c.fillStyle = INK;
      c.fillRect(lx + 84, cy - 10, 7, 12);
    }
    // the status board: one row per part, a segmented bar that fills, its percentage
    const bx = Math.round(w * 0.58),
      bw = w - pad - bx,
      segs = 16,
      sw = (bw - 150) / segs;
    c.fillStyle = FAINT;
    c.fillRect(bx - 18, pad + 32, 1, h - pad - 32 - pad);
    B.board.forEach(([k, f], i) => {
      const y = pad + 46 + i * 22,
        v = f(p),
        label = k.startsWith('bay') ? `${X.bay} ${k.slice(4)}` : X[k],
        col = v >= 1 ? MINT : v > 0 ? AMBER : FAINT;
      mono(c, label, bx, y, 12, v > 0 ? INK : DIM);
      for (let j = 0; j < segs; j++) {
        const on = j < Math.round(v * segs);
        c.fillStyle = on ? col : 'rgba(214,220,211,.08)';
        c.fillRect(bx + 104 + j * sw, y - 9, sw - 2, 9);
      }
      mono(c, `${String(Math.round(v * 100)).padStart(3, ' ')}%`, w - pad, y, 12, col, 'right');
    });
    // the overall bar
    const all = B.board.reduce((a, [, f]) => a + f(p), 0) / B.board.length,
      oy = h - pad - 14;
    mono(
      c,
      `${X.overall} ${String(Math.round(all * 100)).padStart(3, ' ')}%`,
      bx,
      oy + 10,
      12,
      all >= 1 ? MINT : INK,
    );
    c.strokeStyle = DIM;
    c.lineWidth = 1;
    c.strokeRect(bx + 104.5, oy + 0.5, bw - 104 - 1, 11);
    c.fillStyle = all >= 1 ? MINT : AMBER;
    c.fillRect(bx + 107, oy + 3, (bw - 110) * all, 6);
  }
  // The shutdown, as the boot in reverse on the same screen: the menu gives way at once to the log, which writes the
  // shutdown (the request, the session saved, each bay switched off as its relay opens, the main power last), while the
  // status board's bars empty bay by bay and the overall bar drains; the screen itself goes out last (OFF.relay.top).
  function shutdownLog() {
    return [
      { at: 0.03, k: 'shutdown' },
      {
        at: 0.12,
        k: 'save',
        st: [
          [0.12, 'run'],
          [0.42, 'ok'],
        ],
      },
      ...['D', 'C', 'B', 'A'].map((b) => ({
        at: OFF.relay[b] - 0.2,
        k: 'bay',
        b,
        st: [[OFF.relay[b], 'off']],
      })),
      { at: OFF.relay.top - 0.5, k: 'power', st: [[OFF.relay.top - 0.15, 'off']] },
    ];
  }
  function drawShutdown(c, w, h, q, t) {
    const X = T().term,
      pad = 14,
      lines = shutdownLog();
    glass(c, w, h);
    txt(c, X.title, pad, pad + 14, 15, INK, 'left', 600);
    mono(c, X.stopping, w - pad - 92, pad + 13, 12, AMBER, 'right');
    mono(c, new Date(OPENED + t * 1000).toTimeString().slice(0, 8), w - pad, pad + 13, 12, DIM, 'right');
    c.fillStyle = FAINT;
    c.fillRect(pad, pad + 22, w - 2 * pad, 1);
    const lx = pad + 2,
      top = pad + 44,
      rowH = 17,
      shown = lines.filter((l) => q >= l.at);
    c.font = `400 12px ${FONT_MONO}`;
    shown.forEach((l, i) => {
      mono(c, `[${l.at.toFixed(2).padStart(6, ' ')}]`, lx, top + i * rowH, 12, FAINT);
      drawLogLine(c, l, q, lx + 72, top + i * rowH, 44, 12, i === shown.length - 1 ? INK : DIM, t);
    });
    // the status board, emptying: each bay as its relay opens, the rest with the main power
    const bx = Math.round(w * 0.58),
      bw = w - pad - bx,
      segs = 16,
      sw = (bw - 150) / segs;
    const bay = (b) => 1 - clamp01((q - OFF.relay[b] + 0.3) / 0.3),
      main = 1 - clamp01((q - OFF.relay.top + 0.5) / 0.35);
    const board = [
      ['power', main],
      ['lamps', bay('D')],
      ...['A', 'B', 'C', 'D'].map((b) => [`bay ${b}`, bay(b)]),
      ['radar', bay('A')],
      ['link', bay('D')],
    ];
    c.fillStyle = FAINT;
    c.fillRect(bx - 18, pad + 32, 1, h - pad - 32 - pad);
    board.forEach(([k, v], i) => {
      const y = pad + 46 + i * 22,
        label = k.startsWith('bay') ? `${X.bay} ${k.slice(4)}` : X[k],
        col = v >= 1 ? MINT : v > 0 ? AMBER : FAINT;
      mono(c, label, bx, y, 12, v > 0 ? INK : DIM);
      for (let j = 0; j < segs; j++) {
        const on = j < Math.round(v * segs);
        c.fillStyle = on ? col : 'rgba(214,220,211,.08)';
        c.fillRect(bx + 104 + j * sw, y - 9, sw - 2, 9);
      }
      mono(c, `${String(Math.round(v * 100)).padStart(3, ' ')}%`, w - pad, y, 12, col, 'right');
    });
    const all = board.reduce((a, [, v]) => a + v, 0) / board.length,
      oy = h - pad - 14;
    mono(
      c,
      `${X.shutOverall} ${String(Math.round(all * 100)).padStart(3, ' ')}%`,
      bx,
      oy + 10,
      12,
      all > 0 ? AMBER : DIM,
    );
    c.strokeStyle = DIM;
    c.lineWidth = 1;
    c.strokeRect(bx + 104.5, oy + 0.5, bw - 104 - 1, 11);
    c.fillStyle = AMBER;
    c.fillRect(bx + 107, oy + 3, (bw - 110) * all, 6);
  }
  // After the wipe, the left column of the menu: the end of the boot log, then the commands and their answers.
  function termBlocks(p) {
    const B = bootLog(),
      X = T().term,
      out = [];
    let at = B.doneAt + BOOT.firstBlock;
    for (let k = 0; at <= p && k < 10000; k++) {
      const [cmd, block] = X.blocks[k % X.blocks.length],
        rows = block === 'visit' ? visitRows(k) : block,
        typed = at + cmd.length / BOOT.type;
      out.push({
        at,
        cmd,
        typed,
        rows: rows.map(([label, value], i) => ({ at: typed + BOOT.out + i * BOOT.step, label, value })),
      });
      at =
        typed +
        BOOT.out +
        rows.length * BOOT.step +
        BOOT.gap[0] +
        (BOOT.gap[1] - BOOT.gap[0]) * ((hash(k + 17) % 1000) / 1000);
    }
    return out;
  }
  // the VISIT block of turn k: the visit as it stood when that turn came (kept: a line printed does not change after),
  // in the language shown
  const TERM_VISIT = new Map();
  function visitRows(k) {
    if (!TERM_VISIT.has(k)) {
      TERM_VISIT.set(k, [TEL.visited.size, TEL.last, TEL.codes, faction]);
      TERM_VISIT.delete(k - 40);
    }
    const X = T().term,
      [n, last, codes, joined] = TERM_VISIT.get(k);
    return [
      [X.visitPages, `${n}/${MENU_IDS.length}`],
      [X.visitLast, last ? sectionName(last) : '—'],
      [X.visitCodes, String(codes)],
      [X.faction, factionOf(joined)?.name ?? '—'],
    ]; // (always a row, joined or not: the block keeps its length)
  }
  function drawColumn(c, L, p, t, reveal = Infinity) {
    const X = T().term,
      B = bootLog(),
      width = 24,
      rows = 13,
      x = L.pad + 8,
      y0 = L.pad + 18,
      size = 10.5;
    c.font = `400 ${size}px ${FONT_MONO}`;
    const cw = c.measureText('0').width,
      lines = [];
    // the boot, condensed: label, dots, state
    for (const l of B.lines) {
      if (l.k === 'boot') continue;
      const { label, state } = bootText(l, Infinity),
        st = state ? X[state] : '';
      lines.push(
        l.ready
          ? [[label, MINT]]
          : [
              [label + ' ' + '.'.repeat(Math.max(1, width - label.length - st.length - 2)) + ' ', DIM],
              [st, STATE_COLOUR[state] || INK],
            ],
      );
    }
    // the commands typed since, and their answers, and the station's own lines (TERM_LOG: the codes typed on the keypad,
    // the phone's call), each line when it came, the station's under their heading as the facts under theirs
    // (> KEYPAD, > CALL 112; again when other lines came between: the codes typed have their category, as the facts
    // have NETWORK or OPERATIONS); the prompt at the bottom, with the command being typed
    const row = (label, value, colour) => [
      [label + ' ' + '.'.repeat(Math.max(1, width - label.length - value.length - 2)) + ' ', DIM],
      [value, colour],
    ];
    let prompt = '';
    const printed = [];
    for (const b of termBlocks(p)) {
      if (p < b.typed) {
        prompt = b.cmd.slice(0, Math.floor((p - b.at) * BOOT.type));
        break;
      }
      printed.push([b.typed, [['> ' + b.cmd, INK]]]);
      for (const r of b.rows) if (p >= r.at) printed.push([r.at, row(r.label, r.value, MINT)]);
    }
    for (const e of TERM_LOG) if (p >= e.at) printed.push([e.at, row(...e.row()), e.head()]);
    let under = null;
    printed
      .sort((a, b) => a[0] - b[0])
      .forEach(([, l, head]) => {
        if (head && head !== under) lines.push([['> ' + head, INK]]);
        lines.push(l);
        under = head || null;
      });
    const visible = lines.slice(-(rows - 1)).slice(0, reveal);
    // (the line under the pointer, read again: lighter, a reading mark in the margin, its value decoded anew; TQ. The
    // last line is not lighter: in white, a fact's line would look like a heading, "> NETWORK")
    const hot = reveal === Infinity && !seeking && postsLive() ? TQ.row : -1;
    visible.forEach((segments, i) => {
      const y = y0 + i * 19.5,
        lit = i === hot;
      let cx = x;
      segments.forEach(([s, col], j) => {
        const colour = lit && col === DIM ? INK : col;
        if (i !== hot || j < segments.length - 1) mono(c, s, cx, y, size, colour);
        else {
          // its value: the last segment; a command's word after "> "; a single line whole
          const pre = segments.length === 1 && s.startsWith('> ') ? '> ' : '';
          if (pre) mono(c, pre, cx, y, size, colour);
          requery(c, s.slice(pre.length), cx + pre.length * cw, y, size, colour, cw, i, t);
        }
        cx += s.length * cw;
      });
      if (i === hot) {
        c.fillStyle = MINT;
        c.fillRect(L.pad + 3, y - 8, 2, 9);
      }
    });
    const py = y0 + visible.length * 19.5;
    if (reveal !== Infinity && visible.length < Math.min(lines.length, rows - 1)) return; // still printing
    mono(c, '> ' + prompt, x, py, size, MINT);
    c.fillStyle = INK;
    c.fillRect(x + (2 + prompt.length) * cw + 1, py - 8, cw - 1, 10);
  }
  // The terminal read again under the pointer: a style of its own, different from the tiles' light (after Aceternity's
  // Encrypted Text and Motion's Scramble Text). The terminal is a log of the station's readings: pointing at a line is
  // reading it again, and the station polls that value again: the line gets lighter, a reading mark shows in the
  // margin, its value is scrambled for an instant (hold), then settles from left to right (per letter, at most cap),
  // and all is still. No light, no frame: it does not say "click here", as the tiles do. The mouse or a pen only; with
  // reduced motion the value stays sharp. One line at a time, set by the pointer (termZone); a new line only by a
  // gesture of the visitor.
  const TQ = { row: -1, at: -Infinity, hold: 0.14, per: 0.07, cap: 0.36, window: 0.5, rect: null };
  // the top screen to redraw at once (the terminal's line read again, the menu's selection): drawn in the frame's update
  let topDirty = false;
  // a value, decoded anew t s after it was pointed at: the part still to settle drawn in glyphs, fainter (letters and
  // figures only; dots, slashes and spaces stay), new glyphs 20 times a second, different at every reading
  function requery(c, str, x, y, size, colour, cw, i, t) {
    const n = str.length,
      e = t - TQ.at,
      settle = Math.min(TQ.per * n, TQ.cap);
    const k = reduce ? n : Math.max(0, Math.min(n, Math.floor(((e - TQ.hold) / settle) * (n + 1))));
    mono(c, str.slice(0, k), x, y, size, colour);
    if (k >= n) return;
    const salt = i * 131 + ((TQ.at * 1000) | 0),
      bucket = Math.floor(t * 20);
    const rest = [...str.slice(k)]
      .map((ch, j) =>
        /[\p{L}\p{N}]/u.test(ch)
          ? GLYPHS[hash((k + j) * 131 + salt * 977 + bucket * 7919) % GLYPHS.length]
          : ch,
      )
      .join('');
    c.save();
    c.globalAlpha = 0.45;
    mono(c, rest, x + k * cw, y, size, colour);
    c.restore();
  }
  function drawTerminal(s, t) {
    const { c, w, h } = s,
      L = topLayout(w, h),
      p = termT,
      B = bootLog();
    if (shuttingDown()) {
      drawShutdown(c, w, h, sceneT - SW.off, t);
      return;
    }
    // the menu, with the small terminal in its left column and the telemetry on the right
    const menu = () => {
      c.drawImage(s.base, 0, 0, w, h);
      padTiles(c, s, L.cards); // (the tiles while a code is typed)
      if (menuSel >= 0) drawMenuSelection(c, L.cards[menuSel]);
      padMatches().forEach((i) => drawPadMatch(c, L.cards[i], i));
      drawColumn(c, L, p, t);
      drawTelemetry(c, L, t);
      mono(c, new Date(OPENED + t * 1000).toTimeString().slice(0, 8), L.ax + L.aw - 64, L.pad + 12, 12);
    };
    if (p >= B.doneAt) {
      menu();
      return;
    }
    if (p < B.menuAt) {
      drawBoot(c, w, h, p, t);
      return;
    }
    // a change of screen, as a computer does it: the boot screen clears at once, the glass stays empty a moment, then the
    // menu builds itself (its frames, titles and curves), the log printing itself again in its column, line by line
    const q = p - B.menuAt - BOOT.blank;
    if (q < 0) {
      glass(c, w, h);
      return;
    }
    drawMenuParts(c, w, h, q, t);
    drawColumn(c, L, p, t, Math.max(0, Math.floor((q - 0.25) / 0.06)));
    const cv = clamp01((q - 0.9) / 0.6);
    if (cv > 0) drawTelemetry(c, L, t, cv);
    const clock = new Date(OPENED + t * 1000).toTimeString().slice(0, 8);
    mono(c, clock.slice(0, Math.round(8 * clamp01((q - 0.3) / 0.3))), L.ax + L.aw - 64, L.pad + 12, 12);
  }

  // the radar screen background: navy glass, grid, bearing ticks every 10 degrees (longer every 30), the range rings, the
  // axes and the four headings, drawn once
  function drawRadarBase(s) {
    const { c, w, h } = s,
      cx = w / 2,
      cy = h / 2;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
    g.addColorStop(0, '#0c1b33');
    g.addColorStop(1, '#050d1a');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(90,140,200,.16)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = cx % 38; x < w; x += 38) {
      c.moveTo(Math.round(x) + 0.5, 0);
      c.lineTo(Math.round(x) + 0.5, h);
    }
    for (let y = cy % 38; y < h; y += 38) {
      c.moveTo(0, Math.round(y) + 0.5);
      c.lineTo(w, Math.round(y) + 0.5);
    }
    c.stroke();
    c.strokeStyle = 'rgba(150,195,255,.45)';
    c.beginPath();
    for (let d = 0; d < 360; d += 10) {
      const a = (d * Math.PI) / 180,
        r0 = 110,
        r1 = d % 30 ? 104 : 98;
      c.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
      c.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
    }
    c.stroke();
    c.fillStyle = 'rgba(150,195,255,.7)';
    c.beginPath();
    c.arc(cx, cy, 2, 0, 6.283);
    c.fill();
    // the range rings (every 5 miles: their figures along the north-east) and the two axes; the four headings inside the
    // bearing ticks
    c.strokeStyle = 'rgba(150,195,255,.4)';
    c.beginPath();
    for (const r of RADAR.rings) {
      c.moveTo(cx + r, cy);
      c.arc(cx, cy, r, 0, 6.283);
    }
    c.stroke();
    c.strokeStyle = 'rgba(150,195,255,.22)';
    c.beginPath();
    c.moveTo(0, Math.round(cy) + 0.5);
    c.lineTo(w, Math.round(cy) + 0.5);
    c.moveTo(Math.round(cx) + 0.5, 0);
    c.lineTo(Math.round(cx) + 0.5, h);
    c.stroke();
    RADAR.rings.forEach((r, i) => {
      if (r < Math.min(cx, cy))
        mono(c, String(5 * (i + 1)), cx + r * 0.72 + 3, cy - r * 0.72 - 2, 7, 'rgba(150,195,255,.5)');
    });
    [
      ['000', 0],
      ['090', 90],
      ['180', 180],
      ['270', 270],
    ].forEach(([t, d]) => {
      const q = (d * Math.PI) / 180;
      mono(c, t, cx + Math.sin(q) * 88, cy - Math.cos(q) * 88 + 2.5, 7, 'rgba(150,195,255,.55)', 'center');
    });
  }
  // the radar overlay: the scope (its canvas) and the echoes, the factions' in their colours and the people's in white,
  // each placed as a fraction of the screen, and as a bearing and a range for the sweep; the ground clutter (within
  // RADAR.clutter of the centre, thicker nearer it) and the specks (anywhere), each painted on a turn or not (p), as a
  // real return comes and goes; the faction joined, its echo ringed (.mark). RADAR: the rings' radii; the afterglow
  // behind the line (s, its time constant) and how far it shows (deg); an echo's fade (s), what is left of it till the
  // sweep comes back (floor), its dot's radius (px); the clutter's and the specks' fade (s)
  const RADAR_PERIOD = 6; // s per turn
  const RADAR = {
    rings: [55, 110, 165],
    glow: 1.1,
    glowSpan: 160,
    fade: 1.6,
    floor: 0.22,
    dot: 4.5,
    speck: 0.9,
    clutter: 34,
  };
  const RADAR_AT = {
      manticore: [0.72, 0.28],
      valkyra: [0.3, 0.7],
      lonestar: [0.58, 0.62],
      biggy: [0.36, 0.3],
    },
    RADAR_PERSON = '#eef4ff'; // (a person's echo, white)
  function buildRadar(s) {
    const { tube, w, h } = s,
      cx = w / 2,
      cy = h / 2,
      R = Math.hypot(cx, cy);
    const div = (cls, css) => {
      const d = document.createElement('div');
      d.className = cls;
      Object.assign(d.style, css);
      return d;
    };
    const r = div('radar', {}),
      cv = document.createElement('canvas'),
      at = (x, y) => ({
        b: ((Math.atan2(x - cx, cy - y) * 180) / Math.PI + 360) % 360,
        r: Math.hypot(x - cx, y - cy),
      });
    cv.className = 'scope';
    cv.width = Math.round(w * CANVAS_SCALE);
    cv.height = Math.round(h * CANVAS_SCALE);
    Object.assign(cv.style, { width: w + 'px', height: h + 'px' });
    const scope = cv.getContext('2d');
    scope.scale(CANVAS_SCALE, CANVAS_SCALE);
    r.append(cv);
    const echoes = [...FACTIONS, ...PEOPLE].map(({ id, colour = RADAR_PERSON }) => {
      const [fx, fy] = RADAR_AT[id],
        x = fx * w,
        y = fy * h,
        mark = factionOf(id) ? div('mark', { left: x + 'px', top: y + 'px' }) : null; // (a faction's ring, for the one joined)
      if (mark) {
        mark.style.setProperty('--c', colour);
        r.append(mark);
      }
      return { id, colour, mark, x, y, ...at(x, y) };
    });
    const rand = rng(61),
      speck = (x, y, p) => ({ ...at(x, y), x, y, p, v: 0.25 + 0.45 * rand() });
    const clutter = Array.from({ length: 70 }, () => {
      const q = rand() * 6.283,
        d = 5 + RADAR.clutter * rand() ** 1.6;
      return speck(cx + Math.sin(q) * d, cy - Math.cos(q) * d, 0.75);
    });
    const specks = Array.from({ length: 26 }, () => speck(rand() * w, rand() * h, 0.35));
    tube.append(r);
    s.radar = {
      scope,
      cx,
      cy,
      R,
      echoes,
      specks: [...clutter, ...specks],
      drawn: -Infinity,
      light: LITE || !CSS.supports('mask-composite', 'subtract') ? null : radarLight(s),
    }; // (none in LITE, nor without the mask its glass needs)
  }
  // the radar's light round its glass (CSS .radar-light): the screen's own box widened by RADAR_LIGHT.pad on each
  // side, projected as the screen is (onScreen: the bezel is in its plane), over the screens; its light (the i) turned
  // to the sweep's angle and lit with the receiver's gain by radarStep
  const RADAR_LIGHT = { pad: 90 }; // (px of the screen's box: about the bezel and a hand of the console round it)
  function radarLight(s) {
    const p = RADAR_LIGHT.pad,
      W = s.w + 2 * p,
      H = s.h + 2 * p,
      el = document.createElement('div'),
      beam = document.createElement('i');
    el.className = 'radar-light';
    el.append(beam);
    Object.assign(el.style, { width: W + 'px', height: H + 'px' });
    [
      ['--pad', p],
      ['--w', s.w],
      ['--h', s.h],
      ['--d', Math.ceil(Math.hypot(W, H))],
    ].forEach(([k, v]) => el.style.setProperty(k, v + 'px'));
    $('screens').append(el);
    project(
      el,
      W,
      H,
      [
        [-p, -p],
        [s.w + p, -p],
        [s.w + p, s.h + p],
        [-p, s.h + p],
      ].map(([x, y]) => onScreen(s, x, y)),
    );
    return { el, beam };
  }
  // our emblem, traced from its 1024-unit drawing (centre 512, about 790 units wide), size px wide, centred on cx, cy; in
  // one ink, if given (a pictogram: its bars in it too)
  function emblem(c, cx, cy, size, ink = null) {
    const k = size / 790;
    c.save();
    c.translate(cx - 512 * k, cy - 512 * k);
    c.scale(k, k);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = ink || '#f3f5f9';
    c.lineWidth = 44;
    c.beginPath();
    c.moveTo(319, 137.5);
    c.lineTo(771, 137.5);
    c.arc(771, 251.5, 114, -Math.PI / 2, 0);
    c.lineTo(885, 715);
    c.stroke();
    c.beginPath();
    c.moveTo(705, 886.5);
    c.lineTo(253, 886.5);
    c.arc(253, 772.5, 114, Math.PI / 2, Math.PI);
    c.lineTo(139, 309);
    c.stroke();
    const cap = (a, b, wd, c0, c1) => {
      const e = wd / 2,
        L = Math.hypot(b[0] - a[0], b[1] - a[1]),
        ux = (b[0] - a[0]) / L,
        uy = (b[1] - a[1]) / L;
      const g = c.createLinearGradient(a[0] - ux * e, a[1] - uy * e, b[0] + ux * e, b[1] + uy * e);
      g.addColorStop(0, c0);
      g.addColorStop(1, c1);
      c.strokeStyle = g;
      c.lineWidth = wd;
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
    };
    const col = (a, b) => (ink ? [ink, ink] : [a, b]);
    cap([420.6, 396.8], [320.6, 616.6], 80, ...col('#27df95', '#05ba6b'));
    cap([571.5, 366.8], [451.7, 656.4], 82, ...col('#ff6c6c', '#ff3d50'));
    cap([702.6, 396.8], [602.6, 616.6], 80, ...col('#41c4fd', '#089be8'));
    c.restore();
  }
  // the tower screen, laid out on the game's grid (1000 x 600 units, about 2 % in from the bezel); our name, the code's
  // slots: the code of the page the screen opens, typed at the keypad it opens it too (not 471, which beside
  // "▸ EXTENSION" would confuse: 471 stays a hidden code), our emblem in the fourth. No inner frame: the bezel
  // frames the screen, as on the menu's and the terminal's (the game draws one; the screen looks better without it);
  // our name instead of the game's tower's
  function drawMain(s) {
    const { c, w, h } = s;
    glass(c, w, h, '#1f2220');
    const u = Math.min((w * 0.955) / 1000, (h * 0.955) / 600),
      ox = (w - 1000 * u) / 2,
      oy = (h - 600 * u) / 2;
    // The block, centred on the grid (0 to 600): our name (as wide as the slots at most, 92 to 908), 105 units above the
    // figures' top (room between the code and the title), the slots down to their underlines' foot (466). The heights
    // are measured on the font, which may vary from a system to another.
    const asc = (size, text) => {
      c.font = `700 ${size * u}px ${FONT_TERM}`;
      return c.measureText(text).actualBoundingBoxAscent / u;
    };
    c.font = `700 ${92 * u}px ${FONT_TERM}`;
    const nameSize = 92 * Math.min(1, (816 * u) / c.measureText(NAME).width);
    const nameFoot = 389 - asc(150, '4') - 105,
      dy = 300 - (nameFoot - asc(nameSize, NAME) + 466) / 2;
    const X = (x) => ox + x * u,
      Y = (y) => oy + (y + dy) * u;
    c.save();
    c.shadowColor = 'rgba(255,255,255,.35)';
    c.shadowBlur = 3;
    txt(c, NAME, X(500), Y(nameFoot), nameSize * u, WHITE, 'center', 700);
    const pitch = 215,
      ul = 172;
    [...T().menu[MENU_IDS.indexOf(SCREEN_SECTION)][2], 'emblem'].forEach((v, i) => {
      const cx = 500 + (i - 1.5) * pitch;
      if (v === 'emblem') emblem(c, X(cx), Y(332), 150 * u);
      else txt(c, v, X(cx), Y(389), 150 * u, WHITE, 'center', 700);
      c.fillStyle = MINT;
      c.fillRect(X(cx - ul / 2), Y(450), ul * u, 16 * u);
      if (v === 'emblem') {
        c.beginPath();
        c.moveTo(X(cx - 40), Y(451));
        c.lineTo(X(cx), Y(428));
        c.lineTo(X(cx + 40), Y(451));
        c.fill();
      }
    });
    // what the screen is for, under its slots (as ENTER CODE's ▼ KEYPAD), so that the project's page is easy to find:
    // its page, its code (what the figures above it are, as on the menu's cards), read with a click, in its tag's words
    txt(
      c,
      `▸ ${sectionName(SCREEN_SECTION)} · CODE ${T().menu[MENU_IDS.indexOf(SCREEN_SECTION)][2]} · ${(touchOnly ? T().postScreenHintTouch : T().postScreenHint).toUpperCase()}`,
      X(500),
      Y(548),
      36 * u,
      'rgba(159, 251, 193, .85)',
      'center',
      600,
    );
    c.restore();
  }
  function drawCode(s) {
    if (HACK.t0 !== null && hackOnCode() && (!PAD.entry || PAD.answer?.state === 'active'))
      return drawHack(s, performance.now() / 1000 - HACK.t0); // (in portrait: the tower out of view)
    const { c, w, h } = s;
    glass(c, w, h, '#252826'); // (no inner frame, as on the other screens)
    c.save();
    c.shadowColor = 'rgba(255,255,255,.35)';
    c.shadowBlur = 2;
    txt(c, T().enter, w / 2, h * 0.23, h * 0.13, '#fefefe', 'center', 700);
    // the answer, in place of the slots, the title kept (as in the game); its word as wide as the slots' block at most
    const said = PAD.answer?.state;
    if (said) {
      const word = T()[said],
        look = ANSWER_LOOK[said];
      c.font = `700 ${h * 0.24}px ${FONT_TERM}`;
      const size = h * 0.24 * Math.min(1, (w * 0.78) / c.measureText(word).width);
      c.shadowColor = look.glow;
      c.shadowBlur = 4;
      txt(c, word, w / 2, h * 0.66, size, look.colour, 'center', 700);
      c.restore();
      return;
    }
    // the call, while nothing is typed, in place of the slots: INCOMING CALL, bright with each ring; then CONNECTED,
    // and the call's time under it, where the keypad's hint was
    const call = !PAD.entry && { ringing: 'callIncoming', connected: 'callConnected' }[CALL.state];
    if (call) {
      const word = T()[call],
        bright = CALL.lit || CALL.state === 'connected';
      c.font = `700 ${h * 0.2}px ${FONT_TERM}`;
      const size = h * 0.2 * Math.min(1, (w * 0.86) / c.measureText(word).width);
      c.shadowColor = 'rgba(159, 251, 193, .45)';
      c.shadowBlur = bright ? 4 : 0;
      txt(c, word, w / 2, h * 0.64, size, bright ? MINT : 'rgba(159, 251, 193, .55)', 'center', 700);
      if (CALL.state === 'connected') {
        c.shadowBlur = 0;
        txt(c, callClock(), w / 2, h * 0.875, h * 0.095, 'rgba(159, 251, 193, .85)', 'center', 600);
      }
      c.restore();
      return;
    }
    c.fillStyle = '#fefefe';
    const sw = w * 0.14,
      gap = 3,
      n = 3,
      tw = n * sw + (n - 1) * gap;
    for (let i = 0; i < n; i++)
      c.fillRect(w / 2 - tw / 2 + i * (sw + gap), h * 0.68, sw, Math.max(2, h * 0.035));
    // the figures typed, each over its slot, as in the game: "___" -> "2__" -> "27_" -> "273"
    const typed = PAD.entry;
    for (let i = 0; i < typed.length; i++)
      txt(c, typed[i], w / 2 - tw / 2 + i * (sw + gap) + sw / 2, h * 0.62, h * 0.3, '#fefefe', 'center', 700);
    c.restore();
    // at rest, where the code is typed: the keypad, below (so that the visitor knows where to type it); not once
    // something is typed
    if (!typed)
      txt(c, T().keypadHint, w / 2, h * 0.875, h * 0.095, 'rgba(159, 251, 193, .85)', 'center', 600);
  }
  // The small displays: their signal (amplitude, density, height) is scaled by A, the gain, which comes up after their
  // trace during the power-on (gainOf).
  // (each shows a real reading of the station: C1 the keyboard's activity; C2 the code's check and C3 the station's
  // state; A2 the faction's emblem and A3 its name; A1 the radar's A-scope; B1 the bays' power)
  const SMALL_KINDS = {
    a1: 'ascope',
    a2: 'emblem',
    a3: 'faction',
    b1: 'power',
    c1: 'keys',
    c2: 'check',
    c3: 'status',
  };
  // the radar's A-scope, as a ship's beside its plan display: the returns along one bearing, the range across the trace
  // (the radar's centre at the left, the glass's corner at the right); here, the returns of the echoes the sweep has just
  // painted: a peak at each one's range, in its echo's colour (a faction's, a person's white), falling as it fades on the
  // radar (no floor: the beam has moved on); at the left, the ground clutter's grass, always there at short range; along
  // the trace, its own faint noise. The sweep's angle and the echoes' ages as the radar's (radarStep, radarDraw): the
  // same at every moment.
  const ASCOPE = { base: 0.8, peak: 0.62, width: 1.7, grass: 0.16 }; // (the baseline's height, a peak's at most, its width (px), the grass's reach: fractions of the trace)
  function aScope(c, w, h, t, A) {
    const radar = SCR.carte?.radar;
    if (!radar) return;
    const angle = reduce ? 40 : ((t / RADAR_PERIOD) * 360) % 360,
      since = signalAge(SCR.carte),
      y0 = h * ASCOPE.base,
      x0 = 4,
      span = w - 8;
    const peaks = radar.echoes.map((e) => {
      const u = (((angle - e.b + 360) % 360) / 360) * RADAR_PERIOD;
      return {
        x: x0 + (e.r / radar.R) * span,
        k: u > since ? 0 : Math.exp(-u / RADAR.fade),
        colour: e.colour,
      };
    });
    const y = (x) => {
      let v = Math.sin(x * 1.9 + t * 13) * 0.25 + Math.sin(x * 0.7 - t * 7) * 0.2; // (the trace's own noise, a fraction of a pixel)
      const g = (x - x0) / span;
      if (g < ASCOPE.grass) v += (1 - g / ASCOPE.grass) * (1.6 + 1.2 * Math.abs(Math.sin(x * 2.3 + t * 17))); // (the grass)
      for (const p of peaks) v += p.k * h * ASCOPE.peak * Math.exp(-(((x - p.x) / ASCOPE.width) ** 2));
      return y0 - v * A;
    };
    const trace = (from, to) => {
      c.beginPath();
      c.moveTo(from, y(from));
      for (let x = from + 0.5; x <= to; x += 0.5) c.lineTo(x, y(x));
      c.stroke();
    };
    c.save();
    c.lineWidth = 1;
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(214,220,211,.85)';
    trace(x0, x0 + span);
    for (const p of peaks)
      if (p.k * A > 0.03) {
        c.strokeStyle = p.colour;
        c.globalAlpha = Math.min(1, p.k * 1.4);
        trace(Math.max(x0, p.x - 4), Math.min(x0 + span, p.x + 4));
      }
    c.restore();
  }
  // the factions' emblems, the game's (the media's factions/, never in the repository: the game's media, shown to
  // BULKHEAD with the rest, removed on request)
  const FACTION_LOGOS = Object.fromEntries(
    FACTIONS.map(({ id }) => {
      const im = new Image();
      im.onload = () => smallShow();
      im.src = media(`factions/${id}.webp`);
      return [id, im];
    }),
  );
  function drawSmall(s, t, A) {
    const { c, w, h } = s,
      kind = SMALL_KINDS[s.z.id];
    glass(c, w, h, '#050806');
    if (kind === 'power') {
      // (a bar per bay, its letter under it; its segments lit as far as its power: bayPower.
      // The gain fades the whole picture in, not the reading: once there, it shows the bays as they are)
      const n = BAY_POWER.bays.length,
        cw = (w - 10) / n,
        bw = Math.min(12, cw * 0.5),
        top = 4,
        foot = h - 10,
        sh = (foot - top) / BAY_POWER.seg;
      c.save();
      c.globalAlpha = A;
      BAY_POWER.bays.forEach((b, i) => {
        const cx = 5 + cw * (i + 0.5),
          v = bayPower(i, t) * BAY_POWER.seg;
        for (let k = 0; k < BAY_POWER.seg; k++) {
          c.fillStyle = `rgba(214,220,211,${(0.1 + 0.75 * clamp01(v - k)).toFixed(3)})`;
          c.fillRect(cx - bw / 2, foot - (k + 1) * sh + 0.5, bw, sh - 1);
        }
        mono(c, b, cx, h - 2.5, 6.5, 'rgba(214,220,211,.7)', 'center');
      });
      c.restore();
    } else if (kind === 'keys') {
      // (the keyboard's activity, the last 2.5 s scrolling left: a blip per key)
      const span = 2.5,
        y0 = h * 0.6,
        amp = h * 0.38 * A,
        hits = PAD.hits.filter((th) => t - th < span + 0.4);
      c.strokeStyle = 'rgba(214,220,211,.85)';
      c.lineWidth = 1;
      c.beginPath();
      for (let x = 0; x <= w; x++) {
        const tx = t - ((w - x) / w) * span;
        let v = 0;
        for (const th of hits) {
          const u = tx - th;
          if (u >= 0 && u < 0.25) v += Math.exp(-u / 0.045) * Math.sin(u * 55);
        } // (a sharp rise, a small rebound: one key, one blip)
        const y = y0 - v * amp + Math.sin(x * 1.7 + t * 11) * 0.35 * A;
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    } else if (kind === 'check') {
      // (the code's check, one cell a figure: nearly off at rest, its baseline; the figures
      // typed fill their cells, a fine line sweeping them as it reads; then all in lime (ACTIVE) or orange-red (ERROR))
      const said = PAD.answer?.state,
        n = PAD.len,
        gap = 3,
        cw = (w - 10 - (n - 1) * gap) / n,
        ch = h * 0.42,
        y = (h - ch) / 2;
      const answer = said === 'active' ? LIME : said === 'error' ? ALERT : null;
      if (!PAD.entry) {
        c.fillStyle = `rgba(214,220,211,${(0.2 * A).toFixed(3)})`;
        c.fillRect(5, Math.round(h / 2), w - 10, 1);
      } else {
        for (let i = 0; i < n; i++) {
          const x = 5 + i * (cw + gap);
          if (answer) {
            c.globalAlpha = A;
            c.fillStyle = answer;
            c.fillRect(x, y, cw, ch);
            c.globalAlpha = 1;
          } else if (i < PAD.entry.length) {
            c.fillStyle = `rgba(214,220,211,${(0.75 * A).toFixed(3)})`;
            c.fillRect(x, y, cw, ch);
          } else {
            c.strokeStyle = `rgba(214,220,211,${(0.35 * A).toFixed(3)})`;
            c.lineWidth = 1;
            c.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
          }
        }
        if (!answer && !reduce) {
          c.fillStyle = `rgba(214,220,211,${(0.6 * A).toFixed(3)})`;
          c.fillRect(5 + ((t * 1.4) % 1) * (w - 10), y - 3, 1, ch + 6);
        }
      }
    } else if (kind === 'ascope') {
      // (A1: the radar's A-scope; aScope)
      aScope(c, w, h, t, A);
    } else if (kind === 'emblem') {
      // (A2: the faction joined, its emblem, coming up as it is joined; none: its empty slot)
      const joined = factionOf(faction),
        im = joined && FACTION_LOGOS[joined.id],
        k = reduce ? 1 : clamp01((t - factionAt) / 0.4);
      c.save();
      c.globalAlpha = A;
      if (im?.naturalWidth) {
        const H = h * 0.82,
          W = (H * im.naturalWidth) / im.naturalHeight;
        c.globalAlpha = A * k;
        c.imageSmoothingQuality = 'high';
        c.drawImage(im, (w - W) / 2, (h - H) / 2, W, H);
      } // (no glow: at this size it blurs the emblem into a blot)
      else {
        c.strokeStyle = 'rgba(214,220,211,.25)';
        c.setLineDash([2, 2]);
        c.strokeRect(
          Math.round(w / 2 - h * 0.4) + 0.5,
          Math.round(h * 0.1) + 0.5,
          Math.round(h * 0.8) - 1,
          Math.round(h * 0.8) - 1,
        );
      }
      c.restore();
    } else if (kind === 'faction') {
      // (A3: FACTION, then its name in its colour, decoded as it is joined; none: NONE)
      const X = T().term,
        joined = factionOf(faction),
        k = reduce ? 1 : clamp01((t - factionAt) / 0.5);
      c.save();
      c.globalAlpha = A;
      mono(c, X.faction, w / 2, h * 0.38, h * 0.26, 'rgba(214,220,211,.55)', 'center');
      mono(
        c,
        joined ? (k < 1 ? decoding(joined.name, k, 7, t) : joined.name) : X.factionNone,
        w / 2,
        h * 0.82,
        h * 0.34,
        joined ? joined.colour : 'rgba(214,220,211,.45)',
        'center',
        600,
      );
      c.restore();
    } else if (kind === 'status' && A > 0.5) {
      // (the station's state, scrolling: the code being typed (or its answer) first,
      // the link, the sound; with reduced motion it stands, the code in sight)
      const X = T(),
        code = PAD.answer?.state ? `${PAD.entry} ${X[PAD.answer.state]}` : PAD.entry.padEnd(PAD.len, '_');
      const ink = 'rgba(214,220,211,.8)',
        joined = factionOf(faction); // (the faction joined, in its colour, after the code)
      const parts = [
        [`CODE ${code} · `, ink],
        ...(joined
          ? [
              [joined.name, joined.colour],
              [' · ', ink],
            ]
          : []),
        [`${X.statusLink} · ${soundOn ? `${X.soundWord} ${volStep * 10} %` : X.muted} · `, ink],
      ];
      c.font = `400 ${h * 0.45}px ${FONT_MONO}`;
      const ws = parts.map(([p]) => c.measureText(p).width),
        tw = ws.reduce((a, b) => a + b),
        off = reduce ? 0 : (t * 18) % tw;
      for (const x0 of [6 - off, 6 - off + tw])
        parts.reduce((x, [p, col], i) => (mono(c, p, x, h * 0.66, h * 0.45, col), x + ws[i]), x0);
    }
  }

  // ===================================================================================================================
  // Needles and lamps: small elements of their own, turned or lit by the compositor (with a graphics card nothing is
  // redrawn; without one, LITE, the processor redraws round what moves: the needles stay still at rest there, needleStep)
  // ===================================================================================================================
  // panelT: the arrival's time as the panel sees it (Infinity once over, or without an arrival); roomLight: how lit the
  // room is (0..1), which the needles follow (they are hard to see in the dark)
  let panelT = Infinity,
    roomLight = 1,
    panelOff = null; // (panelOff: s since the station was switched off, while it goes down)
  const NEEDLES = [];
  // rest values: the game's own for the top dials, plausible elsewhere
  const NEEDLE_REST = { 'haut-blanc-1': 31, 'haut-blanc-2': 52, 'haut-noir-1': 50, 'haut-noir-2': 35 };
  // Each needle charges with what it measures: when its bay gets power, one after the other within the bay (stagger),
  // it climbs to its value like a charging capacitor (95 % in fill s), its spring smoothing the start (k, c: stiffness
  // and damping, close to critical: no bounce, a voltmeter at most a hint past its value).
  const NEEDLE_KIND = {
    volt: { k: 30, c: 8, fill: 2.6, stagger: 0.35 },
    gauge: { k: 20, c: 9, fill: 3.2, stagger: 0.4 },
    top: { k: 20, c: 9, fill: 3.0, stagger: 0 },
    vu: { k: 40, c: 11, fill: 1.6, stagger: 0 },
  };
  // (the top bay's four temperature gauges each read a bay's, as their plates say: A to D in reading order; they warm up
  // as it gets power, and cool as it loses it; each alone in its bay, as the VU meter: no stagger, the relays space them)
  const GAUGE_BAY = { 'haut-blanc-1': 'A', 'haut-noir-1': 'B', 'haut-blanc-2': 'C', 'haut-noir-2': 'D' };
  const NEEDLE_BAY = (id) => GAUGE_BAY[id] ?? (id.startsWith('b-') ? 'B' : 'D');
  const kindOf = (id) =>
    id.startsWith('haut-') ? 'top' : id === 'd-vumetre' ? 'vu' : id.includes('volt') ? 'volt' : 'gauge';
  function buildNeedles(z) {
    const box = $('needles'),
      NS = 'http://www.w3.org/2000/svg';
    const order = {}; // how many needles of the same kind and bay already wait (for the stagger)
    z.gauges.forEach((d, i) => {
      const dark = d.id.startsWith('haut-noir'),
        volt = d.kind.startsWith('volt') || d.id === 'd-vumetre';
      const L = d.radius * (dark ? 0.86 : volt ? 0.92 : 0.84),
        wd = Math.max(1, d.radius / 22),
        R = Math.ceil(L * 1.2 + 4);
      // a small square svg centred on the pivot, turned around its centre
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'needle');
      svg.setAttribute('viewBox', `${-R} ${-R} ${2 * R} ${2 * R}`);
      Object.assign(svg.style, {
        left: d.pivot[0] - R + 'px',
        top: d.pivot[1] - R + 'px',
        width: 2 * R + 'px',
        height: 2 * R + 'px',
      });
      const needle = document.createElementNS(NS, 'path');
      needle.setAttribute(
        'd',
        volt
          ? `M -${wd * 0.5} 0 L 0 ${-L} L ${wd * 0.5} 0 Z`
          : `M -${wd} ${L * 0.16} L -${wd * 0.55} 0 L 0 ${-L} L ${wd * 0.55} 0 L ${wd} ${L * 0.16} Z`,
      );
      needle.setAttribute('fill', dark ? '#e9e2c6' : '#111311');
      const shadow = needle.cloneNode();
      shadow.setAttribute('fill', 'rgba(0,0,0,.35)');
      shadow.setAttribute('transform', 'translate(1.2 1.6)');
      svg.append(shadow, needle);
      if (!volt) {
        const cap = document.createElementNS(NS, 'circle');
        cap.setAttribute('r', Math.max(2.5, d.radius * (dark ? 0.13 : 0.16)));
        cap.setAttribute('fill', dark ? '#2b2f30' : '#0c0d0c');
        cap.setAttribute('stroke', 'rgba(255,255,255,.18)');
        cap.setAttribute('stroke-width', '.6');
        svg.append(cap);
      }
      box.append(svg);
      const kind = kindOf(d.id),
        rest = NEEDLE_REST[d.id] ?? d.valueMin + (d.valueMax - d.valueMin) * (0.32 + ((i * 37) % 30) / 100);
      // when it gets power (arrival time): -Infinity without an arrival (on from the start); otherwise a moment after its
      // bay's relay, one by one
      const bay = NEEDLE_BAY(d.id),
        key = kind + bay,
        nth = (order[key] = (order[key] ?? -1) + 1);
      const onAt = RELAY[bay] + (kind === 'vu' ? 1.2 : 0.3) + nth * NEEDLE_KIND[kind].stagger;
      // (and when it loses it, its bay's relay opening, one after the other again)
      const offAt = OFF.relay[bay] + 0.05 + nth * 0.12;
      // (its life: whether it sags now and then, and its own period)
      const salt = i * 977 + 13,
        dips = rand01(salt) < DIP.share,
        period = within(DIP.period, rand01(salt + 1));
      NEEDLES.push({
        d,
        el: svg,
        rest,
        onAt,
        offAt,
        salt,
        dips,
        period,
        ...NEEDLE_KIND[kind],
        v: d.valueMin,
        vel: 0,
        phase: i * 1.7,
        amp: (d.valueMax - d.valueMin) * (volt ? 0.035 : 0.018),
      });
    });
  }
  // Life on the dials (once started, the needles would stay still: a light, realistic, smooth life, never all at once,
  // on varied timings): about two needles in three (share), each on its own rhythm, now and then sag a little as a load
  // comes on and come back as it goes, as a supply's needle does: once per period (s, its own, between the bounds) at a
  // moment of its own in it, by depth (a share of its reading), easing down over fall s, holding a moment, easing back
  // over back s; its spring smooths it further. A function of the scene time, from a hash per needle and per period:
  // the same at every visit and in a capture, never two needles alike.
  const DIP = {
    share: 0.65,
    period: [8, 18],
    depth: [0.04, 0.1],
    fall: [1.2, 2.4],
    hold: [0.3, 1.2],
    back: [2, 3.5],
  };
  const DIP_LONGEST = DIP.fall[1] + DIP.hold[1] + DIP.back[1];
  const rand01 = (a) => hash(a) / 4294967296;
  const within = ([lo, hi], r) => lo + (hi - lo) * r;
  function dipOf(n, t) {
    if (!n.dips) return 0;
    const P = n.period,
      k = Math.floor(t / P);
    let d = 0;
    for (const c of [k - 1, k]) {
      // (an event may run on from the period before)
      const r = (i) => rand01(n.salt * 7919 + c * 104729 + i * 31),
        start = c * P + r(0) * Math.max(0, P - DIP_LONGEST);
      const fall = within(DIP.fall, r(1)),
        hold = within(DIP.hold, r(2)),
        back = within(DIP.back, r(3)),
        u = t - start;
      const shape =
        u < 0
          ? 0
          : u < fall
            ? smoother(u / fall)
            : u < fall + hold
              ? 1
              : u < fall + hold + back
                ? 1 - smoother((u - fall - hold) / back)
                : 0;
      d = Math.max(d, within(DIP.depth, r(4)) * shape);
    }
    return d;
  }
  // B1, the bays' power (the bays' supply): a bar per bay, A to D as the
  // terminal names them; up from the moment its relay closes, charging as the needles do (95 % in BAY_POWER.fill s),
  // down as it opens (BAY_POWER.drop: its time constant); at rest, now and then a little lower, a load coming on (dipOf,
  // each bay its own rhythm: life); still with reduced motion. Drawn by drawSmall ('power'), as the display's gain allows
  const BAY_POWER = { bays: ['A', 'B', 'C', 'D'], seg: 6, fill: 0.5, drop: 0.2 };
  BAY_POWER.life = BAY_POWER.bays.map((_, i) => ({
    dips: true,
    salt: 7001 + i * 131,
    period: within(DIP.period, rand01(7002 + i * 131)),
  }));
  function bayPower(i, t) {
    const b = BAY_POWER.bays[i],
      off = panelOff !== null ? panelOff - OFF.relay[b] : -Infinity,
      since = panelT - RELAY[b];
    if (since < 0) return 0; // (not yet closed)
    if (reduce) return off >= 0 ? 0 : 1;
    const level =
      (1 - Math.exp((-3 * since) / BAY_POWER.fill)) * (1 - dipOf(BAY_POWER.life[i], off >= 0 ? t - off : t)); // (as it stood when its relay opened, if it has: panelT stands still then)
    return off >= 0 ? level * Math.exp(-off / BAY_POWER.drop) : level; // (its relay open: down from there)
  }
  // bay B's three small dials (BASS, MID, TREBLE on their plates: LEGENDS) read what is heard, as a hi-fi's level
  // meters: the loudest of the audio monitor's bands in their range (mon.v, its studio ballistics: quick up, slow down),
  // on a scale from a quiet floor (SOUND_DIAL.floor) to SOUND_DIAL.top, through their own spring (a light lag, no
  // jitter); nothing heard (the sound off, the volume at 0), on that floor, as the monitor's empty bands above them:
  // they fall when the sound is cut, never rise; with reduced motion, still on that floor (they cannot follow it
  // without moving). The bands, the monitor's 0-4, 5-10 and 11-15: 50 to 280 Hz, 280 Hz to 2.2 kHz, 2.2 to 12 kHz
  const NEEDLE_SOUND = { 'b-bas-1': [0, 5], 'b-bas-2': [5, 11], 'b-bas-3': [11, 16] },
    SOUND_DIAL = { floor: 0.08, top: 0.85 };
  // each needle goes to its value on its spring, then breathes around it (and now and then sags a little: dipOf); with
  // reduced motion it simply sits there. Without a graphics card (LITE) it still goes to its value on its spring (up at
  // the power-on, down at the switch-off, the sound's dials with the sound) but then stays still, neither breath nor sag
  // (calm): the needles are all over the console, and the processor draws again the whole box round all that moves, at
  // every frame (measured: 26 to 30 frames a second with jolts of 70 to 85 ms; calm, 60, even)
  function needleStep(dt, t) {
    const heard = monLive(),
      calm = reduce || LITE; // (heard: the sound on and playing: the small dials of bay B read it)
    for (const n of NEEDLES) {
      const { d } = n,
        on = panelT >= n.onAt && !(panelOff !== null && panelOff >= n.offAt),
        since = panelT - n.onAt;
      const reach = on ? 1 - Math.exp((-3 * since) / n.fill) : 0,
        band = NEEDLE_SOUND[d.id];
      const breath =
        on && !calm && !band
          ? smoother(clamp01((since - n.fill) / 2)) *
            n.amp *
            (Math.sin(t * 0.43 + n.phase) * 0.7 + Math.sin(t * 1.3 + n.phase * 2.1) * 0.3)
          : 0;
      const life = on && !calm && !band ? smoother(clamp01((since - n.fill - 2) / 3)) * dipOf(n, t) : 0; // (once charged)
      const level = band
        ? SOUND_DIAL.floor +
          (SOUND_DIAL.top - SOUND_DIAL.floor) * (heard && !reduce ? Math.max(...mon.v.subarray(...band)) : 0)
        : 0;
      const target = band
        ? d.valueMin + (d.valueMax - d.valueMin) * level * reach
        : d.valueMin + (n.rest - d.valueMin) * reach * (1 - life) + breath;
      if (reduce) {
        n.v = target;
        n.vel = 0;
      } else {
        n.vel += (n.k * (target - n.v) - n.c * n.vel) * dt;
        n.v += n.vel * dt;
      }
      const a = d.angleMin + ((d.angleMax - d.angleMin) * (n.v - d.valueMin)) / (d.valueMax - d.valueMin);
      setStyle(n.el, 'transform', `rotate(${a.toFixed(2)}deg)`);
      setStyle(n.el, 'opacity', (0.55 + 0.45 * roomLight).toFixed(3));
    }
  }

  const LAMP_COLOURS = {
    rouge: '#ff3b30',
    vert: '#3dff7a',
    ambre: '#ffae3d',
    jaune: '#ffe34a',
    blanc: '#f4f6ef',
  };
  const mixHex = (a, b, k) =>
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  const rgba = (hex, a) =>
    `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
  // the lamps that tell a state at rest, and what lights them: the main power, or their screen once warm
  const STATUS = { 'd-milieu-5': 'red', 'd-milieu-6': 'amber', 'd-milieu-7': 'ready' }; // around the power button
  // One light ambiance for the whole console, coherent everywhere. Every lit key and lens of the four bays is backlit
  // alike, by one method: its lit face is a picture (bay D's, which the room picture does not have, are
  // lit the way those of bays A to C are), lit with its bay. And in each bay two or three "active" white lights, apart,
  // shine a little more and light the panel around them, all set alike (ACCENT: the glow's radii in canvas px and
  // strength at its centre, the glass's level), coming on one after the other with their bay. (No green glow around the
  // ENTER key or the "ready" lamp: the same ambiance there too.)
  // The lights' calibration (data/lights-calibration.json, measured outside the repository): every light measured on the
  // rendered console and brought to the look of its kind (backlit or active, by colour), so that no difference shows:
  // the lit faces are corrected in their pictures, the active glasses here (their level).
  let CAL = { active: {}, tint: {} };
  const activeLevel = (l) => CAL.active[l.id] ?? ACCENT.level;
  // the colour of a lens the page draws: the measured hue of the lit faces of its colour, else its own
  const lensColour = (l) => (!l.radius && CAL.tint[l.color]) || LAMP_COLOURS[l.color] || '#ffffff';
  // (as in the game: a lit button is an evenly lit, matte face, a little brighter, without a hot spot or a halo; its
  // light stays close to it: a white core, a halo or added light look too flashy)
  const ACCENT = { r: [120, 92], a: 1, level: 0.9, tint: '#fff6e8', glass: '#f7f2e8' }; // its light: radii (canvas px), strength, warm white; its face
  // a coloured lamp lit (round, or a lens lit by an event; not the white ones, nor the active lights, which have their
  // own) lights the metal round it in its colour, as the active lights light the panel, in small: a pool of light added
  // on the metal (a tint showed too little on the dark panel) of POOL.r times its radius, POOL.a strong at its centre,
  // fading smoothly, rising and fading with it (lampPool)
  const POOL = { r: 4.2, a: 0.34 };
  function lampPool(box, col, x, y, rad) {
    const el = document.createElement('div'),
      r = rad * POOL.r;
    el.className = 'pool';
    const stops = [
      [1, 0],
      [0.7, 14],
      [0.4, 32],
      [0.16, 56],
      [0.04, 80],
      [0, 100],
    ]
      .map(([k, p]) => `${rgba(col, (POOL.a * k).toFixed(3))} ${p}%`)
      .join(', ');
    Object.assign(el.style, {
      left: x - r + 'px',
      top: y - r + 'px',
      width: 2 * r + 'px',
      height: 2 * r + 'px',
      background: `radial-gradient(closest-side, ${stops})`,
    });
    box.prepend(el);
    return el;
  }
  const after = (bay, s) => () => RELAY[bay] + s;
  const SOURCES = {
    'a-bande-blanche-2': after('A', 0.25),
    'a-colonne-2-5': after('A', 0.6), // bay A
    'b-bande-gauche-1-3': after('B', 0.25),
    'b-bande-droite-2-2': after('B', 0.55),
    'b-banc-2-6-1': after('B', 0.85), // bay B
    'c-bande-gauche-2': after('C', 0.25),
    'c-bande-milieu-3': after('C', 0.55),
    'c-colonne-6-1': after('C', 0.85), // bay C
    'code-bas-4': after('D', 0.7),
    'code-bas-6': after('D', 1.0), // bay D: over the voltmeters, the 1st and 3rd white lenses;
    'd-bande-gauche-2': after('D', 0.3),
    'd-bande-gauche-4': after('D', 0.55), // over the keypad, the 2nd and 4th of its strip;
    'd-bande-milieu-2': after('D', 0.4),
    'd-bande-droite-1': after('D', 0.85), // over the lamp panel, the 2nd of 4 and the 1st of 2
  };
  // the lenses under ENTER CODE light downwards only, onto the voltmeters: the screen above already lights its own frame
  // (the ENTER CODE panel must not be lit too much)
  const DOWNWARD = new Set(['code-bas-4', 'code-bas-6']);
  // The keys and lenses of the four bays (strips, columns, banks): their lit faces, one picture per group, over the room
  // where every key is off. Each group lights when its bay's relay closes, the groups one after the other left to right.
  const KEYS = { stagger: 0.04 };
  const LAMPS = [];
  // incandescent bulbs: about 90 % of their light in 65 ms when switched on, a softer fade (about 300 ms) when off
  const BULB = { on: 0.028, off: 0.1 };
  // (at rest, t = Infinity: lit for good if its span never ends, else out; a span that never began is dark)
  const bulb = (t, a, b) => {
    if (t < a || b <= a) return 0;
    if (t === Infinity) return b === Infinity ? 1 : 0;
    const up = 1 - Math.exp(-(Math.min(t, b) - a) / BULB.on);
    return t < b ? up : up * Math.exp(-(t - b) / BULB.off);
  };
  function buildLamps(z, glassOf) {
    const box = $('lamps');
    const strips = z.lights
      .filter((l) => l.group.startsWith('d-bande'))
      .sort((a, b) => a.rect[0] - b.rect[0])
      .map((l) => ({
        id: l.id,
        color: l.color,
        center: [l.rect[0] + l.rect[2] / 2, l.rect[1] + l.rect[3] / 2],
        size: [l.rect[2] + 4, l.rect[3] + 4],
      }));
    // the glass of each lamp and lens as it shows on the room picture, so that a lit glass fills its own bezel: the round
    // lamps measured out to their bezel (glass.json), the lenses from the inventory (their box and slanted outline)
    const faces = Object.fromEntries(z.lights.map((f) => [f.id, f]));
    const evLenses = new Set(Object.values(PAD_LAMPS).flat()); // (the lenses lit by an event)
    const bayOf = (l) => (faces[l.id] || l).bay || 'D'; // (the panel's lamps and lenses without a bay are bay D's)
    // (a source must be one of the inventory's lights or keys: a wrong name would silently light nothing)
    for (const id in SOURCES)
      if (!faces[id] && !z.keys.some((k) => k.id === id)) console.warn('unknown light source:', id);
    // the backlit keys: the face inside the key's outline (3.5 px in from its edges)
    const keyLights = z.keys
      .filter((k) => SOURCES[k.id])
      .map((k) => {
        const cx = k.quad.reduce((a, p) => a + p[0], 0) / 4,
          cy = k.quad.reduce((a, p) => a + p[1], 0) / 4;
        const quad = k.quad.map(([qx, qy]) => [qx + Math.sign(cx - qx) * 3.5, qy + Math.sign(cy - qy) * 3.5]);
        const xs = quad.map((p) => p[0]),
          ys = quad.map((p) => p[1]);
        return {
          id: k.id,
          color: 'vert',
          face: {
            rect: [
              Math.min(...xs),
              Math.min(...ys),
              Math.max(...xs) - Math.min(...xs),
              Math.max(...ys) - Math.min(...ys),
            ],
            quad,
          },
        };
      });
    // the panels' own lenses chosen as sources (from the inventory: their glass is measured there)
    const extraLights = z.lights
      .filter((l) => l.extra && SOURCES[l.id] && !l.group.startsWith('d-bande'))
      .map((l) => ({ id: l.id, color: l.color, extra: true }));
    // the phone's call lamp, laid on the phone in its picture (its glass in glass.json): a round red lamp
    // as the panel's, lit by the call only (not in the lamp test: the phone is a device of its own)
    const phoneLed = glassOf['telephone-led']
      ? [
          (([gx, gy, gw, gh]) => ({
            id: 'telephone-led',
            color: 'rouge',
            center: [gx + gw / 2, gy + gh / 2],
            radius: gw / 1.56,
            phone: true,
          }))(glassOf['telephone-led']),
        ]
      : [];
    [...z.lamps, ...z.lenses, ...strips, ...keyLights, ...extraLights, ...phoneLed].forEach((l) => {
      const col = lensColour(l),
        round = !!l.radius,
        f = faces[l.id] || l.face;
      const [gx, gy, gw, gh] =
        glassOf[l.id] ||
        (f
          ? f.rect
          : round
            ? [l.center[0] - l.radius * 0.78, l.center[1] - l.radius * 0.78, l.radius * 1.56, l.radius * 1.56]
            : [
                l.center[0] - l.size[0] / 2 + 2,
                l.center[1] - l.size[1] / 2 + 2,
                l.size[0] - 4,
                l.size[1] - 4,
              ]);
      const x = gx + gw / 2,
        y = gy + gh / 2;
      // an active light's face: an even, warm diffuser, a little brighter than the backlit ones (no white hot spot); a
      // lens lit by an event (the keypad's) is one too, in its own colour: its hue with a touch (15 %) of the warm
      // diffuser, saturated as a coloured lamp lit (with 45 %, the red came out pink and the green mint), with no light
      // of its own on the panel
      const hot = !!SOURCES[l.id],
        even = hot || (!round && evLenses.has(l.id));
      const core = even ? [0.82, 0.9, 0.84] : [0.6, 0.95, 0.9],
        face = hot ? ACCENT.glass : even ? mixHex(col, ACCENT.glass, 0.15) : col;
      // the element is the halo (a soft glow around the glass; barely any around an active light, whose light is its own
      // layer), its child the lit glass
      const rx = (l.radius || 14) * 2.6,
        ry = (l.radius || 7) * 2.2;
      const el = document.createElement('div');
      el.className = 'lamp';
      Object.assign(el.style, {
        left: x - rx + 'px',
        top: y - ry + 'px',
        width: 2 * rx + 'px',
        height: 2 * ry + 'px',
        background: `radial-gradient(closest-side, ${rgba(col, even ? 0.07 : 0.24)}, ${rgba(col, even ? 0.03 : 0.1)} 45%, ${rgba(col, 0)})`,
      });
      const glass = document.createElement('i');
      // an active light's glass has a brighter heart: it stands out from the backlit ones in every bay alike
      Object.assign(
        glass.style,
        { width: gw + 'px', height: gh + 'px' },
        round
          ? {
              borderRadius: '50%',
              background: `radial-gradient(ellipse at 45% 40%, ${rgba('#ffffff', 0.55)}, ${rgba(col, 0.9)} 45%, ${rgba(col, 0.8)})`,
            }
          : {
              borderRadius: '1.5px',
              background: `radial-gradient(ellipse at 50% 45%, ${rgba(even ? face : l.color === 'blanc' ? '#ffffff' : col, core[0])}, ${rgba(face, core[1])} 55%, ${rgba(face, core[2])})`,
            },
      ); // (a lens's diffuser lights evenly: as bright as the lit faces of bays A to C)
      if (!round && f?.quad) {
        glass.style.borderRadius = '0';
        glass.style.clipPath = `polygon(${f.quad.map(([qx, qy]) => `${(qx - gx).toFixed(2)}px ${(qy - gy).toFixed(2)}px`).join(', ')})`;
      }
      el.append(glass);
      box.append(el);
      const glow =
        !hot && l.color !== 'blanc' && (round || evLenses.has(l.id))
          ? lampPool(box, col, x, y, l.radius || Math.max(gw, gh) / 2)
          : null;
      const src = SOURCES[l.id];
      // an active light also lights the panel around it: its own layer, under the lamps' glass, coming on with it; the
      // light falls off smoothly, strong by the button and fading far out
      if (src) {
        const { r, a, tint } = ACCENT;
        for (const [cls, k0] of [['spill', a]]) {
          const spill = document.createElement('div');
          spill.className = cls;
          const stops = [
            [1, 0],
            [0.72, 14],
            [0.42, 32],
            [0.18, 55],
            [0.06, 78],
            [0, 100],
          ]
            .map(([k, p]) => `${rgba(tint, (k0 * k).toFixed(3))} ${p}%`)
            .join(', ');
          Object.assign(spill.style, {
            left: x - r[0] + 'px',
            top: y - r[1] + 'px',
            width: 2 * r[0] + 'px',
            height: 2 * r[1] + 'px',
            background: `radial-gradient(closest-side, ${stops})`,
          });
          if (DOWNWARD.has(l.id)) {
            // nothing above the lens: the light fades out over the lens's own height, no hard edge
            const top = gy - (y - r[1]);
            spill.style.maskImage =
              spill.style.webkitMaskImage = `linear-gradient(to bottom, transparent ${(top - 2).toFixed(1)}px, #000 ${(top + gh + 4).toFixed(1)}px)`;
          }
          box.prepend(spill);
          LAMPS.push({
            el: spill,
            spans: [[src(), Infinity, 1]],
            off: [[-Infinity, OFF.relay[bayOf(l)], 1]],
          });
        }
      }
      // when it is lit (arrival time): spans [from, to, level]
      const spans = [];
      if (src) spans.push([src(), Infinity, activeLevel(l)]);
      const along = clamp01((x - 1480) / 450); // left to right across the panel: the ripple
      if (!l.face && !l.extra && !l.phone)
        spans.push([
          PANEL.test[0] + along * PANEL.ripple,
          PANEL.test[1] + along * PANEL.ripple,
          PANEL.testLevel,
        ]);
      const st = STATUS[l.id],
        half = readyAt('principal'),
        all = READY_ALL;
      if (st === 'red') spans.push([PANEL.test[1] + 0.6, half, 0.85]);
      if (st === 'amber') spans.push([half - 0.05, all, 0.85]);
      if (st === 'ready') spans.push([all - 0.05, Infinity, 1]);
      // switched off: the status lamp tells the shutdown as it told the start-up, in reverse (green out at once, amber
      // while the bays go down, red until the last one is out); every other lamp lit at rest goes out with its bay
      const off =
        st === 'amber'
          ? [[0.04, OFF.relay.B, 0.85]]
          : st === 'red'
            ? [[OFF.relay.B - 0.05, OFF.relay.top + 0.3, 0.85]]
            : st === 'ready'
              ? [[-Infinity, 0.02, 1]]
              : offSpans(spans, OFF.relay[bayOf(l)]);
      LAMPS.push({
        id: l.id,
        el,
        glow,
        spans,
        off,
        rest: Math.max(0, ...spans.map(([a, b, k]) => k * bulb(Infinity, a, b))),
      });
    });
  }
  function buildKeys(keys) {
    const order = Object.entries(keys).sort((a, b) => a[1].x - b[1].x),
      n = {},
      count = {};
    for (const [, k] of order) count[k.bay] = (count[k.bay] ?? 0) + 1;
    for (const [id, k] of order) {
      const im = document.createElement('img');
      im.className = 'key';
      im.alt = '';
      im.src = media(`keys/${id}.webp`);
      Object.assign(im.style, { left: k.x + 'px', top: k.y + 'px', width: k.w + 'px', height: k.h + 'px' });
      $('keys').append(im);
      const i = (n[k.bay] = (n[k.bay] ?? -1) + 1);
      // (they go out the other way, right to left, when the station is switched off)
      LAMPS.push({
        el: im,
        spans: [[RELAY[k.bay] + i * KEYS.stagger, Infinity, 1]],
        off: [[-Infinity, OFF.relay[k.bay] + (count[k.bay] - 1 - i) * KEYS.stagger, 1]],
      });
    }
  }
  // t: power time; off: t is the time since the station was switched off, and each lamp follows its shutdown spans
  function lampStep(t, off = false) {
    for (const l of LAMPS)
      lampLevel(l, Math.max(0, ...(off ? l.off : l.spans).map(([a, b, k]) => k * bulb(t, a, b))));
  }
  // a lamp's level: its glass and halo, and the pool it casts, if any
  function lampLevel(l, v) {
    const o = v.toFixed(3);
    setStyle(l.el, 'opacity', o);
    if (l.glow) setStyle(l.glow, 'opacity', o);
  }
  // Lamps lit by an event (the keypad's; the phone's call lamp), over their level at rest, as bulbs: lampEvent(ids,
  // on) lights them or puts them out from now; evLampStep follows them, every frame while one changes (with reduced
  // motion, at once). Switched off, the station puts them out (padReset, callStop): they go out as bulbs too, over the
  // shutdown's own steps (evLampStep runs after them).
  const EV_LAMPS = new Set();
  function lampEvent(ids, on) {
    const t = performance.now() / 1000;
    for (const id of ids) {
      const l = LAMPS.find((x) => x.id === id),
        lit = !!l?.ev && l.ev[1] === Infinity;
      if (!l || on === lit) continue;
      // (lit again while it fades: from the glow it still has)
      const glow = l.ev ? bulb(t, ...l.ev) : 0;
      l.ev = on ? [t + BULB.on * Math.log(1 - Math.min(glow, 0.999)), Infinity] : [l.ev[0], t];
      EV_LAMPS.add(l);
    }
    if (reduce) evLampStep(Infinity);
  }
  function evLampStep(t) {
    for (const l of EV_LAMPS) {
      lampLevel(l, Math.max(l.rest, bulb(t, ...l.ev)));
      if (l.ev[1] !== Infinity && (t === Infinity || t - l.ev[1] > 1)) {
        l.ev = null;
        EV_LAMPS.delete(l);
      } // (out for good)
    }
  }
  // a lamp lit at rest goes out as a bulb does when its bay's relay opens (at), at the level it had
  const offSpans = (spans, at) => {
    const k = Math.max(0, ...spans.filter(([, b]) => b === Infinity).map(([, , v]) => v));
    return k > 0 ? [[-Infinity, at, k]] : [];
  };

  // ===================================================================================================================
  // The arrival, a pure function of its own time t (s): walk-in, dark, power-on, legal hand-over
  // ===================================================================================================================
  // walk: the walk-in from the far view (s), slowing down to a stop. black: pure black at the start, then the eye
  // adapts over eye s, the edges edgeLag s later. dark: how much black remains far away and once arrived (centre,
  // edges); in between it follows the walk (the closer, the better one sees); the power-on lifts the rest. cadence:
  // footsteps per second (a bob at each step, a sway from side to side every two).
  const ARR = {
    walk: 3.6,
    black: 0.2,
    eye: 0.6,
    edgeLag: 0.2,
    farDark: [0.72, 0.84],
    nightDark: [0.22, 0.4],
    cadence: 1.8,
  };
  // The power-on starts when the visitor presses the main power button, or by itself at the end of a 10 s countdown
  // (AUTO_AT) so nobody stays in the dark; every time below is counted from that moment (power time, p). The lamp test
  // first, then each bay's relay closes in turn, one bay at a time (at, s after the first one); its tubes heat and come
  // up; the light of the bay, which comes from its screens, follows them a touch behind (the lit room through a soft
  // mask per bay).
  // AUTO_POWER: the countdown before the station starts by itself (s); CAPTURE_POWER: s after the walk-in at which a
  // still frame (?ct=) has the button pressed
  const AUTO_POWER = 10,
    CAPTURE_POWER = 1;
  const BAYS = {
    A: [444, 803, 330, 430],
    B: [836, 803, 300, 430],
    C: [1247, 803, 330, 430],
    D: [1712, 803, 380, 430],
    top: [1096, 330, 1000, 270],
  }; // mask centre x, y, radii x, y
  const LIGHT = { order: ['top', 'A', 'B', 'C', 'D'], lag: 0.25, fill: 0.8 };
  // when each relay closes (s after the press): the station's computer first (its screen is the top one: it boots and
  // drives the rest), then the bays one by one after the lamp test, 1.4 s apart, as when they go down (1.9 s apart, all
  // ready at 11.3 s, made the start-up a little too long; now all ready at about 9.6 s)
  const RELAY = { top: 0.2, A: 1.6, B: 3.0, C: 4.4, D: 5.8 };
  const SCREEN_BAY = {
    carte: 'A',
    a1: 'A',
    a2: 'A',
    a3: 'A',
    'crt-b': 'B',
    b1: 'B',
    principal: 'C',
    c1: 'C',
    c2: 'C',
    c3: 'C',
    code: 'D',
    haut: 'top',
  };
  const PIECE_BAY = {
    'plaque-volume': 'B',
    'plaque-son': 'B',
    volume: 'B',
    'son-levier': 'B',
    'bouton-alim': 'D',
    'bouton-alim-enfonce': 'D',
    'telephone-combine': 'D',
    'bouton-b-gauche': 'B',
    'levier-b-gauche': 'B',
    'bouton-b-droit': 'B',
    'levier-b-droit': 'B',
  };
  // (the top screen is the terminal's monitor, the first one on: it warms up quickly)
  // A tube warming up: while its cathode heats (heat, s) a glow of the phosphor rises in the glass (glow: its colour);
  // then the picture comes up through the glow over rise s, easing in and out (85 %), the glow giving way to it, and
  // the last 15 % creep in (TAIL_TAU). Raster screens start very slightly oversize (over: high voltage still low) and
  // settle; the radar and the oscilloscope draw in place. No flash, no opening line (a power-off artefact).
  // signal: when the signal of the radar, the oscilloscope and the small displays comes up, as a fraction of the rise
  // (B1, the bays' power: from its picture on, as a supply's meter reads, waiting for no signal: 0).
  const GLOW = {
    mint: 'rgba(190,235,212,.26)',
    blue: 'rgba(95,140,205,.3)',
    green: 'rgba(115,200,145,.26)',
    grey: 'rgba(214,220,211,.2)',
  };
  const TUBE = {
    carte: { heat: 1.1, rise: 2.8, over: 0, signal: 0.55, glow: GLOW.blue },
    'crt-b': { heat: 0.95, rise: 2.4, over: 0, signal: 0.55, glow: GLOW.green },
    principal: { heat: 1.2, rise: 3.0, over: 0.01, glow: GLOW.mint },
    haut: { heat: 0.5, rise: 1.8, over: 0.01, glow: GLOW.mint },
    code: { heat: 1.0, rise: 2.6, over: 0.008, glow: GLOW.mint },
    a1: { heat: 0.85, rise: 2.2, over: 0.008, signal: 0.5, glow: GLOW.grey },
    a2: { heat: 1.05, rise: 2.2, over: 0.008, signal: 0.5, glow: GLOW.grey },
    a3: { heat: 0.95, rise: 2.2, over: 0.008, signal: 0.5, glow: GLOW.grey },
    b1: { heat: 1.0, rise: 2.2, over: 0.008, signal: 0, glow: GLOW.grey },
    c1: { heat: 0.85, rise: 2.2, over: 0.008, signal: 0.5, glow: GLOW.grey },
    c2: { heat: 1.1, rise: 2.2, over: 0.008, signal: 0.5, glow: GLOW.grey },
    c3: { heat: 0.9, rise: 2.2, over: 0.008, signal: 0.5, glow: GLOW.grey },
  };
  // delay: the small displays of a bay come one by one after its main screen (s after the bay's relay)
  const SMALL_DELAY = { a1: 0.6, a2: 1.0, a3: 1.4, b1: 0.8, c1: 0.6, c2: 1.0, c3: 1.4 };
  const tubeStart = (id) => RELAY[SCREEN_BAY[id]] + (SMALL_DELAY[id] || 0); // when its relay feeds it
  const TAIL_TAU = 1.6,
    GAIN_RISE = 1.6;
  // The panel. With the main power the lamp test comes, readable: the lamps come on in a ripple from left to right
  // (ripple, s), stay lit, and go out in the same order with a soft fade. Then one status lamp tells the start-up next to
  // the power button: red while the screens heat, amber from half-way, green once the last one is warm (lamps hand over
  // like bulbs, one fading as the next comes on). The lamp above ENTER CODE lights when its screen is ready for a code.
  const PANEL = { test: [0.15, 1.5], ripple: 0.6, testLevel: 0.75 };
  const readyAt = (id) => tubeStart(id) + TUBE[id].heat + 0.8 * TUBE[id].rise; // its screen nearly up
  // the picture starts very dim and gathers slowly (the eased rise, raised to a power: a long gentle start)
  const rise01 = (u, p) => Math.pow(smoother(clamp01((u - p.heat) / p.rise)), 1.35);
  const bright = (u, p) =>
    u < p.heat
      ? 0
      : 0.85 * rise01(u, p) +
        (u < p.heat + p.rise ? 0 : 0.15 * (1 - Math.exp(-(u - p.heat - p.rise) / (p.tail ?? TAIL_TAU))));
  const glowOf = (u, p) =>
    u < 0 ? 0 : smoother(clamp01(u / (p.heat * 1.15))) * (1 - smoother(clamp01((u - p.heat) / p.rise)));
  const signalAge = (s) => {
    const p = TUBE[s.z.id];
    return s.u - p.heat - (p.signal || 0) * p.rise;
  }; // s since its signal began
  const gainOf = (s) => smoother(clamp01(signalAge(s) / GAIN_RISE));
  const LIGHT_ALL = Math.max(...Object.keys(TUBE).map((id) => tubeStart(id) + TUBE[id].heat + TUBE[id].rise)); // the last tube is up
  const READY_ALL = Math.max(...Object.keys(TUBE).map(readyAt)); // the last screen is nearly up
  // after the power: P_END the arrival is visibly over (the site layer comes back), P_TAIL the tubes' last creep is over
  const P_END = LIGHT_ALL + LIGHT.fill;
  const P_TAIL = LIGHT_ALL + 4 * TAIL_TAU;
  const WALK_END = LITE ? ARR.black + ARR.eye : ARR.walk; // when the visitor has arrived (no walk-in in the light version)
  // powerAt: the arrival time at which the station was switched on (Infinity: not yet)
  let powerAt = Infinity;
  const powered = () => powerAt !== Infinity;
  const LEGAL_SWAP = { at: ARR.black + 0.15, fade: 0.3 }; // legal line 2: the intro's credit fades into the console's

  const curtain = $('curtain'),
    curtainEdge = $('curtain-edge'),
    edge = $('edge'),
    litImg = $('lit'),
    legal2 = $('legal2');
  const litBays = {};
  let litPieces = [],
    legalOwn = true;
  // the desk of bay D (keypad, lamp panel) gets far less room light than the others, whose big screens light their
  // desks (measured: 33 against 51 to 58; its bare panel 15 against 35). A soft fill light, in soft-light like the
  // active lights (it lifts the surface and keeps its texture), brings it to the same ambiance (without it, the bottom
  // right looks dark compared to the rest); it comes up with bay D's own light.
  // The same for bay B's instrument module (the oscilloscope, its gauges and knobs), whose lower row is darker than the
  // same row of the other bays (measured: 38 against 75 to 99).
  const FILLS = { D: { c: [1702, 966], r: [300, 150], a: 0.62 }, B: { c: [833, 776], r: [225, 90], a: 0.9 } };
  const FILL_TINT = '#fff6e8',
    fillEls = {};
  function buildFills() {
    for (const [bay, { c, r, a }] of Object.entries(FILLS)) {
      const el = document.createElement('div');
      el.className = 'spill';
      const stops = [
        [1, 0],
        [0.92, 40],
        [0.55, 70],
        [0.2, 88],
        [0, 100],
      ]
        .map(([k, p]) => `${rgba(FILL_TINT, (a * k).toFixed(3))} ${p}%`)
        .join(', ');
      Object.assign(el.style, {
        left: c[0] - r[0] + 'px',
        top: c[1] - r[1] + 'px',
        width: 2 * r[0] + 'px',
        height: 2 * r[1] + 'px',
        background: `radial-gradient(closest-side, ${stops})`,
        opacity: 0,
      });
      $('lamps').prepend(el);
      fillEls[bay] = el;
    }
  }

  // a tube u s after its bay's relay closed (u < 0: no power yet; Infinity: fully on)
  function tubeOn(s, u, p = TUBE[s.z.id]) {
    // (p: its power-on's profile; the reading screen's, quicker: READ_TUBE)
    const on = u === Infinity,
      b = on ? 1 : u < 0 ? 0 : bright(u, p),
      m = on ? 1 : rise01(u, p);
    s.u = u;
    s.b = b;
    setStyle(s.tube, 'opacity', b.toFixed(3));
    setStyle(s.tube, 'transform', p.over && m < 1 ? `scale(${(1 + p.over * (1 - m)).toFixed(4)})` : 'none');
    setStyle(s.warm, 'opacity', (on ? 0 : glowOf(u, p)).toFixed(3));
    setStyle(s.tube, 'filter', 'none');
    setStyle(s.beam, 'opacity', '0');
  }
  // a tube u s after its power went (u < 0: still on). The deflection fails at once: the picture collapses to a bright
  // line across its middle (line s), the line to a dot (dot s), the beam's energy gathering as it shrinks (the picture,
  // squeezed, gives way to the beam: one even line, then a dot); the dot fades as the phosphor cools (fade s), and the
  // glass keeps a faint afterglow a moment longer (glow: its time constant).
  const COLLAPSE = { line: 0.07, dot: 0.12, fade: 0.8, glow: 1.2 };
  function tubeOff(s, u, C = COLLAPSE) {
    // (C: its collapse's timing; the reading screen's, slower: READ_COLLAPSE)
    if (u < 0) return; // (still on: as it was when the station was switched off)
    const sy = Math.max(0.008, 1 - out3(clamp01(u / C.line))),
      sx = Math.max(0.012, 1 - out3(clamp01((u - C.line) / C.dot)));
    const dot = 1 - smoother(clamp01((u - C.line - C.dot) / C.fade));
    s.u = -1;
    s.b = dot;
    setStyle(s.tube, 'opacity', (dot * Math.pow(sy, 0.35)).toFixed(3));
    setStyle(s.beam, 'opacity', (dot * smoother(clamp01((1 - sy - 0.55) / 0.4))).toFixed(3));
    setStyle(s.beam, 'transform', `scaleX(${sx.toFixed(4)})`);
    setStyle(s.tube, 'transform', `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`);
    setStyle(
      s.tube,
      'filter',
      LITE ? 'none' : `brightness(${(1 + 3 * (1 - sy) * (1 - 0.5 * (1 - sx))).toFixed(2)})`,
    );
    setStyle(
      s.warm,
      'opacity',
      (0.7 * clamp01(u / C.line) * Math.exp(-Math.max(0, u - C.line) / C.glow)).toFixed(3),
    );
  }
  // one layer per bay: the lit room seen through the bay's soft mask, cropped to the mask's box
  function buildLitBays(src) {
    LIGHT.order.forEach((b) => {
      const [cx, cy, rx, ry] = BAYS[b],
        x = Math.max(0, cx - rx),
        y = Math.max(0, cy - ry),
        w = Math.min(2192, cx + rx) - x,
        hh = Math.min(1261, cy + ry) - y;
      const d = document.createElement('div');
      d.className = 'litbay';
      Object.assign(d.style, {
        left: x + 'px',
        top: y + 'px',
        width: w + 'px',
        height: hh + 'px',
        backgroundImage: `url("${src}")`,
        backgroundPosition: `${-x}px ${-y}px`,
      });
      d.style.maskImage =
        d.style.webkitMaskImage = `radial-gradient(${rx}px ${ry}px at ${cx - x}px ${cy - y}px, #000 0%, #000 50%, transparent 100%)`;
      $('lit-bays').append(d);
      litBays[b] = d;
    });
  }
  // the walk-in: steady steps that slow down to a stop; the sway of the steps fades as one stops
  function walk(t) {
    if (LITE) return;
    const x = clamp01(t / ARR.walk),
      amp = Math.pow(1 - x, 1.6),
      ph = t * Math.PI * ARR.cadence;
    CAM.k = 1 - Math.pow(1 - x, 1.7);
    CAM.bob = [Math.sin(ph) * 3 * amp, -Math.abs(Math.sin(ph)) * 5 * amp, Math.sin(ph + 0.6) * 0.25 * amp];
    setStyle(edge, 'opacity', smoother(CAM.k).toFixed(3));
    camera();
  }
  // the power-on; returns how lit the room is (0..1)
  function powerOn(t) {
    const lv = {},
      n = {};
    for (const id in TUBE) {
      const b = SCREEN_BAY[id],
        u = t - tubeStart(id);
      tubeOn(SCR[id], u);
      lv[b] = (lv[b] || 0) + bright(u - LIGHT.lag, TUBE[id]);
      n[b] = (n[b] || 0) + 1;
    }
    LIGHT.order.forEach((b) => {
      lv[b] /= n[b];
    });
    return setRoomLight(lv, smoother(clamp01((t - LIGHT_ALL) / LIGHT.fill)));
  }
  // the room's light: each bay's (lv, 0..1, through its soft mask) and the whole lit room (all); returns how lit it is
  function setRoomLight(lv, all) {
    const mean = LIGHT.order.reduce((a, b) => a + lv[b], 0) / LIGHT.order.length;
    // Light version: without a graphics card the browser redraws only what changes, so the room stays in its half-light
    // while the screens warm up (small areas), and its light comes up as a whole at the end (one short full redraw).
    if (LITE) setStyle(litImg, 'opacity', all.toFixed(3));
    else {
      LIGHT.order.forEach((b) => setStyle(litBays[b], 'opacity', lv[b].toFixed(3)));
      ROOT.classList.toggle('lighting', all < 1); // the bay layers exist until the lit room takes over
      setStyle(litImg, 'opacity', all.toFixed(3));
    }
    litPieces.forEach((p) =>
      setStyle(p, 'opacity', (LITE ? all : Math.max(lv[PIECE_BAY[p.dataset.p]] ?? 0, all)).toFixed(3)),
    );
    for (const bay in fillEls)
      setStyle(fillEls[bay], 'opacity', (LITE ? all : Math.max(lv[bay], all)).toFixed(3));
    legendEls.forEach((el) =>
      setStyle(el, 'opacity', (0.35 + 0.65 * (LITE ? all : Math.max(lv[el.dataset.bay], all))).toFixed(3)),
    );
    markEls.forEach((el) =>
      setStyle(el, '--lit', (0.35 + 0.65 * (LITE ? all : Math.max(lv.D, all))).toFixed(3)),
    );
    return LITE ? all : Math.max(mean, all);
  }
  // the dark: out of the black as the eye adapts, then following the walk down to the night level, lifted by the light
  function darkness(t, lit) {
    const k = CAM.k,
      eye = (lag) => 1 - smoother(clamp01((t - ARR.black - lag) / ARR.eye));
    const d0 = ARR.farDark[0] + (ARR.nightDark[0] - ARR.farDark[0]) * k,
      d1 = ARR.farDark[1] + (ARR.nightDark[1] - ARR.farDark[1]) * k;
    const centre = (d0 + (1 - d0) * eye(0)) * (1 - lit);
    // the edges stay darker a little longer (one more full-screen layer: left out in the light version)
    const edges = LITE ? centre : (d1 + (1 - d1) * eye(ARR.edgeLag)) * (1 - lit);
    // two layers: an even black (the centre's level), and the vignette that adds what the edges have on top of it
    setStyle(curtain, 'opacity', centre.toFixed(3));
    setStyle(
      curtainEdge,
      'opacity',
      (centre < 0.999 ? clamp01((edges - centre) / (1 - centre)) : 0).toFixed(3),
    );
  }
  function legalHandover(t) {
    if (!legalHandoverOn) return; // (no film played at this load: the line is the console's own from the start)
    const { at, fade } = LEGAL_SWAP,
      own = t >= at + fade;
    setStyle(
      legal2,
      'opacity',
      (t < at
        ? 1
        : t < at + fade
          ? 1 - (t - at) / fade
          : t < at + 2 * fade
            ? (t - at - fade) / fade
            : 1
      ).toFixed(3),
    );
    if (own !== legalOwn) {
      legalOwn = own;
      legal2.textContent = own ? T().legal2 : T().intro2;
      layout();
      rerasterPending = true;
    } // (in portrait the framing follows the legal lines; the world rasterised again once the walk is over)
  }
  // the arrival at time t; the power-on runs on the power time p (negative or -Infinity before the press)
  function arrival(t) {
    const p = t - powerAt;
    // ([ skip ] goes once the arrival is visibly over: the focus it had stays on the console, not lost with it)
    if (p >= P_END && ROOT.classList.contains('hud-hidden') && document.activeElement === $('skip'))
      ROOT.focus({ preventScroll: true });
    ROOT.classList.toggle('arriving', p < P_TAIL);
    ROOT.classList.toggle('hud-hidden', p < P_END);
    ROOT.classList.toggle('awaiting-power', !powered() && t >= WALK_END);
    powerTarget(t - WALK_END, p);
    walk(t);
    station(p);
    darkness(t, roomLight);
    legalHandover(t);
  }
  // the station p s after its main power came (negative or -Infinity: not yet): its light, screens, panel, terminal
  function station(p) {
    ROOT.classList.toggle('power-on', p >= 0);
    roomLight = powerOn(p);
    panelT = p;
    panelOff = null;
    lampStep(p);
    termT = p;
  }
  // the state the arrival ends in, exactly (also the starting point with reduced motion)
  function arrivalEnd() {
    if (!powered()) powerAt = WALK_END;
    arrival(powerAt + P_TAIL);
    ROOT.classList.remove('arriving', 'hud-hidden'); // (over, whatever the rounding of powerAt + P_TAIL - powerAt)
    for (const id in SCR) tubeOn(SCR[id], Infinity);
    panelT = Infinity;
    lampStep(Infinity);
  }
  // the visitor presses the main power button (or the time runs out)
  function switchOn(t) {
    if (powered()) return;
    powerAt = Math.max(t, WALK_END);
    ROOT.classList.remove('awaiting-power');
    visit.remember();
  }

  // ===================================================================================================================
  // The station switched off, and on again: the reverse of switching it on, as clean and coherent. Once it is on and at
  // rest, its main power button is pressed again: it comes back up, and the station goes down as it came up, in
  // reverse. The terminal writes the shutdown; bay by bay, D, C, B, A, each relay opens (its clunk): its screens
  // collapse as tubes do when their power goes, its lamps and keys go out as bulbs do (the keys right to left),
  // its needles fall back on their springs, its light leaves the room; the status lamp by the button tells it,
  // green out, amber, red, as it told the start-up; the computer's screen goes last.
  // Then the station is dark as before the first press, and the button's target is back (no countdown: it was switched
  // off on purpose). A press switches it on again: the same start-up, a little quicker (pace: its tubes are still warm).
  // It all runs on the scene clock, a function of the time since each switch, like the arrival.
  // relay: when each relay opens (s after the press): the start-up's order in reverse, 7.8 s in all with these (5.6 s
  // is far too fast, 10.3 s a little too slow); small: a bay's small displays a moment before its main screen; fade: a
  // bay's light going; handover: the whole lit room hands over to the bays' at once; end: all is out (the top screen's
  // dot and afterglow gone)
  // ===================================================================================================================
  const OFF = {
    relay: { D: 0.5, C: 1.85, B: 3.3, A: 4.7, top: 6.0 },
    small: -0.06,
    fade: 0.9,
    handover: 0.6,
    pace: 1.6,
  };
  OFF.end = OFF.relay.top + 1.8;
  const SW = { off: null, on: null, rest: false }; // scene times of the switch-off and of the switch-on again; off at rest
  // the station is up, and its button switches it off: as soon as its start-up (the arrival's, or a switch-on again) is
  // visibly over (P_END: the room lit, the site's layer back), not only once the tubes' last creep is over (P_TAIL, 5.6 s
  // later, invisible: the button would not seem to respond at once)
  function stationUp() {
    if (seeking || !powered()) return false;
    if (arrivalT !== null) return arrivalT - powerAt >= P_END; // the arrival, visibly over
    if (SW.off === null) return true; // on, at rest
    return SW.on !== null && (sceneT - SW.on) * OFF.pace >= P_END; // on again, visibly
  }
  const shuttingDown = () => SW.off !== null && SW.on === null && !reduce && sceneT - SW.off < OFF.end; // (reduced motion: off at once)
  const stationOff = () => SW.off !== null && SW.on === null && !shuttingDown();
  function switchOff() {
    if (!stationUp()) return;
    // (pressed during the start-up's last creep: it simply ends there, as it is, and the shutdown starts from it)
    if (arrivalT !== null) {
      arrivalT = null;
      ROOT.classList.remove('arriving', 'hud-hidden');
    }
    SW.on = null;
    SW.off = sceneT;
    SW.rest = false;
    visit.forget(); // (switched off: coming back to the page shows the arrival again)
    stillShow();
  }
  function switchOnAgain() {
    if (!stationOff()) return;
    SW.on = sceneT;
    ROOT.classList.remove('awaiting-power');
    visit.remember();
    stillShow();
  }
  // with reduced motion there is no frame loop: the end state at once, drawn once, its sounds with it (the station
  // switched off or on again, the arrival skipped, motion reduced meanwhile: motionSet, a page left: readEnd)
  function stillShow() {
    if (!reduce) return;
    if (SW.off !== null) stationStep(sceneT);
    liveControls();
    update(sceneT, 0, true);
    soundSync();
    hackStill();
    wake();
  }
  // the button switches the station off: it takes the pointer, and screen readers are told what it does (its name, in
  // the language of the moment, from its state: powerLabel)
  function canSwitch(on) {
    if (ROOT.classList.contains('can-switch') === on) return;
    ROOT.classList.toggle('can-switch', on);
    PT.btn.setAttribute('aria-label', powerLabel());
  }
  const powerLabel = () =>
    ROOT.classList.contains('can-switch')
      ? T().powerOnLabel
      : `${T().power}: ${T().powerOff}. ${T().powerLine}`;
  // the station q s after it was switched off
  function shutdown(q) {
    ROOT.classList.remove('power-on'); // (the button comes back up)
    const lv = {};
    LIGHT.order.forEach((b) => {
      lv[b] = 1 - smoother(clamp01((q - OFF.relay[b]) / OFF.fade));
    });
    for (const id in TUBE)
      tubeOff(SCR[id], q - OFF.relay[SCREEN_BAY[id]] - (SMALL_DELAY[id] ? OFF.small : 0));
    const mean = LIGHT.order.reduce((a, b) => a + lv[b], 0) / LIGHT.order.length;
    roomLight = setRoomLight(lv, LITE ? mean : 1 - smoother(clamp01(q / OFF.handover)));
    darkness(Infinity, roomLight);
    panelOff = q;
    lampStep(q, true);
  }
  // after the arrival: the station going down, off, or coming up again, on the scene clock
  function stationStep(t) {
    if (SW.on !== null) {
      const p = reduce ? Infinity : (t - SW.on) * OFF.pace;
      if (p >= P_TAIL) {
        stationAtRest();
        SW.off = SW.on = null;
        SW.rest = false;
        return;
      }
      station(p);
      darkness(Infinity, roomLight);
      powerTarget(t - SW.off - OFF.end, t - SW.on, false); // (the target leaves as it does on the first press)
      return;
    }
    if (reduce) SW.off = -Infinity; // (reduced motion: off at once, its shutdown over for good, motion back or not)
    const q = t - SW.off;
    if (q < OFF.end) {
      shutdown(q);
      offSoundStep(q);
      return;
    }
    if (!SW.rest) {
      SW.rest = true;
      station(-Infinity);
      darkness(Infinity, roomLight);
      for (const id in SCR) tubeOn(SCR[id], -1);
      offSoundStep(Infinity);
      ROOT.classList.add('awaiting-power');
    }
    powerTarget(q - OFF.end, -Infinity, false);
  }
  // on and at rest, exactly as after the arrival
  function stationAtRest() {
    station(P_TAIL);
    darkness(Infinity, roomLight);
    for (const id in SCR) tubeOn(SCR[id], Infinity);
    panelT = Infinity;
    lampStep(Infinity);
    setStyle(PT.box, 'visibility', 'hidden');
    setStyle(PT.line, 'visibility', 'hidden');
  }

  // The target on the power button, in the intro's language, as a function of a (s since the visitor arrived) and c (s
  // since the button was pressed). Timings from the intro and the official references (React Bits Target Cursor, GSAP
  // ScrambleText) and the rules of military panels (MIL-STD-1472F, WCAG 2.2): only the status square blinks, at 1.1 Hz,
  // and stops after 5 s; the lock blinks twice, once; the press answers within 0.1 s.
  const POWER = { x: 1807.5, y: 950.5, w: 23, h: 30 }; // the black button of bay D (canvas px)
  const TGT = {
    spread: 1.9,
    turn: 22, // the corners come from 1.9 times their distance, turned 22 degrees
    lock: [0, 0.5],
    turnDur: 0.42, // they converge and snap (back.out 1.2) while their turn straightens (out3)
    blink: [0.52, 0.72],
    off: 0.1, // the lock's double blink: off 100 ms, twice, 200 ms apart
    pad: 8,
    padHover: 3, // the corners' room around the button, at rest and under the pointer (px)
    lead: [0.6, 0.78],
    tagY: 806, // the leader draws up (expo.out) to the tag, set above the desk's ledge, in the clear
    // (canvas y of its bottom edge): the panel's lamps and strips stay visible
    plate: [0.74, 0.94], // the tag's plate opens from its centre
    name: [0.86, 1.3],
    state: [1.22, 1.42],
    hint: [1.38, 1.8], // its text: decoded, decoded, typed
    line: [1.2, 1.4],
    lineText: [1.35, 2.15], // the hint line: its plate, its text
    scans: 2,
    scanEvery: 2.4,
    scanPass: 1.9,
    scanGap: 0.5, // then two sweeps of a scan line
    sqPeriod: 0.9,
    sqFor: 5, // the standby square: 0.45 s on, 0.45 s dim; steady after 5 s
  };
  // the press: the corners close in (0.9) and turn green at once, OFF is wiped and ON decoded, read, then all leaves the
  // countdown to the automatic start: it appears under the hint (COUNT_AT, s after arriving) and runs AUTO_POWER s from
  // there, 10, 09… 00; then the station starts by itself (AUTO_AT)
  const COUNT_AT = TGT.lineText[1],
    AUTO_AT = COUNT_AT + AUTO_POWER;
  // (ON must stay long enough to be read: the tag holds it about 1.5 s before it leaves)
  const PRESS = {
    close: 0.2,
    swap: [0.08, 0.4],
    hint: [0.12, 0.6],
    line: [0, 0.3],
    lineClose: [0.25, 0.4],
    text: [1.5, 1.75],
    plate: [1.7, 1.85],
    lead: [1.75, 1.9],
    corners: [1.8, 2.1],
    end: 2.15,
  };
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const out2 = (x) => 1 - (1 - x) ** 2,
    out3 = (x) => 1 - (1 - x) ** 3,
    in2 = (x) => x * x;
  const sinIO = (x) => (1 - Math.cos(Math.PI * x)) / 2;
  const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const backOut = (x, s = 1.2) => {
    const q = x - 1;
    return q * q * ((s + 1) * q + s) + 1;
  }; // about 5 % past, then back

  // A line of letters drawn one by one, each letter a span written only when it changes. decode: the letters settle from
  // left to right, three scrambled ones ahead; type: they appear from left to right; wipe: they go from the end, three
  // scrambled ones ahead of the wipe. Scrambled letters are capitals and figures, new ones 20 times a second; the
  // letters still to come, or gone, keep their room. (GLYPHS and hash: with the terminal's)
  function letters(el, salt) {
    return { el, salt, txt: null, spans: [] };
  }
  function setLetters(L, txt) {
    if (L.txt === txt) return;
    L.txt = txt;
    L.el.textContent = '';
    L.spans = [...txt].map((ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      L.el.append(s);
      return { s, ch, hid: false };
    });
  }
  function drawLetters(L, mode, p, wipe, t) {
    const chars = [...L.txt],
      n = chars.length,
      bucket = Math.floor(t * 20);
    const shown = mode === 'type' ? Math.round(p * n) : Math.floor(p * (n + 3)),
      gone = Math.floor(wipe * (n + 3));
    L.spans.forEach((x, i) => {
      const j = n - 1 - i,
        real = chars[i];
      const hid = i >= shown || j < gone - 3;
      const mixed = !hid && ((mode !== 'type' && i >= shown - 3) || j < gone) && real !== ' ' && real !== '·';
      const ch = mixed ? GLYPHS[hash(i * 131 + L.salt * 977 + bucket * 7919) % GLYPHS.length] : real;
      if (x.ch !== ch) {
        x.ch = ch;
        x.s.textContent = ch;
      }
      if (x.hid !== hid) {
        x.hid = hid;
        x.s.classList.toggle('hid', hid);
      }
    });
  }

  const PT = {
    box: $('power'),
    btn: $('power-btn'),
    lock: ROOT.querySelector('#st-power .tg-lock'),
    corners: [...ROOT.querySelectorAll('#st-power .tg-corner')],
    lead: ROOT.querySelector('#st-power .tg-lead'),
    end: ROOT.querySelector('#st-power .tg-end'),
    tag: $('power-tag'),
    plate: ROOT.querySelector('#st-power-tag .plate'),
    marks: [...ROOT.querySelectorAll('#st-power-tag .c')],
    sq: ROOT.querySelector('#st-power-tag .sq'),
    state: $('pt-state'),
    name: letters($('pt-name'), 1),
    st: letters($('pt-state'), 2),
    hint: letters($('pt-hint'), 3),
    line: $('power-line'),
    linePlate: ROOT.querySelector('#st-power-line .plate'),
    scan: ROOT.querySelector('#st-power-line .scan'),
    lineText: letters($('pl-text'), 4),
    count: letters($('pl-count'), 5),
    countN: null,
    hw: 0,
    hh: 0,
    scanX: 0,
    scanW: 0,
    hover: false,
    hoverK: 0,
    hoverClock: 0,
  };
  const touchOnly = matchMedia('(hover: none)').matches;
  // the texts, the state padded to the longer of its two words so that the tag never changes width
  function powerTexts() {
    const w = Math.max([...T().powerOff].length, [...T().powerOn].length),
      pad = (s) => s + ' '.repeat(w - [...s].length);
    setLetters(PT.name, T().power + ' · ');
    PT.offTxt = pad(T().powerOff);
    PT.onTxt = pad(T().powerOn);
    setLetters(PT.st, PT.offTxt);
    PT.hintTxt = touchOnly ? T().powerHintTouch : T().powerHint;
    setLetters(PT.hint, PT.hintTxt);
    setLetters(PT.lineText, T().powerLine);
    PT.countN = null; // the countdown's text is set as it runs
    PT.btn.setAttribute('aria-label', powerLabel());
  }
  // where everything goes on the screen: the button from its world position at the framing (the camera is at rest once
  // the visitor has arrived), the tag above it on its leader, kept 16 px inside the screen; the boxes are measured with
  // their full text
  function placePowerTarget() {
    const vw = innerWidth,
      vh = innerHeight,
      { s, tx, ty } = framing(vw, vh);
    const x = devicePx(devicePx(tx) + POWER.x * s),
      y = devicePx(devicePx(ty) + POWER.y * s);
    PT.hw = (POWER.w / 2) * s;
    PT.hh = (POWER.h / 2) * s;
    setStyle(PT.box, 'transform', `translate(${x}px, ${y}px)`);
    setStyle(PT.btn, 'width', Math.max(32, POWER.w * s + 16) + 'px');
    setStyle(PT.btn, 'height', Math.max(32, POWER.h * s + 16) + 'px');
    const leadBottom = -(PT.hh + TGT.pad + 4),
      leadTop = Math.min(leadBottom - 24, devicePx((TGT.tagY - POWER.y) * s));
    setStyle(PT.lead, 'top', leadTop + 'px');
    setStyle(PT.lead, 'height', leadBottom - leadTop + 'px');
    setStyle(PT.end, 'top', leadTop - 1.5 + 'px');
    // (the letters are all shown while measuring)
    setLetters(PT.count, `${T().powerAuto} 10 ${T().powerSec}`);
    PT.countN = null;
    [PT.name, PT.st, PT.hint, PT.lineText, PT.count].forEach((L) => drawLetters(L, 'decode', 1, 0, 0));
    const w = PT.tag.offsetWidth,
      h = PT.tag.offsetHeight;
    const left = Math.max(16 - x, Math.min(vw - 16 - x - w, -w / 2));
    setStyle(PT.tag, 'transform', `translate(${devicePx(left)}px, ${devicePx(leadTop - h)}px)`);
    // the hint line in the middle of the top screen when it shows (not on a phone, whose framing is bay D), else at the
    // top
    const top = { x: devicePx(tx) + 863.5 * s, y: devicePx(ty) + 331.5 * s, w: 1155 * s };
    const onScreen = top.x - top.w / 2 >= 0 && top.x + top.w / 2 <= vw && top.w >= 460;
    PT.line.classList.toggle('on-screen', onScreen);
    setStyle(
      PT.line,
      'transform',
      onScreen
        ? `translate(${devicePx(top.x)}px, ${devicePx(top.y)}px) translate(-50%, -50%)`
        : 'translateX(-50%)',
    );
    const txt = $('pl-text');
    PT.scanX = txt.offsetLeft;
    PT.scanW = txt.offsetWidth;
  }
  // the pointer over the button: the corners close in, 0.2 s to come (power2.out), a little longer to leave
  function hoverAmount() {
    const now = performance.now() / 1000,
      dt = Math.min(0.1, now - PT.hoverClock);
    PT.hoverClock = now;
    PT.hoverK += ((PT.hover ? 1 : 0) - PT.hoverK) * (1 - Math.exp(-dt / (PT.hover ? 0.065 : 0.1)));
    return PT.hoverK;
  }
  // (line: the hint line and the countdown, for the first start only: switched off on purpose, no countdown)
  function powerTarget(a, c, line = true) {
    const shown = a >= 0 && c < PRESS.end;
    setStyle(PT.box, 'visibility', shown ? 'visible' : 'hidden');
    setStyle(PT.line, 'visibility', shown && line ? 'visible' : 'hidden');
    if (!shown) return;
    // (from the press on, nothing new comes in: what was coming in stops where it was, then everything leaves)
    const t = a,
      pressed = c >= 0,
      hover = pressed ? 0 : hoverAmount(),
      inA = Math.min(a, a - c);
    // the corners: converge, snap, blink twice; under the pointer and when pressed they close in; then they leave
    const spread =
      (TGT.spread - (TGT.spread - 1) * backOut(seg(inA, ...TGT.lock))) *
      (1 + 0.5 * in2(seg(c, ...PRESS.corners)));
    const turn = TGT.turn * (1 - out3(seg(inA, 0, TGT.turnDur)));
    const blink = TGT.blink.some((b) => a >= b && a < b + TGT.off) ? 0.15 : 1;
    const leave = 1 - seg(c, ...PRESS.corners);
    setStyle(PT.lock, 'opacity', (seg(inA, 0, 0.12) * blink * leave).toFixed(3));
    setStyle(PT.lock, 'transform', `rotate(${turn.toFixed(2)}deg)`);
    setStyle(PT.lock, 'color', pressed ? 'var(--ready)' : '');
    const pad = TGT.pad + (TGT.padHover - TGT.pad) * hover,
      close = 1 - 0.1 * out2(seg(c, 0, PRESS.close));
    const dx = (PT.hw + pad) * spread * close,
      dy = (PT.hh + pad) * spread * close;
    [
      [-dx, -dy],
      [dx - 10, -dy],
      [-dx, dy - 10],
      [dx - 10, dy - 10],
    ].forEach(([u, v], i) =>
      setStyle(PT.corners[i], 'transform', `translate(${u.toFixed(2)}px, ${v.toFixed(2)}px)`),
    );
    // the leader: drawn up from the lock, drawn back down into it as the target leaves
    const lead = expoOut(seg(inA, ...TGT.lead)) * (1 - out2(seg(c, ...PRESS.lead)));
    setStyle(PT.lead, 'transform', `scaleY(${lead.toFixed(4)})`);
    setStyle(PT.end, 'opacity', seg(lead, 0.85, 1).toFixed(3));
    // the tag: its plate opens from its centre, its text decodes; the status square (amber) blinks on standby
    const plate = sinIO(seg(inA, ...TGT.plate)) * (1 - sinIO(seg(c, ...PRESS.plate)));
    setStyle(PT.tag, 'opacity', plate > 0 ? '1' : '0');
    setStyle(PT.plate, 'transform', `scaleX(${plate.toFixed(4)})`);
    PT.marks.forEach((m) => setStyle(m, 'opacity', seg(plate, 0.8, 1).toFixed(3)));
    const since = a - TGT.plate[1],
      dim = !pressed && since > 0 && since < TGT.sqFor && since % TGT.sqPeriod >= TGT.sqPeriod / 2;
    setStyle(
      PT.sq,
      'opacity',
      (plate >= 1 && seg(inA, ...TGT.name) > 0 ? (dim ? 0.22 : 1) * (1 - seg(c, ...PRESS.text)) : 0).toFixed(
        3,
      ),
    );
    setStyle(PT.sq, 'color', pressed ? 'var(--ready)' : 'var(--standby)');
    // OFF, then (on the press) ON: the old word wiped out at once, the new one decoded
    const on = c >= PRESS.swap[0];
    setLetters(PT.st, on ? PT.onTxt : PT.offTxt);
    PT.state.classList.toggle('on', on);
    const textOut = seg(c, ...PRESS.text);
    drawLetters(PT.name, 'decode', seg(inA, ...TGT.name), textOut, t);
    drawLetters(
      PT.st,
      'decode',
      on ? seg(c, ...PRESS.swap) : seg(inA, ...TGT.state),
      on ? textOut : seg(c, 0, PRESS.swap[0]),
      t,
    );
    // the second line: "click to switch on" wiped at once, then "starting up…" typed in its place
    const starting = c >= PRESS.hint[0];
    setLetters(PT.hint, starting ? T().powerStarting : PT.hintTxt);
    drawLetters(
      PT.hint,
      'type',
      starting ? seg(c, ...PRESS.hint) : seg(inA, ...TGT.hint),
      starting ? textOut : seg(c, 0, PRESS.hint[0]),
      t,
    );
    // the hint line: its plate opens, its text decodes, then a scan line crosses it twice
    const linePlate = sinIO(seg(inA, ...TGT.line)) * (1 - sinIO(seg(c, ...PRESS.lineClose)));
    setStyle(PT.linePlate, 'transform', `scaleX(${linePlate.toFixed(4)})`);
    drawLetters(PT.lineText, 'decode', seg(inA, ...TGT.lineText), seg(c, ...PRESS.line), t);
    // the countdown to the automatic start, whole seconds, under the hint
    const left = Math.max(0, Math.min(AUTO_POWER, Math.ceil(AUTO_POWER - (Math.min(a, a - c) - COUNT_AT))));
    if (left !== PT.countN) {
      PT.countN = left;
      setLetters(PT.count, `${T().powerAuto} ${String(left).padStart(2, '0')} ${T().powerSec}`);
    }
    drawLetters(PT.count, 'type', seg(inA, TGT.lineText[1], TGT.lineText[1] + 0.5), seg(c, ...PRESS.line), t);
    let su = -1;
    for (let k = 0; k < TGT.scans; k++) {
      const u = (a - TGT.lineText[1] - TGT.scanGap - k * TGT.scanEvery) / TGT.scanPass;
      if (u >= 0 && u < 1) su = u;
    }
    if (su >= 0 && !pressed) {
      setStyle(PT.scan, 'transform', `translateX(${(PT.scanX + su * PT.scanW - 30).toFixed(1)}px)`);
      setStyle(PT.scan, 'opacity', (0.6 * Math.sqrt(Math.sin(Math.PI * su))).toFixed(3));
    } else setStyle(PT.scan, 'opacity', '0');
  }

  // ===================================================================================================================
  // Clocks and the main loop
  // ===================================================================================================================
  // The scene clock advances with the frames, at most MAX_STEP per frame: if the page stalls (pictures decoding, a busy
  // machine), everything slows down for a moment instead of jumping ahead. Without frames (motion reduced, a page read at
  // rest: frame) it stands, and goes on from where it stood, nothing caught up; the clocks it shows move on by the time
  // it stood (OPENED; stoodAt: since when, from the page's start; looping: the frames asked for). The arrival has its own
  // time on top of it.
  const MAX_STEP = 0.05,
    DRAW_EVERY = 1 / 15;
  let sceneT = 0,
    arrivalT = null,
    seeking = false,
    last = 0,
    drawT = 0,
    topT = 0,
    monT = 0,
    looping = false,
    stoodAt = performance.now();

  // screens that move are redrawn at a calm rate, and only while they show something
  // (with reduced motion the screens are not redrawn on their own: the small displays that tell the keypad, the sound and
  // the faction are drawn as these change)
  function smallShow() {
    if (reduce)
      for (const id of ['c1', 'c2', 'c3', 'a2', 'a3'])
        if (SCR[id]?.b > 0) drawSmall(SCR[id], sceneT, gainOf(SCR[id]));
  }
  function drawScreens(t) {
    for (const id in SMALL_KINDS) if (SCR[id].b > 0) drawSmall(SCR[id], t, gainOf(SCR[id]));
  }
  // the radar: the sweep turns on the scene clock (reduced motion: it stands); the faction joined, its echo ringed once
  // the receiver gain is up; its light round the glass at the sweep's angle (each frame, its turn only); the scope drawn
  // at the sweep's angle
  function radarStep(t) {
    const s = SCR.carte,
      angle = reduce ? 40 : ((t / RADAR_PERIOD) * 360) % 360,
      gain = gainOf(s),
      light = s.radar.light;
    for (const e of s.radar.echoes)
      if (e.mark) setStyle(e.mark, 'opacity', (e.id === faction ? gain : 0).toFixed(3)); // (the faction joined, there once the radar is)
    if (light) {
      setStyle(light.beam, 'transform', `rotate(${angle.toFixed(2)}deg)`);
      setStyle(light.el, 'opacity', gain.toFixed(3));
    }
    if (LITE && !reduce && Math.abs(t - s.radar.drawn) < DRAW_EVERY) return; // (LITE: the scope at the small displays' rate, the processor drawing it)
    s.radar.drawn = t;
    radarDraw(s, angle, t, gain, signalAge(s));
  }
  // the scope at the sweep's angle (deg, 0 up, clockwise): what it shows depends on that angle alone, each thing on the
  // time since the sweep crossed its bearing (age), nothing before the receiver's signal (since); a speck painted on its
  // turn or not (turn: the sweep's turns from the start, past its bearing), the same each time that turn is drawn
  function radarDraw(s, angle, t, gain, since) {
    const { scope: c, cx, cy, R, echoes, specks } = s.radar,
      { w, h } = s,
      rad = (deg) => ((deg - 90) * Math.PI) / 180;
    const age = (b) => (((angle - b + 360) % 360) / 360) * RADAR_PERIOD;
    c.clearRect(0, 0, w, h);
    if (gain <= 0) return;
    c.save();
    // the afterglow: the glass the sweep has just passed, lit, fading with the time since (stops along its span)
    const glow = c.createConicGradient(rad(angle - RADAR.glowSpan), cx, cy),
      n = 12;
    const fade = (d) => Math.exp(-((d / 360) * RADAR_PERIOD) / RADAR.glow),
      end = fade(RADAR.glowSpan); // (brought down to nothing at the span's far end: no edge where it starts)
    for (let i = 0; i <= n; i++) {
      const k = (0.4 * (fade(RADAR.glowSpan * (1 - i / n)) - end)) / (1 - end);
      glow.addColorStop((i / n) * (RADAR.glowSpan / 360), `rgba(120, 180, 255, ${(k * gain).toFixed(3)})`);
    }
    glow.addColorStop(RADAR.glowSpan / 360 + 1e-4, 'rgba(120, 180, 255, 0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
    // the clutter and the specks
    for (let i = 0; i < specks.length; i++) {
      const p = specks[i],
        u = age(p.b);
      if (u > since) continue;
      const turn = Math.floor(t / RADAR_PERIOD - p.b / 360),
        shown = ((Math.imul(turn + 7, 73856093) ^ Math.imul(i + 1, 19349663)) >>> 0) % 1000 < p.p * 1000;
      const k = p.v * Math.exp(-u / RADAR.speck) * gain;
      if (!shown || k < 0.02) continue;
      c.fillStyle = `rgba(190, 215, 255, ${k.toFixed(3)})`;
      c.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
    }
    // the echoes: round, as in the game, in their own colour (a faction's, a person's white) with a soft
    // halo, white as they are painted; then fading, to what is left of them till the sweep comes back
    for (const e of echoes) {
      const u = age(e.b);
      if (u > since) continue;
      const k = (RADAR.floor + (1 - RADAR.floor) * Math.exp(-u / RADAR.fade)) * gain,
        flash = Math.exp(-u / 0.12) * gain;
      const dot = (r) => {
        c.beginPath();
        c.arc(e.x, e.y, r, 0, 6.283);
        c.fill();
      };
      c.fillStyle = e.colour;
      c.globalAlpha = k * 0.25;
      dot(RADAR.dot + 4);
      c.globalAlpha = k;
      dot(RADAR.dot);
      if (flash > 0.02) {
        c.fillStyle = '#e8f2ff';
        c.globalAlpha = flash;
        dot(RADAR.dot + 1);
      }
    }
    // the line, from the centre to beyond the glass: a wide faint stroke under a fine bright one
    c.globalAlpha = gain;
    const q = rad(angle),
      x1 = cx + Math.cos(q) * R,
      y1 = cy + Math.sin(q) * R;
    for (const [col, wd] of [
      ['rgba(140, 195, 255, .22)', 4],
      ['rgba(225, 242, 255, .95)', 1.2],
    ]) {
      c.strokeStyle = col;
      c.lineWidth = wd;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(x1, y1);
      c.stroke();
    }
    c.restore();
  }
  function update(t, dt, forceDraw = false) {
    const still = held(); // (the screen read close up: around it, in shadow, nothing moves)
    if (!still) {
      radarStep(t);
      needleStep(dt, t);
    }
    drawT += dt;
    topT += dt;
    if ((drawT > DRAW_EVERY && !still) || forceDraw) {
      drawT = 0;
      drawScreens(t);
    }
    if (EV_LAMPS.size && !reduce) evLampStep(performance.now() / 1000); // (the lamps lit by an event: the keypad's; the call lamp)
    // the top screen: at the screens' calm rate, faster while the terminal boots (its letters decode at 20 Hz)
    // (and while a line of the terminal is read again; what changed it at once: topDirty. The controls first, so that
    // a selection on the menu shows in this very frame)
    controlsFrame(dt, forceDraw);
    const every =
      (termT < bootLog().doneAt || shuttingDown() || (TQ.row >= 0 && t - TQ.at < TQ.window)) && !LITE
        ? BOOT.every
        : DRAW_EVERY;
    if (SCR.haut.b > 0 && ((topT > every && !still) || forceDraw || topDirty)) {
      topT = 0;
      drawTerminal(SCR.haut, t);
    }
    topDirty = false;
  }
  // the controls turn on their springs, their targets come and go; the audio monitor follows what is heard, at most
  // 30 times a second (and only when what it shows changed: drawMonitor)
  function controlsFrame(dt, forceDraw = false) {
    controlsStep(dt);
    targetsStep();
    if (SCR['crt-b'].b > 0 && !held()) {
      monitorStep(dt);
      monT += dt;
      if (monT > 1 / 30 || forceDraw) {
        monT = 0;
        drawMonitor(SCR['crt-b'], gainOf(SCR['crt-b']), forceDraw);
      }
    }
  }
  // ?perf=1: frames per second and the longest frame over each half second (tick); without frames, why (idle: motion
  // reduced, or a page read at rest), counted anew once they come back
  const perfMeter =
    new URLSearchParams(location.search).get('perf') === '1'
      ? (() => {
          const el = document.createElement('div');
          el.id = 'st-perf';
          ROOT.append(el);
          let frames = 0,
            worst = 0,
            since = null;
          const meter = {
            tick(now, gapMs) {
              since ??= now - gapMs;
              frames++;
              worst = Math.max(worst, gapMs);
              if (now - since >= 500) {
                el.textContent = `${LITE ? 'LITE · ' : ''}${Math.round((frames * 1000) / (now - since))} fps · ${Math.round(worst)} ms`;
                frames = 0;
                worst = 0;
                since = now;
              }
            },
            idle() {
              el.textContent = reduce ? 'still (reduced motion)' : 'at rest (page read)';
              frames = 0;
              worst = 0;
              since = null;
            },
          };
          if (reduce) meter.idle();
          else el.textContent = '…';
          return meter;
        })()
      : null;
  // The scene moves slowly (needles, the radar's sweep, the lamps): it is updated on every REFRESH.stride-th refresh of
  // the screen, the fewest refreshes at least MIN_FRAME ms apart. Up to 100 Hz that is every refresh; on a higher-refresh
  // screen every other one (120 to 200 Hz) or every third (240, 300 Hz), 60 to 100 updates a second: the same look, half
  // the work for the page and the graphics card (measured: at 165 Hz the page kept about 0.8 of a CPU core busy, for
  // motions that do not need it). Evenly: counted in refreshes (refreshTick), not timed against a threshold (a 12 ms
  // threshold lies so close to two refreshes at 165 Hz, 12.12 ms, that a refresh a little early pushes an update to the
  // third: 12, 18, 12 ms, the sweep stuttering; measured: 7 stutters in 8 s, none counted in refreshes). A refresh
  // skipped changes nothing on the page, so the browser composes nothing new. And no update
  // at all while none is needed: with reduced motion (the still frames below), and while a page is read at rest
  // (resting: close up, its sweep, its labels' decoding and the screen's switch-over, which squeezes the page with its
  // tube, over, and the targets still: targetsBusy; the console out of sight behind it), so that no processor, graphics
  // card or battery is spent on what is not seen: the frame that comes to rest drawn, none after it; wake starts the
  // loop again (leaving, another page, a label to decode), the scene going on from where it stood.
  const MIN_FRAME = 9.5; // (ms: at most about 105 updates a second; its steps at 105, 210 and 316 Hz, none near a common refresh rate)
  // the screen's refresh, from the frames' own spacing: the median of each REFRESH.keep intervals in turn (a refresh late
  // or skipped does not move it), its stride set from it; the refreshes since the last update counted (n: a frame the
  // browser dropped counts as the refreshes it took). True: this refresh is an update's; at once when the loop starts
  // again (wake: an interval of more than 50 ms)
  const REFRESH = { keep: 16, gaps: [], ms: 1000 / 60, stride: 1, n: 0, at: 0 };
  function refreshTick(now) {
    const R = REFRESH,
      gap = now - R.at;
    R.at = now;
    if (!(gap > 0 && gap <= 50)) {
      R.n = 0;
      return true;
    }
    R.gaps.push(gap);
    if (R.gaps.length === R.keep) {
      R.ms = R.gaps.sort((a, b) => a - b)[R.keep >> 1];
      R.stride = Math.ceil(MIN_FRAME / R.ms);
      R.gaps.length = 0;
    }
    R.n += Math.max(1, Math.round(gap / R.ms));
    if (R.n < R.stride) return false;
    R.n = 0;
    return true;
  }
  const resting = () =>
    held() &&
    PAGE.at === null &&
    !DECS.length &&
    TOWER.onAt === null &&
    TOWER.offAt === null &&
    !targetsBusy(performance.now() / 1000);
  function frame(now) {
    if (reduce || onHold) {
      looping = false;
      stoodAt ??= last;
      perfMeter?.idle();
      return;
    } // (no more frames until something happens: wake)
    if (!refreshTick(now)) {
      requestAnimationFrame(frame);
      return;
    }
    if (perfMeter && last) perfMeter.tick(now, now - last);
    if (stoodAt !== null) {
      OPENED += now - stoodAt;
      stoodAt = null;
    } // (the time the scene stood: the clocks shown go on from the time of day)
    const dt = last ? Math.min(MAX_STEP, Math.max(0, (now - last) / 1000)) : 0;
    last = now;
    if (!seeking) {
      sceneT += dt;
      if (arrivalT !== null) {
        arrivalT += dt;
        if (rerasterPending && !walking()) rerasterWorld();
        if (!powered() && arrivalT >= WALK_END + AUTO_AT) switchOn(arrivalT);
        if (arrivalT < powerAt + P_TAIL) arrival(arrivalT);
        else {
          arrivalEnd();
          arrivalT = null;
        }
      } else if (SW.off !== null)
        stationStep(sceneT); // (switched off, or on again)
      else if (powered()) termT += dt; // the terminal lives on
      liveControls();
      readStep();
      towerStep();
      hackStep();
      pageStep(); // (the reading screen, its pages, the hack)
      update(sceneT, dt);
      soundSync();
    }
    if (resting()) {
      looping = false;
      stoodAt = last;
      perfMeter?.idle();
      return;
    } // (at rest, this frame drawn: none until wake)
    requestAnimationFrame(frame);
  }
  // with reduced motion the scene stands still (no frame loop), but what the visitor does still shows: the controls are
  // set at once, the targets come and go at once, the audio monitor shows what is heard. Frames are asked for when
  // something happens (wake: the pointer, the keyboard, a control, the terminal, a page) and go on only while something
  // is still going on (stillBusy); at rest, or behind a page read, nothing runs. Without reduced motion, wake starts the
  // frame loop again where it stood (a page read at rest), its first frame counting no time (last).
  // (none before the console is built: the texts are first set, and wake() asked, before its screens and controls exist)
  let stillLast = 0,
    stillAsked = false,
    built = false;
  function wake() {
    if (!built || onHold) return;
    if (!reduce) {
      if (!looping) {
        looping = true;
        last = 0;
        requestAnimationFrame(frame);
      }
    } else if (!stillAsked) {
      stillAsked = true;
      requestAnimationFrame(stillFrame);
    }
  }
  function stillBusy() {
    if (resting()) return false; // (a page read: the console out of sight)
    const now = performance.now() / 1000;
    if (
      CTL.knob.drag ||
      topDirty ||
      (snd && soundOn) ||
      now - mon.volAt < MON.volShow ||
      now - mon.soundAt < MON.volShow
    )
      return true;
    for (const key in CTT) {
      const g = CTT[key];
      if (now < g.until || g.closeAt >= 0 || (g.hover && now - g.hoverAt < g.intent)) return true;
    }
    return false;
  }
  function stillFrame(now) {
    stillAsked = false;
    if (onHold) return;
    const dt = stillLast ? Math.min(MAX_STEP, (now - stillLast) / 1000) : 0;
    stillLast = now;
    liveControls();
    controlsFrame(dt);
    if (topDirty && SCR.haut.b > 0) drawTerminal(SCR.haut, sceneT); // (the terminal's line read again, the menu's selection)
    topDirty = false;
    if (stillBusy()) wake();
  }
  // [ animations ] (beside [ sound ], as it is; in [ skip ]'s place once the arrival is over): the animations on, or off
  // as with reduced motion, the choice kept for the visit; a change of the system's setting is the newer choice and drops
  // it. It always shows, and switches, the state one sees.
  const motionBtn = $('motion');
  function motionLabel() {
    motionBtn.textContent = reduce ? T().motionOff : T().motionOn;
    motionBtn.setAttribute('aria-pressed', String(!reduce));
    motionBtn.setAttribute('aria-label', T().motionLabel);
  }
  motionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    motionPref.set(!reduce);
    motionSet(!reduce);
  });
  REDUCE.addEventListener('change', () => {
    motionPref.set(null);
    motionSet(REDUCE.matches);
  });
  // motion reduced, or back, at once. Reduced, what is under way ends as it would have with reduced motion from the
  // start: the arrival as when skipped (a dip to black; at once if only its tubes' last creep, unseen, is left: P_END), a
  // move of the camera through a dip to black (readDip; the screen's switch-over after it at once: readEnd), the screen's
  // switch-on at once, a page as shown without a move (pageStill), the lamps lit by an event at their level, the rest
  // drawn once (stillShow); the frame loop stops at its next frame. Back, the loop takes the scene on from where it
  // stands.
  function motionSet(on) {
    if (on === reduce) return;
    reduce = on;
    ROOT.classList.toggle('reduce', on);
    motionLabel();
    if (on && built) {
      // (each only if under way)
      if (arrivalT !== null && arrivalT - powerAt >= P_END) {
        arrivalEnd();
        arrivalT = null;
      } else skipArrival();
      if (READ.dur) {
        READ.dur = 0;
        readDip(READ.to, 0);
      }
      if (TOWER.onAt !== null) towerOn();
      pageStill();
      evLampStep(Infinity);
      perfMeter?.idle();
      stillShow();
    }
    wake();
  }
  // the arrival can be skipped ([ skip ] or Escape): a short dip to black, then the station on, its menu built. It
  // plays once per visit: the tab remembers that the station is on (sessionStorage: nothing is kept once the tab is
  // closed), so coming back to the console shows it already on, with a fade.
  const veil = $('veil'),
    VISIT = 'wardogs.console.on';
  const visit = {
    seen: () => {
      try {
        return sessionStorage.getItem(VISIT) === '1';
      } catch {
        return false;
      }
    },
    remember: () => {
      try {
        sessionStorage.setItem(VISIT, '1');
      } catch {
        /* private mode: it simply plays again */
      }
    },
    forget: () => {
      try {
        sessionStorage.removeItem(VISIT);
      } catch {
        /* private mode */
      }
    },
  };
  let skipping = false;
  function skipArrival() {
    if (arrivalT === null || skipping) return;
    skipping = true;
    veil.style.opacity = '1';
    setTimeout(() => {
      if (!powered()) switchOn(arrivalT);
      arrivalEnd();
      arrivalT = null;
      stillShow(); // (skipped as motion was reduced: motionSet)
      veil.style.opacity = '0';
      skipping = false;
    }, 320);
  }
  // the console shown already on: from black, with a fade
  function fadeIn(d = 0.6) {
    veil.style.transition = 'none';
    veil.style.opacity = '1';
    void veil.offsetWidth;
    veil.style.transition = `opacity ${d}s ease`;
    veil.style.opacity = '0';
    setTimeout(
      () => {
        veil.style.transition = '';
      },
      d * 1000 + 50,
    );
  }
  // ===================================================================================================================
  // The sound on the console. The oscilloscope becomes the audio monitor: 16 bands of what is heard (after the volume),
  // with the ballistics of a studio meter (instant rise, slow fall, a peak mark that holds then falls). Its working
  // controls sit on the blank panel just under it (the ones under the screen, not the pair on the right): copies of
  // bay B's right knob and bar switch, made in the light of that place; the pair on the right stays
  // still, as in the game. The knob is the volume: it turns by notches, one per lobe of its rim (it has 12, so at rest
  // it always looks as on the picture), 11 positions from 0 to 100 %, by dragging round it, the wheel or the arrow
  // keys; a small click per notch, a spring as it settles. It turns as a filmstrip of its turn over one lobe, rendered
  // from the photo: the lobes go round, the light stays where it is. The switch
  // turns the sound on and off (a quarter of a notch-plate: 30 degrees), with its clac, in step with [ sound ]. What
  // they do shows on the monitor itself, as on a real device (the volume for a moment, the sound on or off); no
  // floating tag (it looked buggy).
  // ===================================================================================================================
  // (one notch per lobe: 12. The knob starts at 50 %, def: a visitor arriving at the station hears the sound at half
  // volume. The mix plays as levelled at 80 %, ref; each notch is 4 dB, so 50 % is 12 dB under it, as a real volume
  // knob turned down from 80 to 50.)
  const VOL = { pref: 'wardogs.volume', steps: 10, def: 5, ref: 8, pitch: 360 / 12, dbPerStep: 4 };
  const volGain = (n) => (n <= 0 ? 0 : Math.pow(10, ((n - VOL.ref) * VOL.dbPerStep) / 20));
  let volStep = (() => {
    try {
      const v = +sessionStorage.getItem(VOL.pref);
      return Number.isInteger(v) && v >= 0 && v <= VOL.steps && sessionStorage.getItem(VOL.pref) !== null
        ? v
        : VOL.def;
    } catch {
      return VOL.def;
    }
  })();
  const SPRING = { knob: [420, 30], lever: [600, 32] }; // stiffness, damping: a little overshoot, then still
  // the legends printed on the plates above the knob and the switch (in each plate's slot, from pieces.json); and, so
  // that no plate stays blank, on bay B's other plates, blank on the picture (measured on it, by their edges;
  // canvas px), what each dial or control is for in an audio bay, as its
  // needle behaves: its supply's voltage and current (the needles rise as the bay gets power), the amplifier's heat and
  // load (a load coming on: the dips), the three small dials the bass, the mids and the treble of what is heard
  // (NEEDLE_SOUND), the decorative knobs and switches below them settings of a sound desk; and on the labels under the
  // top bay's four temperature gauges (°C): each a bay's, A to D in reading order as the terminal and B1 name the
  // bays, its needle warming up as its bay gets power (NEEDLE_BAY), lit with the top bay (their third field). In TXT
  // legends; printed (.legend) with their capitals centred in the plate, all in one type, the copies' (--sound-s: one
  // set of markings on the console).
  const LEGENDS = [
    ['vol', 'plaque-volume'],
    ['sound', 'plaque-son'],
    ['volt', [682.15, 516.93, 42.48, 8.15]],
    ['amp', [952.41, 516.87, 43.01, 8.19]],
    ['temp', [677.99, 606.96, 45.12, 8.76]],
    ['load', [949.95, 606.99, 45.01, 8.74]],
    ['bass', [769.41, 746.38, 38.32, 8.96]],
    ['mid', [814.03, 746.35, 39.8, 9.01]],
    ['treble', [860.94, 746.39, 38.04, 8.96]],
    ['filter', [668.88, 751.42, 40.54, 12.18]],
    ['mono', [716.85, 751.37, 40.68, 12.26]],
    ['echo', [909.98, 751.42, 41.24, 12.23]],
    ['line', [957.74, 751.43, 40.93, 12.17]],
    ['bayA', [1557.94, 306.2, 76.07, 19.75], 'top'],
    ['bayB', [1745.74, 305.96, 77.63, 20], 'top'],
    ['bayC', [1557.43, 469.4, 76.19, 19.52], 'top'],
    ['bayD', [1745.18, 469.44, 76.98, 19.67], 'top'],
  ];
  const legendEls = [];
  // a clue added on the room, so that the easter egg can be found: the phone's three blank keys, under * 0 #, printed
  // 1 1 2, the code that makes it ring (DISCORD's on the menu), their centres measured on the picture (canvas px).
  // Hidden from screen readers, as the legends (printed marks). (471's clue is the terminal's:
  // its SPECIAL ACCESS block, TXT term blocks.)
  const ROOM_MARKS = [
    ['figure', [1826.5, 684.8], '1'],
    ['figure', [1847, 685], '1'],
    ['figure', [1867.8, 685.3], '2'],
  ];
  const markEls = [];
  const LEVER_ON = 30;
  const CTL = {
    knob: {
      angle: volStep * VOL.pitch,
      vel: 0,
      drag: null,
      el: null,
      strips: [],
      frames: 1,
      stride: 0,
      frame: -1,
    },
    lever: { angle: 0, vel: 0, el: null, imgs: [] },
  };
  // the copies under the monitor: the knob's filmstrip (knob.json) and the switch, which turns
  // on its axis (pieces.json); their axes are set by buildControls
  const KNOB = { id: 'volume', axis: null },
    LEVER = { id: 'son-levier', axis: null };
  // (the group made smaller to fit its recess: its scale, in knob.json; the sizes measured on
  // the photo, CT.knob, CT.bar, the hit areas, the legends' type (all of them, bay B's too: one set), follow it)
  let SOUND_S = 1;
  function buildControls(pieces, film) {
    const box = $('controls');
    KNOB.axis = film.axis;
    LEVER.axis = pieces[LEVER.id].axis;
    SOUND_S = film.scale ?? 1;
    box.style.setProperty('--sound-s', SOUND_S);
    for (const [key, P] of [
      ['knob', KNOB],
      ['lever', LEVER],
    ]) {
      const c = CTL[key];
      if (key === 'knob') {
        c.strips = [...ROOT.querySelectorAll(`.piece[data-p="${P.id}"] .strip`)];
        c.frames = film.frames;
        c.stride = film.stride;
      } else {
        const p = pieces[P.id];
        c.imgs = [...ROOT.querySelectorAll(`.piece[data-p="${P.id}"]`)];
        c.imgs.forEach((im) => {
          im.style.transformOrigin = `${P.axis[0] - p.x}px ${P.axis[1] - p.y}px`;
        });
      }
      const el = document.createElement(key === 'lever' ? 'button' : 'div');
      el.className = 'ctl ' + key;
      if (key === 'knob') {
        el.tabIndex = 0;
        el.setAttribute('role', 'slider');
        el.setAttribute('aria-valuemin', '0');
        el.setAttribute('aria-valuemax', '100');
      } else {
        el.type = 'button';
        el.setAttribute('role', 'switch');
      }
      // the hit area: the piece's box, a little larger, centred on its axis
      const r = (key === 'knob' ? 24 : 26) * SOUND_S;
      Object.assign(
        el.style,
        key === 'knob'
          ? {
              left: P.axis[0] - r + 'px',
              top: P.axis[1] - r + 'px',
              width: 2 * r + 'px',
              height: 2 * r + 'px',
            }
          : {
              left: P.axis[0] - r + 'px',
              top: P.axis[1] - 17 * SOUND_S + 'px',
              width: 2 * r + 'px',
              height: 34 * SOUND_S + 'px',
            },
      );
      box.append(el);
      c.el = el;
      wireTarget(el, key);
    }
    const k = CTL.knob,
      kel = k.el;
    // turning the knob: the angle follows the pointer round its axis; each notch passed is a step
    const pointerAngle = (e) => {
      const b = kel.getBoundingClientRect();
      return (
        (Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180) / Math.PI
      );
    };
    kel.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      kel.focus({ preventScroll: true });
      kel.setPointerCapture(e.pointerId);
      k.drag = { last: pointerAngle(e) };
      kel.classList.add('dragging');
    });
    kel.addEventListener('pointermove', (e) => {
      if (!k.drag) return;
      const a = pointerAngle(e);
      let d = a - k.drag.last;
      d -= 360 * Math.round(d / 360);
      k.drag.last = a;
      k.angle = Math.max(0, Math.min(VOL.steps * VOL.pitch, k.angle + d));
      k.vel = 0;
      const n = Math.round(k.angle / VOL.pitch);
      if (n !== volStep) setVolume(n);
    });
    const end = () => {
      if (!k.drag) return;
      k.drag = null;
      kel.classList.remove('dragging');
      wake();
    };
    kel.addEventListener('pointerup', end);
    kel.addEventListener('pointercancel', end);
    // the wheel (a trackpad's small steps add up) and the keyboard
    let wheel = 0;
    kel.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        wheel += e.deltaY;
        if (Math.abs(wheel) >= 60) {
          setVolume(volStep - Math.sign(wheel));
          wheel = 0;
        }
      },
      { passive: false },
    );
    kel.addEventListener('keydown', (e) => {
      const d = { ArrowUp: 1, ArrowRight: 1, PageUp: 1, ArrowDown: -1, ArrowLeft: -1, PageDown: -1 }[e.key];
      if (d) {
        e.preventDefault();
        setVolume(volStep + d);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setVolume(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setVolume(VOL.steps);
      }
    });
    CTL.lever.el.addEventListener('click', (e) => {
      e.stopPropagation();
      setSound(!soundOn);
    });
    for (const [key, plate, bay = 'B'] of LEGENDS) {
      const [x, y, w, h] = Array.isArray(plate) ? plate : pieces[plate].slot; // (a rect measured on the picture, or a piece's slot)
      const el = unread(document.createElement('div'));
      el.className = 'legend';
      el.dataset.t = key;
      el.dataset.bay = bay; // (printed marks: the controls carry their own names)
      Object.assign(el.style, { left: x + w / 2 + 'px', top: y + h / 2 + 'px' }); // (its centre on the plate's: .legend)
      box.prepend(el);
      legendEls.push(el);
    }
    for (const [kind, [x, y], figure] of ROOM_MARKS) {
      const el = unread(document.createElement('div'));
      el.className = 'room-mark ' + kind;
      if (figure) el.textContent = figure;
      Object.assign(el.style, { left: x + 'px', top: y + 'px' });
      box.prepend(el);
      markEls.push(el);
    }
    CTL.lever.angle = soundOn ? LEVER_ON : 0;
    const lv = pieces[LEVER.id],
      slot = (id) => {
        const [x, y, w, h] = pieces[id].slot;
        return [x, y, x + w, y + h];
      },
      join = (a, b) => [
        Math.min(a[0], b[0]),
        Math.min(a[1], b[1]),
        Math.max(a[2], b[2]),
        Math.max(a[3], b[3]),
      ];
    buildTargets({
      knob: join(slot('plaque-volume'), [
        KNOB.axis[0] - CT.knob * SOUND_S,
        KNOB.axis[1] - CT.knob * SOUND_S,
        KNOB.axis[0] + CT.knob * SOUND_S,
        KNOB.axis[1] + CT.knob * SOUND_S,
      ]),
      lever: join(slot('plaque-son'), [lv.x, lv.y, lv.x + lv.w, lv.y + lv.h]),
      power: [POWER.x - POWER.w / 2, POWER.y - POWER.h / 2, POWER.x + POWER.w / 2, POWER.y + POWER.h / 2],
    });
    CTT.knob.btn = k.el;
    CTT.lever.btn = CTL.lever.el; // (their elements, for the targets' rules: outside the window, not there)
    wireTarget(PT.btn, 'power');
    controlsLabel();
    applyControls();
  }
  function setVolume(n) {
    n = Math.max(0, Math.min(VOL.steps, n));
    if (n === volStep) return;
    volStep = n;
    smallShow();
    try {
      sessionStorage.setItem(VOL.pref, String(n));
    } catch {
      /* private mode */
    }
    if (snd) {
      snd.setVolume(volGain(n));
      if (soundOn) snd.detent();
    }
    mon.volAt = performance.now() / 1000;
    mon.soundAt = -Infinity;
    controlsLabel();
    targetChanged('knob');
  }
  function controlsLabel() {
    const k = CTL.knob,
      l = CTL.lever,
      pct = volStep * 10;
    if (k.el) {
      k.el.setAttribute('aria-label', T().vol);
      k.el.setAttribute('aria-valuenow', String(pct));
      k.el.setAttribute('aria-valuetext', `${pct} %`);
    }
    legendEls.forEach((el) => {
      el.textContent = T().legends[el.dataset.t];
    });
    if (l.el) {
      l.el.setAttribute('aria-label', T().soundLabel);
      l.el.setAttribute('aria-checked', String(soundOn));
    }
    targetTexts();
  }
  // each control on its spring towards its position (the knob's notch, the switch's on or off); the pieces turn with it
  function controlsStep(dt) {
    if (!CTL.knob.el) return;
    const k = CTL.knob,
      l = CTL.lever;
    const spring = (c, target, [K, D]) => {
      if (reduce) {
        c.angle = target;
        c.vel = 0;
        return;
      }
      const a = K * (target - c.angle) - D * c.vel;
      c.vel += a * dt;
      c.angle += c.vel * dt;
      if (Math.abs(target - c.angle) < 0.01 && Math.abs(c.vel) < 0.05) {
        c.angle = target;
        c.vel = 0;
      }
    };
    if (!k.drag) spring(k, volStep * VOL.pitch, SPRING.knob);
    spring(l, soundOn ? LEVER_ON : 0, SPRING.lever);
    applyControls();
  }
  function applyControls() {
    // the knob: the frame of its angle within a lobe
    const k = CTL.knob,
      phase = (((k.angle % VOL.pitch) + VOL.pitch) % VOL.pitch) / VOL.pitch,
      f = Math.round(phase * k.frames) % k.frames;
    if (f !== k.frame) {
      k.frame = f;
      k.strips.forEach((st) => setStyle(st, 'transform', `translateX(${-f * k.stride}px)`));
    }
    const l = CTL.lever,
      tr = `rotate(${l.angle.toFixed(2)}deg)`;
    l.imgs.forEach((im) => setStyle(im, 'transform', tr));
  }

  // ===================================================================================================================
  // The targets of the sound's controls, in the power button's language (everything one can use looks and behaves
  // alike). Pointed at (or focused from the keyboard, turned, or touched), a control gets curved arrows that show how it
  // moves (an arrow round the knob says that it turns): on both sides of the knob, clockwise; at both ends of the
  // switch's bar, the way it will rock. They are its lock: they come in as the power button's corners do (from wider,
  // turned, snapping into place) while they draw themselves along, as Motion's path drawing does; no corners on top of
  // them (corners and arrows together are too much). Then the power's leader, drawn down to a tag below the panel (the
  // monitor above stays clear), whose plate opens from its centre and whose text decodes: the control's name and state,
  // then how to use it. Quicker than the power button's, being a hint under the pointer, with the same curves; it leaves
  // as the power's does (text wiped, plate closed, leader drawn back, arrows away). One at a time: the one touched last.
  // The colours are the power's: the status square and the state amber while the sound is off, green when it is on.
  // ===================================================================================================================
  const CT = {
    open: {
      lock: [0, 0.34],
      turnDur: 0.3,
      arc: [0, 0.3],
      lead: [0.22, 0.36],
      plate: [0.32, 0.46],
      name: [0.38, 0.62],
      state: [0.54, 0.7],
      hint: [0.62, 0.92],
    },
    close: { text: [0, 0.12], plate: [0.08, 0.2], lead: [0.14, 0.26], arc: [0.18, 0.36], end: 0.4 },
    spread: 1.35, // the arrows come from 1.35 times their size (the power's corners: 1.9, from farther)
    lead: 26,
    linger: 1.2, // the leader's length (screen px); a touch's tag stays 1.2 s
    knob: 20.5, // the knob's radius (canvas px)
    knobArcs: [
      [135, 225],
      [315, 405],
    ], // the knob's arrows: up its left side, down its right side (deg, screen, 0 = right)
    bar: { angle: -16.6, half: 22.5 }, // the switch's bar at rest (OFF): its angle and half length about its axis (measured)
    post: { from: 22, pad: 3 }, // a post's corners come in from 22 px farther out, to 3 px around it (screen px)
    intent: 0.3, // a zone's target waits until the pointer has rested on it 0.3 s (hover intent): the
    // pointer that crosses the audio module on its way to the knob or the switch does
    // not bring the module's frame up
  };
  const CTT = {};
  // The targets' markup: corners (the power button, the posts) or curved arrows (the sound's controls), then a leader
  // and a tag (none for the menu's entries: their tiles show their name and code already)
  const TG = {
    lock: '<div class="tg-lock"><i class="tg-corner tl"></i><i class="tg-corner tr"></i><i class="tg-corner bl"></i><i class="tg-corner br"></i></div>',
    arcs:
      '<svg class="tg-arc"><path class="case arc" pathLength="1"/><path class="case arc" pathLength="1"/><path class="case head"/>' +
      '<path class="line arc" pathLength="1"/><path class="line arc" pathLength="1"/><path class="line head"/></svg>',
    lead: (down) => `<i class="tg-lead${down ? ' down' : ''}"></i><i class="tg-end"></i>`,
    tag:
      '<div class="tg-tag"><span class="plate"></span><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>' +
      '<p class="l1"><span class="sq"></span><span class="nm"></span><span class="st"></span></p><p class="l2"></p></div>',
  };
  // a target: its key, its kind (arcs: the sound's controls; power; post; card: a menu's entry), its markup, box (what it
  // locks on, canvas px: x0, y0, x1, y1), axis (its control's), lit (its status square and state green, else amber) and
  // live (when it can show)
  function makeTarget(key, kind, html, salt, box, axis, lit, live) {
    const el = document.createElement('div');
    el.className = 'ctl-tg';
    el.innerHTML = html;
    $('ctl-targets').append(el);
    const q = (sel) => el.querySelector(sel),
      qa = (sel) => [...el.querySelectorAll(sel)],
      word = (sel, k) => (q(sel) ? letters(q(sel), salt + k) : null);
    return (CTT[key] = {
      key,
      kind,
      el,
      svg: q('.tg-arc'),
      arcs: qa('.tg-arc .arc'),
      heads: qa('.tg-arc .head'),
      lock: q('.tg-lock'),
      corners: qa('.tg-corner'),
      lead: q('.tg-lead'),
      end: q('.tg-end'),
      tag: q('.tg-tag'),
      plate: q('.tg-tag .plate'),
      marks: qa('.tg-tag .c'),
      l1: q('.tg-tag .l1'),
      sq: q('.tg-tag .sq'),
      stEl: q('.tg-tag .st'),
      name: word('.nm', 1),
      st: word('.st', 2),
      hint: word('.l2', 3),
      box,
      axis,
      lit,
      live,
      hover: false,
      hoverAt: 0,
      intent: 0,
      kbd: false,
      until: 0,
      touched: 0,
      openAt: -1,
      closeAt: -1,
      inA: 0,
      changedAt: -Infinity,
      wayAt: -Infinity,
      hw: 0,
      hh: 0,
      s: 1,
      cl: 10,
    });
  }
  // what takes the pointer and the keyboard for a target: pointed at, focused from the keyboard (not by a click), touched
  // (its tag then stays a moment)
  function wireTarget(el, key) {
    const now = () => performance.now() / 1000;
    el.addEventListener('pointerenter', () => {
      const g = CTT[key];
      if (g) {
        g.hover = true;
        g.touched = g.hoverAt = now();
      }
      wake();
    });
    el.addEventListener('pointerleave', () => {
      const g = CTT[key];
      if (g) g.hover = false;
      wake();
    });
    el.addEventListener('pointerup', (e) => {
      const g = CTT[key];
      if (g && e.pointerType !== 'mouse') g.until = now() + CT.linger;
      wake();
    });
    el.addEventListener('focus', () => {
      const g = CTT[key];
      if (g && el.matches(':focus-visible')) {
        g.kbd = true;
        g.touched = now();
      }
      wake();
    });
    el.addEventListener('blur', () => {
      const g = CTT[key];
      if (g) g.kbd = false;
      wake();
    });
  }
  // box: the module the corners lock on, its plate and its control (canvas px: x0, y0, x1, y1); axis: the control's. The
  // main power button too, while the station is on: its target as at the start, its corners and its leader up to its tag
  // above, in its ON state (pointed at: "click to switch off"); the start-up's own target shows it when it is off.
  function buildTargets(boxes) {
    const always = () => true,
      sound = () => soundOn;
    makeTarget('knob', 'arcs', TG.arcs + TG.lead(true) + TG.tag, 10, boxes.knob, KNOB.axis, sound, always);
    makeTarget('lever', 'arcs', TG.arcs + TG.lead(true) + TG.tag, 20, boxes.lever, LEVER.axis, sound, always);
    makeTarget(
      'power',
      'power',
      TG.lock + TG.lead(false) + TG.tag,
      30,
      boxes.power,
      [POWER.x, POWER.y],
      always,
      stationUp,
    );
  }
  // The posts, in the same language. Pointed at or focused, a post is locked by four corners, each on its own corner
  // of the post, the outer edge of its frame, its arms along the post's two sides (seen in perspective, a post is not
  // quite a rectangle: it leans, and straight corners would look off on an askew post), with a tag on its side: its
  // name, its state, what to do (the menu's entries: corners only, their tile selected on the screen itself).
  // - The reading screen: the outer edge of its bezel, measured on the lit room (its right side 9 px further right at
  //   its foot than at its top).
  // - ENTER CODE and the keypad, two posts (one zone over the screen, the lamps, the voltmeters and the keypad would
  //   not be clean): the screen, the outer edge of its bezel, measured on the lit room, its tag above as the phone's;
  //   the keypad, the outer edge of its rim (the dark groove round it), measured on the lit room:
  //   it stands askew, its left side 5 degrees, its right side 7 (the
  //   perspective), its top and foot level; a zone like the audio module (its keys are its controls).
  // - The phone: the phone alone, without its cord, its four corners measured on the lit room (the phone stands a
  //   little askew, its right side 10 px further right at its foot than at its top); its tag above.
  // - The audio module (its monitor, the knob and the switch): a zone that is only pointed at, its frame showing that
  //   it can be used, its own controls taking the keyboard; its four corners measured on the lit room (its left side
  //   6 px further left at its foot than at its top).
  // - The menu's entries: their tiles on the top screen, through its projection.
  // Each is a button over its place on the console, live once the station is up and its menu built (before, a click
  // anywhere powers the station on). DISCORD (the phone, the menu's entry) opens the server's invitation in a new tab;
  // the radar's echoes, the factions' and the people's, are posts too (buildEchoes).
  const LINKS = {
    discord: 'https://discord.gg/bb7hMrw8S9',
    github: 'https://github.com/Wardogs-Companion/wardogs-companion-website',
    twitch: TWITCH_EXTENSION, // (the extension's page on Twitch, to install it: links.js)
  };
  // the networks' names, as they write them (the same in both languages): the project's places and a person's links
  const NETWORKS = { twitch: 'Twitch', discord: 'Discord', github: 'GitHub' };
  // the project's places elsewhere, on the community page (DISCORD's): one line each (its address, its mark:
  // SOCIAL_MARKS), its name in NETWORKS, its words in TXT socials; a network more (YouTube...), a line more in each
  const SOCIALS = [
    { id: 'discord', url: LINKS.discord },
    { id: 'github', url: LINKS.github },
  ];
  // the people on the radar, a white echo each (the rule: a colour is a faction, white a person), their card a hologram
  // (cardOpen); for now the creator alone (others once they agree). Each: their public handle, their place on the radar
  // (RADAR_AT), their links (their names in NETWORKS, their words in TXT cards); only what they chose to show
  const PEOPLE = [
    {
      id: 'biggy',
      handle: 'Biggy',
      links: [
        ['twitch', 'https://www.twitch.tv/biggyqlf'],
        ['discord', LINKS.discord],
        ['github', 'https://github.com/BiggyQLF'],
      ],
    },
  ]; // (their own profiles; the community's server)
  const MENU_IDS = SECTION_IDS; // (the menu's entries, in the order of TXT's menu: sections.js)
  // a section opened, the same from the tiles, the sections' bar and the keypad: on the reading screen; a section that
  // would be a link elsewhere opens it in a new tab (none now: DISCORD has its own page; the phone is its direct line,
  // its post's href)
  const SECTION_LINKS = {};
  // ===================================================================================================================
  // Reading. The tower's screen is the reading screen, read close up: whatever leads there (a click on it, the menu's
  // EXTENSION or SCREENSHOTS, the sections' bar, their codes on the keypad: openSection) calls read(id). The screen
  // locks (its corners close in on its bezel, turn green and blink twice, as the intro's lock; its tag leaves) and shows
  // the section (its name and ACQUISITION; its page once close: the pages); then the camera comes close
  // (CAM.r, 0 to 1, in READ_T.in s, smoother, after READ_T.lock s) while the rest of the console goes into the dark
  // (#st-focus), until its glass covers the window; there, BACK shows at its top left. back() (BACK, Escape, Backspace
  // or Delete, a click beside the screen) does the reverse, in READ_T.out s. Meanwhile the console takes neither the
  // pointer nor the keyboard (readInert); held close, what moves around the screen, in shadow, stands still (update:
  // held). A move interrupted goes on from where the camera is. With reduced motion (and without a graphics card, LITE)
  // the camera is not animated (a short dip to black).
  // ===================================================================================================================
  const READ = {
    id: null,
    from: 0,
    to: 0,
    t0: 0,
    dur: 0,
    lockAt: -Infinity,
    arrived: false,
    opener: null,
    dip: 0,
    swap: false,
  }; // (swap: a tab changed, close up)
  const READ_T = { lock: 0.3, in: 1.0, out: 0.8, shade: 1, tighten: 0.12, blink: [0.08, 0.28], off: 0.1 };
  const READ_SECTIONS = SECTION_IDS; // (each read on the reading screen)
  // a section asked for by the page's address (/extension, /fr/about…: its own page, src/pages/[section].astro, which
  // marks the root element; the intro film skipped for it, seen-check.js): the console opens already on (begin), the
  // section is read as soon as the menu is live (livePosts)
  const asked = document.documentElement.dataset.section;
  let deep = READ_SECTIONS.includes(asked) ? asked : null;
  // the address follows the section read (its own page's), and is the home page's again once back on the menu; the
  // page's title and the languages' links with it (the same section in the other language)
  function addressFor(id) {
    const path = sectionPath(ROOT.dataset.lang, id);
    if (location.pathname.replace(/\/$/, '') !== path.replace(/\/$/, ''))
      history.replaceState(history.state, '', path + location.search);
    document.title = id ? `${T().titles[id]} · ${NAME}` : NAME;
    for (const a of document.querySelectorAll('#home a[hreflang]')) a.href = sectionPath(a.hreflang, id);
  }
  const SCREEN_SECTION = 'extension'; // (the tower's screen opens the extension's page: what the app does, first)
  const reading = () => READ.id !== null && READ.to === 1; // (going there, or there; not coming back)
  const held = () => READ.arrived && READ.to === 1; // (there, close up)
  // a section: a link opens in a new tab (SECTION_LINKS); the others are read on the reading screen
  function openSection(id) {
    telVisit(id); // (the top screen's VISITED)
    if (SECTION_LINKS[id]) window.open(SECTION_LINKS[id], '_blank', 'noopener');
    else if (READ_SECTIONS.includes(id)) {
      if (READ.id !== id && ROOT.classList.contains('posts-live'))
        logLine(
          () => T().term.readHead,
          () => [sectionName(id), T().term.readOk, MINT],
        ); // (the page read, in the terminal's log under > READ, as the codes under > KEYPAD)
      read(id);
    }
  }
  function read(id) {
    if (!ROOT.classList.contains('posts-live') || !SCR.principal) return;
    const was = READ.id !== null,
      turning = was && READ.to === 0,
      other = was && !turning && id !== READ.id;
    READ.id = id;
    addressFor(id);
    const sound = snd && soundOn; // (the lock's relay, or a tab's detent)
    if (sound && (!was || turning)) snd.lock();
    else if (sound && other) snd.tab();
    if (!was) {
      READ.opener = document.activeElement !== document.body ? document.activeElement : null;
      if (CALL.state !== 'idle') callStop(CALL.state === 'connected' ? 'ended' : 'missed'); // (its box would cover the screen)
      hackEnd(false); // (the screen read instead, the hack called off)
      for (const key in CTT) Object.assign(CTT[key], { hover: false, kbd: false, until: 0 }); // (only the screen's target now)
      ROOT.classList.add('reading');
      readSquare(true);
      readLines(true); // (the shield takes the pointer; the console is made inert once the camera is still: readApply)
    }
    if (turning) towerOn(); // (read again on the way back: its page on again)
    if (!was || turning) {
      READ.swap = false;
      READ.lockAt = performance.now() / 1000;
      READ.arrived = false;
      readMove(1, was ? 0 : READ_T.lock);
    }
    screenRes(SCR.principal, readScale());
    if (other && held()) {
      // (another page, swept in over the bare glass, without its name in large: a gentler change; opened from a button of the page gone with it, the focus on its title)
      READ.swap = true;
      if (pageOf(id)) pageShow(id, PAGE_T.swap);
      else pageHide();
      if (unfocused(document.activeElement))
        (PAGE.id !== null ? pageTitle() : $('back')).focus({ preventScroll: true });
      else $('pad-status').textContent = T().pageSay.replace('{page}', sectionName(id)); // (the focus kept on the bar's button that changed it: screen readers told the page changed)
    }
    drawTower();
    navCurrent();
    wake();
  }
  function back() {
    if (!reading()) return;
    addressFor(null);
    $('back').hidden = true;
    ROOT.classList.remove('read-there');
    navCurrent();
    const tube = !reduce && !LITE; // (the page switched off as one leaves; the camera pulls back once it is a line)
    if (tube) {
      TOWER.offAt = performance.now() / 1000;
      if (snd && soundOn) snd.pageOff();
    } // (its tube's crackle)
    readMove(0, tube ? READ_COLLAPSE.line : 0);
    drawTower();
    wake();
  }
  // out of reach while a screen is read: the console's posts (the keypad among them), the sound's controls and the main
  // power button. Made inert (the keyboard, screen readers) only while the camera stands still, close up then back at the
  // framing: inert, they are painted again, which costs a frame of 24 to 60 ms (measured), unseen when nothing moves;
  // while the camera moves, the shield (#st-shield, over the world) takes the pointer
  function readInert(on) {
    for (const id of ['posts', 'controls', 'power']) $(id).inert = on;
  }
  // the camera's move towards to (1: close, 0: the framing), from where it is, in a time in proportion to the way left
  function readMove(to, delay) {
    Object.assign(READ, {
      from: CAM.r,
      to,
      t0: performance.now() / 1000 + delay,
      dur: (to ? READ_T.in : READ_T.out) * Math.abs(to - CAM.r),
    });
    if (reduce || LITE) {
      READ.dur = 0;
      readDip(to, delay);
    } // (not animated: through a dip to black)
    else if (!READ.dur) readApply(); // (no way left, as when read again on the way back before the camera moved: there at once)
  }
  // without a move (reduced motion; without a graphics card, LITE, where the approach ran at 11 to 15 frames a second):
  // the lock, then a short dip to black (#st-veil, as skipping the arrival): close up (or back at the framing) under the
  // black, then the black lifts. Timers: the same with reduced motion, where no frame loop runs.
  const READ_DIP = { black: 0.34 }; // (s: the veil's own fade, .32 s, and a frame)
  function readDip(to, delay) {
    clearTimeout(READ.dip);
    READ.dip = setTimeout(() => {
      veil.style.opacity = '1';
      READ.dip = setTimeout(() => {
        READ.dip = 0;
        CAM.r = to;
        readApply();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            veil.style.opacity = '0';
          }),
        );
      }, READ_DIP.black * 1000);
    }, delay * 1000);
  }
  // each frame while it moves
  function readStep() {
    if (READ.id === null || !READ.dur) return;
    const k = seg(performance.now() / 1000, READ.t0, READ.t0 + READ.dur);
    CAM.r = k >= 1 ? READ.to : READ.from + (READ.to - READ.from) * smoother(k);
    if (k >= 1) READ.dur = 0;
    readApply();
  }
  // the camera where CAM.r says, the shadow with it, the screen's corners on its bezel as the camera shows it; arrived,
  // BACK takes the focus (from what led there, or from nothing); back at the framing, it ends
  function readApply() {
    camera();
    setStyle($('focus'), 'opacity', (READ_T.shade * seg(CAM.r, 0, 0.6)).toFixed(3));
    setStyle($('focus-in'), 'opacity', seg(CAM.r, 0.6, 1).toFixed(3)); // (the frame into the dark at the end of the approach)
    if (CTT.screen) targetOn(CTT.screen, CAM.pose, CAM.r === 0 || CAM.r === 1);
    if (CAM.r < 1) pageHide(); // (a page only close up)
    if (READ.to === 1 && CAM.r === 1 && !READ.arrived) {
      READ.arrived = true;
      readInert(true); // (now still: its own lines)
      $('back').hidden = false;
      ROOT.classList.add('read-there'); // (BACK, and on a computer the bar at the top)
      if (pageOf(READ.id)) pageShow(READ.id, 0);
      else {
        pageHide();
        drawTower();
      } // (its page, swept in at once; none for a section without one, even read again on the way back from another's)
      const at = document.activeElement; // (the focus: on the page, to read it and scroll it from the keyboard; else BACK)
      if (unfocused(at) || at === READ.opener)
        (PAGE.id !== null ? pageTitle() : $('back')).focus({ preventScroll: true });
    }
    if (READ.to === 0 && CAM.r === 0) readEnd();
  }
  // back at the framing: the console takes the pointer and the keyboard again, the focus goes back to what led there
  function readEnd() {
    Object.assign(READ, { id: null, dur: 0, arrived: false });
    navCurrent();
    ROOT.classList.remove('read-there');
    ROOT.classList.remove('reading');
    readInert(false);
    screenRes(SCR.principal, CANVAS_SCALE);
    drawTower();
    readLines(false);
    readSquare(false);
    if (TOWER.offAt !== null) {
      if (reduce) towerOn();
      else Object.assign(TOWER, { offAt: null, onAt: performance.now() / 1000 });
      if (snd && soundOn) snd.screenOn();
    } // (switched off on the way: on again now, its switch-on heard; at once if motion was reduced on the way: motionSet)
    if (CTT.knob) placeTargets();
    const o = READ.opener;
    READ.opener = null;
    if (o?.isConnected && unfocused(document.activeElement)) o.focus({ preventScroll: true });
    if (rerasterPending) rerasterWorld();
    stillShow();
    wake(); // (motion reduced while it was read: the console, still while it was, drawn once as it stands now)
  }
  // at once, without a move or a focus (the station switched off, the arrival played again); and a switch-over of the
  // screen still going on (it would fight the station's own tubes) called off
  function readReset() {
    if (TOWER.offAt !== null || TOWER.onAt !== null) towerOn();
    if (READ.dip) {
      clearTimeout(READ.dip);
      READ.dip = 0;
      veil.style.opacity = '0';
    } // (a dip on its way: the black lifted)
    if (READ.id === null) return;
    addressFor(null);
    READ.opener = null;
    $('back').hidden = true;
    CAM.r = 0;
    Object.assign(READ, { to: 0, dur: 0 });
    readApply();
  }
  // the glass's raster lines (.scr::after: 1 px of every 3, world px) off on the screen read, from the lock to the
  // framing again: grown with the zoom they made stripes across the letters, and moiré; once close the screen draws its
  // own, under its text (drawRead)
  function readLines(on) {
    setStyle(SCR.principal.el, '--line', on ? '0px' : '');
  }
  // the reading screen's box laid square on its glass while it is read (READ_GLASS), on its quad at rest: its quad leans
  // 4 px (its right side, at the foot), and that perspective makes the browser resample it: close up, the letters went
  // soft (measured: twice as sharp square). Set as it locks and back at the framing, where 4 px hardly show.
  function readSquare(on) {
    const s = SCR.principal,
      [x0, y0, x1, y1] = READ_GLASS;
    project(
      s.el,
      s.w,
      s.h,
      on
        ? [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
          ]
        : s.z.quad,
    );
  }
  // the reading screen's scale on this screen, close up: its canvas is drawn at it (sharp up close)
  const readScale = () => Math.min(8, readPose(innerWidth, innerHeight).s * devicePixelRatio);
  // a screen's canvas at k pixels per screen unit (CANVAS_SCALE at the framing)
  function screenRes(s, k) {
    const cv = s.c.canvas,
      W = Math.round(s.w * k),
      H = Math.round(s.h * k);
    s.k = k;
    if (cv.width === W && cv.height === H) return;
    cv.width = W;
    cv.height = H;
    s.c.setTransform(k, 0, 0, k, 0, 0);
  }
  // the reading screen: at rest, our name, the code's slots and our logo (drawMain); read (and on the way back), the
  // section (drawRead)
  function drawTower() {
    const s = SCR.principal;
    if (!s) return;
    if (READ.id !== null) drawRead(s, READ.id);
    else if (HACK.t0 !== null) drawHack(s, performance.now() / 1000 - HACK.t0);
    else drawMain(s);
  }
  // Leaving it, the screen switches over, abruptly (a page transition: the screen cuts, the other one comes on): its
  // page collapses as a tube switched off (tubeOff: a line, a dot) while the camera pulls back; back at the framing it
  // comes on again, quickly, on our name and the code's slots (tubeOn with READ_TUBE). Each frame while it does
  // (towerStep, frame); none with reduced motion or without a graphics card (at once). The collapse is quick, 0.22 s
  // to its line, and the camera pulls back only then, so that it is seen close up; the screen comes on again in about
  // a second.
  const READ_TUBE = { heat: 0.3, rise: 0.8, over: 0.01, tail: 0.15, glow: GLOW.mint };
  const READ_COLLAPSE = { line: 0.22, dot: 0.28, fade: 0.9, glow: 1.2 };
  const TOWER = { offAt: null, onAt: null };
  function towerStep() {
    const s = SCR.principal;
    if (!s || (TOWER.offAt === null && TOWER.onAt === null)) return;
    const now = performance.now() / 1000,
      p = READ_TUBE;
    if (TOWER.onAt === null) tubeOff(s, now - TOWER.offAt, READ_COLLAPSE);
    else if (now - TOWER.onAt < p.heat + p.rise + 4 * p.tail) tubeOn(s, now - TOWER.onAt, p);
    else {
      TOWER.onAt = null;
      tubeOn(s, Infinity);
    }
    pageTube();
  }
  // the switch-over called off (read again on the way back, the station switched off): the screen on, at once
  function towerOn() {
    Object.assign(TOWER, { offAt: null, onAt: null });
    if (SCR.principal) {
      tubeOn(SCR.principal, Infinity);
      pageTube();
    }
  }
  // the section's name, and ACQUISITION under it, as the screen acquires it; then its page swept in over them (pageCut:
  // the name only below the scan line, none once the page is in)
  function drawRead(s, id) {
    const { c, w, h } = s,
      title = sectionName(id);
    glass(c, w, h, '#1f2220');
    if (held()) {
      c.fillStyle = 'rgba(0, 0, 0, .16)';
      for (let y = 0; y < h; y += 3 / s.k) c.fillRect(0, y, w, 1 / s.k);
    } // (its lines, 1 px of every 3 of the window, under the text)
    if (READ.swap) return; // (a tab changed: the glass alone under the sweep)
    const cut = PAGE.id === id ? pageCut(s) : 0;
    if (cut >= h) return;
    c.save();
    if (cut > 0) {
      c.beginPath();
      c.rect(0, cut, w, h - cut);
      c.clip();
    }
    c.shadowColor = 'rgba(255,255,255,.2)';
    c.shadowBlur = 2; // (a faint glow: close up, the letters crisp)
    const P = readPose(innerWidth, innerHeight),
      vw = Math.min(w, innerWidth / P.s); // (the glass's width in the window, close up)
    c.font = `700 ${h * 0.19}px ${FONT_TERM}`;
    const size = h * 0.19 * Math.min(1, (vw * 0.8) / c.measureText(title).width);
    txt(c, title, w / 2, h * 0.52, size, WHITE, 'center', 700);
    c.shadowColor = 'rgba(159, 251, 193, .3)';
    c.shadowBlur = 2;
    c.font = `600 ${h * 0.075}px ${FONT_TERM}`;
    txt(
      c,
      T().acquisition,
      w / 2,
      h * 0.7,
      h * 0.075 * Math.min(1, (vw * 0.8) / c.measureText(T().acquisition).width),
      MINT,
      'center',
      600,
    );
    c.restore();
  }
  // the bar's entry of the section read (none coming back): green, and said as the page shown
  function navCurrent() {
    for (const b of $('sections').children) {
      const on = reading() && b.dataset.s === READ.id;
      b.classList.toggle('current', on);
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    }
  }
  // ===================================================================================================================
  // The pages. A section with a page (TXT pages) shows it as text on the glass once close (#st-page): the screen shows the
  // section's name and ACQUISITION as the camera comes, then a scan line sweeps down the glass and the page comes up
  // behind it, the name going under it (a screen signal reveal: short, no glitch); another tab, its name a moment
  // (PAGE_T.hold), then the sweep. Without a move (reduced motion, LITE) it is there at once. Leaving, it goes with its
  // tube, then is gone as the camera pulls back (a page only close up: readApply). A page uses all the space, stands
  // apart from the bar and says precisely what things do: a grid of modules over the window's width, under a header
  // band (the page's header line: where one is, its parts, the link, a clock) and over a foot band; its parts each lead
  // from the header line.
  // ===================================================================================================================
  const PAGE = { id: null, at: null, k: 1, top: 96, bottom: 56, clock: 0 }; // (id: the page shown; at: when its sweep starts, Infinity until the frame after pageShow, null once in; k: the sweep, 0 to 1; top, bottom: its bands, px; clock: its header line's)
  const PAGE_T = { hold: 0.15, swap: 0.06, sweep: 0.45 }; // (hold: the name shown, the first time; swap: the bare glass, a tab changed)
  const pageOf = (id) => T().pages[id];
  const sectionName = (id) => T().menu[MENU_IDS.indexOf(id)][0];
  const two = (n) => String(n).padStart(2, '0');
  // an element, its texts set as text
  function node(tag, cls, text, kids = []) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    e.append(...kids);
    return e;
  }
  // a module's body, piece by piece, each made by its kind (a kind more, one maker more): a paragraph, a list (in two
  // columns: ul2), a small heading, something still to come (its amber chip), the figures' readout (a value, and names
  // under some), the catalogue's families (each with its count, a bar in proportion and its detail)
  const PIECES = {
    p: (t) => node('p', '', t),
    ul: (items) =>
      node(
        'ul',
        '',
        '',
        items.map((t) => node('li', '', t)),
      ),
    ul2: (items) =>
      node(
        'ul',
        'two',
        '',
        items.map((t) => node('li', '', t)),
      ),
    h4: (t) => node('h4', '', t),
    go: (id) => {
      // (a section opened from the page: the sections' bar's button, its name and code)
      const i = MENU_IDS.indexOf(id),
        [title, sub, code] = T().menu[i],
        b = node('button', 'go', '', [
          ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
          node('span', '', title),
          node('small', '', 'CODE ' + code),
        ]);
      b.type = 'button';
      b.dataset.s = id;
      b.setAttribute(
        'aria-label',
        `${title}. ${sub}. CODE ${code}${SECTION_LINKS[id] ? ` (${T().newTab})` : ''}`,
      );
      return b;
    },
    status: (rows) =>
      node(
        'dl',
        'status',
        '',
        rows.map(([k, v, tone], i) =>
          row(i, [node('dt', '', k), node('dd', 'st' + (tone ? ' ' + tone : ''), '', [dec(v)])]),
        ),
      ), // (a state: amber, to come; ready: green)
    stack: (pieces) =>
      node(
        'div',
        'stack',
        '',
        pieces.map(([k, ...a]) => PIECES[k](...a)),
      ), // (pieces one under the other, as a column of their own)
    soon: (t, chip) => node('p', 'soon', '', [node('span', '', t), node('span', 'chip', '', [dec(chip)])]),
    rows: (rows) =>
      node(
        'dl',
        '',
        '',
        rows.map(([k, v, names], i) =>
          row(i, [
            node('dt', '', k),
            node('dd', '', '', [dec(v)]),
            ...(names ? [node('dd', 'names', names)] : []),
          ]),
        ),
      ),
    // the invitation to a place (the community page's: Discord): its mark, a large link, where it leads; a new tab (↗)
    join: (id) => {
      const X = T(),
        { url } = SOCIALS.find((n) => n.id === id),
        name = NETWORKS[id],
        [words, action] = X.socials[id];
      const a = node('a', 'go join', '', [
        ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
        node('span', '', action + ' ↗'),
        node('small', '', url.replace(/^https?:\/\//, '')),
      ]);
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', `${action}: ${name}. ${words} (${X.newTab})`);
      const signal = node('span', 'join-signal', '', [
        ...[0, 1, 2].map((k) => {
          const w = node('i', 'wave');
          w.style.setProperty('--k', k);
          return w;
        }),
        markIcon(id, 'join-mark'),
      ]); // (an incoming call: its waves, CSS)
      return node('div', 'join-box', '', [unread(signal), a]); // (a new tab: its ↗, and said to screen readers; no line under it: not needed)
    },
    // the other places, from SOCIALS (a line more there, a card more here): each its mark, its name, its words
    links: (ids) =>
      node(
        'ul',
        'links',
        '',
        ids.map((id) => {
          const X = T(),
            { url } = SOCIALS.find((n) => n.id === id),
            name = NETWORKS[id],
            [words] = X.socials[id];
          const a = node('a', 'go link', '', [
            ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
            markIcon(id, 'link-mark'),
            node('span', 'link-t', '', [node('b', '', name), node('small', '', words)]),
            node('span', 'link-go', '↗'),
          ]);
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.setAttribute('aria-label', `${name}. ${words} (${X.newTab})`);
          return node('li', '', '', [a]);
        }),
      ),
    // the roadmap as a mission route (its moves: routeRun): its track (a dashed course, lit as it is plotted), its
    // stops in order (a waypoint each: YOU ARE HERE, today, what is there ticked and its state; then each step, its
    // name, its items, each under a redaction bar until declassified), its foot (no date; an idea: Discord)
    route: ({ here: [flag, name, done, state, tone], step, stops, note, links }) => {
      const mark = (cls, label) =>
        node('div', 'stop-mark', '', [
          unread(node('i', 'stop-node')),
          ...(cls === 'here' ? [unread(node('i', 'stop-ping'))] : []),
          node('span', 'stop-k', '', [dec(label)]),
        ]);
      const track = unread(
        node('div', 'route-track', '', [node('i', 'route-beam'), node('i', 'route-head')]),
      );
      const list = node('ol', 'route-stops', '', [
        node('li', 'stop here', '', [
          mark('here', flag),
          node('h4', 'stop-name', '', [dec(name)]),
          node('div', 'stop-body', '', [
            node(
              'ul',
              'stop-done',
              '',
              done.map((t) => node('li', '', t)),
            ),
            node('p', 'pg-state' + (tone ? ' ' + tone : ''), '', [dec(state)]), // (ready: green)
          ]),
        ]),
        ...stops.map(([n, items], i) =>
          node('li', 'stop' + (i ? '' : ' next'), '', [
            mark('', step.replace('{n}', i + 1)),
            node('h4', 'stop-name', '', [dec(n)]),
            node(
              'ul',
              'stop-items',
              '',
              items.map((t) => node('li', '', '', [document.createTextNode(t), unread(node('i', 'redact'))])),
            ),
          ]),
        ),
      ]);
      const btn = node('button', 'go route-btn', '', [
        ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
        node('span'),
      ]);
      btn.type = 'button';
      list.id = 'st-route-stops';
      btn.setAttribute('aria-controls', list.id);
      const route = node('div', 'route', '', [
        node('div', 'route-map', '', [track, list]),
        node('div', 'route-toggle', '', [btn]),
        node('div', 'route-foot', '', [
          node(
            'p',
            '',
            '',
            note.map((t) => node('span', '', t)),
          ),
          PIECES.links(links),
        ]),
      ]);
      route.dataset.decOwn = '';
      routeSet(route, ROUTE.open);
      return route; // (its labels decoded as its stops are reached: routeStop; its details as left, for the visit)
    },
    // the figures on one band (its number, its name, the names under it), the facts good to know (a title, a line),
    // a small note (the rights under a list)
    stats: (items) =>
      node(
        'dl',
        'stats',
        '',
        items.map(([n, k, names], i) =>
          row(i, [
            node('dt', '', k),
            node('dd', 'v', '', [dec(n)]),
            ...(names ? [node('dd', 'names', names)] : []),
          ]),
        ),
      ),
    facts: (items) =>
      node(
        'ul',
        'facts',
        '',
        items.map(([t, p], i) => row(i, [node('strong', '', '', [dec(t)]), node('span', '', p)], 'li')),
      ),
    small: (t) => node('p', 'small-note', t),
    trio: (rows) =>
      node(
        'ul',
        'trio',
        '',
        rows.map(([name, line, go, out], i) =>
          row(
            i,
            [
              node('strong', '', '', [dec(name)]),
              node('span', '', line),
              ...(go ? [PIECES.go(go)] : out ? [outLink(out)] : []),
            ],
            'li',
          ),
        ),
      ), // (the project's pieces: a line each, its section's button, or its place elsewhere: a new tab)
    steps: (items) =>
      node(
        'ol',
        'steps',
        '',
        items.map((it, i) => {
          // (a principle in steps: each its title, what happens, a link to where the page shows it)
          const [title, t, go] = Array.isArray(it) ? it : [null, it];
          return row(
            i,
            [
              node('span', 'n', '', [dec(two(i + 1))]),
              node('div', 't', '', [
                ...(title ? [node('strong', '', '', [dec(title)])] : []),
                node('span', '', t),
                ...(go ? [partLink(...go, 'step-go')] : []),
              ]),
            ],
            'li',
          );
        }),
      ),
    cat: (rows) => {
      const most = Math.max(...rows.map(([, n]) => +n));
      return node(
        'ul',
        'cat',
        '',
        rows.map(([f, n, d], i) => {
          const bar = node('i', 'bar');
          bar.style.setProperty('--w', (n / most).toFixed(3));
          return row(
            i,
            [
              node('span', 'f', f),
              node('span', 'c', '', [dec(n)]),
              bar,
              ...(d ? [node('span', 'd', d)] : []),
            ],
            'li',
          );
        }),
      );
    },
  };
  // a row of a readout or of the catalogue, in its order (--i: its draw waits for the rows above)
  function row(i, kids, tag = 'div') {
    const r = node(tag, tag === 'div' ? 'row' : '', '', kids);
    r.style.setProperty('--i', i);
    return r;
  }
  // the top's capture (beside its words, as large as FIG.k allows, enlarged with a click), where to follow the
  // release, a link to a part of the page (the roadmap, its details shown; the editor, the panel: pageGo)
  function heroPic([file, [W, H], alt, cap], title) {
    const img = node('img');
    img.alt = alt;
    img.decoding = 'async';
    img.draggable = false;
    img.width = W;
    img.height = H;
    img.src = media(file);
    const cell = node('button', 'fig-cell', '', [
      ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
      img,
    ]);
    cell.type = 'button';
    cell.dataset.title = title;
    cell.setAttribute('aria-label', `${T().figZoom}: ${alt}`);
    const pic = node('figure', 'hero-pic', '', [cell, ...(cap ? [node('figcaption', 'fig-cap', cap)] : [])]);
    pic.style.setProperty('--w', Math.round(W * FIG.k) + 'px');
    return pic;
  }
  // meanwhile, where to follow the release (a new tab)
  function followLink([words, id]) {
    const a = node('a', 'part-link', '', [node('span', '', words), node('span', 'arrow', '↗')]);
    a.href = LINKS[id];
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', `${words} (${T().newTab})`);
    return a;
  }
  function partLink(label, part, cls) {
    const b = node('button', 'part-link ' + cls, '', [node('span', '', label), node('span', 'arrow', '↓')]);
    b.type = 'button';
    b.dataset.part = part;
    return b;
  }
  // a place elsewhere (SOCIALS), as a section's button: its name ↗, its words; a new tab
  function outLink(id) {
    const X = T(),
      { url } = SOCIALS.find((n) => n.id === id),
      name = NETWORKS[id],
      [words] = X.socials[id];
    const a = node('a', 'go', '', [
      ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
      node('span', '', name + ' ↗'),
      node('small', '', words),
    ]);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', `${name}. ${words} (${X.newTab})`);
    return a;
  }
  // a module: its corner ticks, its header strip (its title), its body
  function mod(cls, head, body) {
    return node('section', 'mod ' + cls, '', [
      ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'mc ' + c)),
      node('div', 'mod-head', '', head),
      node('div', 'mod-body', '', body),
    ]);
  }
  // the page's blocks, each made by its kind (a kind more, one maker more) into the grid it goes in (at: the opening
  // grid, then each part's): its hero (its kicker and state in its strip; its name, the page's title, focused once
  // there); a module (a title, a width out of 12, tall: over two rows, kind: its look, fig: its illustration, flip: the
  // illustration first, below: under the text, however wide);
  // a part (a heading band, which the header line's links lead to, and a grid of its own: its modules fill its rows)
  const PAGE_BLOCKS = {
    hero: (
      at,
      { kicker, title, note, lead, text, state, tone, status, states, pic, join, follow, more, contact },
    ) => {
      const h = node('h1', '', title);
      h.tabIndex = -1;
      const words = [
        h,
        ...(note ? [node('p', 'hero-note', note)] : []),
        ...(lead ? [node('p', 'pg-lead', lead)] : []),
        node('p', 'pg-text', '', contact ? cardWords(text, contact) : [text]),
        ...(status
          ? [
              node('p', 'hero-status', '', [
                node('span', 'pg-state' + (status[2] ? ' ' + status[2] : ''), '', [dec(status[0])]),
                node('span', '', status[1]),
              ]),
            ]
          : []), // (its state beside its words, with what it means; ready: green)
        ...(states
          ? [
              node(
                'dl',
                'hero-states',
                '',
                states.map(([k, v, t], i) =>
                  row(i, [node('dt', '', k), node('dd', 'pg-state' + (t ? ' ' + t : ''), '', [dec(v)])]),
                ),
              ),
            ]
          : []), // (each piece and its state, ABOUT)
        node('div', 'hero-links', '', [
          ...(follow ? [followLink(follow)] : []),
          ...(more ? [partLink(...more, 'hero-more')] : []),
        ]),
      ];
      const side = pic
        ? heroPic(pic, title)
        : join
          ? node('div', 'hero-join', '', [PIECES.join(join)])
          : null; // (beside its words: its capture, or its invitation)
      at.grid.append(
        mod(
          side ? 'hero w12 with-pic' : states ? 'hero w12' : 'hero w8',
          [
            node('p', 'pg-kicker', '', [dec(kicker)]),
            ...(state ? [node('p', 'pg-state' + (tone ? ' ' + tone : ''), '', [dec(state)])] : []),
          ],
          side ? [node('div', 'hero-words', '', words), side] : words,
        ),
      );
    },
    mod: (
      at,
      { title, w = 4, tall = false, kind = '', h1 = false, fig, flip = false, below = false, body },
    ) => {
      const h = node(h1 ? 'h1' : at.part ? 'h3' : 'h2', '', '', [dec(title)]);
      if (h1) h.tabIndex = -1; // (a page without a hero: this module's title is the page's)
      const pieces = body.map(([k, ...a]) => PIECES[k](...a));
      at.grid.append(
        mod(
          [
            `w${w}`,
            tall ? 'tall' : '',
            kind,
            fig ? 'with-fig' : '',
            flip ? 'flip' : '',
            below ? 'fig-below' : '',
          ]
            .filter(Boolean)
            .join(' '),
          [h],
          fig ? [node('div', 'mod-text', '', pieces), figure(fig, title)] : pieces,
        ),
      );
    },
    part: (at, id, nav, title) => {
      at.part++;
      at.n = 0;
      at.parts.push([id, nav]);
      const h = node('h2', '', '', [dec(title)]),
        n = node('span', 'n', two(at.part)),
        rule = node('i', 'rule');
      h.tabIndex = -1;
      h.id = `st-part-${id}-h`;
      n.setAttribute('aria-hidden', 'true');
      rule.setAttribute('aria-hidden', 'true');
      const sec = node('section', 'part', '', [
        node('div', 'part-head', '', [n, h, rule]),
        (at.grid = node('div', 'grid')),
      ]);
      sec.id = `st-part-${id}`;
      sec.setAttribute('aria-labelledby', h.id);
      at.body.append(sec);
    },
  };
  // a capture explained, so that no space stays empty and the words match the picture exactly: the whole capture (id:
  // its anchor, mod-<id>; file, in the media; size: its pixels), numbered marks on what it shows (each item: its
  // label, its words, its zone in the capture's pixels, framed, its number a tab fixed to its frame: tl above its top
  // left corner, tr above its top right one, l beside its left side, r beside its right one, ir inside its top right
  // corner), beside it the same numbers, a line each: the text says what the picture shows, no more, and fills its side
  // (flip: the picture on the right; wide: a wide one, the larger share for it, its lines under it on a narrower
  // window, in two columns; fit: a narrow one, it and its lines side by side in the middle, as wide as they are; h: its
  // height at most). At FIG.k at most, as the other pictures. A line or a mark pointed at: both lit, its zone framed.
  // A click on the capture: enlarged (figOpen). As its module locks: the capture scans in, then each mark with its
  // line, one after another (CSS)
  PAGE_BLOCKS.anno = (
    at,
    {
      id,
      title,
      w = 12,
      flip = false,
      wide = false,
      fit = false,
      h: maxH,
      file,
      size: [W, H],
      alt,
      lead,
      items,
    },
  ) => {
    const X = T(),
      img = node('img');
    img.alt = alt;
    img.decoding = 'async';
    img.draggable = false;
    img.width = W;
    img.height = H;
    img.src = media(file);
    const cell = node('button', 'fig-cell', '', [
      ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
      img,
    ]);
    cell.type = 'button';
    cell.dataset.title = title;
    cell.setAttribute('aria-label', `${X.figZoom}: ${alt}`);
    const pct = (v, of) => ((100 * v) / of).toFixed(3) + '%';
    const marks = unread(
      node(
        'div',
        'anno-marks',
        '',
        items.map(([, , [x, y, w, h, tab = 'tl']], i) => {
          const m = node('span', 'anno-mark ' + tab, '', [
            node('i', 'anno-zone'),
            node('b', '', String(i + 1)),
          ]);
          m.dataset.n = i;
          m.style.setProperty('--i', i);
          setStyle(m, 'left', pct(x, W));
          setStyle(m, 'top', pct(y, H));
          setStyle(m, 'width', pct(w, W));
          setStyle(m, 'height', pct(h, H));
          return m;
        }),
      ),
    );
    const pic = node('div', 'anno-pic', '', [cell, marks]);
    pic.style.setProperty('--w', Math.round(Math.min(W * FIG.k, maxH ? (maxH * W) / H : Infinity)) + 'px'); // (h: as high as that at most)
    const list = node(
      'ol',
      'anno-list',
      '',
      items.map(([label, words], i) => {
        const li = node('li', '', '', [
          unread(node('b', 'n', String(i + 1))),
          node('span', '', '', [
            node('strong', '', label),
            ...(words ? [document.createTextNode(' — ' + words)] : []),
          ]),
        ]);
        li.dataset.n = i;
        li.style.setProperty('--i', i);
        return li;
      }),
    );
    const h = node(at.part ? 'h3' : 'h2', '', '', [dec(title)]);
    const el = mod(
      `w${w} anno-mod${flip ? ' flip' : ''}${wide ? ' wide' : ''}${fit ? ' fit' : ''}`,
      [h],
      [
        node('div', 'anno-fig', '', [pic]),
        node('div', 'anno-text', '', [...(lead ? [node('p', 'anno-lead', lead)] : []), list]),
      ],
    );
    if (id) {
      el.id = 'st-mod-' + id;
      h.tabIndex = -1;
    } // (its anchor: IN DETAIL's target)
    at.grid.append(el);
  };
  // a line or a mark pointed at (or touched): it and its twin lit, its zone framed; the module's others not
  {
    let hot = null;
    const light = (m, n) => {
      for (const e of m.querySelectorAll('.anno-list li, .anno-mark'))
        e.classList.toggle('hot', e.dataset.n === n);
    };
    const point = (target) => {
      const m = target.closest('.anno-mod'),
        t = target.closest('.anno-list li, .anno-mark b');
      if (hot && hot !== m) light(hot, null);
      hot = m;
      if (m) light(m, t ? t.closest('[data-n]').dataset.n : null);
    };
    $('page-body').addEventListener('pointerover', (e) => {
      if (!ARRIVE.until) point(e.target);
    }); // (IN DETAIL's number lit: kept while the pointer stays still)
    $('page-view').addEventListener(
      'pointermove',
      (e) => {
        if (!ARRIVE.until) return;
        clearTimeout(ARRIVE.timer);
        ARRIVE.until = 0;
        point(e.target);
      },
      { passive: true },
    ); // (its first move: what it points at now)
    $('page-body').addEventListener('pointerleave', () => {
      if (hot) light(hot, null);
      hot = null;
    });
  }
  // The screenshots page's piece (PIECES.shots): the app's captures in its two sides, the viewer panel then the
  // streamer editor (their pictures: the media's captures/, never in the repository: they show the game's
  // items; one not there yet said to be coming). One shown at a time (SHOTS.i, kept for the visit); ◀ ▶, the list, ← → on
  // the page, a swipe on its screen choose another (shotGo): it comes in behind a short scan line, received as a signal
  // (none without a move), its caption follows, screen readers hear which it is.
  // A capture whose file holds {team} comes in the three team colours (SHOT_TEAMS, in the app's order; the one shown:
  // SHOTS.team, kept for the visit): three buttons beside it show it in another, the same way (shotGo), {team} in its
  // texts naming the team shown. Its ENLARGE button, or a click on it, opens it enlarged (zoomOpen).
  const SHOTS = { i: 0, team: 'manticore', rows: [], sides: [] },
    SHOT_DIR = 'captures/',
    SHOT_T = { scan: 0.32, lock: 0.15, blocks: [24, 12, 6, 3] };
  const SHOT_TEAMS = [
    ['lonestar', 'Lonestar'],
    ['valkyra', 'Valkyra'],
    ['manticore', 'Manticore'],
  ];
  const shotTeamed = ([file]) => file.includes('{team}');
  // a capture's picture, caption and picture's text in the team shown (a caption alone: the picture's text too, then
  // heard once, from the picture), and all its pictures (to fetch them ahead)
  const shotPic = ([file, , cap, alt = cap]) => {
    const [id, name] = SHOT_TEAMS.find(([t]) => t === SHOTS.team);
    return [
      file.replace('{team}', id),
      cap.replaceAll('{team}', name),
      alt.replaceAll('{team}', name),
      alt === cap,
    ];
  };
  const shotCount = (i) => `${SHOTS.sides[i]} · ${two(i + 1)} / ${two(SHOTS.rows.length)}`; // (the screen's corner: the side shown, then which capture)
  // a button of the screenshots (the bar's family: its corner ticks; its text, if any), and an element screen readers
  // skip
  const shotBtn = (cls, label, text = '') => {
    const b = node('button', 'shot-btn ' + cls, '', [
      ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
      ...(text ? [node('span', '', text)] : []),
    ]);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    return b;
  };
  const unread = (e) => {
    e.setAttribute('aria-hidden', 'true');
    return e;
  };
  const shotFiles = ([file]) =>
    file.includes('{team}') ? SHOT_TEAMS.map(([t]) => file.replace('{team}', t)) : [file];
  // the captures of a side at one scale: its largest known (SHOTS.boxes, by side, read as each picture loads) fits its
  // screen, and each of its pictures is drawn at that scale, so that the panel keeps its size and place from one capture
  // to the next (the captures: the viewer panel at one size, centred alike, the item card standing out of it; the
  // editor's views wider). A scale for each side: the editor's width would shrink the viewer panel
  SHOTS.boxes = new Map();
  SHOTS.sideOf = new Map();
  const shotSide = (img) =>
    SHOTS.sideOf.get((img.currentSrc || img.src).split('/').pop().replace('.game.webp', '.webp')); // (by its name in the texts)
  const SHOT_PHONE = matchMedia('(max-width: 700px)');
  const SHOT_RO = new ResizeObserver(() => shotFitAll());
  function shotSeen(img) {
    // (a capture's size known: its side's box grows, the screens fit again)
    const w = img.naturalWidth,
      h = img.naturalHeight,
      side = shotSide(img);
    if (side === undefined) return; // (not a capture)
    const [bw, bh] = SHOTS.boxes.get(side) || [0, 0];
    if (w && (w > bw || h > bh)) {
      SHOTS.boxes.set(side, [Math.max(bw, w), Math.max(bh, h)]);
      shotFitAll();
    }
  }
  function shotFit(screen) {
    const img = screen?.querySelector('img');
    if (!img?.naturalWidth) return;
    const [bw, bh] = SHOTS.boxes.get(shotSide(img)) || [img.naturalWidth, img.naturalHeight];
    const phone = SHOT_PHONE.matches,
      zoom = screen === ZOOM.pic;
    if (zoom && !ZOOM.el.open) return; // (closed meanwhile: fitted again as it opens)
    const room = zoom && !phone && getComputedStyle(img); // (enlarged: the window less what is round it, as the CSS says: .zoom-img)
    const tall =
      room && Math.min(parseFloat(room.maxHeight), screen.closest('.zoom-stage').clientHeight - 18); // (a title on two lines: the stage's own room, less its frame's 2 × 9 px)
    const k = zoom
      ? phone
        ? 1
        : Math.min(1, parseFloat(room.maxWidth) / bw, tall / bh)
      : Math.min(
          1,
          (screen.clientWidth - (phone ? 16 : 152)) / bw,
          phone ? Infinity : (screen.clientHeight - 60) / bh,
        ); // (its top bar's room and a margin: 40 + 12 + 8 px; on its sides, ◀ ▶ and 8 px: 2 × (24 + 44 + 8))
    setStyle(img, 'width', (img.naturalWidth * k).toFixed(1) + 'px');
    if (!zoom) setStyle(screen, 'height', phone ? (bh * k + 88).toFixed(1) + 'px' : ''); // (a phone: as tall as the largest, its 44 px above and below)
  }
  function shotFitAll() {
    shotFit($('page-body').querySelector('.shot-screen'));
    if (ZOOM.el?.open) shotFit(ZOOM.pic);
  }
  PIECES.shots = (groups) => {
    const rows = groups.flatMap(([, , g]) => g);
    SHOT_RO.disconnect();
    if (ZOOM.el) SHOT_RO.observe(ZOOM.el);
    SHOTS.rows = rows;
    SHOTS.sides = groups.flatMap(([side, , g]) => g.map(() => side));
    SHOTS.parts = groups.flatMap(([, , g, part]) => g.map(() => part));
    SHOTS.i = Math.min(SHOTS.i, rows.length - 1);
    groups.forEach(([, , g], gi) =>
      g.forEach((r) => {
        for (const file of shotFiles(r)) SHOTS.sideOf.set(file, gi);
      }),
    ); // (a picture's side, by its group's place: its scale, the same in either language)
    const X = T(),
      i = SHOTS.i,
      [, title] = rows[i],
      [file, cap, alt, same] = shotPic(rows[i]);
    const img = node('img', 'shot-img');
    img.alt = alt;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('error', () => img.parentNode?.classList.add('pending')); // (its picture not there yet)
    img.addEventListener('load', () => {
      img.parentNode?.classList.remove('pending');
      shotSeen(img);
      shotFit(img.parentNode);
    });
    img.src = media(SHOT_DIR + file);
    const screen = node('div', 'shot-screen', '', [
      img,
      unread(node('p', 'shot-pending', '', [dec(X.shotPending)])),
      unread(node('i', 'shot-scan')),
      unread(node('p', 'shot-count', '', [dec(shotCount(i))])),
      ...(X.shotLang ? [unread(node('p', 'shot-lang', X.shotLang))] : []), // (the captures' language, where it is not the page's)
      shotBtn('zoom', X.shotZoom, X.shotZoomShort),
      shotBtn('prev', X.shotPrev),
      shotBtn('next', X.shotNext),
    ]);
    SHOT_RO.observe(screen);
    let j = 0;
    const list = node(
      'div',
      'shot-index',
      '',
      groups.flatMap(([label, sub, g], k) => {
        const h = node('h3', 'shot-group', '', [dec(label)]);
        h.id = 'st-shot-group-' + k;
        const head = node('div', 'shot-group-head', '', [h, node('p', 'shot-group-sub', '', [dec(sub)])]);
        const ol = node(
          'ol',
          'shot-list',
          '',
          g.map(([, t]) => {
            const b = node('button', '', '', [node('span', 'n', two(j + 1)), dec(t)]);
            b.type = 'button';
            b.dataset.i = j;
            if (j++ === i) b.setAttribute('aria-current', 'true');
            return node('li', '', '', [b]);
          }),
        );
        ol.start = j - g.length + 1;
        ol.setAttribute('aria-labelledby', h.id);
        return [head, ol];
      }),
    );
    const live = node('p', 'sr shot-live');
    live.setAttribute('aria-live', 'polite');
    const teamsK = node('p', 'shot-teams-k', '', [dec(X.shotTeams)]);
    teamsK.id = 'st-shot-teams-k';
    const teams = node('div', 'shot-box shot-teams', '', [
      teamsK,
      node(
        'div',
        'shot-teams-row',
        '',
        SHOT_TEAMS.map(([t, name]) => {
          const b = node('button', 'shot-team', name);
          b.type = 'button';
          b.dataset.team = t;
          b.setAttribute('aria-pressed', String(t === SHOTS.team));
          return b;
        }),
      ),
    ]);
    teams.setAttribute('role', 'group');
    teams.setAttribute('aria-labelledby', teamsK.id);
    teams.classList.toggle('off', !shotTeamed(rows[i]));
    const more = node('div', 'shot-box shot-more', '', [
      node('p', 'shot-teams-k', '', [dec(X.shotMore)]),
      shotMoreBtn(i),
    ]);
    more.classList.toggle('off', shotTeamed(rows[i]));
    const desc = node('p', 'shot-desc', cap);
    if (same) unread(desc);
    const root = node('div', 'shots', '', [
      node('figure', 'shot-view', '', [screen]),
      node('div', 'shot-side', '', [
        node('p', 'shot-kicker', '', [dec(SHOTS.sides[i])]),
        node('h2', 'shot-title', '', [dec(title)]),
        desc,
        teams,
        more,
        list,
        live,
      ]),
    ]);
    return root;
  };
  // IN DETAIL's button: the EXTENSION page, at the module that explains the capture shown (SHOT_MORE: its anchor, and
  // the number it is about, if one; else its part), opened there (PAGE.next)
  const SHOT_MORE = {
    '01-viewer-panel-{team}.webp': ['panel'],
    '02-backpack.webp': ['panel', 7],
    '03-gear-vehicles.webp': ['panel', 9],
    '04-item-card.webp': ['cards'],
    '05-classes.webp': ['classes'],
    '06-streamer-editor.webp': ['editor'],
    '07-item-picker.webp': ['picker'],
    '08-backpack-editing.webp': ['backpack', 3],
  };
  function shotMoreBtn(i) {
    const b = node('button', 'shot-more-btn', '', [node('span'), node('span', 'arrow', '→')]);
    b.type = 'button';
    shotMoreSet(b, i);
    return b;
  }
  // (set in place for another capture: a button kept keeps the focus)
  function shotMoreSet(b, i) {
    const X = T(),
      [target, mark] = SHOT_MORE[SHOTS.rows[i][0]] || [SHOTS.parts[i]],
      page = sectionName('extension'),
      blocks = X.pages.extension;
    const nav =
      blocks.find(([k, o]) => k === 'anno' && o.id === target)?.[1].title ||
      blocks.find(([k, id]) => k === 'part' && id === target)?.[2] ||
      '';
    b.firstChild.textContent = `${page} › ${nav}`;
    b.dataset.part = target;
    if (mark) b.dataset.mark = mark;
    else delete b.dataset.mark;
    b.setAttribute('aria-label', X.shotMoreSay.replace('{page}', page).replace('{part}', nav));
  }
  // another capture, or the same in another team's colours: decoded first (no blank between), then in, its caption, its
  // entry in the list, its team's button, said
  async function shotGo(i, team = SHOTS.team) {
    const root = $('page-body').querySelector('.shots'),
      rows = SHOTS.rows;
    if (!root || !rows.length) return;
    i = (i + rows.length) % rows.length;
    const recolour = i === SHOTS.i;
    if (recolour && (team === SHOTS.team || !shotTeamed(rows[i]))) return;
    SHOTS.i = i;
    SHOTS.team = team;
    const [file, cap, alt, same] = shotPic(rows[i]),
      title = rows[i][1],
      next = new Image();
    next.src = media(SHOT_DIR + file);
    try {
      await next.decode();
    } catch {}
    const stale = () => SHOTS.i !== i || SHOTS.team !== team || !root.isConnected; // (another one asked meanwhile, or the page gone)
    if (stale()) return;
    const img = root.querySelector('.shot-img'),
      teams = root.querySelector('.shot-teams'),
      X = T(),
      zoom = ZOOM.el?.open;
    const screen = zoom ? ZOOM.pic : img.parentNode,
      pic = zoom ? ZOOM.img : img; // (where it comes in: enlarged, when open)
    if (!reduce && !LITE) screen.classList.add('signal'); // (hidden until its signal: not a frame of it before)
    img.src = next.src;
    img.alt = alt;
    if (zoom) zoomFill();
    root.querySelector('.shot-count').textContent = shotCount(i);
    root.querySelector('.shot-kicker').textContent = SHOTS.sides[i];
    const desc = root.querySelector('.shot-desc');
    root.querySelector('.shot-title').textContent = title;
    desc.textContent = cap;
    if (same) desc.setAttribute('aria-hidden', 'true');
    else desc.removeAttribute('aria-hidden');
    for (const b of root.querySelectorAll('.shot-list button')) {
      if (+b.dataset.i === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    }
    const more = root.querySelector('.shot-more'),
      teamed = shotTeamed(rows[i]),
      at = document.activeElement;
    const out = teamed ? more : teams,
      leaving = !out.classList.contains('off') && out.contains(at); // (the focus in the box going out)
    teams.classList.toggle('off', !teamed);
    more.classList.toggle('off', teamed);
    shotMoreSet(more.querySelector('.shot-more-btn'), i);
    if (leaving)
      (teamed
        ? teams.querySelector(`.shot-team[data-team="${team}"]`)
        : more.querySelector('.shot-more-btn')
      )?.focus({ preventScroll: true }); // (to the one coming in)
    for (const b of teams.querySelectorAll('.shot-team'))
      b.setAttribute('aria-pressed', String(b.dataset.team === team));
    const say = recolour
      ? X.shotTeamSay.replace('{title}', title).replace('{team}', SHOT_TEAMS.find(([t]) => t === team)[1])
      : X.shotSay
          .replace('{n}', i + 1)
          .replace('{t}', rows.length)
          .replace('{side}', SHOTS.sides[i])
          .replace('{title}', title);
    root.querySelector('.shot-live').textContent = say;
    if (zoom) ZOOM.live.textContent = say;
    try {
      await pic.decode();
    } catch {} // (laid out at its own size before its signal measures it)
    shotSeen(pic);
    shotFit(screen);
    if (stale()) return;
    shotScan(screen);
  }
  // a capture coming in: from the top, behind a short scan line, received as a signal (shotSignal; none without a move);
  // after delay s (the module locking)
  function shotScan(screen, delay = 0) {
    if (reduce || LITE) {
      screen.classList.remove('signal');
      return;
    } // (motion reduced since its signal was asked for: the picture at once)
    const img = screen.querySelector('img'),
      ease = 'cubic-bezier(.3, .6, .4, 1)',
      d = SHOT_T.scan * 1000,
      h = screen.clientHeight + 40,
      t = { duration: d, easing: ease, delay: delay * 1000, fill: 'backwards' };
    const clip = [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }];
    img.animate(clip, t);
    shotSignal(screen, img, delay)?.animate(clip, t);
    screen.querySelector('.shot-scan').animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 1, transform: `translateY(${h * 0.9}px)`, offset: 0.9 },
        { opacity: 0, transform: `translateY(${h}px)` },
      ],
      t,
    );
  }
  // the capture as a signal received: over the picture (hidden meanwhile), drawn in blocks that grow finer, one size a
  // step (SHOT_T.blocks, over the scan's time), then gone, the picture sharp under it; none for a picture not there yet.
  // Returns its canvas (for the scan's clip)
  function shotSignal(screen, img, delay) {
    screen.querySelector('.shot-signal')?.remove();
    const w = img.clientWidth,
      h = img.clientHeight;
    if (!img.naturalWidth || !w || !h) {
      screen.classList.remove('signal');
      return null;
    }
    const k = Math.min(2, devicePixelRatio || 1),
      cv = node('canvas', 'shot-signal'),
      c = cv.getContext('2d');
    const small = document.createElement('canvas'),
      sc = small.getContext('2d');
    cv.width = Math.round(w * k);
    cv.height = Math.round(h * k);
    cv.setAttribute('aria-hidden', 'true');
    setStyle(cv, 'left', img.offsetLeft + 'px');
    setStyle(cv, 'top', img.offsetTop + 'px');
    setStyle(cv, 'width', w + 'px');
    setStyle(cv, 'height', h + 'px');
    const draw = (b) => {
      // (the picture b px a block: drawn small, then enlarged without smoothing)
      small.width = Math.max(1, Math.round(w / b));
      small.height = Math.max(1, Math.round(h / b));
      sc.drawImage(img, 0, 0, small.width, small.height);
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, cv.width, cv.height);
      c.drawImage(small, 0, 0, cv.width, cv.height);
    };
    const steps = SHOT_T.blocks,
      step = (SHOT_T.scan * 1000) / steps.length,
      t0 = performance.now() + delay * 1000;
    draw(steps[0]);
    img.after(cv);
    screen.classList.add('signal');
    let last = 0;
    const tick = (now) => {
      const i = Math.max(0, Math.floor((now - t0) / step));
      if (i >= steps.length || !cv.isConnected) {
        cv.remove();
        if (!screen.querySelector('.shot-signal')) screen.classList.remove('signal');
        return;
      }
      if (i !== last) {
        draw(steps[i]);
        last = i;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return cv;
  }
  {
    const body = $('page-body');
    let touch = null;
    let swiped = 0;
    body.addEventListener('click', (e) => {
      const b = e.target.closest('.shot-btn, .shot-list button, .shot-team, .shot-more-btn');
      if (!b) {
        if (e.target.closest('.shot-img') && performance.now() - swiped > 400) zoomOpen();
        return;
      } // (a click on the capture: enlarged)
      if (b.classList.contains('zoom')) return zoomOpen();
      if (b.dataset.part) {
        PAGE.next = [b.dataset.part, +b.dataset.mark || 0];
        return openSection('extension');
      } // (IN DETAIL)
      if (b.dataset.team) return shotGo(SHOTS.i, b.dataset.team);
      shotGo(
        b.classList.contains('prev')
          ? SHOTS.i - 1
          : b.classList.contains('next')
            ? SHOTS.i + 1
            : +b.dataset.i,
      );
    });
    body.addEventListener('unitlock', (e) => {
      const r = e.target.querySelector('.shot-screen');
      if (r) shotScan(r, SHOT_T.lock);
    }); // (in as its module locks)
    body.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && e.target.closest('.shot-screen') && !e.target.closest('.shot-btn'))
        touch = [e.clientX, e.clientY];
    });
    body.addEventListener('pointerup', (e) => {
      if (!touch) return;
      const dx = e.clientX - touch[0],
        dy = e.clientY - touch[1];
      touch = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        swiped = performance.now();
        shotGo(SHOTS.i + (dx < 0 ? 1 : -1));
      }
    });
    body.addEventListener('pointercancel', () => {
      touch = null;
    });
    $('page-view').addEventListener('keydown', (e) => {
      // (← →: the captures, wherever the focus is in the page)
      if (
        (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        !body.querySelector('.shots')
      )
        return;
      e.preventDefault();
      shotGo(SHOTS.i + (e.key === 'ArrowRight' ? 1 : -1));
    });
  }
  // The route's moves, as its module locks (none without a move: all there at once). The beam plots the
  // course at one pace (ROUTE.px a second), its bright head ahead of it (routePlot); each stop locks as the beam reaches
  // it (routeStop: its waypoint closes in, YOU ARE HERE pings a few times, the next step's square blinks amber as the
  // standby's, its labels decode, the route's own: data-dec-own, its items come out from under their bars, one after
  // another). Across (a wide page), the whole course in one run, ROUTE.min to ROUTE.max s; down (narrower, the route
  // turned: ROUTE_DOWN), longer than the window, the course plotted to each stop as it scrolls into view (the stops above
  // it first, if skipped), each waiting till then (.wait)
  const ROUTE = {
    start: 0.3,
    px: 1000,
    min: 1,
    max: 1.7,
    node: 0.36,
    wipe: 0.34,
    item: 0.07,
    after: 0.12,
    io: null,
    open: false,
  }; // (open: its details shown, kept for the visit: routeSet)
  const ROUTE_DOWN = matchMedia('(max-width: 1099px)');
  function routeRun(route) {
    ROUTE.io?.disconnect();
    ROUTE.io = null;
    if (reduce || LITE) return;
    const track = route.querySelector('.route-track'),
      stops = [...route.querySelectorAll('.stop')],
      down = ROUTE_DOWN.matches;
    const tr = track.getBoundingClientRect(),
      len = down ? tr.height : tr.width;
    if (!len) return;
    const at = stops.map((s) => {
      const r = s.querySelector('.stop-node').getBoundingClientRect();
      return Math.max(0, down ? r.top + r.height / 2 - tr.top : r.left + r.width / 2 - tr.left) / len;
    }); // (each stop's place along the course, 0 to 1)
    const now = performance.now() / 1000;
    if (!down) {
      const dur = Math.min(ROUTE.max, Math.max(ROUTE.min, len / ROUTE.px));
      routePlot(track, 0, 1, dur, ROUTE.start, false, len);
      stops.forEach((s, i) => routeStop(s, now, ROUTE.start + dur * at[i]));
      return;
    }
    let done = 0,
      last = -1; // (last: the stop the course was plotted to; its place measured anew at each step)
    for (const s of stops) s.classList.add('wait');
    track.querySelector('.route-beam').style.clipPath = 'inset(0 0 100% 0)';
    const reach = (k) => {
      const tr = track.getBoundingClientRect(),
        len = tr.height,
        at = stops.map((s) => {
          const r = s.querySelector('.stop-node').getBoundingClientRect();
          return Math.max(0, r.top + r.height / 2 - tr.top) / len;
        });
      const from = last < 0 ? 0 : at[last],
        t0 = performance.now() / 1000,
        to = k === stops.length - 1 ? 1 : at[k],
        dur = Math.max(0.25, Math.min(ROUTE.max, ((to - from) * len) / ROUTE.px));
      routePlot(track, from, to, dur, 0, true, len);
      for (; done <= k; done++) routeStop(stops[done], t0, (dur * (at[done] - from)) / (to - from || 1));
      last = k;
      if (done === stops.length) {
        ROUTE.io.disconnect();
        ROUTE.io = null;
      }
    };
    ROUTE.io = new IntersectionObserver(
      (es, io) => {
        if (io !== ROUTE.io) return; // (entries queued before it was let go: the route turned, motion reduced, another run)
        const k = Math.max(-1, ...es.filter((e) => e.isIntersecting).map((e) => stops.indexOf(e.target)));
        if (k >= done) reach(k);
      },
      { root: $('page-view'), rootMargin: '0px 0px -15% 0px' },
    );
    for (const s of stops) ROUTE.io.observe(s);
  }
  // the course plotted from a to b (0 to 1 along it) in dur s, after delay s: the mint course uncovered, its head ahead
  function routePlot(track, a, b, dur, delay, down, len) {
    const clip = (k) =>
      down ? `inset(0 0 ${(100 - k * 100).toFixed(2)}% 0)` : `inset(0 ${(100 - k * 100).toFixed(2)}% 0 0)`;
    const go = (k) =>
      down ? `translate(0, ${(k * len).toFixed(1)}px)` : `translate(${(k * len).toFixed(1)}px, 0)`;
    const t = { duration: dur * 1000, delay: delay * 1000, easing: 'linear', fill: 'backwards' },
      beam = track.querySelector('.route-beam');
    beam.style.clipPath = clip(b);
    beam.animate([{ clipPath: clip(a) }, { clipPath: clip(b) }], t);
    track.querySelector('.route-head').animate(
      [
        { opacity: 1, transform: go(a) },
        { opacity: 1, offset: 0.9 },
        { opacity: 0, transform: go(b) },
      ],
      t,
    );
  }
  // the route's details shown or hidden (its stops' lists; its button's words), kept for the visit; shown with a click:
  // declassified, stop after stop
  function routeSet(route, open, anim = false) {
    const b = route.querySelector('.route-btn'),
      X = T();
    route.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    b.querySelector('span').textContent = open ? X.routeHide : X.routeShow;
    ROUTE.open = open;
    if (!open || !anim || reduce || LITE) return;
    let k = 0; // (the stops the plot still has to reach, and the bars it still declassifies, left to it)
    for (const stop of route.querySelectorAll('.stop:not(.wait)')) {
      const bars = [...stop.querySelectorAll('.redact')].filter((bar) => !bar.getAnimations().length);
      if (!bars.length) continue;
      bars.forEach((bar, j) =>
        bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
          duration: ROUTE.wipe * 1000,
          delay: (0.08 + k * 0.12 + j * ROUTE.item) * 1000,
          easing: 'cubic-bezier(.6, 0, .3, 1)',
          fill: 'backwards',
        }),
      );
      k++;
    }
  }
  $('page-body').addEventListener('click', (e) => {
    const b = e.target.closest('.route-btn');
    if (b) routeSet(b.closest('.route'), b.getAttribute('aria-expanded') !== 'true', true);
  });
  // a stop reached in t s (now: the time it counts from)
  function routeStop(stop, now, t) {
    const nodeEl = stop.querySelector('.stop-node'),
      ms = (x) => x * 1000,
      ping = stop.querySelector('.stop-ping');
    stop.classList.remove('wait');
    nodeEl.animate(
      [
        { opacity: 0, transform: 'rotate(45deg) scale(2.6)', borderColor: '#69d58c' },
        { opacity: 1, offset: 0.4 },
        { transform: 'rotate(45deg) scale(1)', borderColor: '#69d58c', offset: 0.7 },
        {},
      ],
      { duration: ms(ROUTE.node), delay: ms(t), easing: 'cubic-bezier(.25, 1.5, .55, 1)', fill: 'backwards' },
    );
    if (ping)
      ping.animate(
        [
          { opacity: 0.85, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(3.4)' },
        ],
        { duration: 1100, delay: ms(t + ROUTE.node), iterations: 3, easing: 'ease-out' },
      );
    if (stop.classList.contains('next'))
      nodeEl.animate(
        [
          { opacity: 1, easing: 'steps(1, end)' },
          { opacity: 0.15, offset: 0.5, easing: 'steps(1, end)' },
          { opacity: 1 },
        ],
        { duration: 900, delay: ms(t + ROUTE.node), iterations: 4 },
      );
    stop.querySelectorAll('.dec').forEach((d, j) => decStart(d, now + t + ROUTE.after + j * 0.08));
    stop.querySelectorAll('.redact').forEach((bar, j) =>
      bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
        duration: ms(ROUTE.wipe),
        delay: ms(t + ROUTE.node * 0.6 + j * ROUTE.item),
        easing: 'cubic-bezier(.6, 0, .3, 1)',
        fill: 'backwards',
      }),
    );
  }
  $('page-body').addEventListener('unitlock', (e) => {
    const r = e.target.querySelector('.route');
    if (r) routeRun(r);
  });
  // the stops still waiting shown, the course whole (the route turned meanwhile; motion reduced: pageStill)
  function routeWhole() {
    if (!ROUTE.io) return;
    ROUTE.io.disconnect();
    ROUTE.io = null;
    const r = $('page-body').querySelector('.route');
    if (!r) return;
    r.querySelector('.route-beam').style.clipPath = '';
    for (const s of r.querySelectorAll('.stop.wait')) s.classList.remove('wait');
  }
  ROUTE_DOWN.addEventListener('change', routeWhole);
  // A module's illustration (fig): crops of the captures (the media's illustrations/, never in the repository: they show
  // the game's items), one picture or several (a row: side by side), all at one scale, FIG.k (the captures were made
  // with their text as large: then it stays as large on the whole page), less if the figure needs it (its width,
  // FIG.maxH high), never enlarged (a picture given its width: drawn at it). Each opens enlarged with a click (the
  // screenshots' window, for one picture). As its module locks, each comes in behind a scan line.
  const FIG = { dir: 'illustrations/', gap: 10, k: 0.75, maxH: 640 }; // (k: the scale of every picture, at most: the captures' text the same size from one to the next)
  const FIG_RO = new ResizeObserver((es) => {
    for (const e of es) figFit(e.target);
  });
  function figure(items, title) {
    let j = 0;
    const rows = items.map((it) => (Array.isArray(it[0]) ? it : [it]));
    const el = node(
      'div',
      'fig',
      '',
      rows.map((row) =>
        node(
          'div',
          'fig-row',
          '',
          row.map(([file, alt, width]) => {
            const img = node('img');
            img.alt = alt;
            img.decoding = 'async';
            img.draggable = false;
            if (width) img.dataset.w = width;
            img.addEventListener('load', () => figFit(el));
            img.src = media(FIG.dir + file);
            const b = node('button', 'fig-cell', '', [
              ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
              img,
            ]);
            b.type = 'button';
            b.dataset.title = title;
            b.style.setProperty('--i', j++);
            b.setAttribute('aria-label', `${T().figZoom}: ${alt}`);
            return b;
          }),
        ),
      ),
    );
    FIG_RO.observe(el);
    return el;
  }
  // its pictures at one scale: the widest row fits the figure, the whole FIG.maxH high at most
  function figFit(el) {
    const rows = [...el.querySelectorAll('.fig-row')].map((r) => [...r.querySelectorAll('img')]);
    if (rows.flat().some((im) => !im.naturalWidth)) return; // (all known first)
    const free = (im) => !im.dataset.w,
      wOf = (r) => r.reduce((a, im) => a + (free(im) ? im.naturalWidth : 0), 0),
      hOf = (r) => Math.max(0, ...r.filter(free).map((im) => im.naturalHeight));
    const W = Math.max(1, ...rows.map((r) => wOf(r) + FIG.gap * (r.length - 1))),
      H = rows.reduce((a, r) => a + hOf(r), 0) + FIG.gap * (rows.length - 1);
    const k = Math.min(FIG.k, el.clientWidth / W, H ? FIG.maxH / H : 1);
    for (const im of rows.flat())
      setStyle(im, 'width', (free(im) ? im.naturalWidth * k : +im.dataset.w).toFixed(1) + 'px');
  }
  // one picture enlarged (an illustration): the screenshots' window, without its arrows
  function figOpen(cell) {
    const img = cell.querySelector('img');
    if (!ZOOM.el) zoomBuild();
    ZOOM.one = { src: img.currentSrc || img.src, alt: img.alt, title: cell.dataset.title };
    ZOOM.opener = cell;
    zoomShow();
  }
  $('page-body').addEventListener('click', (e) => {
    const c = e.target.closest('.fig-cell');
    if (c) figOpen(c);
  });
  // A capture enlarged (rather than a magnifying scope, which gets in the way of reading it): its ENLARGE button, or a
  // click on it, opens it over the whole site (a modal dialog: the rest inert; Escape, its close button or a click
  // beside it closes it, the focus back where it was), at its own size, or the window's if larger; on a phone at its
  // own size, slid round with a finger. In a holo window's frame (zoomShow),
  // it comes in as on the page (shotScan); ◀ ▶ and ← → browse the captures from there too (shotGo keeps both screens).
  const ZOOM = { el: null, pic: null, img: null, live: null, opener: null, one: null, words: [] }; // (one: an illustration, alone)
  function zoomBuild() {
    const d = node('dialog', 'zoom'),
      img = node('img', 'zoom-img'),
      title = node('h2', 'zoom-title'),
      live = node('p', 'sr');
    const pic = node('div', 'zoom-pic', '', [img, unread(node('i', 'shot-scan'))]);
    const frame = node('div', 'zoom-frame', '', [
      ...['tl', 'tr', 'bl', 'br'].map((c) => node('i', 'c ' + c)),
      pic,
      unread(node('p', 'zoom-pending')),
    ]);
    img.decoding = 'async';
    img.draggable = false;
    title.id = 'st-zoom-title';
    live.setAttribute('aria-live', 'polite');
    img.addEventListener('error', () => frame.classList.add('pending')); // (a capture still to come, browsed to)
    img.addEventListener('load', () => {
      frame.classList.remove('pending');
      if (!ZOOM.one) shotSeen(img);
      shotFit(pic);
    });
    d.append(
      node('div', 'zoom-head', '', [
        holoMark(node('canvas', 'zoom-mark'), 36, '#e4e6da'),
        node('div', 'zoom-titles', '', [node('p', 'zoom-kicker'), title]),
        shotBtn('zoom-close', ''),
      ]),
      node('div', 'zoom-stage', '', [frame]),
      shotBtn('prev', ''),
      shotBtn('next', ''),
      node('p', 'zoom-hint'),
      live,
    );
    d.setAttribute('aria-labelledby', title.id);
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b)
        return b.classList.contains('zoom-close')
          ? d.close()
          : ZOOM.one
            ? null
            : shotGo(SHOTS.i + (b.classList.contains('next') ? 1 : -1));
      if (!e.target.closest('.zoom-frame, .zoom-head, .zoom-hint')) d.close(); // (a click beside it)
    });
    d.addEventListener('keydown', (e) => {
      e.stopPropagation(); // (the page's own keys wait, BACK's Escape above all: the dialog's own Escape closes it)
      if (
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        !ZOOM.one &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        shotGo(SHOTS.i + (e.key === 'ArrowRight' ? 1 : -1));
      }
    });
    d.addEventListener('close', () => {
      ZOOM.pic.classList.remove('signal');
      ZOOM.opener?.focus?.();
      ZOOM.opener = null;
    });
    ROOT.append(d);
    SHOT_RO.observe(d);
    Object.assign(ZOOM, { el: d, pic, img, live });
  }
  // its texts and picture: the capture shown, in the language shown
  function zoomFill(fresh = false) {
    const X = T(),
      d = ZOOM.el,
      one = ZOOM.one;
    d.classList.toggle('one', !!one); // (an illustration: no arrows, no browsing)
    let src, alt, kicker, title;
    if (one) {
      ({ src, alt, title } = one);
      kicker = sectionName('extension');
    } else {
      const i = SHOTS.i,
        row = SHOTS.rows[i],
        [file, , a] = shotPic(row);
      src = media(SHOT_DIR + file);
      alt = a;
      kicker = shotCount(i);
      title = row[1];
    }
    ZOOM.words = [
      [d.querySelector('.zoom-kicker'), kicker],
      [d.querySelector('.zoom-title'), title],
    ].map(([el, t], k) => holoLine(el, t, t, 340 + k, fresh)); // (still to decode as it opens, browsed at once)
    if (ZOOM.img.getAttribute('src') !== src) ZOOM.img.src = src;
    ZOOM.img.alt = alt;
    d.querySelector('.zoom-pending').textContent = X.shotPending;
    d.querySelector('.zoom-close').setAttribute('aria-label', X.zoomClose);
    d.querySelector(':scope > .prev').setAttribute('aria-label', X.shotPrev);
    d.querySelector(':scope > .next').setAttribute('aria-label', X.shotNext);
    d.querySelector('.zoom-hint').replaceChildren(
      ...(touchOnly ? X.zoomSwipe : one ? X.zoomKeys.slice(1) : X.zoomKeys).map((l) => node('span', '', l)),
    );
  }
  // shown, filled first: a holo window, unfolding, its heading decoded, the capture coming in by its signal
  // (shotScan); all at once without a move; the focus on its close button
  function zoomShow() {
    const still = reduce || LITE;
    zoomFill(!still);
    if (!still) ZOOM.pic.classList.add('signal');
    ZOOM.el.showModal();
    ZOOM.el.querySelector('.zoom-close').focus();
    if (!still) {
      const words = ZOOM.words;
      holoOpen(ZOOM.el.querySelector('.zoom-frame'), words, 0, () => ZOOM.el.open && ZOOM.words === words);
    }
    ZOOM.img
      .decode()
      .catch(() => {})
      .then(() => {
        if (!ZOOM.one) shotSeen(ZOOM.img);
        shotFit(ZOOM.pic);
        if (ZOOM.el.open) shotScan(ZOOM.pic);
        else ZOOM.pic.classList.remove('signal');
      }); // (fitted once decoded; a capture counted as seen, not an illustration)
  }
  function zoomOpen() {
    const screen = $('page-body').querySelector('.shot-screen');
    if (!screen || screen.classList.contains('pending')) return;
    if (!ZOOM.el) zoomBuild();
    ZOOM.one = null;
    ZOOM.opener = document.activeElement;
    zoomShow();
  }
  // the page of a section, in the language shown (keep: where it was scrolled to, as for a language changed), and its
  // header line
  function pageBuild(id, keep = false) {
    const view = $('page-view'),
      top = keep ? view.scrollTop : 0,
      body = $('page-body'),
      at = { body, grid: node('div', 'grid'), part: 0, n: 0, parts: [] };
    body.replaceChildren(at.grid);
    for (const [kind, ...a] of pageOf(id)) PAGE_BLOCKS[kind](at, ...a);
    view.setAttribute('aria-label', sectionName(id));
    view.scrollTop = top;
    pageHead(id, at.parts);
    pageUnits();
    if (!$('page').hidden) {
      pageSpy();
      pageTops();
    } // (shown: the part read lit, the rebuilt units measured) // (shown: the part read lit; hidden, nothing is laid out yet)
  }
  // the header line: where one is (MAIN MENU › the section), the page's parts (each leads to its part); no link state
  // nor clock (they would be read as real information; the codes stay, they are typed on the keypad)
  function pageHead(id, parts) {
    const X = T(),
      nav = $('page-nav');
    $('page-path').replaceChildren(
      node('span', '', X.menuHead),
      node('span', 'sep', ' › '),
      node('b', '', '', [dec(sectionName(id))]),
    );
    nav.setAttribute('aria-label', X.onPage);
    nav.replaceChildren(
      ...parts.map(([pid, label], i) => {
        const b = node('button', '', '', [node('span', 'n', two(i + 1)), node('span', '', label)]);
        b.type = 'button';
        b.dataset.part = pid;
        return b;
      }),
    );
  }
  $('page-nav').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) pageGo(b.dataset.part);
  });
  $('page-body').addEventListener('click', (e) => {
    const b = e.target.closest('.part-link');
    if (b) pageGo(b.dataset.part);
  }); // (a link to a part of the page)
  $('page-body').addEventListener('click', (e) => {
    const b = e.target.closest('.go[data-s]');
    if (b) openSection(b.dataset.s);
  });
  // a part of the page: scrolled to (smoothly, unless motion is reduced or without a graphics card), its heading focused
  // (the keyboard and screen readers go on from there)
  function pageGo(pid) {
    const sec = $(`part-${pid}`);
    if (!sec) return;
    const rb = sec.querySelector('.route-btn[aria-expanded="false"]');
    if (rb) routeSet(rb.closest('.route'), true); // (the roadmap: its details shown)
    $('page-view').scrollTo({ top: sec.offsetTop - 24, behavior: reduce || LITE ? 'auto' : 'smooth' });
    sec.querySelector('h2').focus({ preventScroll: true });
  }
  // the part being read: its link lit in the header line (the last one once at the foot), at most once a frame
  let spyAsk = 0;
  function pageSpy() {
    spyAsk = 0;
    const view = $('page-view'),
      links = [...$('page-nav').children],
      line = view.scrollTop + view.clientHeight * 0.3;
    let cur = null;
    for (const b of links) {
      const sec = $(`part-${b.dataset.part}`);
      if (sec && sec.offsetTop <= line) cur = b;
    }
    if (view.scrollHeight > view.clientHeight && view.scrollTop + view.clientHeight >= view.scrollHeight - 2)
      cur = links[links.length - 1] ?? null;
    for (const b of links)
      if ((b === cur) !== b.hasAttribute('aria-current')) {
        if (b === cur) b.setAttribute('aria-current', 'location');
        else b.removeAttribute('aria-current');
      }
  }
  $('page-view').addEventListener(
    'scroll',
    () => {
      if (!spyAsk) spyAsk = requestAnimationFrame(pageSpy);
    },
    { passive: true },
  );
  // its room between the bands: on a computer, under the header band (BACK and the sections, 12 + 40 px, then the
  // header line: 96) and above the legal lines; on a phone (the menu out of view), under BACK and above the sections'
  // bar (BANDS); the bands fill the rest
  const PAGE_HEAD = 96,
    PAGE_GAP = 12;
  function pagePlace() {
    const phone = ROOT.classList.contains('menu-off');
    PAGE.top = phone ? BANDS.top : PAGE_HEAD;
    PAGE.bottom = phone ? BANDS.bar : innerHeight - $('legal').getBoundingClientRect().top + PAGE_GAP;
    setStyle($('page-view'), 'top', PAGE.top + 'px');
    setStyle($('page-view'), 'bottom', PAGE.bottom + 'px');
    setStyle($('page-head'), 'height', PAGE.top + 'px');
    setStyle($('page-foot'), 'height', PAGE.bottom + 'px');
  }
  // The page builds itself as it comes (its CSS: .dec, .lock). Its blocks (units: the header line, then each
  // module and part heading band, in order) lock once per showing: as the scan line reaches them (pageReveal, their tops
  // measured once the page is laid out: pageTops), or as they scroll into view after (pageIO); a language changed
  // rebuilds them as they were (seen: on at once). A unit locked: its moves (CSS), and its labels decoded one after
  // another (DEC.gap apart; each over DEC.base + DEC.per a letter, between DEC.min and DEC.max): the real text hidden
  // under a copy (aria-hidden) where the letters already read show, DEC.ahead scrambled ones after them (a figure by
  // figures, a letter by letters, changing DEC.tick times a second, the station's own pace), none beyond. Run from the
  // frame loop (pageStep) only while some decode.
  const DEC = { tick: 20, ahead: 3, base: 0.12, per: 0.016, min: 0.24, max: 0.5, gap: 0.06 };
  const DECS = [],
    UNIT = new WeakMap();
  const DEC_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ',
    DEC_FIGURES = '0123456789';
  const dec = (t) => node('span', 'dec', t); // (a label that decodes)
  PAGE.units = [];
  PAGE.seen = new Set();
  PAGE.anim = false;
  PAGE.head = { el: ROOT.querySelector('#st-page-head .ph-line'), i: -1, on: false, top: 0, bottom: 0 };
  function unitOn(u, still) {
    u.on = true;
    PAGE.seen.add(u.i);
    u.el.classList.add('on');
    if (!still) u.el.classList.add('lock');
  }
  function unitLock(u, now) {
    if (u.on) return;
    unitOn(u, false);
    u.el.dispatchEvent(new Event('unitlock', { bubbles: true })); // (a piece's own move, if it has one)
    let j = 0;
    for (const el of u.el.querySelectorAll('.dec'))
      if (!el.closest('[data-dec-own]')) decStart(el, now + DEC.gap * ++j); // (data-dec-own: a piece that times its own, the route)
  }
  function decStart(el, at) {
    const text = el.textContent;
    if (!text.trim()) return;
    const ov = node('span', 'dec-ov');
    ov.setAttribute('aria-hidden', 'true');
    el.classList.add('decoding');
    el.append(ov);
    DECS.push({
      el,
      ov,
      text,
      at,
      breaks: null,
      dur: Math.min(DEC.max, Math.max(DEC.min, DEC.base + DEC.per * text.length)),
    });
    wake(); // (the frame loop decodes it: pageStep)
  }
  // where a label's real text breaks its lines (the indices that start a line; none on one line), read on its text node
  function decBreaks(tn) {
    const r = document.createRange();
    r.selectNodeContents(tn);
    if (r.getClientRects().length < 2) return [];
    const out = [];
    let top = null;
    for (let i = 0; i < tn.length; i++) {
      r.setStart(tn, i);
      r.setEnd(tn, i + 1);
      const b = r.getBoundingClientRect();
      if (!b.height) continue;
      if (top !== null && b.top > top + b.height / 2) out.push(i);
      if (top === null || b.top > top + b.height / 2) top = b.top;
    }
    return out;
  }
  // the decode's text with its real lines' breaks: the space that ends a line becomes the break (char for char the real
  // text's: each letter where its own is), else (a hyphen) a break before the index that starts the line
  const withBreaks = (s, br) => {
    const c = s.split('');
    for (let j = br.length - 1; j >= 0; j--) {
      const b = br[j];
      if (b > c.length) continue;
      if (c[b - 1] === ' ') c[b - 1] = '\n';
      else c.splice(b, 0, '\n');
    }
    return c.join('');
  };
  const decGlyph = (ch, i, t) =>
    /\d/.test(ch)
      ? DEC_FIGURES[(i * 7 + t * 3) % 10]
      : /\p{L}/u.test(ch)
        ? DEC_LETTERS[(i * 11 + t * 5) % DEC_LETTERS.length]
        : ch;
  function decStep(now) {
    const t = Math.floor(now * DEC.tick);
    for (const d of DECS) if (!d.breaks && d.el.isConnected) d.breaks = decBreaks(d.el.firstChild); // (all the reads first)
    for (let j = DECS.length - 1; j >= 0; j--) {
      const d = DECS[j],
        p = (now - d.at) / d.dur;
      if (p >= 1 || !d.el.isConnected) {
        d.ov.remove();
        d.el.classList.remove('decoding');
        DECS.splice(j, 1);
        continue;
      }
      const n = Math.max(0, Math.floor(p * d.text.length)),
        s =
          p <= 0
            ? ''
            : d.text.slice(0, n) +
              [...d.text.slice(n, n + DEC.ahead)].map((c, i) => decGlyph(c, n + i, t)).join('');
      const shown = d.breaks?.length ? withBreaks(s, d.breaks) : s;
      if (d.ov.textContent !== shown) d.ov.textContent = shown;
    }
  }
  // the page's units, its blocks as built (on at once without a move, or already seen; else watched for coming into view)
  const pageIO = new IntersectionObserver(
    (es) => {
      if (PAGE.id === null || PAGE.at !== null) return; // (while it sweeps, the sweep does it)
      const now = performance.now() / 1000;
      for (const e of es)
        if (e.isIntersecting) {
          const u = UNIT.get(e.target);
          if (u) unitLock(u, now);
          pageIO.unobserve(e.target);
        }
    },
    { root: $('page-view'), rootMargin: '0px 0px -18px 0px' },
  ); // (as soon as it comes out of the view's fading foot: its 18 px)
  function pageUnits() {
    pageIO.disconnect();
    PAGE.units = [...$('page-body').querySelectorAll('.mod, .part-head')].map((el, i) => ({
      el,
      i,
      on: false,
      top: 0,
    }));
    for (const u of PAGE.units) {
      UNIT.set(u.el, u);
      if (!PAGE.anim || PAGE.seen.has(u.i)) unitOn(u, true);
      else pageIO.observe(u.el);
    }
  }
  // their tops in the window, read once laid out (before any of them changes: no reading between writes)
  function pageTops() {
    for (const u of [PAGE.head, ...PAGE.units]) {
      const r = u.el.getBoundingClientRect();
      u.top = r.top;
      u.bottom = r.bottom;
    }
  }
  // the sweep at k: the units it has reached (and in view) lock; at its end, those in view it could not see (the page
  // scrolled meanwhile) lock too, read once
  function pageReveal(k, now) {
    const y = k * innerHeight,
      bottom = innerHeight - PAGE.bottom;
    if (k > 0) unitLock(PAGE.head, now);
    for (const u of PAGE.units)
      if (!u.on && u.top < y && u.top < bottom && u.bottom > PAGE.top) unitLock(u, now); // (one above the view, after IN DETAIL: when it comes into view)
    if (k < 1) return;
    const rest = PAGE.units.filter((u) => !u.on),
      r = rest.map((u) => u.el.getBoundingClientRect());
    rest.forEach((u, i) => {
      if (r[i].top < bottom && r[i].bottom > PAGE.top) unitLock(u, now);
    });
  }
  // IN DETAIL's arrival: its module (or part) at the top, its heading focused (screen readers go on from there), the
  // number it is about lit a moment (ARRIVE_MS)
  const ARRIVE_MS = 3200,
    ARRIVE = { until: 0, timer: 0 };
  function pageArrive(target, mark) {
    const el = $(`mod-${target}`) || $(`part-${target}`),
      view = $('page-view');
    if (!el) return;
    view.scrollTop += el.getBoundingClientRect().top - view.getBoundingClientRect().top - 24;
    el.querySelector('h2, h3').focus({ preventScroll: true });
    if (!mark) return;
    const lit = el.querySelectorAll(`:is(.anno-list li, .anno-mark)[data-n="${mark - 1}"]`);
    for (const e of lit) e.classList.add('hot');
    ARRIVE.until = performance.now() + ARRIVE_MS;
    clearTimeout(ARRIVE.timer);
    ARRIVE.timer = setTimeout(() => {
      if (ARRIVE.until) for (const e of lit) e.classList.remove('hot');
      ARRIVE.until = 0;
    }, ARRIVE_MS); // (out at the end only if the pointer has not moved)
  }
  // shown, its sweep starting delay s after the frame that shows it (none without a move): its units new, its header
  // line to lock again. Arriving, that frame is long (readApply: the console made inert, the page built, laid out and
  // painted: about 60 ms in all with a graphics card, measured) but still (the camera at rest, the name on the glass):
  // the sweep's clock starts at the next one (PAGE.at Infinity until then), none of its steps in it (the screen drawn
  // once, the header line locked after); from a click (another tab), as the frame that paints the page begins, that
  // paint taken from its bare glass (PAGE_T.swap). (Built during the approach, it would stall the camera's move; spread
  // over idle times, only the elements' making would be: their styles, layout and paint come with its first frame.)
  function pageShow(id, delay) {
    const sweep = !reduce && !LITE,
      h = PAGE.head;
    PAGE.anim = sweep;
    PAGE.seen = new Set();
    $('page').classList.toggle('anim', sweep);
    h.on = false;
    h.el.classList.remove('on', 'lock');
    if (!sweep) unitOn(h, true);
    PAGE.id = id;
    pageBuild(id);
    pagePlace();
    $('page').hidden = false;
    if (PAGE.next) {
      const [target, mark] = PAGE.next;
      PAGE.next = null;
      pageArrive(target, mark);
    } // (IN DETAIL: opened at its part)
    pageTube();
    pageSpy();
    pageTops();
    if ($('page-body').querySelector('.shots'))
      for (const row of SHOTS.rows)
        for (const f of shotFiles(row)) {
          const im = new Image();
          im.onload = () => shotSeen(im);
          im.src = media(SHOT_DIR + f);
        } // (the screenshots page: the other captures fetched ahead)
    PAGE.at = sweep ? Infinity : null;
    pageSweep(sweep ? 0 : 1);
    if (sweep)
      requestAnimationFrame((t) => {
        if (PAGE.id === id && PAGE.at === Infinity) PAGE.at = t / 1000 + delay;
      }); // (at the next frame's start; none if it was hidden meanwhile, or another shown)
    drawTower();
    wake();
  }
  // hidden, it lets go of the focus at once (readEnd, in the same call without a move, gives it back to what led there)
  function pageHide() {
    if (PAGE.id === null) return;
    Object.assign(PAGE, { id: null, at: null });
    pageIO.disconnect();
    DECS.length = 0;
    if ($('page').contains(document.activeElement)) document.activeElement.blur();
    $('page-view').scrollTop = 0;
    $('page').hidden = true; // (while it still shows: hidden, a view keeps its scroll, the next page would open where this one was read)
  }
  // motion reduced while a page shows: as if shown without a move (pageShow), at once: its sweep and its labels' decoding
  // over, its units all there and none locked (their moves gone, and not played again once motion is back), the route's
  // waiting stops reached, its pieces' own moves ended (the route's, a capture's signal)
  function pageStill() {
    if (PAGE.id === null || !PAGE.anim) return;
    PAGE.anim = false;
    PAGE.at = null;
    $('page').classList.remove('anim');
    pageIO.disconnect();
    routeWhole();
    for (const u of [PAGE.head, ...PAGE.units]) {
      unitOn(u, true);
      u.el.classList.remove('lock');
    }
    for (const d of DECS) {
      d.ov.remove();
      d.el.classList.remove('decoding');
    }
    DECS.length = 0;
    pageSweep(1);
    drawTower();
    $('page')
      .getAnimations({ subtree: true })
      .forEach((a) => a.cancel());
    $('page')
      .querySelectorAll('.shot-signal')
      .forEach((cv) => cv.remove());
  }
  // the focus once there: the page's title (to read it, and scroll it from the keyboard), else its view
  const pageTitle = () => $('page-body').querySelector('h1') || $('page-view');
  // the sweep at k (0 to 1): the scan line at k of the window's height (the glass), the page shown above it, its bands
  // with it; the line fading over its last tenth, as it leaves the glass
  function pageSweep(k) {
    PAGE.k = k;
    const H = innerHeight,
      y = k * H,
      all = k >= 1;
    setStyle(
      $('page-head'),
      'clipPath',
      all ? 'none' : `inset(0 0 ${Math.max(0, PAGE.top - y).toFixed(1)}px 0)`,
    );
    setStyle(
      $('page-view'),
      'clipPath',
      all ? 'none' : `inset(0 0 ${Math.max(0, H - PAGE.bottom - y).toFixed(1)}px 0)`,
    );
    setStyle(
      $('page-foot'),
      'clipPath',
      all ? 'none' : `inset(0 0 ${Math.min(PAGE.bottom, Math.max(0, H - y)).toFixed(1)}px 0)`,
    );
    setStyle($('page-scan'), 'transform', `translateY(${y.toFixed(1)}px)`);
    setStyle($('page-scan'), 'opacity', (k > 0 && k < 1 ? Math.min(1, (1 - k) / 0.1) : 0).toFixed(3));
  }
  // each frame while it sweeps, or while its labels decode (frame)
  function pageStep() {
    const now = performance.now() / 1000;
    if (PAGE.at !== null && now >= PAGE.at) {
      const k = smoother(seg(now, PAGE.at, PAGE.at + PAGE_T.sweep));
      pageSweep(k);
      pageReveal(k, now);
      if (k >= 1) PAGE.at = null;
      drawTower();
    }
    if (DECS.length) decStep(now); // (the labels decoding)
  }
  // the scan line on the reading screen's canvas (its own px, through the camera close up): the section's name is drawn
  // only below it (drawRead); before the sweep, all of it; once the page is in, none
  function pageCut(s) {
    if (PAGE.at === null) return s.h;
    if (PAGE.k <= 0) return 0;
    const { s: S, ty } = CAM.pose,
      [, gy0, , gy1] = READ_GLASS;
    return ((PAGE.k * innerHeight - ty) / S - gy0) * (s.h / (gy1 - gy0));
  }
  // leaving, the page goes with its tube: the same squeeze, light and fade (its centre is the glass's)
  function pageTube() {
    if (PAGE.id === null || !SCR.principal) return;
    const t = SCR.principal.tube.style,
      p = $('page');
    setStyle(p, 'transform', t.transform);
    setStyle(p, 'opacity', t.opacity);
    setStyle(p, 'filter', t.filter);
  }
  function backTexts() {
    const X = T();
    $('back-txt').textContent = X.back;
    $('back-key').textContent = X.backKey;
    $('back-key').hidden = touchOnly;
    $('back').setAttribute('aria-label', X.backLabel);
  }
  $('back').addEventListener('click', back);
  // a click beside the glass (on its way there, its frame or the console in the dark: the shield) goes back, as in a
  // viewer
  $('shield').addEventListener('click', (e) => {
    if (!reading()) return;
    const { s, tx, ty } = CAM.pose,
      x = (e.clientX - tx) / s,
      y = (e.clientY - ty) / s,
      [x0, y0, x1, y1] = READ_GLASS;
    if (x < x0 || x > x1 || y < y0 || y > y1) back();
  });
  // (pts: its four corners TL TR BR BL, canvas px; lit: its state green, else amber; side: of its tag, below by default;
  // zone: pointed at only; section: the section it opens)
  const POSTS = [
    {
      key: 'screen',
      pts: [
        [1046, 527],
        [1435, 527],
        [1444, 804],
        [1044, 804],
      ],
      lit: () => true,
      section: SCREEN_SECTION,
    }, // (the reading screen)
    {
      key: 'code',
      pts: [
        [1484, 572],
        [1678, 572],
        [1684, 709],
        [1488, 709],
      ],
      lit: () => true,
      side: 'above',
    },
    {
      key: 'keypad',
      pts: [
        [1466.3, 882.3],
        [1612.9, 882.4],
        [1633.6, 1041.5],
        [1481.2, 1041.6],
      ],
      lit: () => true,
      zone: true,
    },
    {
      key: 'phone',
      pts: [
        [1748, 553],
        [1908, 553],
        [1918, 711],
        [1748, 711],
      ],
      lit: () => true,
      side: 'above',
      section: 'discord',
      href: LINKS.discord,
    }, // (the direct line: the invitation)
    {
      key: 'audio',
      pts: [
        [746, 527],
        [927, 527],
        [925, 738],
        [740, 738],
      ],
      lit: () => soundOn,
      zone: true,
    },
  ];
  const postsLive = () => stationUp() && termT >= bootLog().doneAt;
  let menuSel = -1; // the menu's entry wanted (-1: none)
  // a point of a screen's own box (px) on the console (canvas px), through the screen's projection (as project)
  function onScreen(s, x, y) {
    const q = s.z.quad,
      m = mm(
        basis([q[0], q[1], q[3], q[2]]),
        adj(
          basis([
            [0, 0],
            [s.w, 0],
            [0, s.h],
            [s.w, s.h],
          ]),
        ),
      );
    const [u, v, k] = mv(m, [x, y, 1]);
    return [u / k, v / k];
  }
  // and back: a point on the console (canvas px) in a screen's own box (the inverse projection, kept)
  function fromScreen(s, x, y) {
    const q = s.z.quad;
    s.inv ??= adj(
      mm(
        basis([q[0], q[1], q[3], q[2]]),
        adj(
          basis([
            [0, 0],
            [s.w, 0],
            [0, s.h],
            [s.w, s.h],
          ]),
        ),
      ),
    );
    const [u, v, k] = mv(s.inv, [x, y, 1]);
    return [u / k, v / k];
  }
  // The terminal's column (the menu's left frame): where the pointer is, in its rows (TQ); not a post: no target, no
  // focus, it only reads the pointer (the mouse or a pen)
  function termZone(s) {
    const L = topLayout(s.w, s.h),
      pts = [
        [L.pad, L.pad],
        [L.pad + L.lw, L.pad],
        [L.pad + L.lw, L.pad + L.H],
        [L.pad, L.pad + L.H],
      ].map(([x, y]) => onScreen(s, x, y));
    const xs = pts.map((q) => q[0]),
      ys = pts.map((q) => q[1]),
      b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const el = document.createElement('div');
    el.className = 'term-zone';
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      left: b[0] + 'px',
      top: b[1] + 'px',
      width: b[2] - b[0] + 'px',
      height: b[3] - b[1] + 'px',
    });
    $('posts').append(el);
    const point = (row) => {
      if (row !== TQ.row) {
        TQ.row = row;
        TQ.at = sceneT;
        topDirty = true;
        wake();
      }
    };
    const at = (e) => {
      if (e.pointerType === 'touch') return;
      const r = (TQ.rect ??= el.getBoundingClientRect());
      const [u, v] = fromScreen(
        s,
        b[0] + ((e.clientX - r.left) / r.width) * (b[2] - b[0]),
        b[1] + ((e.clientY - r.top) / r.height) * (b[3] - b[1]),
      );
      const row = Math.floor((v - (L.pad + 4)) / 19.5); // (a row: from 14 px above a line's baseline)
      point(u < L.pad || u > L.pad + L.lw || row < 0 || row > 11 ? -1 : row); // (the 12 lines of the log; not the prompt)
    };
    el.addEventListener('pointerenter', (e) => {
      TQ.rect = null;
      at(e);
    });
    el.addEventListener('pointermove', at);
    el.addEventListener('pointerleave', () => point(-1));
    addEventListener('resize', () => {
      TQ.rect = null;
    });
  }
  // The sections' bar (shown when the menu is out of view): a button per entry of the menu, opening the same section
  // (one list: a section more, one entry more); on a phone, its pictogram over its name (SECTION_ICON px square),
  // the top screen's, in the bar's khaki, Discord's logo in white (its brand)
  const NAV_IDS = MENU_IDS,
    SECTION_ICON = 15;
  function buildSections() {
    NAV_IDS.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.s = id;
      b.innerHTML =
        '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><canvas class="ico" aria-hidden="true"></canvas><span></span><small></small>';
      const ico = b.querySelector('.ico'),
        k = devicePixelRatio || 1,
        S = SECTION_ICON,
        c = ico.getContext('2d');
      ico.width = ico.height = Math.round(S * k);
      c.scale(k, k);
      picto(c, id, S / 2, S / 2, S * 0.7, {
        ink: id === 'discord' ? WHITE : getComputedStyle(ROOT).getPropertyValue('--khaki').trim(),
        glow: false,
        line: 1.3,
      });
      b.addEventListener('click', () => openSection(id));
      $('sections').append(b);
    });
  }
  function sectionsTexts() {
    const X = T(),
      bar = $('sections');
    bar.setAttribute('aria-label', X.sections);
    for (const b of bar.children) {
      const id = b.dataset.s,
        i = MENU_IDS.indexOf(id),
        [title, sub, code] = X.menu[i];
      b.querySelector('span').textContent = title;
      b.querySelector('small').textContent = code ? 'CODE ' + code : '';
      b.setAttribute(
        'aria-label',
        `${title}. ${sub}.${code ? ` CODE ${code}` : ''}${SECTION_LINKS[id] ? ` (${X.newTab})` : ''}`,
      );
    }
  }
  function buildPosts() {
    const s = SCR.haut;
    termZone(s);
    buildSections();
    sectionsTexts();
    const cards = topLayout(s.w, s.h).cards.map((r, i) => ({
      key: `card${i}`,
      kind: 'card',
      lit: () => true, // (open, as the posts: its tag's square green)
      section: MENU_IDS[i],
      tile: r,
      pts: [
        onScreen(s, r.x, r.y),
        onScreen(s, r.x + r.w, r.y),
        onScreen(s, r.x + r.w, r.y + r.h),
        onScreen(s, r.x, r.y + r.h),
      ],
    }));
    const posts = POSTS.map((p) => ({ ...p, kind: 'post' }));
    [...cards, ...posts].forEach((p, i) => {
      const xs = p.pts.map((q) => q[0]),
        ys = p.pts.map((q) => q[1]),
        b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      const el = document.createElement(p.zone ? 'div' : 'button'); // (a zone is no button: its own controls take the keyboard)
      el.className = p.zone ? 'post zone' : 'post';
      if (p.zone) el.setAttribute('aria-hidden', 'true');
      else el.type = 'button';
      Object.assign(el.style, {
        left: b[0] + 'px',
        top: b[1] + 'px',
        width: b[2] - b[0] + 'px',
        height: b[3] - b[1] + 'px',
      });
      if (p.section)
        el.addEventListener('click', (e) =>
          p.key === 'phone' && CALL.state !== 'idle'
            ? callPhone(e.detail === 0)
            : p.href
              ? (telVisit(p.section), window.open(p.href, '_blank', 'noopener'))
              : openSection(p.section),
        ); // (the phone, while it rings, answers; during the call, hangs up)
      else if (p.key === 'code')
        el.addEventListener('click', () =>
          PAD_ORDER.map((a) => PAD.keys[a]?.el)
            .find((k) => k?.tabIndex === 0)
            ?.focus(),
        ); // (ENTER CODE leads to the keypad; Enter on it, the keyboard's, enters the code typed: padPress)
      $('posts').append(el);
      wireTarget(el, p.key);
      const g = makeTarget(
        p.key,
        p.kind,
        TG.lock + TG.lead(true) + TG.tag, // (a menu's entry too: drawn on the screen, its words do not grow with the browser's zoom; its tag's do)
        40 + 10 * i,
        b,
        [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2],
        p.lit,
        postsLive,
      );
      Object.assign(g, {
        btn: el,
        pts: p.pts,
        side: p.side || 'below',
        link: !!(p.href || SECTION_LINKS[p.section]),
        intent: p.zone ? CT.intent : 0,
      });
      if (p.tile) spotlight(el, p.tile, s);
      if (p.key === 'keypad') buildKeypad(el, b);
    });
    buildEchoes();
  }
  // The radar, a module like the others (the sound, the keypad): a zone over it, its corners on its bezel
  // (RADAR_BOX), only pointed at, its tag above (RADAR · the faction joined, what to do); then its echoes over it, the
  // factions' and the people's: each a post of its own (echoPost), its corners round the echo, its button larger; a
  // faction's click joins it, or leaves the one joined (setFaction), a person's opens their card (cardOpen). An echo
  // pointed at takes the target from the zone (touched last). Its tag in its echo's colour (its line: tint), as the
  // radar's once a faction is joined (for coherence). From the keyboard, the zone is a group, as the keypad's: one
  // stop, after the menu's entries (the console read from the left), the echo joined or the leftmost (echoStop; the one
  // last focused while the focus is in it); the arrows from echo to echo, left to right (ECHO_ORDER: right or down the
  // next, left or up the one before, as in a group of choices); Enter or Space acts; a faction's named by it, its state
  // its pressed state. On a phone (the radar out of view), the factions' strip (buildStrip) and, from the ABOUT page,
  // the people's cards.
  const ECHO = { box: 22, hit: 44 };
  // the radar's bezel, its outer edge (where the dark housing meets it), measured on the lit room so that its corners
  // follow its lean: it stands askew, its left side 5.2 degrees, its right
  // side 2.9 (the perspective), its top and foot level (TL TR BR BL, room px)
  const RADAR_BOX = [
    [288.2, 527.9],
    [626, 528],
    [612.2, 804.3],
    [262.9, 804.3],
  ];
  const ECHO_ORDER = [...FACTIONS, ...PEOPLE]
    .map((f) => f.id)
    .sort((a, b) => RADAR_AT[a][0] - RADAR_AT[b][0]);
  const echoBtn = (id) => CTT[`echo-${id}`].btn;
  function buildEchoes() {
    const pts = RADAR_BOX,
      xs = pts.map((q) => q[0]),
      ys = pts.map((q) => q[1]);
    const b = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      zone = document.createElement('div');
    zone.className = 'post zone';
    zone.setAttribute('role', 'group');
    Object.assign(zone.style, {
      left: b[0] + 'px',
      top: b[1] + 'px',
      width: b[2] - b[0] + 'px',
      height: b[3] - b[1] + 'px',
    });
    $('posts').insertBefore(zone, CTT.screen.btn);
    wireTarget(zone, 'radar');
    const rz = makeTarget(
      'radar',
      'post',
      TG.lock + TG.lead(true) + TG.tag,
      190,
      b,
      [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2],
      () => faction !== null,
      postsLive,
    );
    Object.assign(rz, {
      btn: zone,
      pts,
      side: 'above',
      link: false,
      intent: CT.intent,
      tint: () => factionOf(faction)?.colour ?? null,
    });
    FACTIONS.forEach((f, i) =>
      echoPost(f.id, 200 + 10 * i, {
        act: () => setFaction(faction === f.id ? null : f.id),
        lit: () => faction === f.id,
        tint: () => f.colour,
      }),
    );
    PEOPLE.forEach((p, i) =>
      echoPost(p.id, 240 + 10 * i, {
        act: (el) => cardOpen(p.id, el),
        lit: () => false,
        tint: () => RADAR_PERSON,
        card: true,
      }),
    );
    zone.addEventListener('focusin', (e) =>
      ECHO_ORDER.forEach((id) => {
        echoBtn(id).tabIndex = echoBtn(id) === e.target ? 0 : -1;
      }),
    );
    zone.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
      if (!step || e.altKey || e.ctrlKey || e.metaKey) return;
      const i = ECHO_ORDER.findIndex((id) => echoBtn(id) === document.activeElement),
        j = i + step;
      if (i < 0 || j < 0 || j >= ECHO_ORDER.length) return;
      e.preventDefault();
      echoBtn(ECHO_ORDER[j]).focus();
    });
    buildStrip();
  }
  // an echo's post, in the radar's group: its corners round the echo (a square of ECHO.box, the radar's own px), its
  // button larger (ECHO.hit, canvas px: easily pointed at, there whether the sweep has lit the echo or not; the stop:
  // echoStop), its tag above or below as it leaves the other echoes clear; act: what its click does (a person's opens a
  // window: card), lit: its state green, tint: its line's colour
  function echoPost(id, salt, { act, lit, tint, card = false }) {
    const s = SCR.carte,
      h = ECHO.box / 2,
      radar = CTT.radar,
      [fx, fy] = RADAR_AT[id],
      at = (dx, dy) => onScreen(s, fx * s.w + dx, fy * s.h + dy),
      [x, y] = at(0, 0);
    const pts = [at(-h, -h), at(h, -h), at(h, h), at(-h, h)],
      xs = pts.map((q) => q[0]),
      ys = pts.map((q) => q[1]);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'post echo';
    el.tabIndex = -1;
    if (card) el.setAttribute('aria-haspopup', 'dialog');
    Object.assign(el.style, {
      left: x - ECHO.hit / 2 - radar.box[0] + 'px',
      top: y - ECHO.hit / 2 - radar.box[1] + 'px',
      width: ECHO.hit + 'px',
      height: ECHO.hit + 'px',
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      act(el);
    });
    radar.btn.append(el);
    wireTarget(el, `echo-${id}`);
    const g = makeTarget(
      `echo-${id}`,
      'post',
      TG.lock + TG.lead(true) + TG.tag,
      salt,
      [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      [x, y],
      lit,
      postsLive,
    );
    Object.assign(g, { btn: el, pts, side: fy < 0.5 ? 'above' : 'below', link: false, intent: 0, tint });
  }
  // the radar's stop: the echo joined, else the leftmost; left as it is while the focus is in the radar (the arrows)
  function echoStop() {
    if (CTT.radar.btn.contains(document.activeElement)) return;
    for (const id of ECHO_ORDER) echoBtn(id).tabIndex = id === (faction ?? ECHO_ORDER[0]) ? 0 : -1;
  }
  // On a phone, a tablet in portrait (the menu and the radar out of view: menu-off), the factions as a strip over
  // the sections' bar (placed by measureBands; hidden while a page is read): FACTION and the one joined, then a button
  // each, its emblem and its name; the one joined lit in its colour, a touch on it leaves it
  function buildStrip() {
    const row = $('factions').querySelector('.row');
    for (const f of FACTIONS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.f = f.id;
      b.style.setProperty('--c', f.colour);
      b.innerHTML = `<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><img src="${media(`factions/${f.id}.webp`)}" alt=""><span>${f.name}</span>`;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        setFaction(faction === f.id ? null : f.id);
      });
      row.append(b);
    }
  }
  function stripShow() {
    const X = T(),
      strip = $('factions'),
      joined = factionOf(faction),
      head = strip.querySelector('p');
    strip.setAttribute('aria-label', X.factionsGroup);
    head.replaceChildren(`${X.term.faction} · `, node('b', '', joined ? joined.name : X.term.factionNone));
    head.style.setProperty('--c', joined?.colour ?? '');
    for (const b of strip.querySelector('.row').children)
      b.setAttribute('aria-pressed', String(b.dataset.f === faction));
  }
  // the faction joined (id) or left (null): the one way to it (the radar's echoes, from the pointer or the keyboard; on a
  // phone, the factions' strip), kept, said by the terminal under > RADAR and to screen readers (a status: no one else
  // hears it), shown in its places at once (no sound yet: the lock's relay was the station's start-up click; a real
  // recording to choose)
  function setFaction(id) {
    if (id === faction || (id !== null && !factionOf(id))) return;
    const was = faction,
      f = factionOf(id);
    faction = id;
    factionAt = reduce ? -Infinity : sceneT;
    factionPref.set(id);
    $('faction-status').textContent = (f ? T().factionJoinedSay : T().factionLeftSay).replace(
      '{name}',
      (f ?? factionOf(was)).name,
    );
    if (ROOT.classList.contains('posts-live'))
      logLine(
        () => T().term.radar,
        () => [T().term.faction, f ? f.name : T().term.factionNone, f ? MINT : INK],
      );
    factionApply();
    targetChanged(`echo-${id ?? was}`); // (its tag shows the change a moment; the one clicked only)
  }
  // the faction in its places, at once, frames or not (reduced motion): A2 and A3, C3 (smallShow), the echo ringed; the
  // radar's and the echoes' tags
  function factionApply() {
    if (SCR.carte?.radar && !held()) radarStep(sceneT);
    smallShow();
    targetTexts();
    wake();
  }
  // The holo windows (a person's card, the call's box, a capture enlarged): our emblem at their head, the screen's pixel
  // density; their lines, each its words for screen readers (.sr) and, for the eyes, a run of letters (aria-hidden) still
  // to decode (fresh) or there at once; as they come, unfolding from their foot (a flicker as it settles), then their
  // lines decoded once, as the frames come while live() holds (their own clock: the console may be at rest behind);
  // motion reduced on the way, all of it there at once (as motionSet does elsewhere: its own moves, also, ended too).
  // HOLO: the unfolding's and the decoding's times (s), the unfolding's keyframes
  const HOLO = {
    open: 0.26,
    decode: 0.55,
    unfold: [
      { clipPath: 'inset(100% 0 0 0)', opacity: 0.2 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0.85, offset: 0.7 },
      { opacity: 0.6, offset: 0.85 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1 },
    ],
  };
  function holoMark(cv, size, ink) {
    const k = devicePixelRatio || 1,
      c = cv.getContext('2d');
    cv.width = cv.height = Math.round(size * k);
    c.scale(k, k);
    emblem(c, size / 2, size / 2, size * 0.9, ink);
    return unread(cv);
  }
  function holoLine(el, shown, said, salt, fresh) {
    const eye = unread(node('span')),
      L = letters(eye, salt);
    el.replaceChildren(node('span', 'sr', said), eye);
    setLetters(L, shown);
    drawLetters(L, 'decode', fresh ? 0 : 1, 0, 0);
    return L;
  }
  function holoOpen(el, lines, delay, live, also = []) {
    const runs = [
      el.animate(HOLO.unfold, {
        duration: HOLO.open * 1000,
        delay: delay * 1000,
        easing: 'ease-out',
        fill: 'backwards',
      }),
      ...also,
    ]; // (backwards: once unfolded, nothing clipped, its glow and corners whole)
    const t0 = performance.now() / 1000 + delay + HOLO.open * 0.6;
    const tick = () => {
      if (!live()) return;
      const now = performance.now() / 1000,
        k = reduce ? 1 : clamp01((now - t0) / HOLO.decode); // (the tick lasts past the unfolding: it covers it all)
      if (reduce) runs.forEach((a) => a.finish());
      for (const L of lines) drawLetters(L, 'decode', k, 0, now);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  // A person's card, a hologram the radar projects when their echo (a white dot) is clicked: from it a thin beam rises,
  // the card unfolds from its foot above it (or beside it, if the window has no room there), a dark ground nearly
  // opaque (read over the console, not through it) tinted with the radar's blue-white, fine scan lines, its edges lit;
  // its words decoded as it opens, then still (a design rule: 80 % calm). From the ABOUT page (a phone: the radar out
  // of view), the same card in the middle,
  // without a beam. A modal window named by its person: its close button, Escape or a click beside it (pressed and
  // released there) closes it, the focus back where it was. Screen readers get each line's words whole (a hidden copy,
  // .sr: holoLine), the decoding letters hidden from them. Without a move (reduced motion, LITE), there at once.
  // CARD: its distance from the echo (px), the beam's time (s)
  const CARD = { el: null, id: null, opener: null, down: null, words: [], gap: 70, beam: 0.18 };
  function cardBuild() {
    const d = node('dialog', 'holo'),
      card = node('div', 'holo-card'),
      mark = holoMark(node('canvas', 'holo-mark'), 40, '#dcecff');
    card.append(
      ...['tl', 'tr', 'bl', 'br'].map((q) => node('i', 'c ' + q)),
      node('button', 'holo-close', '×'),
      node('div', 'holo-body', '', [
        // (the frame still, its words scrolling)
        node('div', 'holo-head', '', [
          mark,
          node('div', '', '', [node('p', 'holo-kicker'), node('h2', 'holo-name')]),
        ]),
        node('dl', 'holo-rows'),
        node('p', 'holo-text'),
        node('div', 'holo-links'),
      ]),
    );
    card.querySelector('.holo-close').type = 'button';
    d.append(unread(node('i', 'holo-beam')), card);
    const beside = (t) => !t?.closest?.('.holo-card');
    d.addEventListener('pointerdown', (e) => {
      CARD.down = e.target;
    });
    d.addEventListener('click', (e) => {
      if (e.target.closest('.holo-close') || (beside(e.target) && beside(CARD.down))) d.close();
    }); // (its button, or a click pressed and released beside it)
    d.addEventListener('keydown', (e) => e.stopPropagation()); // (the console's keys wait: its own Escape closes it)
    d.addEventListener('close', () => {
      CARD.opener?.focus?.({ preventScroll: true });
      Object.assign(CARD, { opener: null, id: null, down: null });
    });
    ROOT.append(d);
    CARD.el = d;
  }
  // its words, in the language shown, each line still to decode (fresh) or there at once (holoLine)
  function cardTexts(fresh) {
    const X = T(),
      C = X.cards[CARD.id],
      p = PEOPLE.find((q) => q.id === CARD.id),
      card = CARD.el.querySelector('.holo-card');
    CARD.el.setAttribute('aria-label', C.label);
    card.querySelector('.holo-close').setAttribute('aria-label', X.cardClose);
    card
      .querySelector('.holo-rows')
      .replaceChildren(...C.rows.flatMap(([k]) => [node('dt', '', k), node('dd')]));
    card.querySelector('.holo-links').replaceChildren(
      ...p.links.map(([id, url]) => {
        const a = node('a', 'holo-link', NETWORKS[id].toUpperCase() + ' ↗');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', `${NETWORKS[id]}. ${C.links[id]} (${X.newTab})`);
        return a;
      }),
    );
    const lines = [
      [card.querySelector('.holo-kicker'), C.kicker, C.kicker],
      [card.querySelector('.holo-name'), p.handle.toUpperCase(), p.handle],
      ...[...card.querySelectorAll('.holo-rows dd')].map((dd, i) => [dd, C.rows[i][1], C.rows[i][1]]),
      [card.querySelector('.holo-text'), C.text, C.text],
    ];
    CARD.words = lines.map(([el, shown, said], i) => holoLine(el, shown, said, 300 + i, fresh));
  }
  // where it stands: above its echo (the beam from the echo to its foot), or beside it if the window has no room above;
  // from the ABOUT page, or once its echo is out of the window (a tablet turned), in the middle, without a beam; never
  // past the window's edges (the echo measured anew on each call: the camera follows the window)
  function cardPlace() {
    const card = CARD.el.querySelector('.holo-card'),
      beam = CARD.el.querySelector('.holo-beam'),
      vw = innerWidth,
      vh = innerHeight;
    const w = card.offsetWidth,
      h = card.offsetHeight,
      r = CARD.opener.classList.contains('echo') && CARD.opener.getBoundingClientRect();
    const c = r && [r.left + r.width / 2, r.top + r.height / 2],
      o = c && c[0] >= 0 && c[0] <= vw && c[1] >= 0 && c[1] <= vh ? c : null; // (its echo, if in the window)
    let x = (vw - w) / 2,
      y = Math.max(16, (vh - h) / 2);
    if (o) {
      x = Math.max(16, Math.min(vw - w - 16, o[0] - w / 2));
      y = o[1] - CARD.gap - h;
      if (y < 16) {
        x = Math.max(16, Math.min(vw - w - 16, o[0] + CARD.gap));
        y = Math.max(16, Math.min(vh - h - 16, o[1] - h / 2));
      } // (no room above: beside it)
    }
    setStyle(card, 'transform', `translate(${devicePx(x)}px, ${devicePx(y)}px)`);
    beam.hidden = !o;
    if (!o) return;
    const tx = Math.max(x + 12, Math.min(x + w - 12, o[0])),
      ty = y + h < o[1] ? y + h : y + h / 2,
      len = Math.hypot(tx - o[0], ty - o[1]),
      deg = (Math.atan2(tx - o[0], o[1] - ty) * 180) / Math.PI;
    Object.assign(beam.style, {
      height: len + 'px',
      transform: `translate(${o[0] - 1}px, ${o[1] - len}px) rotate(${deg}deg)`,
    });
  }
  // open: from an echo (above it, its beam drawn first) or from a page (in the middle); unfolding and decoding
  // (holoOpen), at once without a move; the terminal says the contact
  function cardOpen(id, opener) {
    if (!CARD.el) cardBuild();
    Object.assign(CARD, { id, opener });
    const still = reduce || LITE,
      beamed = opener.classList.contains('echo');
    cardTexts(!still);
    CARD.el.showModal();
    cardPlace();
    CARD.el.querySelector('.holo-close').focus();
    if (ROOT.classList.contains('posts-live')) {
      const p = PEOPLE.find((q) => q.id === id);
      logLine(
        () => T().term.radar,
        () => [T().term.contact, p.handle.toUpperCase(), MINT],
      );
    }
    if (still) return;
    const beam = CARD.el.querySelector('.holo-beam'),
      lead = beamed ? CARD.beam : 0,
      rest = +getComputedStyle(beam).opacity,
      words = CARD.words;
    const drawn = beamed
      ? [
          beam.animate(
            [
              { transform: beam.style.transform + ' scaleY(0)', opacity: 1 },
              { transform: beam.style.transform + ' scaleY(1)', opacity: 1 },
              { opacity: rest },
            ],
            { duration: (CARD.beam + HOLO.open) * 1000, easing: 'ease-out', fill: 'backwards' },
          ),
        ]
      : []; // (drawn up, then down to its light at rest)
    holoOpen(
      CARD.el.querySelector('.holo-card'),
      words,
      lead,
      () => CARD.el.open && CARD.words === words,
      drawn,
    );
  }
  addEventListener('resize', () => {
    if (CARD.el?.open) cardPlace();
  });
  // a page's words with a person's handle as a link to their card (the ABOUT page: "created by Biggy")
  function cardWords(text, id) {
    const p = PEOPLE.find((q) => q.id === id),
      i = p ? text.indexOf(p.handle) : -1;
    if (i < 0) return [text];
    const b = node('button', 'card-link', p.handle);
    b.type = 'button';
    b.setAttribute('aria-haspopup', 'dialog');
    b.addEventListener('click', () => cardOpen(id, b));
    return [text.slice(0, i), b, text.slice(i + p.handle.length)];
  }
  // a menu's tile: the light under the pointer (.spot), over the tile on the top screen's tube, where the pointer is on
  // the tile's button (the tile's own px: the screen is upright, so the button is the tile scaled); the mouse or a pen
  // only (a touch has no pointer to follow)
  function spotlight(el, tile, s) {
    const spot = document.createElement('i');
    spot.className = 'spot';
    Object.assign(spot.style, {
      left: tile.x + 'px',
      top: tile.y + 'px',
      width: tile.w + 'px',
      height: tile.h + 'px',
    });
    s.tube.append(spot);
    const at = (e) => {
      const r = el.getBoundingClientRect();
      setStyle(spot, '--x', (((e.clientX - r.left) / r.width) * tile.w).toFixed(1) + 'px');
      setStyle(spot, '--y', (((e.clientY - r.top) / r.height) * tile.h).toFixed(1) + 'px');
    };
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      at(e);
      spot.classList.add('on');
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') at(e);
    });
    el.addEventListener('pointerleave', () => spot.classList.remove('on'));
  }
  // ===================================================================================================================
  // The keypad and the entry, as in the game. Its 12 keys pressed with the pointer or the finger, or from the real
  // keyboard (figures, Enter, Backspace or Delete, Escape); a key whitens 0.13 s as it is pressed and beeps (the alarm
  // keypad's piezo); the code is typed on the ENTER CODE screen ("___" -> "2__" -> "27_" -> "273"); CLEAR / ENTER
  // (EFFACER / ENTRER) printed on the two coloured keys; the small display C1 traces the keyboard's activity. The answer
  // to ENTER (ACTIVE, ERROR): padEnter. The keys are buttons inside the keypad's zone, so that its target stays while the
  // pointer is on them; from the keyboard the keypad is a single stop, its arrows moving between its keys. Each key's
  // button, flash and legend lie on its face, measured (PAD_FACES).
  // ===================================================================================================================
  const PAD = { len: 3, entry: '', keys: {}, hits: [], flash: 0.13, answer: null, timers: [] };
  const PAD_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter']; // (rows of 3, as on the keypad)
  // Each key's face, its corners TL TR BR BL (canvas px), measured on the lit room
  // (to the tenth of a pixel): the keypad stands askew, its keys' sides leaning
  // 5 to 7 degrees, their tops and feet level. (The outlines in zones.json are straight and 2 to 4 px off: a key would
  // whiten beside itself.)
  const PAD_FACES = {
    1: [
      [1473.6, 887.9],
      [1516.2, 887.6],
      [1519, 918.3],
      [1476.2, 918.3],
    ],
    2: [
      [1519.8, 887.7],
      [1562.3, 887.8],
      [1565.5, 918.5],
      [1522.8, 918.3],
    ],
    3: [
      [1566, 887.7],
      [1607.9, 887.9],
      [1611.8, 918.3],
      [1569.4, 918.3],
    ],
    4: [
      [1476.6, 920.5],
      [1519.3, 920.5],
      [1522.6, 953.1],
      [1479.8, 953.1],
    ],
    5: [
      [1523.2, 920.4],
      [1565.7, 920.5],
      [1569.6, 953.2],
      [1526.6, 953.1],
    ],
    6: [
      [1569.8, 920.4],
      [1611.8, 920.6],
      [1615.9, 953.1],
      [1573.4, 953.1],
    ],
    7: [
      [1480.2, 955.8],
      [1522.9, 955.7],
      [1526.2, 990.8],
      [1483.5, 990.6],
    ],
    8: [
      [1526.8, 955.6],
      [1569.9, 955.8],
      [1573.9, 990.7],
      [1530.1, 990.6],
    ],
    9: [
      [1573.9, 955.6],
      [1616.2, 955.8],
      [1620.4, 990.6],
      [1577.5, 990.7],
    ],
    clear: [
      [1483.9, 994.2],
      [1526.4, 994.2],
      [1530.3, 1033.7],
      [1487.6, 1033.6],
    ],
    0: [
      [1530.7, 994.1],
      [1574.2, 993.9],
      [1578.3, 1033.5],
      [1534.3, 1033.5],
    ],
    enter: [
      [1578.2, 994.2],
      [1620.6, 994.3],
      [1625.4, 1033.5],
      [1582.4, 1033.6],
    ],
  };
  function buildKeypad(zone, box) {
    zone.removeAttribute('aria-hidden');
    zone.setAttribute('role', 'group');
    PAD_ORDER.forEach((action, i) => {
      // a key's parts, each a box of its face's size projected onto its face: the button (in the keypad's zone: it takes
      // the pointer, and shows its focus, on the key itself), its flash, CLEAR / ENTER's legend (printed on the key)
      const q = PAD_FACES[action],
        w = Math.round(Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1])),
        h = Math.round(q[3][1] - q[0][1]);
      const part = (tag, cls, parent, at) => {
        const el = document.createElement(tag);
        el.className = cls;
        Object.assign(el.style, { width: w + 'px', height: h + 'px' });
        parent.append(el);
        project(el, w, h, at);
        return el;
      };
      const el = part(
        'button',
        'padkey',
        zone,
        q.map(([x, y]) => [x - box[0], y - box[1]]),
      );
      el.type = 'button';
      el.tabIndex = i ? -1 : 0;
      el.addEventListener('click', () => padPress(action));
      PAD.keys[action] = { el, flash: part('i', `keyflash ${action}`, $('fx'), q) };
      if (action === 'clear' || action === 'enter')
        PAD.keys[action].label = part('i', 'keylabel', $('fx'), q);
    });
    // from the keyboard: the arrows move between the keys; one stop for the whole keypad, the key last focused (by the
    // keyboard, a click or a tap)
    zone.addEventListener('focusin', (e) =>
      PAD_ORDER.forEach((a) => {
        PAD.keys[a].el.tabIndex = PAD.keys[a].el === e.target ? 0 : -1;
      }),
    );
    zone.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
      if (!step || e.altKey || e.ctrlKey || e.metaKey) return;
      const i = PAD_ORDER.findIndex((a) => PAD.keys[a].el === document.activeElement),
        j = i + step;
      if (
        i < 0 ||
        j < 0 ||
        j >= PAD_ORDER.length ||
        (Math.abs(step) === 1 && Math.floor(j / 3) !== Math.floor(i / 3))
      )
        return;
      e.preventDefault();
      PAD.keys[PAD_ORDER[j]].el.focus();
    });
    padTexts();
  }
  function padTexts() {
    const X = T();
    PAD.keys.clear.el.parentElement.setAttribute('aria-label', X.keypadName);
    PAD.keys.clear.label.textContent = X.keyClear;
    PAD.keys.enter.label.textContent = X.keyEnter;
    PAD_ORDER.forEach((a) =>
      PAD.keys[a].el.setAttribute(
        'aria-label',
        a === 'clear' ? X.keyClearLabel : a === 'enter' ? X.keyEnterLabel : a,
      ),
    );
  }
  // a key on C1: its time, the last 3 s kept; none with reduced motion (C1 stands still there: no blip could show)
  function padHit() {
    if (!reduce) PAD.hits = [...PAD.hits.filter((th) => sceneT - th < 3), sceneT];
  }
  // a key pressed: it whitens and beeps, C1 shows it; a figure joins the entry (three at most), CLEAR empties it
  function padPress(action) {
    if (!ROOT.classList.contains('posts-live')) return; // (the station up, its menu built)
    // while it answers, the keypad waits; once ERROR shows, a key dismisses it, as if it were empty again
    if (PAD.answer) {
      if (PAD.answer.state !== 'error') return;
      padReset();
    }
    const k = PAD.keys[action];
    k.flash.animate(
      reduce
        ? [{ opacity: 1 }, { opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }],
      { duration: reduce ? PAD.flash * 1000 : (PAD.flash * 1000) / 0.6 },
    );
    if (snd && soundOn) snd.key();
    padHit();
    const before = PAD.entry;
    if (action === 'clear') PAD.entry = '';
    else if (action === 'enter') padEnter();
    else if (PAD.entry.length < PAD.len) PAD.entry += action;
    // the code as typed, read to a screen reader (the screens draw it on canvases), unless a call speaks there
    if (PAD.entry !== before && CALL.state === 'idle')
      $('pad-status').textContent = PAD.entry ? [...PAD.entry].join(' ') : T().keyClearLabel;
    padShow();
  }
  // The answer to ENTER, as in the game: about 83 ms after it, in one frame (no motion), ACTIVE in lime for a known
  // code (the menu's, and 471, hidden), ERROR in orange-red for another, or for fewer than three figures; then the keypad
  // is empty again ("___"): 1.5 s after ENTER for ACTIVE (the keypad waits; its code has led on at 1 s: CODE_OPEN), 2 s
  // for ERROR, which a key also dismisses. (The game shows ERROR then LOCKED: its tower locks; nothing locks here, and
  // the two words went by too fast to read: ERROR alone.) Timers, not the frame loop: a few changes of state, each
  // redrawing the small screen once, the same with reduced motion.
  const ANSWER = { after: 0.083, error: 2, active: 1.5 };
  const LIME = '#cbf25c',
    ALERT = '#ff6b3d'; // (the game's lime and orange-red)
  const ANSWER_LOOK = {
    active: { colour: LIME, glow: 'rgba(203, 242, 92, .5)' },
    error: { colour: ALERT, glow: 'rgba(255, 107, 61, .5)' },
  };
  const HIDDEN_CODES = ['471']; // (it plays the hack: hackStart)
  // Where an accepted code leads: where its menu's entry leads, one table drawn from the menu itself (its codes and
  // MENU_IDS): 273 EXTENSION, 226 SCREENSHOTS (CAM on a phone's keys), 008 ABOUT, opened as a click on their tile, the
  // phone or the sections' bar opens them (openSection: their reading screen); DISCORD's code makes the phone ring
  // instead, the call (callRing: a bonus for the visitor who types the code; the tile, the bar and a click on the phone
  // still open the invitation at once; and a tab opened a second after a key may be blocked by a browser); the hidden
  // code plays the hack (hackStart). ACTIVE is read for 1 s (CODE_OPEN), then the destination opens; the keypad empties
  // behind it (1.5 s); switched off before, nothing opens (padReset).
  const CODE_OPEN = 1;
  function codeDest(code) {
    const i = T().menu.findIndex((m) => m[2] === code);
    return i >= 0
      ? MENU_IDS[i] === 'discord'
        ? 'call'
        : MENU_IDS[i]
      : HIDDEN_CODES.includes(code)
        ? 'hack'
        : null;
  }
  function codeGo(dest) {
    if (dest === 'call') return callRing(); // (the phone rings, then the call)
    if (dest === 'hack') return hackStart(); // (the hack)
    openSection(dest); // (as a click on its tile)
  }
  function padEnter() {
    if (!PAD.entry) return; // (nothing typed: nothing to answer)
    const code = PAD.entry,
      dest = codeDest(code),
      ok = !!dest,
      entry = T().menu.find((m) => m[2] === code);
    PAD.answer = { state: null, code };
    const at = (sec, fn) => PAD.timers.push(setTimeout(fn, sec * 1000)),
      show = (state) => {
        PAD.answer.state = state;
        padShow();
      };
    // (announced to screen readers with where it leads: "Code 273 accepted: EXTENSION")
    const said = !ok
      ? T().codeRefused
      : entry
        ? T().codeAcceptedTo.replace('{to}', entry[0])
        : T().codeAccepted;
    at(ANSWER.after, () => {
      show(ok ? 'active' : 'error');
      logCode(code, ok);
      $('pad-status').textContent = said.replace('{code}', code);
    });
    if (ok) at(ANSWER.after + CODE_OPEN, () => codeGo(dest));
    at(ok ? ANSWER.active : ANSWER.error, padReset);
  }
  // (the announcement emptied too: the same answer again is announced again)
  // (but not the phone's: its call is said there while it rings or is on)
  function padReset() {
    PAD.timers.forEach(clearTimeout);
    PAD.timers = [];
    PAD.answer = null;
    PAD.entry = '';
    if (CALL.state === 'idle') $('pad-status').textContent = '';
    padShow();
  }
  // What the keypad does shows on its lamps too (lampEvent): the lenses over ENTER CODE, red, the two yellows, green:
  // the yellows while a code is typed, the green one (ACTIVE) or the red one (ERROR) for its answer. (The panel's own
  // green and red lamps telling the answer looked messy: two white lenses over the screen became a red and a green one,
  // beside the yellows. Their colour is in their pictures and in lenses.json; they are found by it.)
  const PAD_LAMPS = { typing: [], active: [], error: [] };
  function padLampsFrom(z) {
    const over = (colour) =>
      z.lenses.filter((l) => l.id.startsWith('code-haut-') && l.color === colour).map((l) => l.id);
    Object.assign(PAD_LAMPS, { typing: over('jaune'), active: over('vert'), error: over('rouge') });
  }
  function padShow() {
    drawCode(SCR.code);
    smallShow();
    const said = PAD.answer?.state;
    lampEvent(PAD_LAMPS.typing, !!PAD.entry && !said);
    lampEvent(PAD_LAMPS.active, said === 'active');
    lampEvent(PAD_LAMPS.error, said === 'error');
    // (the menu's entries matched, on the top screen and on the sections' bar)
    const on = padMatches();
    for (const b of $('sections').children) {
      const i = MENU_IDS.indexOf(b.dataset.s);
      b.classList.toggle('match', on.includes(i));
      b.classList.toggle('dim', !!PAD.entry && !on.includes(i));
    }
    topDirty = true;
    wake();
  }
  // Where a code leads, shown as it is typed (the link between code and section made obvious): the menu's entries whose
  // code starts with the figures typed light, their tile on the top screen selected (as under the viewfinder) with the
  // figures typed in white in its CODE, their button on the sections' bar on a phone; none for a hidden code (471), none
  // once the answer is ERROR; for ACTIVE, the code's own. The tile aimed at says more than a highlight: its subtitle
  // gives way to what is typed and what to do, "> 2 7 _", "> 2 7 3 · ENTER", then "> 2 7 3 · ACTIVE"; the other tiles
  // dim while a code is typed (all of them when no code starts so), and so do their buttons on the sections' bar. The
  // answer is logged on the terminal, among its lines: "CODE 273 ...... EXTENSION" (in mint), "CODE 471 ...... ACTIVE"
  // (in lime), "CODE 123 ...... ERROR" (in orange-red).
  function padMatches() {
    if (!PAD.entry || PAD.answer?.state === 'error') return [];
    return T()
      .menu.map(([, , code], i) => (code.startsWith(PAD.entry) ? i : -1))
      .filter((i) => i >= 0);
  }
  // (the subtitle's band of a tile, as the menu is drawn: from 15 px above its line to 6 px under it)
  const subBand = (card) => [card.x + 2, card.y + card.h * 0.55 + 14, card.w - 4, 22];
  function padTiles(c, s, cards) {
    if (!PAD.entry) return;
    const on = padMatches();
    cards.forEach((card, i) => {
      if (on.includes(i)) {
        const [x, y, w, h] = subBand(card),
          k = CANVAS_SCALE;
        c.drawImage(s.bare, x * k, y * k, w * k, h * k, x, y, w, h);
      } else {
        c.fillStyle = 'rgba(5, 8, 6, .62)';
        c.fillRect(card.x, card.y, card.w, card.h);
      } // (dimmed, its frame too)
    });
  }
  function drawPadMatch(c, card, i) {
    if (i !== menuSel) drawMenuSelection(c, card);
    // in place of the subtitle: what is typed (the figures in white, the slots to come), then what to do, or the answer
    const said = PAD.answer?.state,
      line = [['> ', MINT]];
    for (let j = 0; j < PAD.len; j++)
      line.push([(PAD.entry[j] ?? '_') + (j < PAD.len - 1 ? ' ' : ''), j < PAD.entry.length ? WHITE : DIM]);
    if (said === 'active') line.push([' · ', DIM], [T().active, LIME]);
    else if (PAD.entry.length === PAD.len) line.push([' · ', DIM], [T().keyEnter, MINT]);
    c.font = `400 14px ${FONT_MONO}`;
    const ew = c.measureText('0').width,
      n = line.reduce((a, [t]) => a + t.length, 0);
    let lx = card.x + card.w / 2 - (n * ew) / 2;
    line.forEach(([t, col]) => {
      mono(c, t, lx, card.y + card.h * 0.55 + 30, 14, col);
      lx += t.length * ew;
    });
    // (over the tile's own CODE, drawn right-aligned in a fixed-width font: the figures typed at their place)
    const code = T().menu[i][2],
      label = 'CODE ' + code;
    c.font = `400 13px ${FONT_MONO}`;
    const cw = c.measureText('0').width,
      x0 = card.x + card.w - 12 - label.length * cw;
    c.save();
    c.shadowColor = 'rgba(255, 255, 255, .45)';
    c.shadowBlur = 3;
    for (let j = 0; j < PAD.entry.length; j++) mono(c, code[j], x0 + (5 + j) * cw, card.y + 24, 13, WHITE);
    c.restore();
  }
  // The terminal's log of the station's own lines (the codes answered, the phone's call, the pages read): when (termT),
  // its heading and its line (label, value, colour), as functions, so that they follow the language; the last twelve;
  // they leave with the station (livePosts)
  const TERM_LOG = [];
  function logLine(head, row) {
    TERM_LOG.push({ at: termT, head, row });
    if (TERM_LOG.length > 12) TERM_LOG.shift();
    topDirty = true;
    wake();
  }
  function logCode(code, ok) {
    TEL.codes++; // (the terminal's VISIT: the codes typed)
    const i = T().menu.findIndex((m) => m[2] === code);
    logLine(
      () => T().term.keypad,
      () => [
        `CODE ${code}`,
        ...(!ok ? [T().error, ALERT] : i >= 0 ? [T().menu[i][0], MINT] : [T().active, LIME]),
      ],
    );
  }
  // The hack (the story's thread: the intro locked its target on tower 4, the visitor takes it), a bonus for the
  // curious: the hidden code 471 typed at the keypad (never played by itself: the first visit is long enough, and the
  // screen's 273 already shows what the keypad is for). As its ACTIVE has been read (CODE_OPEN), the tower screen
  // switches in one frame, as the game's screens do, to the game's tower before it is ours: TOWER 04, LOCKED in
  // orange-red, held to be read; a capture bar fills as it is hacked (HACKING, its share), by fits and starts as a real
  // hack goes (HACK_RUN); ACCESS GRANTED in lime, held a moment; then, in one frame again, our name, the code's slots
  // and our emblem (hackEnd), the terminal logging it, screen readers told, the lock's relay heard if the sound is on.
  // With reduced motion: ACCESS GRANTED at once, held (HACK_T.still), then ours. In portrait (bay D framed alone, the
  // tower out of view) it plays on ENTER CODE instead, where the code was just typed (hackOnCode). A section read
  // meanwhile, the station switched off or the arrival played again (livePosts) calls it off. The screens show the code
  // only as the visitor types it (ENTER CODE, the terminal's KEYPAD line), and as its clue, now and then: the terminal's
  // SPECIAL ACCESS block among its facts (TOWER 04 ... 471, rather than a tape on the console, which would not belong
  // there; TXT term blocks: to be changed with HIDDEN_CODES). In portrait the terminal is out of view: no clue for 471
  // there, 1 1 2's alone (nothing more on the console).
  // (its times, s: about 6.5 in all, long enough for an easter egg found to be savoured)
  const HACK_T = { locked: 1.0, run: 4.0, granted: 1.5, still: 1.5 },
    HACK_SEG = 20;
  // the bar's progress over its run, by fits and starts: a burst, a stall about a quarter, a burst, a hesitation about
  // 60 %, then the rest in one go ([share of the run, share of the bar], straight between; the same every time)
  const HACK_RUN = [
    [0, 0],
    [0.15, 0.2],
    [0.3, 0.25],
    [0.5, 0.55],
    [0.65, 0.6],
    [0.85, 0.95],
    [1, 1],
  ];
  const HACK = { t0: null, timer: 0, shown: '' }; // (shown: what is drawn, its state and its segments: redrawn as it changes)
  const HACK_LOOK = {
    locked: ANSWER_LOOK.error,
    hacking: { colour: MINT, glow: 'rgba(159, 251, 193, .5)' },
    granted: ANSWER_LOOK.active,
  }; // (LOCKED and ACCESS GRANTED: ERROR's and ACTIVE's looks)
  // where it is at, s after its start: its state, and its bar's segments lit (its share in their steps, 5 %)
  function hackAt(at) {
    const run = clamp01((at - HACK_T.locked) / HACK_T.run),
      i = Math.max(
        1,
        HACK_RUN.findIndex(([r]) => r >= run),
      ),
      [r0, p0] = HACK_RUN[i - 1],
      [r1, p1] = HACK_RUN[i];
    const share = p0 + ((p1 - p0) * (run - r0)) / (r1 - r0);
    return {
      state: at < HACK_T.locked ? 'locked' : run < 1 ? 'hacking' : 'granted',
      lit: Math.floor(share * HACK_SEG + 1e-9),
    };
  }
  const hackOnCode = () => framing(innerWidth, innerHeight).portrait;
  function hackDraw() {
    drawTower();
    if (hackOnCode()) drawCode(SCR.code);
  }
  function hackStart() {
    if (READ.id !== null || !ROOT.classList.contains('posts-live')) return;
    clearTimeout(HACK.timer);
    HACK.timer = 0;
    HACK.t0 = performance.now() / 1000;
    HACK.shown = '';
    hackStill();
    hackDraw();
    wake();
  }
  // with reduced motion (from the start, or reduced meanwhile: stillShow): its end at once, held
  function hackStill() {
    if (!reduce || HACK.t0 === null || HACK.timer) return;
    HACK.t0 = performance.now() / 1000 - HACK_T.locked - HACK_T.run;
    HACK.timer = setTimeout(() => hackEnd(true), HACK_T.still * 1000);
    hackDraw();
  }
  // each frame while it runs (frame): redrawn only as what it shows changes (about twenty times in all, LITE as well)
  function hackStep() {
    if (HACK.t0 === null || reduce) return;
    const at = performance.now() / 1000 - HACK.t0;
    if (at >= HACK_T.locked + HACK_T.run + HACK_T.granted) return hackEnd(true);
    const { state, lit } = hackAt(at),
      shown = state + lit;
    if (shown !== HACK.shown) {
      HACK.shown = shown;
      hackDraw();
    }
  }
  // over (done: the tower taken), or called off
  function hackEnd(done) {
    if (HACK.t0 === null) return;
    clearTimeout(HACK.timer);
    HACK.timer = 0;
    HACK.t0 = null;
    drawTower();
    if (SCR.code) drawCode(SCR.code); // (ENTER CODE too: in portrait it showed it)
    if (!done) return;
    logLine(
      () => T().term.hack,
      () => [T().hack.tower, T().hack.taken, LIME],
    ); // (TAKEN: ACCESS GRANTED would overrun the terminal's 24 columns)
    if (CALL.state === 'idle') $('pad-status').textContent = T().hack.said;
    if (snd && soundOn) snd.lock();
  }
  // the tower screen while it is hacked (or ENTER CODE, in portrait), on drawMain's grid (1000 x 600 units, in the
  // screen's room): the tower's name where ours stands, its state under it (as wide as the slots at most), the capture
  // bar in segments where the slots are, its share under it
  function drawHack(s, at) {
    const { c, w, h } = s,
      X_ = T().hack;
    glass(c, w, h, '#1f2220');
    const u = Math.min((w * 0.955) / 1000, (h * 0.955) / 600),
      ox = (w - 1000 * u) / 2,
      oy = (h - 600 * u) / 2,
      X = (x) => ox + x * u,
      Y = (y) => oy + y * u;
    const { state, lit } = hackAt(at),
      { colour: col, glow } = HACK_LOOK[state];
    c.save();
    c.shadowColor = 'rgba(255,255,255,.35)';
    c.shadowBlur = 3;
    txt(c, X_.tower, X(500), Y(200), 110 * u, WHITE, 'center', 700);
    c.font = `700 ${70 * u}px ${FONT_TERM}`;
    const size = 70 * u * Math.min(1, (816 * u) / c.measureText(X_[state]).width);
    c.shadowColor = glow;
    c.shadowBlur = 4;
    txt(c, X_[state], X(500), Y(310), size, col, 'center', 700);
    const gap = 8,
      sw = (816 - gap * (HACK_SEG - 1)) / HACK_SEG;
    c.shadowBlur = 0;
    for (let i = 0; i < HACK_SEG; i++) {
      c.fillStyle = i < lit ? col : 'rgba(159, 251, 193, .1)';
      c.fillRect(X(92 + i * (sw + gap)), Y(372), sw * u, 56 * u);
    }
    txt(c, `${(lit * 100) / HACK_SEG} %`, X(500), Y(500), 40 * u, 'rgba(159, 251, 193, .85)', 'center', 600);
    c.restore();
  }
  // The phone rings (the code 112: a bonus for the visitor who types the code): its ring, a real recording, 2 s every
  // 6 s (as it rings on the recording), four times; its lamp (the call lamp on its base) lit with each ring, as a
  // bulb; ENTER CODE says INCOMING CALL, bright with each ring; its tag "DISCORD · INCOMING CALL · Click to answer", up
  // while it rings (targetsStep); the terminal "> CALL 112 / LINE ...... RINGING"; screen readers hear it. It stops
  // when it is answered (a click on the phone, or Enter: the call, callAnswer), when nobody answers (MISSED, 2 s after
  // the fourth ring), or with the station. Timers, as the keypad's answer: a few events, the same with reduced motion.
  // The sound only when the visitor turned it on. (No shake of the handset: tried, it did not show.)
  const CALL = {
    state: 'idle',
    rings: 4,
    every: 6,
    ring: 2,
    after: 2,
    timers: [],
    sound: null,
    lit: false,
    since: 0,
    clock: 0,
    talk: 0,
    line: 0,
    n: 0,
    byKey: false,
    words: [],
  };
  const CALL_LAMP = ['telephone-led'];
  function callRing() {
    if (CALL.state !== 'idle') return; // (the line is busy while a call is on)
    CALL.state = 'ringing';
    const at = (sec, fn) => CALL.timers.push(setTimeout(fn, sec * 1000));
    for (let k = 0; k < CALL.rings; k++) {
      at(k * CALL.every, () => callBurst(true));
      at(k * CALL.every + CALL.ring, () => callBurst(false));
    }
    at((CALL.rings - 1) * CALL.every + CALL.ring + CALL.after, () => callStop('missed'));
    logLine(
      () => T().term.callHead,
      () => [T().term.callLine, T().term.ringing, AMBER],
    );
    $('pad-status').textContent = touchOnly ? T().callSayTouch : T().callSay;
    targetTexts();
    targetChanged('phone');
    drawCode(SCR.code);
  }
  // a ring starts (on) or ends: the lamp, the sound, ENTER CODE
  function callBurst(on) {
    CALL.lit = on;
    lampEvent(CALL_LAMP, on);
    if (on && snd && soundOn) CALL.sound = snd.ring();
    drawCode(SCR.code);
    wake();
  }
  // The call. Answered, the ring stops; the handset comes off its hook (#station.call-on: tilted about its cord's end); the
  // call lamp stays lit; ENTER CODE says CONNECTED and counts the call's time; the terminal "LINE ...... CONNECTED"; the
  // call's box comes up at the bottom (placeCall; a holo window, unfolding, its heading decoded: holoOpen): the station
  // speaks, its lines typed at a reading pace (with reduced motion, a line at a time, at the same pace), its voice on the
  // box while a line is typed, then invites to the Discord. Screen readers hear the whole message at once. It ends with
  // HANG UP, a click on the phone, Escape, JOIN (the invitation opens), or with the station.
  const CALL_TALK = { start: 0.5, char: 0.035, pause: 0.7 }; // (s: before the first letter, a letter, after a line)
  function callAnswer(byKey) {
    if (CALL.state !== 'ringing') return;
    CALL.timers.forEach(clearTimeout);
    CALL.timers = [];
    if (snd) snd.cut(CALL.sound);
    CALL.sound = null;
    Object.assign(CALL, { state: 'connected', lit: false, since: performance.now(), line: 0, n: 0, byKey });
    if (snd && soundOn) snd.pickUp(); // (the handset off its hook: its click)
    lampEvent(CALL_LAMP, true);
    ROOT.classList.add('call-on');
    logLine(
      () => T().term.callHead,
      () => [T().term.callLine, T().term.connected, MINT],
    );
    $('pad-status').textContent = `${T().callConnectedSay} ${T().callLines.join(' ')}`;
    const g = CTT.phone;
    if (g) g.until = 0;
    CALL.clock = setInterval(callTick, 1000);
    CALL.talk = setTimeout(callType, CALL_TALK.start * 1000);
    const box = $('call'),
      still = reduce || LITE;
    box.classList.remove('done', 'talking');
    box.hidden = false;
    callTexts(!still);
    placeCall();
    if (!still) {
      const words = CALL.words;
      holoOpen(box, words, 0, () => CALL.state === 'connected' && CALL.words === words);
    } // (unfolding, its heading decoded)
    targetTexts();
    drawCode(SCR.code);
    wake();
  }
  // the phone clicked while a call is on: it rings, it answers; the call is on, it hangs up
  function callPhone(byKey) {
    if (CALL.state === 'ringing') callAnswer(byKey);
    else callStop('ended');
  }
  // missed, ended (hung up, or the invitation taken), or quiet (the station switched off: nothing said); screen readers
  // hear how it ended; the focus, if it was on the box from the keyboard, goes back to the phone
  function callStop(how) {
    if (CALL.state === 'idle') return;
    CALL.timers.forEach(clearTimeout);
    CALL.timers = [];
    clearInterval(CALL.clock);
    clearTimeout(CALL.talk);
    CALL.state = 'idle';
    CALL.lit = false;
    if (snd) snd.cut(CALL.sound);
    CALL.sound = null;
    if (how === 'ended' && snd && soundOn) snd.hangUp(); // (the handset back on its cradle; not for a call missed or cut by the station)
    lampEvent(CALL_LAMP, false);
    ROOT.classList.remove('call-on');
    const box = $('call'),
      kbd = !!box.querySelector(':focus-visible');
    box.hidden = true;
    if (kbd && how) CTT.phone?.btn.focus({ preventScroll: true });
    if (how)
      logLine(
        () => T().term.callHead,
        () => [T().term.callLine, T().term[how], how === 'missed' ? AMBER : INK],
      );
    $('pad-status').textContent = { ended: T().callEndedSay, missed: T().callMissedSay }[how] ?? '';
    const g = CTT.phone;
    if (g) g.until = 0;
    targetTexts();
    drawCode(SCR.code);
    wake();
  }
  // the call's time, mm:ss: on ENTER CODE and on the box, every second
  function callClock() {
    const s = Math.floor((performance.now() - CALL.since) / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  function callTick() {
    $('call-time').textContent = callClock();
    drawCode(SCR.code);
    wake();
  }
  // where the message is: the line being typed (CALL.line) and the letters typed in it (CALL.n); the lines before it are
  // said. Kept by line, so that a change of language keeps the place: the same line, as far as it goes in the other
  // language, a line said staying said. The next letter (with reduced motion, the line whole); then the next one, after a
  // letter's time, or a pause at the end of a line.
  function callType() {
    const lines = T().callLines,
      len = lines[CALL.line].length;
    CALL.n = reduce ? len : Math.min(len, CALL.n + 1);
    const said = CALL.n >= len;
    if (said) {
      CALL.line++;
      CALL.n = 0;
    }
    $('call').classList.toggle('talking', !said); // (the station's voice while a line is typed, still in the pauses)
    callShow();
    if (CALL.line >= lines.length) return callDone();
    const wait = reduce
      ? lines[CALL.line].length * CALL_TALK.char + CALL_TALK.pause
      : said
        ? CALL_TALK.pause
        : CALL_TALK.char;
    CALL.talk = setTimeout(callType, wait * 1000);
  }
  // the lines as typed so far: the letters typed, the cursor (a block on the next letter; none with reduced motion), the
  // rest in place but transparent, so that the box never changes size
  function callShow() {
    const lines = T().callLines,
      box = $('call-talk');
    if (box.children.length !== lines.length)
      box.replaceChildren(
        ...lines.map(() => {
          const p = document.createElement('p');
          p.append(
            ...['on', 'cur', 'hid'].map((k) =>
              Object.assign(document.createElement('span'), { className: k }),
            ),
          );
          return p;
        }),
      );
    lines.forEach((l, i) => {
      const n = i < CALL.line ? l.length : i > CALL.line ? 0 : Math.min(l.length, CALL.n),
        cur = !reduce && i === CALL.line && n < l.length;
      const [a, b, c] = box.children[i].children;
      a.textContent = l.slice(0, n);
      b.textContent = cur ? l[n] : '';
      c.textContent = l.slice(n + (cur ? 1 : 0));
    });
  }
  // all said: the invitation; answered from the keyboard, the focus goes to it (unless it was taken elsewhere meanwhile)
  function callDone() {
    $('call').classList.add('done');
    const at = document.activeElement;
    if (CALL.byKey && (unfocused(at) || at === CTT.phone?.btn)) $('call-join').focus({ preventScroll: true });
  }
  // the box's texts, in the language of the moment (on a change of language too): its heading (CALL 112, the state) still
  // to decode (fresh: answered) or there at once (holoLine), its time, its buttons, the whole message for screen readers,
  // the lines as far as they are typed
  function callTexts(fresh = false) {
    const X = T();
    $('call').setAttribute('aria-label', X.term.callHead);
    CALL.words = [
      [$('call-name'), X.term.callHead],
      [$('call-state'), X.callConnected],
    ].map(([el, t], i) => holoLine(el, t, t, 320 + i, fresh));
    const st = $('call-state');
    st.style.width = '';
    st.style.width = st.getBoundingClientRect().width + 'px'; // (the state's own width, its letters in place: its scrambled ones, in a font of unequal letters, never push the voice beside it)
    $('call-time').textContent = callClock();
    $('call-text').textContent = X.callLines.join(' ');
    $('call-join').textContent = X.callJoin;
    $('call-join').setAttribute('aria-label', `${X.callJoin} (${X.newTab})`);
    $('call-hang').textContent = X.callHangUp;
    callShow();
  }
  // at the bottom, in the middle: SECTIONS.gap above the sections' bar when it shows (portrait), else above the legal
  // lines
  function placeCall() {
    const box = $('call');
    if (box.hidden) return;
    const bar = $('sections'),
      top = (bar.offsetHeight ? bar : $('legal')).getBoundingClientRect().top;
    setStyle(box, 'bottom', innerHeight - top + SECTIONS.gap + 'px');
  }
  $('call-join').href = LINKS.discord;
  holoMark(ROOT.querySelector('#st-call .call-mark'), 36, '#e4e6da');
  $('call-join').addEventListener('click', () => {
    telVisit('discord');
    setTimeout(() => callStop('ended'));
  }); // (once the invitation is opened)
  $('call-hang').addEventListener('click', () => callStop('ended'));
  // the real keyboard: a figure types (by its key, or by its place on the top row: on an AZERTY keyboard the figures
  // need Shift there), Backspace or Delete clears (Escape too, once the arrival is over), Enter validates when the focus
  // is on nothing else, on the keypad or on ENTER CODE with a code typed (on another control, or on ENTER CODE with
  // nothing typed, Enter is that control's: ENTER CODE leads to the keypad); during the call,
  // Escape hangs up; every key pressed shows on C1 (Space on a key of the keypad once: its click does)
  addEventListener('keydown', (e) => {
    if (
      onHold ||
      !PAD.keys.clear ||
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      !ROOT.classList.contains('posts-live')
    )
      return;
    if (READ.id !== null) {
      if (['Escape', 'Backspace', 'Delete'].includes(e.key)) {
        e.preventDefault();
        back();
      }
      return;
    } // (while a section is read)
    const onPad = !!e.target.closest?.('.padkey') || e.target === CTT.code?.btn,
      free = unfocused(e.target);
    const figure = /^[0-9]$/.test(e.key) ? e.key : /^Digit[0-9]$/.test(e.code) ? e.code.slice(5) : null;
    if (figure) padPress(figure);
    else if (e.key === 'Enter' && free && CALL.state === 'ringing' && !PAD.entry) {
      e.preventDefault();
      callAnswer(true);
    } // (it answers the phone)
    // (on ENTER CODE with nothing typed, Enter is its own: it leads to the keypad, as its click does)
    else if (e.key === 'Enter' && (onPad || free) && (PAD.entry || e.target !== CTT.code?.btn)) {
      e.preventDefault();
      padPress('enter');
    } else if (e.key === 'Backspace' || e.key === 'Delete' || (e.key === 'Escape' && PAD.entry)) {
      e.preventDefault();
      padPress('clear');
    } else if (e.key === 'Escape' && CALL.state === 'connected') {
      e.preventDefault();
      callStop('ended');
    } // (it hangs up)
    else if (!(onPad && e.key === ' ')) padHit();
  });
  // they take the pointer and the keyboard while the station is up (a post that loses it gives the focus back)
  function livePosts(on) {
    if (ROOT.classList.contains('posts-live') === on) return;
    ROOT.classList.toggle('posts-live', on);
    if (!on && document.activeElement?.classList.contains('post')) document.activeElement.blur();
    if (!on) {
      TQ.row = -1;
      topDirty = true;
    } // (the terminal's line read again: none; a still pointer gets no leave)
    if (!on) {
      readReset();
      padReset();
      callStop();
      hackEnd(false);
      TERM_LOG.length = 0;
      TERM_VISIT.clear();
    } // (the keypad empty again, the phone quiet, the hack called off, their lamps going out with the station; their lines leave the terminal)
    if (on && deep) {
      const id = deep;
      deep = null;
      setTimeout(() => openSection(id)); // (the section the address asked for; out of the frame that made the menu live)
    }
    wake();
  }
  // what can be used now: the power button switches the station off once it is up; the posts once its menu is built
  function liveControls() {
    canSwitch(stationUp());
    if (CTT.screen) livePosts(postsLive());
  }
  // the entry under the viewfinder, selected as a terminal selects, at once: its frame in mint, a faint glow inside
  function drawMenuSelection(c, { x, y, w, h }) {
    c.save();
    c.fillStyle = 'rgba(159, 251, 193, .055)';
    c.fillRect(x + 1, y + 1, w - 2, h - 2);
    c.strokeStyle = MINT;
    c.lineWidth = 1.5;
    c.shadowColor = 'rgba(159, 251, 193, .45)';
    c.shadowBlur = 4;
    c.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    c.restore();
  }
  // the texts: each state padded to its longest, and the switch's two hints too, so that a tag never changes width
  function targetTexts() {
    if (!CTT.knob) return;
    const X = T(),
      pad = (txt, all) => txt + ' '.repeat(Math.max(...all.map((v) => [...v].length)) - [...txt].length);
    setLetters(CTT.knob.name, `${X.vol} · `);
    setLetters(CTT.knob.st, `${String(volStep * 10).padStart(3, ' ')} %`);
    setLetters(CTT.knob.hint, touchOnly ? X.volHintTouch : X.volHint);
    setLetters(CTT.lever.name, `${X.soundWord} · `);
    setLetters(CTT.lever.st, pad(soundOn ? X.on : X.off, [X.on, X.off]));
    const hints = touchOnly ? [X.soundHintOnTouch, X.soundHintOffTouch] : [X.soundHintOn, X.soundHintOff];
    setLetters(CTT.lever.hint, pad(soundOn ? hints[1] : hints[0], hints));
    setLetters(CTT.power.name, `${X.power} · `);
    setLetters(CTT.power.st, X.powerOn);
    setLetters(CTT.power.hint, touchOnly ? X.powerOffTouch : X.powerOffHint);
    if (CTT.screen) {
      // the posts: name, state (none for the reading screen), what to do; the same, read out, on their buttons (a link
      // says that it opens a new tab; the audio zone is no button)
      // (the phone's state and hint follow the call; each padded to the longest, so that its tag keeps its width)
      const call = {
        idle: [X.postPhoneState, X.postPhoneHint, X.postPhoneHintTouch],
        ringing: [X.callIncoming, X.callAnswer, X.callAnswerTouch],
        connected: [X.callConnected, X.callHangHint, X.callHangHintTouch],
      };
      const [phoneState, phoneHint, phoneTouch] = call[CALL.state],
        all = Object.values(call);
      const phone = [
        X.postPhone,
        pad(
          phoneState,
          all.map((v) => v[0]),
        ),
        pad(
          touchOnly ? phoneTouch : phoneHint,
          all.flatMap((v) => v.slice(1)),
        ),
      ];
      const P = {
        screen: [sectionName(SCREEN_SECTION), '', touchOnly ? X.postScreenHintTouch : X.postScreenHint],
        code: [X.enter, X.postCodeState, X.postCodeHint],
        keypad: [X.postKeypad, X.postCodeState, X.postKeypadHint],
        phone,
        audio: [X.postAudio, pad(soundOn ? X.on : X.off, [X.on, X.off]), X.postAudioHint],
      };
      const tab = (g) => (g.link && !(g === CTT.phone && CALL.state !== 'idle') ? ` (${X.newTab})` : ''); // (the phone opens nothing while a call is on)
      for (const [key, [name, state, hint]] of Object.entries(P)) {
        const g = CTT[key];
        setLetters(g.name, state ? `${name} · ` : name);
        setLetters(g.st, state);
        setLetters(g.hint, hint);
        if (g.btn.tagName === 'BUTTON')
          g.btn.setAttribute(
            'aria-label',
            `${state ? `${name}: ${state.trim()}` : name}. ${hint.trim()}${tab(g)}`,
          );
      }
      X.menu.forEach(([title, sub, code], i) => {
        const g = CTT[`card${i}`];
        setLetters(g.name, `${title} · `);
        setLetters(g.st, `CODE ${code}`);
        setLetters(g.hint, sub);
        g.btn.setAttribute('aria-label', `${title}. ${sub}. CODE ${code}${tab(g)}`);
      });
    }
    // the radar: the faction joined (lit) or none, and what to do (the people's cards too); its echoes: the faction,
    // joined (lit) or not, and what a click does
    if (CTT.radar) {
      const names = [...FACTIONS.map((f) => f.name), X.postRadarNone];
      const hints = [X.postRadarHintPeople, X.postRadarHintPeopleTouch];
      CTT.radar.btn.setAttribute('aria-label', X.radarGroupPeople);
      setLetters(CTT.radar.name, `${X.postRadar} · `);
      setLetters(CTT.radar.st, pad(factionOf(faction)?.name ?? X.postRadarNone, names));
      setLetters(CTT.radar.hint, hints[touchOnly ? 1 : 0]);
    }
    if (CTT['echo-lonestar'])
      for (const f of FACTIONS) {
        const g = CTT[`echo-${f.id}`],
          on = faction === f.id,
          hints = touchOnly ? [X.echoJoinTouch, X.echoLeaveTouch] : [X.echoJoin, X.echoLeave];
        const state = pad(on ? X.echoJoined : X.echoFaction, [X.echoJoined, X.echoFaction]),
          hint = pad(on ? hints[1] : hints[0], hints);
        setLetters(g.name, `${f.name} · `);
        setLetters(g.st, state);
        setLetters(g.hint, hint);
        g.btn.setAttribute('aria-pressed', String(on));
        g.btn.setAttribute('aria-label', f.name);
      }
    for (const p of PEOPLE) {
      // (a person: their handle, what they are, what a click does)
      const g = CTT[`echo-${p.id}`];
      if (!g) continue;
      const C = X.cards[p.id],
        hint = touchOnly ? X.cardOpenTouch : X.cardOpen;
      setLetters(g.name, `${p.handle.toUpperCase()} · `);
      setLetters(g.st, C.kicker);
      setLetters(g.hint, hint);
      g.btn.setAttribute('aria-label', `${p.handle}, ${C.kicker.toLowerCase()}. ${hint}`);
    }
    if (CTT.radar) {
      echoStop();
      stripShow();
    }
  }
  // a control changed (a notch, the switch): its tag shows it, for a moment if it was not pointed at
  function targetChanged(key) {
    const g = CTT[key];
    if (!g) return;
    const now = performance.now() / 1000;
    g.changedAt = now;
    g.touched = now;
    g.until = Math.max(g.until, now + CT.linger);
    wake();
    if (key === 'lever') {
      g.wayAt = now;
      arcPaths(g);
    } // (the switch's arrow now points the other way)
  }
  // where they go on the screen: each one from its world position at the framing (the camera is at rest once the visitor
  // has arrived), its tag kept 16 px inside the screen (measured with its full text)
  function placeTargets() {
    const vw = innerWidth,
      vh = innerHeight,
      { portrait, s, tx, ty } = framing(vw, vh);
    // a post's tag keeps inside the band the framing keeps: below, above the legal lines (in portrait, above the
    // sections' bar); above, below the site's top line (in portrait)
    const floor = Math.min(
        vh - 16,
        portrait ? vh - BANDS.bottom : $('legal').getBoundingClientRect().top - 8,
      ),
      ceil = portrait ? BANDS.top : 16;
    for (const key in CTT) {
      const g = CTT[key],
        [x, y] = targetOn(g, { s, tx, ty });
      if (g.btn) {
        // (a post or a control whose middle is outside the window is not there; a phone shows bay D)
        const off = x < 0 || x > vw || y < 0 || y > vh;
        g.btn.classList.toggle('off-view', off);
        if (off && document.activeElement === g.btn) g.btn.blur();
        g.off = off; // (nor its target)
        if (key === 'card0') ROOT.classList.toggle('menu-off', off); // (the menu out of view: the sections' bar)
      }
      if (g.kind === 'power') {
        // (the power button: its leader up to its tag, placed as the start-up's)
        const leadBottom = -(g.hh + TGT.padHover + 4),
          leadTop = Math.min(leadBottom - 24, devicePx((TGT.tagY - POWER.y) * s));
        setStyle(g.lead, 'top', leadTop + 'px');
        setStyle(g.lead, 'height', leadBottom - leadTop + 'px');
        setStyle(g.end, 'top', leadTop - 1.5 + 'px');
        [g.name, g.st, g.hint].forEach((L) => drawLetters(L, 'decode', 1, 0, 0));
        const w = g.tag.offsetWidth,
          hgt = g.tag.offsetHeight,
          left = Math.max(16 - x, Math.min(vw - 16 - x - w, -w / 2));
        setStyle(g.tag, 'transform', `translate(${devicePx(left)}px, ${devicePx(leadTop - hgt)}px)`);
        continue;
      }
      if (g.kind !== 'arcs') {
        // a post, or a menu's entry: its tag on the leader, on its side, or on the other one when the window has no room
        // there
        [g.name, g.st, g.hint].forEach((L) => drawLetters(L, 'decode', 1, 0, 0));
        const w = g.tag.offsetWidth,
          hgt = g.tag.offsetHeight,
          edge = devicePx(g.hh + CT.post.pad + 4);
        const fitsBelow = y + edge + CT.lead + hgt <= floor,
          fitsAbove = y - edge - CT.lead - hgt >= ceil;
        const below = g.side === 'above' ? !fitsAbove && fitsBelow : fitsBelow,
          near = below ? edge : -edge - CT.lead; // (near: the leader's top)
        g.lead.classList.toggle('down', below);
        setStyle(g.lead, 'top', near + 'px');
        setStyle(g.lead, 'height', CT.lead + 'px');
        setStyle(g.end, 'top', (below ? edge + CT.lead : near) - 1.5 + 'px');
        const left = Math.max(16 - x, Math.min(vw - 16 - x - w, -w / 2));
        setStyle(
          g.tag,
          'transform',
          `translate(${devicePx(left)}px, ${devicePx(below ? edge + CT.lead : near - hgt)}px)`,
        );
        continue;
      }
      const top = devicePx(g.hh + 4); // (the leader starts just under the control)
      setStyle(g.lead, 'top', top + 'px');
      setStyle(g.lead, 'height', CT.lead + 'px');
      setStyle(g.end, 'top', top + CT.lead - 1.5 + 'px');
      [g.name, g.st, g.hint].forEach((L) => drawLetters(L, 'decode', 1, 0, 0));
      const w = g.tag.offsetWidth,
        left = Math.max(16 - x, Math.min(vw - 16 - x - w, -w / 2));
      setStyle(g.tag, 'transform', `translate(${devicePx(left)}px, ${top + CT.lead}px)`);
      arcPaths(g);
    }
  }
  // a target where the camera shows its control (pose: the framing's; for the reading screen, the camera's as it moves,
  // then not snapped to the device's pixels): its place and size; a post's (a menu's entry's) corners, sized to it (a
  // tenth of its smaller side, 10 to 16 px), along its sides. Returns its place.
  function targetOn(g, { s, tx, ty }, snap = true) {
    const [x0, y0, x1, y1] = g.box,
      cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2,
      px = snap ? devicePx : (v) => v;
    const x = px(px(tx) + cx * s),
      y = px(px(ty) + cy * s);
    g.s = s;
    g.hw = ((x1 - x0) / 2) * s;
    g.hh = ((y1 - y0) / 2) * s;
    g.ax = (g.axis[0] - cx) * s;
    g.ay = (g.axis[1] - cy) * s;
    setStyle(g.el, 'transform', `translate(${x}px, ${y}px)`);
    if (g.pts) {
      g.cl = Math.round(Math.max(10, Math.min(16, Math.min(g.hw, g.hh) / 5)));
      setStyle(g.lock, '--cl', g.cl + 'px');
      g.q = g.pts.map(([qx, qy]) => [(qx - cx) * s, (qy - cy) * s]); // (its corners, about its middle, screen px)
      g.qa = cornerAxes(g.q, g.cl);
    }
    return [x, y];
  }
  // the arrows' paths (screen px about the control's axis, which is the svg's centre): arcs, and a head at the end of
  // each pointing the way it turns
  function arcPaths(g) {
    const pt = (r, deg) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
    const arc = (r, a0, a1) => {
      const [x0, y0] = pt(r, a0),
        [x1, y1] = pt(r, a1);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 0 ${a1 > a0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };
    const head = (r, a, dir) => {
      const [x, y] = pt(r, a),
        t = (a * Math.PI) / 180,
        ux = -Math.sin(t) * dir,
        uy = Math.cos(t) * dir,
        nx = Math.cos(t),
        ny = Math.sin(t),
        L = 4.5,
        W = 3;
      return `M${(x - ux * L + nx * W).toFixed(2)} ${(y - uy * L + ny * W).toFixed(2)}L${(x + ux * 0.5).toFixed(2)} ${(y + uy * 0.5).toFixed(2)}L${(x - ux * L - nx * W).toFixed(2)} ${(y - uy * L - ny * W).toFixed(2)}`;
    };
    let d, h, R;
    if (g.key === 'knob') {
      R = CT.knob * SOUND_S * g.s + 5;
      d = CT.knobArcs.map(([a0, a1]) => arc(R, a0, a1));
      h = CT.knobArcs.map(([, a1]) => head(R, a1, 1)).join('');
    } else {
      R = CT.bar.half * SOUND_S * g.s + 4;
      const from = CT.bar.angle + (soundOn ? LEVER_ON : 0),
        to = CT.bar.angle + (soundOn ? 0 : LEVER_ON),
        dir = to > from ? 1 : -1;
      d = [arc(R, from, to), arc(R, from + 180, to + 180)];
      h = head(R, to, dir) + head(R, to + 180, dir);
    }
    const S = Math.ceil(R + 8);
    g.svg.setAttribute('viewBox', `${-S} ${-S} ${2 * S} ${2 * S}`);
    Object.assign(g.svg.style, {
      left: g.ax - S + 'px',
      top: g.ay - S + 'px',
      width: 2 * S + 'px',
      height: 2 * S + 'px',
    });
    g.arcs.forEach((p, i) => p.setAttribute('d', d[i % 2]));
    g.heads.forEach((p) => p.setAttribute('d', h));
  }
  // a target still moving: opening (its tag's text the last in: CT.open.hint), leaving (closeAt, until CT.close.end), or
  // the reading screen's, locking while it is read (on the lock's clock): frames still needed, even behind a page
  // (resting)
  function targetsBusy(now) {
    for (const key in CTT) {
      const g = CTT[key];
      if (g.closeAt >= 0 || (g.openAt >= 0 && now - g.openAt < CT.open.hint[1])) return true;
    }
    return reading() && now - READ.lockAt < CT.open.hint[1];
  }
  // the one touched last; entered together (the pointer landing at once on a post inside a zone: an echo in the radar),
  // the post over the zone round it (its intent the smaller)
  const beats = (a, b) => a.touched > b.touched || (a.touched === b.touched && a.intent < b.intent);
  // each frame: which one is wanted (once the visitor has arrived), then each drawn on its own clock
  function targetsStep() {
    const now = performance.now() / 1000;
    let want = null;
    if (READ.id !== null)
      want = reading() ? 'screen' : null; // (while a screen is read, only its own, locked)
    else if (!walking())
      for (const key in CTT) {
        const g = CTT[key];
        if (!g.live() || g.off) continue; // (the power button's: while the station is up; the posts': once its menu is built; nothing out of view)
        const pointed = g.hover && now - g.hoverAt >= g.intent; // (a zone: once the pointer rests on it)
        const ringing = key === 'phone' && CALL.state === 'ringing'; // (the phone's tag up while it rings)
        if (
          (pointed || g.kbd || CTL[key]?.drag || now < g.until || ringing) &&
          (!want || beats(g, CTT[want]))
        )
          want = key;
      }
    // the menu's entry wanted is selected on the top screen at once
    const sel = want && CTT[want].kind === 'card' ? +want.slice(4) : -1;
    if (sel !== menuSel) {
      menuSel = sel;
      topDirty = true;
    }
    for (const key in CTT) {
      const g = CTT[key];
      if (key === want) {
        if (g.openAt < 0) g.openAt = now;
        g.closeAt = -1;
      } // (wanted again while leaving: it comes back as it was)
      else if (g.openAt >= 0 && g.closeAt < 0) {
        // (left before its leader started: it leaves from its arrows or corners, at once)
        g.inA = now - g.openAt;
        g.closeAt = now - (g.inA < CT.open.lead[0] ? CT.close.arc[0] : 0);
      }
      g.btn?.classList.toggle('locked', key === want); // (its corners mark its focus; else its outline does)
      drawTarget(g, now);
    }
  }
  // A post's corners along its sides. A corner is an L of side L (.tg-corner: its arms along its box's x and y axes),
  // mapped by a matrix whose axes are the post's two sides at that corner, so that its arms lie along them; it stands off
  // the post by o along the outward bisector, o / sin(angle), to be o from both sides (on a rectangle: o, o).
  // Per corner, in the lock's order (TL TR BL BR): m, the matrix's axes; p, where its box's origin goes for o = 0; out,
  // its way out.
  function cornerAxes(q, L) {
    const [tl, tr, br, bl] = q,
      unit = (a, b) => {
        const dx = b[0] - a[0],
          dy = b[1] - a[1],
          n = Math.hypot(dx, dy);
        return [dx / n, dy / n];
      };
    const top = unit(tl, tr),
      bottom = unit(bl, br),
      left = unit(tl, bl),
      right = unit(tr, br);
    // [the post's corner, the x axis (its top or foot), the y axis (its side), the L's corner in its box, its arms' ways]
    return [
      [tl, top, left, 0, 0, 1, 1],
      [tr, top, right, L, 0, -1, 1],
      [bl, bottom, left, 0, L, 1, -1],
      [br, bottom, right, L, L, -1, -1],
    ].map(([c, x, y, lx, ly, sx, sy]) => {
      const a = [x[0] * sx, x[1] * sx],
        b = [y[0] * sy, y[1] * sy],
        sin = Math.abs(a[0] * b[1] - a[1] * b[0]);
      return {
        m: [x[0], x[1], y[0], y[1]].map((v) => v.toFixed(4)).join(', '),
        p: [c[0] - x[0] * lx - y[0] * ly, c[1] - x[1] * lx - y[1] * ly],
        out: [-(a[0] + b[0]) / sin, -(a[1] + b[1]) / sin],
      };
    });
  }
  function drawTarget(g, now) {
    const O = CT.open,
      C = CT.close;
    if (g.openAt >= 0 && g.closeAt >= 0 && (reduce || now - g.closeAt >= C.end)) {
      g.openAt = g.closeAt = -1;
    }
    setStyle(g.el, 'visibility', g.openAt >= 0 ? 'visible' : 'hidden');
    if (g.openAt < 0) return;
    // (with reduced motion: there at once, gone at once)
    const a = reduce ? 9 : now - g.openAt,
      c = g.closeAt < 0 ? -1 : now - g.closeAt,
      inA = c >= 0 ? Math.min(a, g.inA) : a;
    // the reading screen's, while it is read: locked (lk, the lock's clock), its tag closed (tc, the tag's clock)
    const ov = g.key === 'screen' && READ.id !== null,
      lk = ov && READ.to === 1 ? (reduce ? 9 : now - READ.lockAt) : -1,
      tc = ov ? (lk >= 0 ? lk : 9) : c;
    const lit = g.lit();
    if (g.kind === 'power') {
      // the power button's corners, as at the start: they converge and snap, turning straight; they leave spreading out
      const spread =
        (TGT.spread - (TGT.spread - 1) * backOut(seg(inA, ...O.lock))) * (1 + 0.5 * in2(seg(c, ...C.arc)));
      setStyle(g.lock, 'opacity', (seg(inA, 0, 0.08) * (1 - seg(c, ...C.arc))).toFixed(3));
      setStyle(
        g.lock,
        'transform',
        `rotate(${(TGT.turn * (1 - out3(seg(inA, 0, O.turnDur)))).toFixed(2)}deg)`,
      );
      setStyle(g.lock, 'color', 'var(--ready)');
      const dx = (g.hw + TGT.padHover) * spread,
        dy = (g.hh + TGT.padHover) * spread;
      [
        [-dx, -dy],
        [dx - 10, -dy],
        [-dx, dy - 10],
        [dx - 10, dy - 10],
      ].forEach(([u, v], i) =>
        setStyle(g.corners[i], 'transform', `translate(${u.toFixed(2)}px, ${v.toFixed(2)}px)`),
      );
    } else if (g.kind === 'arcs') {
      // the arrows, the lock: they converge and snap (back.out) as their turn straightens (out3), drawing themselves along,
      // their heads last; they leave drawn back and spreading out; the switch's are drawn anew when it changes way
      const spread =
        (CT.spread - (CT.spread - 1) * backOut(seg(inA, ...O.lock))) * (1 + 0.3 * in2(seg(c, ...C.arc)));
      const turn = -TGT.turn * (1 - out3(seg(inA, 0, O.turnDur)));
      setStyle(g.svg, 'transform', `rotate(${turn.toFixed(2)}deg) scale(${spread.toFixed(4)})`);
      const arc =
        out2(Math.min(seg(inA, ...O.arc), seg(now - g.wayAt, 0, O.arc[1] - O.arc[0]))) *
        (1 - seg(c, ...C.arc));
      // (an arc drawn back to nothing would leave its round cap, a dot: it fades as it ends, or two tiny yellow dots stay
      // behind when the pointer goes from the volume knob to the sound switch)
      g.arcs.forEach((p) => {
        setStyle(p, 'stroke-dashoffset', (1 - arc).toFixed(4));
        setStyle(p, 'opacity', seg(arc, 0, 0.12).toFixed(3));
      });
      g.heads.forEach((p) => setStyle(p, 'opacity', seg(arc, 0.85, 1).toFixed(3)));
    } else {
      // a post's corners: they come in from a little farther out and snap onto it (back.out), without the power's turn
      // (a post is large: turned, its corners would swing far); they leave spreading out
      const out =
        CT.post.from * (1 - backOut(seg(inA, ...O.lock))) + 0.5 * CT.post.from * in2(seg(c, ...C.arc));
      const blink = lk >= 0 && READ_T.blink.some((b) => lk >= b && lk < b + READ_T.off); // (locked, it blinks twice)
      const near = ov ? (lk >= 0 ? 1 - seg(CAM.r, 0.7, 0.95) : 0) : 1; // (close up, the bezel leaves the window: its corners fade out on the way; coming back, none)
      setStyle(g.lock, 'opacity', (blink ? 0 : seg(inA, 0, 0.08) * (1 - seg(c, ...C.arc)) * near).toFixed(3));
      setStyle(g.lock, 'color', lk >= 0 ? 'var(--ready)' : ''); // (locked: green, as the main power pressed)
      const o = CT.post.pad * (lk >= 0 ? 1 - out2(seg(lk, 0, READ_T.tighten)) : 1) + out; // (each corner on its own corner of the post, its arms along its sides; locked, tight on it)
      g.qa.forEach(({ m, p, out: d }, i) =>
        setStyle(
          g.corners[i],
          'transform',
          `matrix(${m}, ${(p[0] + d[0] * o).toFixed(2)}, ${(p[1] + d[1] * o).toFixed(2)})`,
        ),
      );
    }
    // the leader, drawn from the lock (down to the tag below; the power button's, and a post's tag above it, up)
    const lead = expoOut(seg(inA, ...O.lead)) * (1 - out2(seg(tc, ...C.lead)));
    setStyle(g.lead, 'transform', `scaleY(${lead.toFixed(4)})`);
    setStyle(g.end, 'opacity', seg(lead, 0.85, 1).toFixed(3));
    // the tag: its plate opens from its centre; its name decodes, then its state; how to use it is typed
    const plate = sinIO(seg(inA, ...O.plate)) * (1 - sinIO(seg(tc, ...C.plate)));
    setStyle(g.tag, 'opacity', plate > 0 ? '1' : '0');
    setStyle(g.plate, 'transform', `scaleX(${plate.toFixed(4)})`);
    g.marks.forEach((m) => setStyle(m, 'opacity', seg(plate, 0.8, 1).toFixed(3)));
    const wipe = seg(tc, ...C.text);
    setStyle(g.sq, 'opacity', (plate >= 1 && seg(inA, ...O.name) > 0 ? 1 - wipe : 0).toFixed(3));
    const tint = g.tint?.() ?? null; // (an echo, its line in its own colour, a faction's or a person's white; the radar, once a faction is joined, in its colour)
    setStyle(g.l1, 'color', tint ?? '');
    setStyle(g.sq, 'color', tint ?? (lit ? 'var(--ready)' : 'var(--standby)'));
    setStyle(g.stEl, 'color', tint ?? '');
    g.stEl.classList.toggle('on', lit);
    drawLetters(g.name, 'decode', seg(inA, ...O.name), wipe, now);
    drawLetters(g.st, 'decode', Math.min(seg(inA, ...O.state), seg(now - g.changedAt, 0, 0.16)), wipe, now);
    drawLetters(g.hint, 'type', Math.min(seg(inA, ...O.hint), seg(now - g.wayAt, 0, 0.3)), wipe, now);
  }

  // The audio monitor: the analyser's spectrum in 16 bands (log-spaced, 50 Hz to 12 kHz), on a level scale of 60 dB.
  const MON = {
    bands: 16,
    lo: 50,
    hi: 12000,
    floor: -92,
    range: 58,
    release: 1.3,
    hold: 0.8,
    fall: 0.55,
    volShow: 1.4,
  };
  const mon = {
    v: new Float32Array(MON.bands),
    pk: new Float32Array(MON.bands),
    held: new Float32Array(MON.bands),
    data: null,
    edges: null,
    volAt: -Infinity,
    soundAt: -Infinity,
  };
  const monLive = () => !!(snd && soundOn && audioCtx && audioCtx.state === 'running'); // (the sound on and playing: the analyser to read)
  function monitorStep(dt) {
    const live = monLive(),
      target = new Float32Array(MON.bands);
    if (live) {
      const an = snd.analyser;
      if (!mon.data) {
        mon.data = new Float32Array(an.frequencyBinCount);
        const hz = audioCtx.sampleRate / an.fftSize;
        mon.edges = Array.from({ length: MON.bands + 1 }, (_, i) =>
          Math.max(1, Math.round((MON.lo * Math.pow(MON.hi / MON.lo, i / MON.bands)) / hz)),
        );
      }
      an.getFloatFrequencyData(mon.data);
      for (let b = 0; b < MON.bands; b++) {
        let p = 0;
        const a = mon.edges[b],
          z = Math.max(a + 1, mon.edges[b + 1]);
        for (let i = a; i < z; i++) p += Math.pow(10, mon.data[i] / 10);
        target[b] = clamp01((10 * Math.log10(p / (z - a) + 1e-12) - MON.floor) / MON.range);
      }
    }
    for (let b = 0; b < MON.bands; b++) {
      mon.v[b] = Math.max(target[b], mon.v[b] - MON.release * dt);
      if (mon.v[b] >= mon.pk[b]) {
        mon.pk[b] = mon.v[b];
        mon.held[b] = MON.hold;
      } else if ((mon.held[b] -= dt) <= 0) mon.pk[b] = Math.max(mon.v[b], mon.pk[b] - MON.fall * dt);
    }
  }
  const PHOS = (a) => `rgba(130, 230, 150, ${a})`;
  // The monitor's face, legible first (the screen is 130 x 84 canvas px, under 100 px wide on a laptop): bold mono
  // letters of 9 px and more in bright phosphor; a header of its own (AUDIO, and the volume or OFF) over a rule, the
  // grid only under the bands; a message across the middle (the volume just turned, with its ten steps; the sound just
  // switched on; the sound off, which stays) on a dark band of its own, the bands fading under it.
  const MONF = { head: 13, label: 9, msg: 11 };
  function drawMonitor(s, A, force = false) {
    const { c, w, h } = s,
      X = T(),
      live = snd && soundOn,
      H = MONF.head;
    // (what it shows, in short: the same as at its last drawing, nothing is drawn)
    const now0 = performance.now() / 1000,
      show0 = (at) => Math.max(0, Math.min(1, (MON.volShow - (now0 - at)) / 0.4));
    const rows0 = Math.floor((h - 5 - (H + 4)) / 4),
      key = [
        A.toFixed(2),
        LANG,
        soundOn,
        volStep,
        live,
        show0(mon.volAt).toFixed(2),
        show0(mon.soundAt).toFixed(2),
        Array.from(mon.v, (v) => Math.round(v * rows0)).join(),
        Array.from(mon.pk, (v) => Math.round(v * rows0)).join(),
      ].join('|');
    if (!force && key === s.monKey) return;
    s.monKey = key;
    glass(c, w, h, '#06110a');
    c.save();
    c.globalAlpha = A;
    mono(c, X.audio, 5, 10, MONF.label, PHOS(0.75), 'left', 700);
    mono(
      c,
      soundOn ? `VOL ${volStep * 10}%` : X.off,
      w - 5,
      10,
      MONF.label,
      PHOS(soundOn ? 0.95 : 0.6),
      'right',
      700,
    );
    c.fillStyle = PHOS(0.28);
    c.fillRect(4, H, w - 8, 1);
    grid(c, 0, H + 1, w, h - H - 1, 8, 4);
    // the message: the knob just turned (for a moment), the switch just turned on (for a moment), or the sound off
    const now = performance.now() / 1000,
      shown = (at) => {
        const t = now - at;
        return t < MON.volShow ? (t < MON.volShow - 0.4 ? 1 : (MON.volShow - t) / 0.4) : 0;
      };
    const vk = shown(mon.volAt),
      sk = soundOn ? shown(mon.soundAt) : 0;
    const msg =
      vk > 0
        ? { k: vk, text: `${X.vol} ${volStep * 10} %`, steps: true }
        : sk > 0
          ? { k: sk, text: `${X.soundWord} ${X.on}` }
          : !live
            ? { k: 1, text: X.muted }
            : null;
    // the bands: segmented columns, brighter as they rise; the peak mark above
    c.globalAlpha = A * (msg ? 1 - 0.8 * Math.min(1, msg.k * 2) : 1);
    const x0 = 6,
      x1 = w - 6,
      y0 = H + 4,
      y1 = h - 5,
      seg = 3,
      gap = 1,
      rows = Math.floor((y1 - y0) / (seg + gap)),
      bw = (x1 - x0) / MON.bands;
    for (let b = 0; b < MON.bands; b++) {
      const n = Math.round(mon.v[b] * rows),
        x = x0 + b * bw + 0.5;
      for (let r = 0; r < Math.max(1, n); r++) {
        c.fillStyle = PHOS(r < n ? 0.45 + 0.45 * (r / rows) : 0.12);
        c.fillRect(x, y1 - (r + 1) * (seg + gap) + gap, bw - 1.5, seg);
      }
      const pk = Math.round(mon.pk[b] * rows);
      if (pk > n) {
        c.fillStyle = PHOS(0.9);
        c.fillRect(x, y1 - pk * (seg + gap) + gap, bw - 1.5, seg - 1);
      }
    }
    if (msg) {
      const bh = msg.steps ? 30 : 20,
        by = Math.round((H + h) / 2 - bh / 2);
      c.globalAlpha = A * msg.k;
      c.fillStyle = 'rgba(4, 12, 7, .92)';
      c.fillRect(4, by, w - 8, bh);
      c.fillStyle = PHOS(0.35);
      c.fillRect(4, by, w - 8, 1);
      c.fillRect(4, by + bh - 1, w - 8, 1);
      mono(c, msg.text, w / 2, by + 14, MONF.msg, PHOS(0.98), 'center', 700);
      if (msg.steps) {
        const sw = (w - 20) / VOL.steps;
        for (let i = 0; i < VOL.steps; i++) {
          c.fillStyle = PHOS(i < volStep ? 0.92 : 0.18);
          c.fillRect(10 + i * sw, by + 19, sw - 2, 6);
        }
      }
    }
    c.restore();
  }

  // ===================================================================================================================
  // The sounds. Real recordings (public/sounds/, CC0), played by sounds.js. Off by default (a browser allows sound only
  // after a gesture anyway): [ sound ] turns them on, and the choice is kept for the visit (sessionStorage).
  // The files are only fetched once the sound is on (or was on earlier in the visit). Each sound starts when the page
  // itself does the thing (the press, a relay, a screen, SYSTEM READY): it follows the power time (termT),
  // so a stalled page never puts the sound ahead of the picture; a sound whose moment has passed (the sound came on
  // later, the arrival was skipped) is not played. The room's hum and fans follow the bays that have power.
  // ===================================================================================================================
  // (the room's hum rises with the bays, one step per relay, straight to a faint presence: idle, a share of its level,
  // never loud; it stays even, with no swell: rising to its full level and settling back afterwards, it stood out at
  // one moment (measured: 9 dB above its rest at 11 to 13 s). No typing sounds either: a key's tick per printed line
  // was only noise.)
  const SOUND = {
    pref: 'wardogs.sound',
    base: '/sounds/',
    late: 0.25,
    latePress: 0.6,
    idle: 0.35,
    step: 1.6,
  };
  const soundBtn = $('sound');
  let audioCtx = null,
    snd = null,
    soundOn = false,
    soundLoad = null,
    soundFetch = null;
  const soundPref = {
    get: () => {
      try {
        return sessionStorage.getItem(SOUND.pref) === '1';
      } catch {
        return false;
      }
    },
    set: (on) => {
      try {
        sessionStorage.setItem(SOUND.pref, on ? '1' : '0');
      } catch {
        /* private mode: off at the next visit */
      }
    },
  };
  function soundLabel() {
    if (!soundBtn) return;
    soundBtn.textContent = soundOn ? T().soundOn : T().soundOff;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.setAttribute('aria-label', T().soundLabel);
    controlsLabel();
  }
  // the context is made in a gesture (it then may play); the files fetched beforehand are only decoded
  function loadSound() {
    if (!soundLoad) {
      audioCtx ??= new AudioContext();
      soundLoad = createConsoleSounds(audioCtx, SOUND.base, soundFetch || fetchConsoleSounds(SOUND.base))
        .then((s) => {
          snd = s;
          sfx.bed = -1;
          snd.setVolume(volGain(volStep));
          soundSync();
        }) // (the room's hum at once, frames or not)
        .catch((err) => {
          console.error(err);
          soundLoad = null;
          soundFetch = null; // (fetched again next time)
        });
    }
    return soundLoad;
  }
  function setSound(on) {
    soundOn = on;
    soundPref.set(on);
    soundLabel();
    smallShow();
    mon.soundAt = performance.now() / 1000;
    mon.volAt = -Infinity;
    targetChanged('lever');
    if (on) {
      loadSound();
      audioCtx.resume();
    } else if (audioCtx) {
      if (snd) snd.toggle();
      setTimeout(() => {
        if (!soundOn) audioCtx.suspend();
      }, 260);
    } // the switch's clac first
  }
  // what sounds, when (power time, s): the press, each bay's relay, each screen (its tube's crackle alone for a small
  // display), SYSTEM READY
  let SOUND_EVENTS = null;
  function soundEvents() {
    if (SOUND_EVENTS) return SOUND_EVENTS;
    const ev = [[0, 'press']];
    LIGHT.order.forEach((b) => ev.push([RELAY[b], 'relay']));
    Object.keys(TUBE).forEach((id) => ev.push([tubeStart(id), 'screen', !!SMALL_DELAY[id]]));
    ev.push([bootLog().ready, 'ready']);
    return (SOUND_EVENTS = ev.sort((a, b) => a[0] - b[0]));
  }
  const sfx = { next: 0, lastP: -Infinity, bed: -1 };
  function soundStep(p) {
    if (p < sfx.lastP - 0.5) sfx.next = 0; // the arrival plays again
    sfx.lastP = p;
    if (!snd || !soundOn || seeking) return;
    const ev = soundEvents();
    while (sfx.next < ev.length && p >= ev[sfx.next][0]) {
      const [at, kind, small] = ev[sfx.next++];
      if (p - at > (kind === 'press' ? SOUND.latePress : SOUND.late)) continue;
      if (kind === 'press') snd.press();
      else if (kind === 'relay') snd.relay();
      else if (kind === 'screen') snd.screen(undefined, small);
      else snd.ready();
    }
    const k = (LIGHT.order.filter((b) => p >= RELAY[b]).length / LIGHT.order.length) * SOUND.idle;
    if (k !== sfx.bed) {
      sfx.bed = k;
      snd.bedLevel(k, undefined, SOUND.step);
    }
  }
  // the sounds in step with the scene: the start-up's and the room's hum on the power time; switched off, the shutdown's
  // own (stationStep). Each frame, and at once where no frame may come (motion reduced, the sounds just ready while a
  // page is read at rest)
  function soundSync() {
    if (!(SW.off !== null && SW.on === null)) soundStep(termT);
  }
  // The shutdown's sounds (shutdown time q): the button, each relay opening, a tube's crackle as each bay's screens
  // collapse; the room's hum going down with the bays, to nothing
  const sfxOff = { next: 0, lastQ: Infinity };
  function offSoundStep(q) {
    if (q < sfxOff.lastQ) sfxOff.next = 0; // (a new shutdown)
    sfxOff.lastQ = q;
    if (!snd || !soundOn) return;
    const ev = [
      [0, 'press'],
      ...['D', 'C', 'B', 'A', 'top'].flatMap((b) => [
        [OFF.relay[b], 'relay'],
        [OFF.relay[b] + 0.03, 'crackle'],
      ]),
    ];
    while (sfxOff.next < ev.length && q >= ev[sfxOff.next][0]) {
      const [at, kind] = ev[sfxOff.next++];
      if (q - at > SOUND.late) continue;
      if (kind === 'press') snd.press();
      else if (kind === 'relay') snd.relay();
      else snd.screen(undefined, true);
    }
    const k =
      q === Infinity
        ? 0
        : (LIGHT.order.filter((b) => q < OFF.relay[b]).length / LIGHT.order.length) * SOUND.idle;
    if (k !== sfx.bed) {
      sfx.bed = k;
      snd.bedLevel(k, undefined, 0.5);
    }
  }
  function replay() {
    readReset();
    arrivalT = 0;
    powerAt = Infinity;
    SW.off = SW.on = null;
    SW.rest = false;
    seeking = false;
    ROOT.classList.remove('seeking');
    arrival(0);
  }
  // a still frame (?ct=<s>, read once the console is ready): the clocks frozen, the scene shown as it is at time t
  function seek(t) {
    readReset();
    seeking = true;
    sceneT = t;
    arrivalT = null;
    SW.off = SW.on = null;
    SW.rest = false;
    ROOT.classList.add('seeking');
    TQ.row = -1; // (no line of the terminal read again in a capture)
    if (rerasterPending) rerasterWorld();
    // (the button pressed CAPTURE_POWER s after arriving, as a visitor would)
    powerAt = WALK_END + CAPTURE_POWER;
    if (t >= powerAt + P_TAIL) arrivalEnd();
    else arrival(t);
    termT = t - powerAt;
    update(t, 1 / 30, true);
  }

  // ===================================================================================================================
  // Language
  // ===================================================================================================================
  function applyLang() {
    $('skip').textContent = T().skip;
    $('skip').setAttribute('aria-label', T().skipLabel);
    soundLabel();
    motionLabel();
    powerTexts();
    legal2.textContent = legalOwn ? T().legal2 : T().intro2;
    if (CTT.knob) controlsLabel();
    layout();
    wake(); // (after the texts, the legal lines among them: all is measured with them)
    if ($('sections').children.length) sectionsTexts();
    if (PAD.keys.clear) padTexts();
    if (CALL.state === 'connected') callTexts();
    if (SCR.principal) {
      drawTower();
      drawCode(SCR.code);
      smallShow();
    }
    backTexts();
    if (PAGE.id !== null) pageBuild(PAGE.id, true); // (the page read, in the other language, where it was)
    if (SCR.haut) {
      drawTopBase(SCR.haut);
      drawTerminal(SCR.haut, sceneT);
    }
  }

  // The main power button: the button, a click anywhere on the console, Enter or Space power the station on; once it is
  // on, the button itself switches it off, and on again (a click elsewhere only switches it on)
  function wirePowerButton() {
    const press = (button) => {
      if (button && stationUp()) switchOff();
      else if (arrivalT !== null) {
        if (arrivalT >= WALK_END - 0.5) switchOn(arrivalT);
      } else if (stationOff()) switchOnAgain();
    };
    PT.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      press(true);
    });
    ROOT.addEventListener('click', (e) => {
      if (!e.target.closest('button, a, .ctl')) press(false);
    });
    // under the pointer, or focused from the keyboard, the corners close in on the button
    const hover = (on) => () => {
      PT.hover = on;
    };
    PT.btn.addEventListener('pointerenter', hover(true));
    PT.btn.addEventListener('pointerleave', hover(false));
    PT.btn.addEventListener('focus', hover(true));
    PT.btn.addEventListener('blur', hover(false));
    addEventListener('keydown', (e) => {
      if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat || onHold) return;
      const onButton = e.target.id === 'st-power-btn';
      if (!ROOT.classList.contains('awaiting-power') && !(onButton && stationUp())) return;
      if (e.target.closest?.('button, a, .ctl') && !onButton) return; // another control, or a link, keeps its own keys
      e.preventDefault();
      press(onButton);
    });
  }

  // ===================================================================================================================
  // Start
  // ===================================================================================================================
  // (line 2 starts on the intro's credit when the film has just played over the console, then the console's own)
  const legalHandoverOn = heldAtStart && !reduce;
  legalOwn = !legalHandoverOn;
  applyLang(); // texts first: the legal lines are right from the first paint
  camera(); // the world sits at the validated framing under the curtain
  ROOT.classList.add('room-dark', 'hud-hidden');
  panelT = 0;
  roomLight = 0;
  if (LITE) ROOT.classList.add('lite');

  (async () => {
    try {
      if (onHold) await new Promise((go) => (buildGo = go));
      // the screens' typeface, loaded with the pictures and waited for before the screens' first drawing (their titles
      // are fitted by measuring their text); a face that does not come within 3 s leaves its fallback
      const faces = Promise.race([
        Promise.all(
          [400, 500, 600, 700].map((w) => document.fonts.load(`${w} 20px "Barlow Semi Condensed"`)),
        ),
        new Promise((r) => setTimeout(r, 3000)),
      ]).catch(() => {});
      CAL = { ...CAL, ...dataLights };
      const [z, pieces, keys, glass, screenFix, knobFilm, lensFix] = [
        dataZones,
        dataPieces,
        dataKeys,
        dataGlass,
        dataScreens,
        dataKnob,
        dataLenses,
      ];
      // the room pictures at the size this screen needs
      const size = roomSize();
      $('dark').src = media(`salle-eteinte-${size}.webp`);
      litImg.src = media(`salle-allumee-${size}.webp`);
      // the moving pieces, dark under lit, each cropped to its own box
      for (const [id, p] of Object.entries(pieces)) {
        for (const light of ['eteinte', 'allumee']) {
          const im = document.createElement('img');
          im.className = 'piece ' + (light === 'allumee' ? 'lit' : 'dark');
          im.alt = '';
          im.dataset.p = id;
          im.src = media(`pieces/${id}-${light}.webp`);
          Object.assign(im.style, {
            left: p.x + 'px',
            top: p.y + 'px',
            width: p.w + 'px',
            height: p.h + 'px',
          });
          $('pieces').append(im);
        }
      }
      for (const light of ['eteinte', 'allumee']) {
        const box = document.createElement('div'),
          st = document.createElement('img');
        box.className = 'piece film ' + (light === 'allumee' ? 'lit' : 'dark');
        box.dataset.p = KNOB.id;
        Object.assign(box.style, {
          left: knobFilm.x + 'px',
          top: knobFilm.y + 'px',
          width: knobFilm.w + 'px',
          height: knobFilm.h + 'px',
        });
        st.className = 'strip';
        st.alt = '';
        st.src = media(`pieces/${KNOB.id}-${light}.webp`);
        Object.assign(st.style, {
          width: knobFilm.stride * knobFilm.frames + 'px',
          height: knobFilm.h + 'px',
        });
        box.append(st);
        $('pieces').append(box);
      }
      litPieces = [...ROOT.querySelectorAll('.piece.lit')];
      // (a screen whose zone is off its glass takes its outline measured on the picture, screens.json)
      z.screens.forEach((s) => {
        if (screenFix[s.id]) s.quad = screenFix[s.id];
      });
      // (a lens placed off its glass, bay D's, takes its outline measured on the picture, lenses.json)
      z.lights.forEach((l) => {
        if (lensFix[l.id]) Object.assign(l, lensFix[l.id]);
      });
      z.lenses.forEach((l) => {
        if (lensFix[l.id]?.color) l.color = lensFix[l.id].color;
      }); // (recoloured in their pictures)
      padLampsFrom(z);
      await faces;
      SCREEN_IDS.forEach((id) => makeScreen(z.screens.find((s) => s.id === id)));
      Object.values(SCR).forEach(emptyOn);
      drawRadarBase(SCR.carte);
      buildRadar(SCR.carte);
      buildNeedles(z);
      buildKeys(keys);
      buildLamps(z, glass);
      ROOT.classList.add('finish');
      buildFills();
      buildControls(pieces, knobFilm);
      buildPosts();
      lampStep(0);
      const SPILL = {
        carte: 'rgba(110,170,255,.2)',
        principal: 'rgba(159,251,193,.13)',
        code: 'rgba(159,251,193,.11)',
        'crt-b': 'rgba(120,230,150,.13)',
        haut: 'rgba(200,230,210,.06)',
      };
      Object.entries(SPILL).forEach(([id, col]) => SCR[id].el.style.setProperty('--spill', col));
      applyLang(); // now that the screens exist
      if (!LITE) buildLitBays(litImg.src);
      Object.values(SCR).forEach((s) => tubeOn(s, -1)); // no power yet
      // every picture is decoded before anything is shown
      await Promise.all([...world.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
      // (a picture that could not load, the network cut: no console with a hole in it, the page given back)
      const missing = [...world.querySelectorAll('img')].filter((i) => !i.naturalWidth).length;
      if (missing) throw new Error(`${missing} of the console's pictures could not load`);
      // two frames and a quarter second under the black, so the first paint of the big pictures happens unseen
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 250))));
      if (loadGivenUp) return; // (too late: the page is the presentation's)
      clearTimeout(loadTimer);
      wirePowerButton();
      $('skip').addEventListener('click', skipArrival);
      addEventListener('keydown', (e) => {
        // (while [ skip ] shows: past P_END, ESC is BACK's, for a section the menu may already open)
        if (e.key === 'Escape' && !e.repeat && arrivalT !== null && arrivalT - powerAt < P_END && !onHold) {
          e.preventDefault();
          skipArrival();
        }
      });
      if (!onHold) begin();
      soundOn = soundPref.get();
      soundLabel();
      soundBtn.hidden = false;
      motionBtn.hidden = false; // ([ animations ] beside it)
      CTL.lever.angle = soundOn ? LEVER_ON : 0;
      applyControls(); // the switch already in place
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSound(!soundOn);
      });
      // on earlier in the visit: the files are fetched now, and the first gesture lets the sound play
      if (soundOn) {
        soundFetch = fetchConsoleSounds(SOUND.base);
        soundFetch.catch(() => {});
        const unlock = () => {
          if (soundOn) {
            loadSound();
            if (onHold) audioCtx.suspend();
            else audioCtx.resume();
          }
          removeEventListener('pointerdown', unlock, true);
          removeEventListener('keydown', unlock, true);
        };
        addEventListener('pointerdown', unlock, true);
        addEventListener('keydown', unlock, true);
      }
      // a hidden tab is silent
      document.addEventListener('visibilitychange', () => {
        if (!audioCtx) return;
        if (document.hidden) audioCtx.suspend();
        else if (soundOn && !onHold) audioCtx.resume();
      });
      built = true;
      update(sceneT, 0, true); // the first drawing of the screens, in the state just set
      wake(); // (the frame loop; with reduced motion, the still frames as they are asked for)
      if (stillT !== null && !onHold) seek(stillT);
      stationState(ROOT, 'ready');
    } catch (err) {
      // without its data the console cannot be drawn: it gives the page back (station.css: [data-state='error'])
      stationState(ROOT, 'error');
      console.error(err);
    }
  })();
  if (!onHold) loadLimit();

  // ===================================================================================================================
  // In its page, under the intro film
  // ===================================================================================================================
  // the console opens, once: with reduced motion, its arrival's end state at once; else once per visit, already on
  // (from black) if the station was switched on earlier in this tab, or if the address asks for a section (deep), or
  // its arrival
  function begin() {
    begun = true;
    if (reduce) {
      arrivalEnd();
      liveControls();
    } else if (visit.seen() || deep) {
      visit.remember();
      arrivalEnd();
      fadeIn();
    } else replay();
  }
  // the film gone: the console opens (as soon as it is built, if it is not yet); after a hold, it goes on as it was (its
  // arrival, a page read), from black
  function start() {
    if (!onHold && begun) return;
    onHold = false;
    loadLimit();
    if (!built) {
      buildGo?.(); // (held from the start: it builds now, then opens)
      buildGo = null;
      return;
    }
    if (!begun) begin();
    else fadeIn();
    if (stillT !== null) seek(stillT);
    update(sceneT, 0, true);
    if (soundOn && audioCtx && !document.hidden) audioCtx.resume(); // (a hidden tab stays silent: visibilitychange)
    wake();
  }
  // the film replayed over it: the console stands as it is (no frame, no key, no sound) until start(); what runs on its
  // own timers is called off (a call, the keypad's answer, a hack)
  function hold() {
    if (onHold) return;
    onHold = true;
    if (built) {
      padReset();
      callStop();
      hackEnd(false);
    }
    if (begun) veil.style.opacity = '1'; // (dark under the film, which ends on black; start() lifts it: fadeIn)
    audioCtx?.suspend();
  }
  function loadLimit() {
    if (built || loadTimer) return;
    // (a hidden tab draws no frame, so the build waits there: its time counts again once the tab is shown)
    const giveUp = () => {
      if (built) return;
      if (document.hidden) {
        document.addEventListener('visibilitychange', () => (loadTimer = setTimeout(giveUp, LOAD_LIMIT)), {
          once: true,
        });
        return;
      }
      loadGivenUp = true;
      stationState(ROOT, 'error');
    };
    loadTimer = setTimeout(giveUp, LOAD_LIMIT);
  }
  return { start, hold };
}
