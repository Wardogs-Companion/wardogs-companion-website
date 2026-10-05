// WARDOGS Companion's intro, the home page's opening: a film of about 24.7 s, drawn by the page as a pure function of
// time, the same on every screen; then the home page's presentation fades in.
//   1. The opening shot of the WARDOGS reveal trailer (the clip, then its last frame in 4K): the rifle over the valley,
//      the Little Birds flying in. The scenery dims around the eyepiece on the near helicopter and the scope pushes
//      straight in on it, faster and faster (motion blur), while the eyepiece settles to where the creator will be; at
//      the peak, inside the blur, the soldier in the centre becomes the press-kit Little Bird's creator (the change of
//      shot); the push dies out and the focus comes back.
//   2. The creator, identified, in mustard yellow.
//   3. The scope pulls out the same way, the way in played backwards: at the peak the creator becomes the trailer's
//      soldier again, and the pull-out dies out on the clip's own framing, both helicopters in view.
//   4. The scope swings to the second helicopter, over the town, in one glide with its inertia (the heading strip turns
//      with it, MAG follows), and pushes in on it as on the first: at the peak it becomes the developers' Little Bird
//      over the industrial town; allies, in green, one tag.
//   5. Same picture in the lens: the scope glides to the concrete tower, our emblem painted on its wall, target locked
//      in red. Then the scope eases out to black, and the stage fades out over the home page's presentation.
// Around the lens, all film long, the scenery stays the trailer's landscape, dimmed and out of focus, as the eye sees
// it past a scope it aims through: only the lens shows the close-ups. The recon HUD follows the game's recon scope and
// turret camera (heading strip, status under the scope, range and magnification on the reticle's line, tinted target
// box with a diamond), never its pixels.
// Rendering: every still picture is a canvas painted once per layout (the press-kit pictures graded, the trailer's
// shot as it is; at the resolution it is shown at, small windows included, so nothing shimmers when the compositor
// shrinks it) and, like the clip, only moved by the compositor (transform, opacity); only the lens's motion canvas is
// drawn per frame, from the lens taking the picture over until the first push dies out, then from the pull-out until
// the second push dies out (the swing included). Every animated value is a channel of time (ch, mv, V), with no
// randomness: a moment always renders the same frame.
// Media: the opening clip (2560 x 1440, muted) and its last frame in 4K, from the WARDOGS reveal trailer; littlebird-1
// and littlebird-2, from the WARDOGS press kit; all © BULKHEAD / Team17. They are never in the repository: the build
// fetches them from a private store into the site (src/integrations/game-media.mjs), and the stage names them in its
// data-media attribute. The emblem's paint layers and the grain are still SVG pictures (public/images/intro, made by
// scripts/intro-svg.mjs), the typefaces are in public/fonts, the reticle is drawn by the page: nothing is loaded from
// elsewhere.
// The stage's life on the page (from the first paint, the end, skip, replay, reduced motion, a film that cannot play):
// see "The stage's life" at the end.
import { EAIM, EBOX, PAINT, PATCH } from './emblem.js';

// The still SVG pictures the film paints from: the emblem's paint layers, in the order buildPaint takes them (the
// brackets' colours, the capsules' colours, the brackets picked out, the worn coverage), and the screen's grain.
const ART = '/images/intro/';
const PAINT_LAYERS = [
  'emblem-brackets.svg',
  'emblem-capsules.svg',
  'emblem-brackets-select.svg',
  'emblem-wear.svg',
].map((f) => ART + f);
const GRAIN = ART + 'grain.svg';

/**
 * Mounts the intro film on its stage (IntroFilm.astro), over the home page's presentation.
 * @param {HTMLElement} stage the stage, with the film's texts (data-texts) and its media's site paths (data-media)
 * @param {HTMLElement} home the presentation under it, out of reach while the stage is on
 * @param {HTMLButtonElement | null} replayBtn the presentation's control that plays the film again
 */
export function mountIntro(stage, home, replayBtn) {
  const MEDIA = JSON.parse(stage.dataset.media || 'null');
  if (!MEDIA) {
    stage.hidden = true;
    return;
  }
  // ---------------------------------------------------------------------------------------------------------
  // Pictures and scene data, in SOURCE pixels of each picture (measured on crop + grid pages and edge profiles).
  const PICS = {
    op: { src: MEDIA.op, w: 3840, h: 2160 },
    lb: { src: MEDIA.lb, w: 3840, h: 2160 },
    l2: { src: MEDIA.l2, w: 3840, h: 2160 },
  };
  const CLIP_SRC = { src: MEDIA.clip, w: 2560, h: 1440 }; // the opening clip; its last frame is PICS.op
  const SCENE = {
    // Last frame of the opening clip (4K). The near helicopter (the big one, left of the chimneys): its body (cabin
    // and the soldiers on the benches) 1950..2110 x 605..715. The push-in target is the soldier on its right bench
    // (head 2073, 578; chest 2082, 610), who becomes the creator: he too sits right of the cabin in the press-kit
    // picture. The scope closes on him and pushes straight in, him in the centre of the reticle, until the body fills
    // most of the glass: at the change of shot the soldier in the centre becomes the creator in the centre. fx: the
    // clip's framing centre on landscape and portrait screens (portrait keeps both helicopters in view). aim2: the
    // second helicopter (the developers'), right of the chimneys over the town, small and hazy, its rotors blurred:
    // cabin, skids and tail 2449..2527 x 800..898, the cabin's dark mass centred on 2489, 866.
    op: {
      aim: { x: 2082, y: 610 },
      bodyW: 160,
      fx: 1920,
      fxPortrait: 2145,
      aim2: { x: 2489, y: 866 },
      bodyW2: 76,
    },
    // Press-kit Little Bird: soldier with the green armband, right of the cabin. Upper body: helmet top 558,
    // armband left edge 1735, muzzle 2066, chest pouches 915. The target box fits the glass at the hold.
    // The studio mark (x 3690..3805, y 1985..2125) is never on screen: the view never goes below y 1975.
    lb: { aim: { x: 1897, y: 740 }, box: { x1: 1728, y1: 552, x2: 2068, y2: 928 }, yMax: 1975 },
    // Press-kit Little Bird over the industrial town (3840 x 2160, sharp). The two soldiers with the green
    // armbands on the bench: the front one (helmet top 1105, armband 1040, boots to 1400) and the one behind him
    // aiming right (helmet 1090, muzzle 1352). Studio mark x 3663..3768, y 1983..2110: never below y 1975.
    l2: { aim: { x: 1194, y: 1243 }, box: { x1: 1036, y1: 1086, x2: 1352, y2: 1400 }, yMax: 1975 },
  };

  // The texts the film writes itself, in the page's language (src/i18n/ui.ts, intro.*, given by IntroFilm.astro): the
  // status, the cards' roles, and what the status's live region says once each target is identified (ariaC, ariaD: the
  // cards themselves are hidden from screen readers). The legal lines and the controls are the page's own markup.
  const TEXT = JSON.parse(stage.dataset.texts || '{}');
  const lang = document.documentElement.lang;
  // Inspection: ?t=<seconds> a still at that moment (?t=lock the locked emblem, ?t=end the presentation, as at the
  // end); ?perf=1 the frame times, in the console each second and for the whole film at its end.
  const Q = new URLSearchParams(location.search);
  const PARAM_T = Q.get('t');
  const PERF = Q.get('perf') === '1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Opening clip: 135 frames at 60 fps (last frame at media 2.233 s). It fades in from black by itself, linearly, and
  // is fully lit from media 2.03 s. Its end comes to a short stop: normal speed until 2.0 s, then the rate eases down
  // to 0.25 over 0.4 s, reaching the clip's last frame exactly as it does (2.0 + 0.4 - 0.75 x 0.4 / 2 = 2.25 of
  // media), so the helicopters do not stop dead as the lens takes over, and do not crawl either. The rate never falls
  // to 0: the film clock follows the clip while it plays. Film time and media time map both ways.
  const CLIP = { R0: 2.0, TR: 0.4, RMIN: 0.25, MLAST: 134 / 60, MEND: 2.25, LIT: 2.05, FADE: 2.033 };
  const smootherInt = (x) => x * x * x * x * (x * (x - 3) + 2.5); // integral of the smoother step over [0, x]
  const smootherStep = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  function rateAt(t) {
    return t <= CLIP.R0 ? 1 : 1 - (1 - CLIP.RMIN) * smootherStep(Math.min(1, (t - CLIP.R0) / CLIP.TR));
  }
  function mediaAt(t) {
    if (t <= CLIP.R0) return Math.max(0, t);
    const x = Math.min(1, (t - CLIP.R0) / CLIP.TR);
    return (
      CLIP.R0 +
      x * CLIP.TR -
      (1 - CLIP.RMIN) * CLIP.TR * smootherInt(x) +
      Math.max(0, t - CLIP.R0 - CLIP.TR) * CLIP.RMIN
    );
  }
  function filmAt(m) {
    if (m <= CLIP.R0) return m;
    let a = CLIP.R0;
    let b = CLIP.R0 + 4;
    for (let i = 0; i < 44; i++) {
      const c = (a + b) / 2;
      if (mediaAt(c) < m) a = c;
      else b = c;
    }
    return (a + b) / 2;
  }
  // The clip's own fade-in (mean luma 17.5 at the first frame, 129 from media 2.03 s, linear in between): when the
  // clip cannot play, its 4K last frame stands in with the same fade.
  const fadeAt = (t) => 0.013 + 0.987 * Math.min(1, Math.max(0, mediaAt(t) / CLIP.FADE));

  const $ = (s) => stage.querySelector(s);
  const mk = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };
  const pClip = $('#pClip');
  const pOp = $('#pOp');
  const pOpB = $('#pOpB');
  const kMot = $('#kMot');
  const mctx = kMot.getContext('2d');
  // Offscreen: the opening shot's copies for the lens (sources for the motion canvas: kOp, its own, and pOpZ, the
  // panorama's picture larger, for the second helicopter) and the motion canvas's two buffers.
  const kOp = document.createElement('canvas');
  const pOpZ = document.createElement('canvas');
  const bufA = document.createElement('canvas');
  const bufB = document.createElement('canvas');
  const actx = bufA.getContext('2d', { alpha: false });
  const bctx = bufB.getContext('2d', { alpha: false });
  const opDim = $('#opDim');
  const edge = $('#edge');
  const opDimEye = $('#opDimEye');
  const lensTint = $('#lensTint');
  const kL2a = $('#kL2a');
  const kLb = $('#kLb');
  const kL2 = $('#kL2');
  const tex = $('#tex');
  const shade = $('#shade');
  const lensWrap = $('#lensWrap');
  const lensClip = $('#lensClip');
  const lensTube = $('#lensTube');
  const lensEdge = $('#lensEdge');
  const lensFlash = $('#lensFlash');
  const scope = $('#scope');
  const ring = $('#ring');
  const glassc = $('#glassc');
  const hairs = [...stage.querySelectorAll('#hairs line')];
  const lockL = $('#lockL');
  const hud = $('#hud');
  const magEl = $('#mag');
  const hdg = $('#hdg');
  const feed = $('#feed');
  const feedRec = $('#feedRec');
  const feedBars = feed.querySelectorAll('.bars i');
  const hdgStrip = $('#hdgStrip');
  const hdgVal = $('#hdgVal');
  const rlDist = $('#rlDist');
  const rlMag = $('#rlMag');
  const statusBox = $('#statusBox');
  const statusEl = $('#status');
  const statusA = $('#statusA');
  const sbg = $('#sbg');
  const sscan = $('#sscan');
  const sq = $('#sq');
  const cover = $('#cover');
  const veil = $('#veil');
  const ctrl = $('#ctrl');
  const skipBtn = $('#skip');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, f) => a + (b - a) * f;
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const smooth = (x) => x * x * (3 - 2 * x);
  const f2 = (v) => (Math.round(v * 100) / 100).toString();
  const TAU = Math.PI * 2;

  // MIL marks on the four arms of the crosshair, a longer one second from the edge.
  const hashes = [];
  [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ].forEach(([dx, dy], dir) => {
    [172, 160, 148, 136, 124, 112].forEach((r, k) => {
      const half = k === 1 ? 8 : 4;
      const cx = 200 + dx * r;
      const cy = 200 + dy * r;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(cx - dy * half));
      line.setAttribute('y1', String(cy - dx * half));
      line.setAttribute('x2', String(cx + dy * half));
      line.setAttribute('y2', String(cy + dx * half));
      line.setAttribute('class', 'hash');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      $('#hashes').append(line);
      hashes.push({ el: line, k, dir, r });
    });
  });
  // (the twins, under the lines)
  for (const el of [...hairs, ...hashes.map((h) => h.el)]) {
    const tw = el.cloneNode();
    tw.setAttribute('class', 'halo');
    $('#halo').append(tw);
    el.twin = tw;
  }

  // ---------------------------------------------------------------------------------------------------------
  // Eases. A scope has inertia: it starts gently, travels, overshoots a touch and settles (a spring following a
  // smooth push).
  function springEase(ramp, zeta, cycles) {
    const N = 800;
    const out = new Float32Array(N + 1);
    const w = TAU * cycles;
    const sub = 6;
    const dt = 1 / N / sub;
    let x = 0;
    let v = 0;
    for (let i = 0; i <= N; i++) {
      out[i] = x;
      for (let k = 0; k < sub; k++) {
        const u = Math.min(1, (i + k / sub) / N / ramp);
        const goal = u * u * u * (u * (u * 6 - 15) + 10);
        v += (w * w * (goal - x) - 2 * zeta * w * v) * dt;
        x += v * dt;
      }
    }
    const rest = 1 - out[N];
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const f = t * N;
      const i = Math.min(N - 1, Math.floor(f));
      return out[i] + (out[i + 1] - out[i]) * (f - i) + rest * t * t * t * (t * (t * 6 - 15) + 10);
    };
  }
  const E = {
    lin: (x) => x,
    in2: (x) => x * x,
    io2: (x) => (x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x)),
    out3: (x) => 1 - (1 - x) ** 3,
    in3: (x) => x * x * x, // (out3 played backwards)
    sin: (x) => 1 - Math.cos((x * Math.PI) / 2),
    sout: (x) => Math.sin((x * Math.PI) / 2),
    sio: (x) => (1 - Math.cos(Math.PI * x)) / 2,
    glide: springEase(0.86, 0.78, 2.2),
    focus: springEase(0.4, 0.42, 3.0),
    snap: springEase(0.32, 0.55, 3.4),
  };

  // ---------------------------------------------------------------------------------------------------------
  // Channels: every animated value is a base plus additive moves, evaluated as a pure function of time, so
  // overlapping moves blend without a jolt and ?t= renders exactly the same frame as the film.
  let CH = {};
  function ch(name, base) {
    CH[name] = { base, end: base, moves: [] };
  }
  function mv(name, to, t0, dur, ease) {
    const c = CH[name];
    c.moves.push({ d: to - c.end, t0, dur, fn: ease || E.sio });
    c.end = to;
  }
  function V(name, t) {
    const c = CH[name];
    let v = c.base;
    for (const m of c.moves) {
      const u = (t - m.t0) / m.dur;
      v += m.d * (u <= 0 ? 0 : u >= 1 ? 1 : m.fn(u));
    }
    return v;
  }

  // ---------------------------------------------------------------------------------------------------------
  // The painted emblem. Its place on the wall and the paint's recipe: emblem.js. Its paint layers (albedo, the brackets
  // picked out, the worn coverage): still SVG pictures (PAINT_LAYERS).
  // The painted layer, in the photo's own pixel grid (drawn over it with the same transform and sampling):
  // paint albedo x the light on the wall (taken from the photo), the wall's fine texture and grime through it,
  // cut by the worn coverage. Canvas composites only (no pixel read-back).
  function buildPaint(img, colB, colC, selB, maskImg) {
    const { x, y, w, h } = PATCH;
    const m = 12;
    // Light on the wall, taken from the photo's luminance: its broad light and stains (blurred), plus a share of
    // its fine texture, so the concrete's pores, rivets and slab joints show through the paint.
    const irr = mk(w, h);
    const ic = irr.getContext('2d');
    ic.filter = `grayscale(1) blur(${PAINT.blur}px)`;
    ic.drawImage(img, x - m, y - m, w + 2 * m, h + 2 * m, -m, -m, w + 2 * m, h + 2 * m);
    ic.filter = 'grayscale(1)';
    ic.globalAlpha = PAINT.tex;
    ic.drawImage(img, x, y, w, h, 0, 0, w, h);
    ic.globalAlpha = 1;
    ic.filter = 'none';
    // Albedo x light x tint, then the gain (the light's level, measured on the white "4") and the saturation.
    const lit = (col, gain, sat) => {
      const lay = mk(w, h);
      const lc = lay.getContext('2d');
      lc.drawImage(col, 0, 0, w, h);
      lc.globalCompositeOperation = 'multiply';
      lc.drawImage(irr, 0, 0);
      lc.fillStyle = PAINT.tint;
      lc.fillRect(0, 0, w, h);
      const o = mk(w, h);
      const oc = o.getContext('2d');
      oc.filter = `brightness(${gain}) saturate(${sat})`;
      oc.drawImage(lay, 0, 0);
      oc.filter = 'none';
      return o;
    };
    const out = lit(colC, PAINT.gain, PAINT.satC);
    const br = lit(colB, PAINT.gainB, PAINT.satB);
    const bc = br.getContext('2d');
    bc.globalCompositeOperation = 'destination-in';
    bc.drawImage(selB, 0, 0, w, h);
    const oc = out.getContext('2d');
    oc.drawImage(br, 0, 0);
    // The concrete's fine relief through the paint (pores, rivets, slab joints): a high-pass of the photo (half
    // the grey picture plus half its blurred negative), hard-light, so the dark pits darken even the bright cream.
    const hp = mk(w, h);
    const hc = hp.getContext('2d');
    hc.filter = 'grayscale(1)';
    hc.drawImage(img, x - m, y - m, w + 2 * m, h + 2 * m, -m, -m, w + 2 * m, h + 2 * m);
    hc.filter = `grayscale(1) invert(1) blur(${PAINT.hpR}px)`;
    hc.globalAlpha = 0.5;
    hc.drawImage(img, x - m, y - m, w + 2 * m, h + 2 * m, -m, -m, w + 2 * m, h + 2 * m);
    hc.globalAlpha = 1;
    const hq = mk(w, h);
    const qc = hq.getContext('2d');
    qc.filter = `contrast(${PAINT.hpC})`;
    qc.drawImage(hp, 0, 0);
    oc.globalCompositeOperation = 'hard-light';
    oc.globalAlpha = PAINT.hp;
    oc.drawImage(hq, 0, 0);
    oc.globalAlpha = 1;
    oc.globalCompositeOperation = 'source-over';
    // Dark grime of the wall carried over the paint.
    oc.globalCompositeOperation = 'multiply';
    oc.globalAlpha = PAINT.grime;
    oc.filter = 'grayscale(1) brightness(1.75) contrast(1.5)';
    oc.drawImage(img, x, y, w, h, 0, 0, w, h);
    oc.filter = 'none';
    // Worn coverage.
    oc.globalAlpha = PAINT.opacity;
    oc.globalCompositeOperation = 'destination-in';
    oc.drawImage(maskImg, 0, 0, w, h);
    return out;
  }

  // ---------------------------------------------------------------------------------------------------------
  // Grades, applied once when the pictures are painted (never per frame).
  // Littlebird-2 is a cooler, darker dusk than littlebird-1's golden evening: a gentle warm grade so both read as
  // the same evening: more exposure in the mid-tones (contrast eased first, so the white "4" and the sky never
  // clip; the shadows lift a little, like the haze of the first picture), then a warm filter (blue down, green a
  // touch), then a low golden light from the right, where the sun is in both pictures.
  const WARM = {
    filter: 'contrast(0.9) brightness(1.17) saturate(1.05)',
    tint: 'rgb(255,241,222)',
    sun: 'rgba(255,176,96,0.16)',
  };
  // The lens: a touch darker than what it shows so the khaki reticle reads on it.
  const LENS_GRADE = 'brightness(0.93) contrast(1.05)';
  // The scenery around the lens (the opening shot, the clip's own picture, not graded) is dimmed by a layer over it.
  const PANO_DIM = 0.17;
  // The scope's view: the scenery around the lens is out of focus, as the eye sees it past a scope it aims through.
  // blur: in CSS px at its cover framing; res: its blurred copy's resolution (half: the blur leaves no detail that
  // would need more).
  const BG = { blur: 3, res: 0.5 };
  // Each Little Bird's top rows melt into its own sky colour over `feather` source px: the mean colour of its rows
  // 0..40 in 48 columns of 80 px (measured with ffmpeg, area average), graded like the lens copy. Only the glass's
  // widest views reach them, through the motion blur around the changes of shot.
  const SKY_TOP = {
    lb: (
      '89a3c7 88a1c4 87a0c3 88a1c3 89a0c2 8da1c2 8fa3c2 92a3c1 95a3bf 97a5c1 a1b3cf aebfd8 afbfd9 b4c1d8 b0c0da b2c1db ' +
      'b4c3db bcc6dc bcc7dc b2bfd4 a9b3cb 9ea8bf 9ca5bc a9b0c5 b9bccf c5c8d9 c3c7dc cacadb c6cdde c7cee1 d2d1df cfd2e1 ' +
      'd1d3e2 ced4e3 cfd5e4 d2d8e5 d6dbe8 dce0ed dde2ee dee3ef e0e4f0 e1e5f1 e1e5f0 e0e5ef e0e4ef e0e3ee dfe3ee dee2ec'
    ).split(' '),
    l2: (
      '8387a2 8a8ea7 8f93ab 9497b0 999bb4 9c9fb7 9ea2ba 9ea3bb a1a5bd 9fa5bd a2a8bf a8acc1 aaaec1 a5acc1 a4abc0 a4acc0 ' +
      'a4acc0 a8afc1 aab0c0 a8aec0 a4acbf a1aabe a0aabe a9b0c1 a6aec0 a3acc0 9faabf a4aec2 a7b1c4 a5afc4 a5afc5 a6b0c6 ' +
      'a7b0c6 aab2c8 adb4c8 aeb3c8 aab0c5 929eb7 8e99b4 8c97b1 8490ac 7885a3 73809e 707e9d 6c7999 697796 697694 677390'
    ).split(' '),
  };
  const SKY = {
    feather: 72,
    // The town's lens copies are dimmed at the top (sky and hills, above y l2DimH), so its bright sky does not flare
    // in the glass at its change of shot; that part is never in view once the scope rests on the developers.
    l2Dim: 0.78,
    l2DimH: 700,
  };
  // Heading strip: bearing at the start of the opening shot, and how far each picture turns per degree (source px of
  // the opening shot's 4K frame, a wide lens; world units of the two Little Birds).
  const HDG = { op0: 128, opU: 52, wU: 66 };
  const CARD = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  // Range on the reticle's line (metres): the creator's helicopter (as on his tag: RNG 0085 M), the developers',
  // the tower wall.
  const RANGE = { C: { v: 85.4, a: 0.45 }, D: { v: 432.7, a: 0.6 }, L: { v: 766.2, a: 0.12 } };
  const IFF = {
    searching: 'var(--iff-search)',
    identified: 'var(--iff-creator)',
    allies: 'var(--iff-allies)',
    locked: 'var(--iff-locked)',
  };
  const TRACK_COL = { C: 'var(--iff-creator)', D: 'var(--iff-allies)', L: 'var(--iff-locked)' };

  // ---------------------------------------------------------------------------------------------------------
  // Layout: the lens's size and its room; for each Little Bird shot, its framing (the picture as if it filled the
  // screen around the lens: where the lens holds, and what lies under it); the opening shot's framings; the canvases'
  // resolutions.
  const L = {};
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return { x1: r.left - s.left, y1: r.top - s.top, x2: r.right - s.left, y2: r.bottom - s.top };
  };
  function computeLayout() {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const cdpr = Math.min(2, window.devicePixelRatio || 1);
    const portrait = W < H;

    // Room for the lens: under the heading strip (and the MAG line), above the legal lines with a band of air between
    // (statusH: kept as it was, so the validated framings do not move).
    const hudB = Math.max(rectOf(hud).y2, rectOf(hdg).y2, rectOf(feed).y2) + 8;
    const botT = Math.min(rectOf($('#legal')).y1, rectOf($('#ctrl')).y1) - 8;
    L.hudB = hudB;
    L.botT = botT;
    L.statusH = 34;
    const M = W <= 600 ? 12 : 20;
    L.M = M;
    // The status's height, and how far below the lens's centre it ends for a lens of radius r (its place: see below).
    statusEl.textContent = TEXT.searching;
    const sh = statusBox.getBoundingClientRect().height;
    statusEl.textContent = '';
    const statusEndAt = (r) => r + 0.35 * Math.round(0.13 * r) + sh + Math.max(5, 0.025 * r);
    // The cards' sizes, each in its full form, the developers' card in its compact one too (see the framings).
    for (const Tg of Object.values(TAGS)) Tg.el.classList.remove('compact');
    measureTags();
    compactTag(TAGS.D, true);
    const hCompact = TAGS.D.h;
    compactTag(TAGS.D, false);

    // The lens: as large as the screen allows; in portrait, never so large that the lens at its highest, its status
    // and a card (the creator's, or the developers' compact one) cannot stack above the legal lines.
    let D = Math.max(160, Math.min(0.5 * H, 0.84 * W, 760));
    if (portrait) {
      const card = Math.max(TAGS.C.h, hCompact);
      const stacks = (r) => hudB + r + Math.max(r + 14, statusEndAt(r) + 8) + card <= botT;
      while (D > 160 && !stacks(D / 2)) D -= 2;
    }
    const R = D / 2;
    Object.assign(L, { W, H, cdpr, portrait, D, R, k: R / 270 });
    lensClip.style.left = lensClip.style.top = -R + 'px';
    lensClip.style.width = lensClip.style.height = D + 'px';
    // (the tube: about an eighth of the lens's radius wide; clear inside the glass but for a light shade along its rim,
    // darkest at the rim, fading to nothing; its dark part, about a third of it, is what the status keeps clear of)
    L.TT = Math.round(0.13 * R);
    {
      const TT = L.TT;
      const p0 = (100 * R) / (R + TT);
      const at = (f) => (p0 + (100 - p0) * f).toFixed(2) + '%';
      lensTube.style.left = lensTube.style.top = -(R + TT) + 'px';
      lensTube.style.width = lensTube.style.height = D + 2 * TT + 'px';
      lensTube.style.background = `radial-gradient(circle closest-side, rgba(8, 9, 6, 0) ${(p0 - 6).toFixed(2)}%, rgba(8, 9, 6, 0.38) ${(p0 - 0.3).toFixed(2)}%, rgba(10, 11, 8, 0.78) ${p0.toFixed(2)}%, rgba(10, 11, 8, 0.36) ${at(0.3)}, rgba(10, 11, 8, 0.1) ${at(0.65)}, rgba(10, 11, 8, 0) 100%)`;
    }
    // Reticle: its ring (r 192 of 400) sits exactly on the lens edge.
    L.S = (D * 400) / 384;
    scope.style.width = scope.style.height = L.S + 'px';
    const kk = clamp(D / 560, 0.9, 1.3);
    ring.style.strokeWidth = f2(1.2 * kk);
    hairs.forEach((h) => {
      h.style.strokeWidth = f2(1.4 * kk);
      h.twin.style.strokeWidth = f2(1.4 * kk + 2);
    });
    hashes.forEach(({ el }) => {
      el.style.strokeWidth = f2(1.6 * kk);
      el.twin.style.strokeWidth = f2(1.6 * kk + 2);
    });
    lockL.style.strokeWidth = f2(2 * Math.min(kk, 1.15));
    for (const tg of Object.values(TG)) {
      tg.b.style.strokeWidth = f2(1.5 * Math.min(kk, 1.15));
      if (tg.k) tg.k.style.strokeWidth = f2(1.6 * Math.min(kk, 1.15));
      tg.d.style.strokeWidth = f2(1.3 * Math.min(kk, 1.15));
      if (tg.x) tg.x.style.strokeWidth = f2(1.5 * Math.min(kk, 1.15));
    }

    // Heading strip: narrower on phones.
    L.hdgW = W <= 600 ? Math.max(200, W - 32) : clamp(W - 440, 320, 580);
    L.ppd = W <= 600 ? 6 : 8;
    hdg.style.width = L.hdgW + 'px';
    hdg.style.marginLeft = -L.hdgW / 2 + 'px';

    // The status's place: just under the lens, centred, as the game's recon scope shows "TRACKING TARGET" under its
    // glass: never over the target's box, the marks or the rim, at the same readable size on every screen, the inside
    // of the scope left to the reticle (the band of air kept under the lens's room is for it).
    // (how far below the lens's centre the status ends: a tag below the lens starts lower still)
    L.statusEnd = statusEndAt(R);
    L.statusDy = L.statusEnd - sh / 2;
    // (portrait: a card goes under the lens's status, or above the lens; landscape: right of the lens, beside it or
    // slid up or down along its ring until it clears the glass by 12 px; placeTags decides the same way)
    L.fitsBelow = (y, h) => y + Math.max(R + 14, L.statusEnd + 8) + h <= botT;
    L.fitsAbove = (y, h) => y - R - 14 - h >= hudB + 4;
    L.fitsRight = (p, w, h) => {
      const dx = W - M - w - p.x;
      if (dx >= R + 12) return true;
      const dy = Math.sqrt((R + 12) ** 2 - Math.max(0, dx) ** 2);
      return p.y - dy - h >= hudB + 4 || p.y + dy + 8 + h <= botT - L.statusH - 2;
    };
    const cardFits = (p, Tg) =>
      portrait ? L.fitsBelow(p.y, Tg.h) || L.fitsAbove(p.y, Tg.h) : L.fitsRight(p, Tg.w, Tg.h);
    L.statusW = {};

    // A framing: the picture at scale s (CSS px per source px, at least `cover`), as if it filled the screen around
    // the lens (it is never shown so: the scenery around the lens stays the opening shot), with the target at the
    // wanted screen spot as far as the picture allows; the lens at the target must stay clear of the heading strip
    // and the status line, else the picture is enlarged a little until it does. (card: a card that must fit next to
    // the lens: in portrait under the lens's status, the lens then held high enough for it; on landscape screens right
    // of the lens, the lens then held far enough left for it)
    function framing(pic, aim, focus, s0, yMax, card) {
      const x1 = R + M;
      let x2 = W - R - M;
      let y1 = hudB + R,
        y2 = botT - L.statusH - R;
      if (y1 > y2) y1 = y2 = (y1 + y2) / 2; // (very short screens: the lens is centred in the room there is)
      if (card && portrait)
        y2 = Math.max(y1, Math.min(y2, botT - card.h - Math.max(R + 14, L.statusEnd + 8)));
      if (card && !portrait) x2 = Math.max(x1, Math.min(x2, W - M - card.w - 38 - R));
      const fx = clamp(focus.x * W, x1, x2);
      const fy = clamp(focus.y * H, y1, y2);
      let s = s0;
      let out = null;
      for (let it = 0; it < 14; it++) {
        const hw = W / (2 * s);
        const hh = H / (2 * s);
        const cx = clamp(aim.x - (fx - W / 2) / s, hw, pic.w - hw);
        const cy = clamp(aim.y - (fy - H / 2) / s, hh, yMax - hh);
        const Lp = { x: W / 2 + (aim.x - cx) * s, y: H / 2 + (aim.y - cy) * s };
        out = { cx, cy, s, L: Lp };
        const ok = Lp.x >= x1 - 0.5 && Lp.x <= x2 + 0.5 && Lp.y >= y1 - 0.5 && Lp.y <= y2 + 0.5;
        if (ok) break;
        s *= 1.05;
      }
      return out;
    }
    // Lens scale that keeps a box (plus a pad) inside 95 % of the glass, the box's aim point at the centre.
    const fit = (box, aim, pad) =>
      (0.95 * R) /
      Math.max(
        ...[
          [box.x1 - pad, box.y1 - pad],
          [box.x2 + pad, box.y1 - pad],
          [box.x1 - pad, box.y2 + pad],
          [box.x2 + pad, box.y2 + pad],
        ].map(([x, y]) => Math.hypot(x - aim.x, y - aim.y)),
      );

    // Little Bird: never below y 1975 (studio mark), so the framing is at least H / 1975 CSS px per source px.
    const lb = PICS.lb;
    L.lbCover = Math.max(W / lb.w, H / lb.h);
    const lbS = Math.max(L.lbCover, H / SCENE.lb.yMax);
    const focus1 = portrait ? { x: 0.5, y: 0.4 } : { x: 0.46, y: 0.45 };
    L.F1 = framing(lb, SCENE.lb.aim, focus1, lbS, SCENE.lb.yMax);
    // (the creator's card fits next to the lens, the lens held higher (portrait) or further left (landscape: a short
    // window, say a browser zoomed in) if need be)
    if (!cardFits(L.F1.L, TAGS.C)) L.F1 = framing(lb, SCENE.lb.aim, focus1, lbS, SCENE.lb.yMax, TAGS.C);
    // (the framing on whole device pixels: it sets where the lens holds on the creator)
    {
      const F = L.F1;
      const a = Math.round((W / 2 - F.cx * F.s) * cdpr) / cdpr;
      const b = Math.round((H / 2 - F.cy * F.s) * cdpr) / cdpr;
      const cx = (W / 2 - a) / F.s;
      const cy = (H / 2 - b) / F.s;
      F.L = { x: F.L.x + (F.cx - cx) * F.s, y: F.L.y + (F.cy - cy) * F.s };
      F.cx = cx;
      F.cy = cy;
    }
    // Lens: at most 1 CSS px per source px, the target's box inside the glass.
    L.s1 = Math.min(1, fit(SCENE.lb.box, SCENE.lb.aim, 6));

    // Opening shot (4K px of its last frame): framed like object-fit: cover (portrait: the crop keeps both
    // helicopters in view). The eyepiece closes on the near helicopter where it is in that framing (Leye, kept clear
    // of the heading strip and the status line); c0 = the source point under it at the first frame.
    const op = PICS.op;
    L.opCover = Math.max(W / op.w, H / op.h);
    const ohw = W / (2 * L.opCover);
    const ohh = H / (2 * L.opCover);
    const oc = {
      x: clamp(portrait ? SCENE.op.fxPortrait : SCENE.op.fx, ohw, op.w - ohw),
      y: clamp(op.h / 2, ohh, op.h - ohh),
    };
    L.Leye = {
      x: clamp(W / 2 + (SCENE.op.aim.x - oc.x) * L.opCover, R + M, W - R - M),
      y: clamp(H / 2 + (SCENE.op.aim.y - oc.y) * L.opCover, hudB + R, botT - L.statusH - R),
    };
    L.opC0 = { x: oc.x + (L.Leye.x - W / 2) / L.opCover, y: oc.y + (L.Leye.y - H / 2) / L.opCover };

    // Little Bird over the town: developers (zoom 2), then the tower wall (zoom 3), same picture. Each zoom goes
    // further than the one before (MAG climbs from one target to the next: the developers' framing half as close
    // again as the creator's, the wall's up to 30 % closer still, the lens still magnifying it 1.15 x) and the lens is
    // as strong as it can be while sharp (it never shows more than 1 CSS px per source px).
    const l2 = PICS.l2;
    L.l2Cover = Math.max(W / l2.w, H / l2.h);
    L.s2 = Math.min(fit(SCENE.l2.box, SCENE.l2.aim, 8), 1);
    L.s3 = Math.min(1, fit(EBOX, EAIM, 8));
    // (the framing never comes so close that the lens stops magnifying it: at least 1.15 x)
    const l2S = Math.max(L.l2Cover, H / SCENE.l2.yMax, Math.min(1.5 * L.F1.s, L.s2 / 1.15));
    // (the developers framed under the column where the lens is when the second push starts (Leye.x), so the push
    // zooms nearly straight in: the lens only settles a little in height)
    const focus2 = { x: L.Leye.x / W, y: portrait ? 0.4 : 0.44 };
    L.F2 = framing(l2, SCENE.l2.aim, focus2, l2S, SCENE.l2.yMax);
    // (the developers' card, where it does not fit next to the lens: in portrait it goes compact; if it still does not
    // fit, the lens is held higher, or further left)
    if (!cardFits(L.F2.L, TAGS.D)) {
      if (portrait) compactTag(TAGS.D, true);
      if (!cardFits(L.F2.L, TAGS.D)) L.F2 = framing(l2, SCENE.l2.aim, focus2, l2S, SCENE.l2.yMax, TAGS.D);
    }
    L.F3 = framing(
      l2,
      EAIM,
      portrait ? { x: 0.5, y: 0.45 } : { x: 0.7, y: 0.5 },
      Math.max(L.F2.s, Math.min(L.F2.s * 1.3, L.s3 / 1.15)),
      SCENE.l2.yMax,
    );

    // Labels on the reticle's horizontal line: from 131 reticle units out (clear of the creator's box), the line
    // opens a gap for them; at a target's hold they sit 16 units (RL, see renderScope) outside its frame. Their size
    // follows the lens, made smaller where, at a hold, they would not fit inside the ring at least 8 units from the
    // frame (what a label waits for, faded), the hand's sway included (it moves a frame by up to 2 units): beside a
    // frame at rest a label is not left half faded (down to 9 px; on a smaller lens it still waits there).
    const q = L.S / 400;
    L.rlIn = 131;
    // (the widest of the three frames along the line at its hold, in reticle units: the creator's box, the developers',
    // the emblem's)
    const reach = (box, aim, pad, s) => ((Math.max(aim.x - box.x1, box.x2 - aim.x) + pad) * s) / q;
    const rlHold =
      16 +
      2 +
      Math.max(
        reach(SCENE.lb.box, SCENE.lb.aim, 6, L.s1),
        reach(SCENE.l2.box, SCENE.l2.aim, 8, L.s2),
        reach(EBOX, EAIM, 3, L.s3),
      );
    let fs = clamp(R * 0.064, 11, 19);
    for (let it = 0; it < 12; it++) {
      for (const el of [rlDist, rlMag]) {
        el.style.fontSize = f2(fs) + 'px';
        el.style.width = '';
      }
      rlDist.textContent = '888.8 M';
      rlMag.textContent = 'X 8.8';
      L.rlDW = Math.ceil(rlDist.offsetWidth) + 1;
      L.rlMW = Math.ceil(rlMag.offsetWidth) + 1;
      if ((L.rlIn + L.rlDW / q + 5 <= 187 && rlHold + L.rlDW / q <= 186 + 8) || fs <= 9) break;
      fs -= 0.5;
    }
    rlDist.style.width = L.rlDW + 'px';
    rlMag.style.width = L.rlMW + 'px';
    rlDist.style.left = f2(L.S / 2 - L.rlIn * q - L.rlDW) + 'px';
    rlMag.style.left = f2(L.S / 2 + L.rlIn * q) + 'px';
    rlDist.textContent = rlMag.textContent = '';

    // The Little Birds' shared world, the lens cameras' (its units: littlebird-1's pixels): littlebird-2 at scale
    // sg = F2.s / F1.s, top edges level, 260 units to the right of littlebird-1 (the lens never shows both).
    L.sg = L.F2.s / L.F1.s;
    L.XB = PICS.lb.w + 260;
    L.wB = { x: L.XB + L.sg * L.F2.cx, y: L.sg * L.F2.cy };
    L.wW = { x: L.XB + L.sg * L.F3.cx, y: L.sg * L.F3.cy };

    // The lens at the change of shot: where the creator is in his framing, so the change of shot happens with the
    // target in the centre of the reticle on both sides of it.
    L.Lopen = { x: L.F1.L.x, y: L.F1.L.y };
    // (world x under the lens at the change of shot: the heading's reference)
    L.qOpn = L.F1.cx + (L.Lopen.x - W / 2) / L.F1.s;

    // The second helicopter: the view swings until it sits exactly where the eyepiece closed on the first (Leye), so
    // the eye stays where it was and the second push starts from there, as the first did. sOp2: the least scale at
    // which the picture still fills the screen with it there (about 1.3 x cover on landscape screens, where it is about
    // 1350 px from the picture's right edge; about 1.2 on phones), plus one percent of air. No guard is needed on the
    // way: the glide moves the point under Leye in a straight line and the zoom's log on the same curve, so each edge
    // condition (linear in that point and in 1 / scale, which never exceeds the straight blend of its two end values)
    // holds all along when it holds at both ends.
    const A2 = SCENE.op.aim2;
    L.sOp2 =
      1.01 *
      Math.max(
        L.opCover,
        L.Leye.x / A2.x,
        (W - L.Leye.x) / (op.w - A2.x),
        L.Leye.y / A2.y,
        (H - L.Leye.y) / (op.h - A2.y),
      );

    // The opening shot dimmed around the lens (PANO_DIM): first with the eyepiece left clear (the clip shows
    // through the reticle as it is), then plain once the lens lies over the eyepiece (no hole is left behind when
    // the lens moves). The hole's soft edge lies just inside the rim, under the lens: the swap from one to the other
    // changes nothing outside it.
    const dimC = `rgba(10,12,8,${PANO_DIM})`;
    opDimEye.style.background = `radial-gradient(circle at ${f2(L.Leye.x)}px ${f2(L.Leye.y)}px, rgba(10,12,8,0) ${f2(R - 1.5)}px, ${dimC} ${f2(R)}px)`;
    opDim.style.background = dimC;

    // The lens's motion canvas (the push and the change of shot): the glass's size; its work buffers hold the
    // glass plus a margin for the blurs.
    kMot.width = kMot.height = Math.round(D * cdpr);
    kMot.style.width = kMot.style.height = D + 'px';
    L.MM = 0.9 * R;
    const os = Math.ceil((2 * R + 2 * L.MM + 12) * cdpr);
    if (bufA.width !== os) {
      bufA.width = bufA.height = bufB.width = bufB.height = os;
    }

    // The lens's still canvases. The compositor scales them with a plain bilinear filter (no mipmaps): shrunk below
    // about 0.6 they shimmer as they move. So each picture is painted at about the resolution it is shown at (never
    // above its own pixels) and, where one shot goes from small to large, held in two resolutions that cross-fade
    // (same picture, so the fade cannot be seen). At 1920 x 1080 and above: one canvas each, at full resolution.
    const kr = (s, m) => Math.min(1, Math.ceil(s * cdpr * m * 100) / 100);
    L.kkLb = kr(L.s1, 1.15);
    L.kkL2 = kr(L.s3, 1.1);
    L.kkL2a = kr(L.s2, 1.15);
    if (L.kkL2a / L.kkL2 >= 0.72) L.kkL2a = 0;
    // Opening shot: the panorama (the scenery around the lens) at cover size; the lens's copy (only a source for the
    // motion canvas, which draws it with the canvas's default smoothing) at what the push's peak needs (at most 1 CSS
    // px per source px).
    L.kbOp = Math.min(1, Math.ceil(L.opCover * cdpr * 1.02 * 100) / 100);
    L.kbOpB = L.kbOp * BG.res;
    // (the second helicopter's framing shows the picture larger: a second copy at that size, swapped in while the view
    // moves fastest, so the landing is as sharp as the wide shot; not where it would add little, nor on dense screens,
    // where the plain copy a fifth larger still reads sharp and a second copy would cost a phone a lot of memory)
    L.kbOpZ = Math.min(1, Math.ceil(L.sOp2 * cdpr * 1.02 * 100) / 100);
    if (L.kbOpZ < 1.1 * L.kbOp || cdpr >= 2) L.kbOpZ = 0;
    // (the push ends with the helicopter's body across 70 % of the glass: past 1 CSS px per source px only in its last
    // fraction of a second, inside the motion blur and the defocus)
    L.sOpPeak = Math.max(L.opCover * 1.5, (0.7 * D) / SCENE.op.bodyW);
    L.kkOp = kr(Math.min(1, L.sOpPeak), 1.05);
  }

  // ---------------------------------------------------------------------------------------------------------
  // Painting the pictures, once per layout. The opening shot: the clip's 4K last frame as it is, sharp (the lens's
  // sources, the scenery until the lens covers it) and out of focus (the scenery around the lens). The lens: each
  // Little Bird with the lens grade (the town warm-graded, our emblem painted on its tower), at the resolutions the
  // layout asks for, its top rows melted into its sky colour.
  const IMG = { op: null, lb: null, l2: null, paint: null, grain: null };
  const setCanvas = (cv, w, h) => {
    cv.width = w;
    cv.height = h;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    return c;
  };
  // A row of measured colours through a grade, on a small canvas of our own (no pixel read-back from the photos).
  function gradeRow(hexes, filter, l2) {
    const n = hexes.length;
    const src = mk(n, 1);
    const sc = src.getContext('2d');
    const im = sc.createImageData(n, 1);
    hexes.forEach((hx, i) => {
      const v = parseInt(hx, 16);
      im.data.set([v >> 16, (v >> 8) & 255, v & 255, 255], i * 4);
    });
    sc.putImageData(im, 0, 0);
    const out = mk(n, 1);
    const oc = out.getContext('2d', { willReadFrequently: true });
    oc.filter = filter;
    oc.drawImage(src, 0, 0);
    oc.filter = 'none';
    if (l2) {
      // (the warm tint and the low sun of paintL2, at the top edge)
      oc.globalCompositeOperation = 'multiply';
      oc.fillStyle = WARM.tint;
      oc.fillRect(0, 0, n, 1);
      const u = n / PICS.l2.w;
      const g = oc.createRadialGradient(
        PICS.l2.w * u * 0.92,
        PICS.l2.h * u * 0.3,
        0,
        PICS.l2.w * u * 0.92,
        PICS.l2.h * u * 0.3,
        PICS.l2.w * u * 0.85,
      );
      g.addColorStop(0, WARM.sun);
      g.addColorStop(1, 'rgba(255,176,96,0)');
      oc.globalCompositeOperation = 'soft-light';
      oc.fillStyle = g;
      oc.fillRect(0, 0, n, 1);
    }
    const d = oc.getImageData(0, 0, n, 1).data;
    return Array.from({ length: n }, (_, i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
  }
  // The top-edge colours as a strip whose alpha falls from 1 to 0: drawn over a picture's top rows (stretched to its
  // width, linear between the column centres), it melts them into their sky colour.
  function featherStrip(row) {
    const n = row.length;
    const fh = 32;
    const c = mk(n, fh);
    const x = c.getContext('2d');
    const im = x.createImageData(n, fh);
    for (let j = 0; j < fh; j++) {
      const a = Math.round(255 * (1 - smooth(j / (fh - 1))));
      for (let i = 0; i < n; i++) im.data.set([row[i][0], row[i][1], row[i][2], a], (j * n + i) * 4);
    }
    x.putImageData(im, 0, 0);
    return c;
  }
  // The two strips, made once: littlebird-1's top edge, and the town's, dimmed as its top is (dimTop).
  let FEATHER = null;
  function feather(ctx, key, w, k) {
    if (!FEATHER) {
      const lb = gradeRow(SKY_TOP.lb, LENS_GRADE, false);
      const l2 = gradeRow(SKY_TOP.l2, WARM.filter + ' ' + LENS_GRADE, true);
      FEATHER = { lb: featherStrip(lb), l2: featherStrip(l2.map((c) => c.map((v) => v * SKY.l2Dim))) };
    }
    const st = FEATHER[key];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(st, 0, 0, st.width, st.height, 0, 0, w, SKY.feather * k);
    ctx.restore();
  }
  // (the town's lens copies: dimmed at the top, see SKY)
  function dimTop(ctx, w, k) {
    const g = ctx.createLinearGradient(0, 0, 0, SKY.l2DimH * k);
    const v = Math.round(255 * SKY.l2Dim);
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const c = Math.round(lerp(v, 255, smooth(u)));
      g.addColorStop(u, `rgb(${c},${c},${c})`);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, SKY.l2DimH * k);
    ctx.restore();
  }
  function paintL2(ctx, k, grade) {
    // Littlebird-2, warm-graded (+ the emblem), at k canvas px per source px.
    const { w, h } = PICS.l2;
    ctx.filter = WARM.filter + ' ' + grade;
    ctx.drawImage(IMG.l2, 0, 0, w, h, 0, 0, w * k, h * k);
    ctx.drawImage(IMG.paint, PATCH.x * k, PATCH.y * k, PATCH.w * k, PATCH.h * k);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = WARM.tint;
    ctx.fillRect(0, 0, w * k, h * k);
    // The low sun: a soft golden light from the right, strongest on the sky and the horizon.
    const g = ctx.createRadialGradient(w * k * 0.92, h * k * 0.3, 0, w * k * 0.92, h * k * 0.3, w * k * 0.85);
    g.addColorStop(0, WARM.sun);
    g.addColorStop(1, 'rgba(255,176,96,0)');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w * k, h * k);
    ctx.globalCompositeOperation = 'source-over';
  }
  const FONT_UI = getComputedStyle(stage).getPropertyValue('--font-ui').trim();
  let fontsIn = false;
  const painted = { kbOp: 0, kbOpZ: -1, kbOpB: 0, kkOp: 0, kkLb: 0, kkL2: 0, kkL2a: -1, hdg: '' };
  // The lens pictures, at the resolutions the layout asks for (repainted only when they change).
  function paintFixed() {
    if (!IMG.lb) return;
    let c;
    if (painted.kkOp !== L.kkOp) {
      // (the opening shot as it is: the clip's last frame, no grade, so the lens continues the panorama exactly)
      c = setCanvas(kOp, Math.round(PICS.op.w * L.kkOp), Math.round(PICS.op.h * L.kkOp));
      c.drawImage(IMG.op, 0, 0, PICS.op.w, PICS.op.h, 0, 0, kOp.width, kOp.height);
      painted.kkOp = L.kkOp;
    }
    if (painted.kkLb !== L.kkLb) {
      const k = L.kkLb;
      const w = Math.round(PICS.lb.w * k);
      const h = Math.round(PICS.lb.h * k);
      c = setCanvas(kLb, w, h);
      c.filter = LENS_GRADE;
      c.drawImage(IMG.lb, 0, 0, PICS.lb.w, PICS.lb.h, 0, 0, w, h);
      c.filter = 'none';
      feather(c, 'lb', w, k);
      painted.kkLb = k;
    }
    if (painted.kkL2 !== L.kkL2) {
      const k = L.kkL2;
      c = setCanvas(kL2, Math.round(PICS.l2.w * k), Math.round(PICS.l2.h * k));
      paintL2(c, k, LENS_GRADE);
      dimTop(c, kL2.width, k);
      feather(c, 'l2', kL2.width, k);
      painted.kkL2 = k;
    }
    // (the developers' reduced copy, on small screens only; a blank dot elsewhere)
    if (painted.kkL2a !== L.kkL2a) {
      const k = L.kkL2a || 0.01;
      c = setCanvas(kL2a, Math.max(1, Math.round(PICS.l2.w * k)), Math.max(1, Math.round(PICS.l2.h * k)));
      if (L.kkL2a) {
        paintL2(c, k, LENS_GRADE);
        dimTop(c, kL2a.width, k);
        feather(c, 'l2', kL2a.width, k);
      }
      painted.kkL2a = L.kkL2a;
    }
  }
  // Paints the picture drawn on src (the same size) onto ctx out of focus by b canvas px: the sharp picture, then its
  // blurred copy over it (so along the edges, where the blur would read outside the picture, its own pixels stay).
  function soften(ctx, src, b) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.drawImage(src, 0, 0);
    ctx.filter = `blur(${b.toFixed(2)}px)`;
    ctx.drawImage(src, 0, 0);
    ctx.restore();
  }
  // The opening shot's copies, at the resolutions the layout asks for (repainted only when they change).
  function paintPano() {
    if (!IMG.lb) return;
    if (painted.kbOp !== L.kbOp) {
      const k = L.kbOp;
      const c = setCanvas(pOp, Math.round(PICS.op.w * k), Math.round(PICS.op.h * k));
      c.drawImage(IMG.op, 0, 0, PICS.op.w, PICS.op.h, 0, 0, pOp.width, pOp.height);
      painted.kbOp = k;
    }
    // (the scope's view of the opening shot: its blurred copy, which comes in over the sharp one once the lens is on
    // screen; the picture is first reduced on a canvas of its own, dropped once used)
    if (painted.kbOpB !== L.kbOpB) {
      const k = L.kbOpB;
      const src = document.createElement('canvas');
      const sc = setCanvas(src, Math.round(PICS.op.w * k), Math.round(PICS.op.h * k));
      sc.drawImage(IMG.op, 0, 0, PICS.op.w, PICS.op.h, 0, 0, src.width, src.height);
      soften(setCanvas(pOpB, src.width, src.height), src, (BG.blur * k) / L.opCover);
      painted.kbOpB = k;
    }
    // (the second helicopter's sharper copy, for the lens only; a dot where it is not needed)
    if (painted.kbOpZ !== L.kbOpZ) {
      const k = L.kbOpZ;
      const c = setCanvas(pOpZ, k ? Math.round(PICS.op.w * k) : 1, k ? Math.round(PICS.op.h * k) : 1);
      if (k) c.drawImage(IMG.op, 0, 0, PICS.op.w, PICS.op.h, 0, 0, pOpZ.width, pOpZ.height);
      painted.kbOpZ = k;
    }
  }
  // The heading tape: every 5 degrees a tick, every 15 a 3-digit bearing, over the headings the film goes through;
  // ticks and figures centred on the strip's middle line (the figures by their measured ink, not the font's box).
  function paintHeading() {
    const key = [L.h0, L.h1, L.ppd, L.cdpr, L.W <= 600, fontsIn].join();
    if (painted.hdg === key) return;
    painted.hdg = key;
    const w = (L.h1 - L.h0) * L.ppd;
    const h = 26;
    const c = setCanvas(hdgStrip, Math.round(w * L.cdpr), Math.round(h * L.cdpr));
    hdgStrip.style.width = w + 'px';
    hdgStrip.style.height = h + 'px';
    c.setTransform(L.cdpr, 0, 0, L.cdpr, 0, 0);
    c.font = `500 ${L.W <= 600 ? 12 : 13}px ${FONT_UI}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const mid = h / 2;
    const base = mid + c.measureText('0123456789').actualBoundingBoxAscent / 2;
    const px = (v) => Math.round(v * L.cdpr) / L.cdpr;
    for (let dg = Math.ceil(L.h0 / 5) * 5; dg <= L.h1; dg += 5) {
      const x = (dg - L.h0) * L.ppd;
      if (dg % 15 === 0) {
        c.fillStyle = 'rgba(238,240,230,0.86)';
        c.fillText(String(((dg % 360) + 360) % 360).padStart(3, '0'), x, base);
      } else {
        c.fillStyle = 'rgba(238,240,230,0.55)';
        c.fillRect(px(x), mid - 5, 1, 10);
      }
    }
  }
  // Grain, scanlines (one device pixel), and a soft shading (top edge, vignette), drawn once into the texture layer
  // that lies over the scenery. (The legal lines' own shading: shadeTexts.)
  function paintTexture() {
    const { cdpr, W, H } = L;
    const w = Math.round(W * cdpr);
    const h = Math.round(H * cdpr);
    tex.width = w;
    tex.height = h;
    tex.style.width = W + 'px';
    tex.style.height = H + 'px';
    const c = tex.getContext('2d');
    const top = c.createLinearGradient(0, 0, 0, 72 * cdpr);
    top.addColorStop(0, 'rgba(10,12,8,0.35)');
    top.addColorStop(1, 'rgba(10,12,8,0)');
    c.fillStyle = top;
    c.fillRect(0, 0, w, 72 * cdpr);
    const vg = c.createRadialGradient(
      w / 2,
      h * 0.45,
      Math.min(w, h) * 0.45,
      w / 2,
      h * 0.45,
      Math.hypot(w, h) * 0.6,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.2)');
    c.fillStyle = vg;
    c.fillRect(0, 0, w, h);
    if (IMG.grain) {
      const gt = mk(180, 180);
      gt.getContext('2d').drawImage(IMG.grain, 0, 0, 180, 180);
      c.globalAlpha = 0.5;
      c.fillStyle = c.createPattern(gt, 'repeat');
      c.fillRect(0, 0, w, h);
    }
    const sc = mk(1, 3 * cdpr);
    const sctx = sc.getContext('2d');
    sctx.fillStyle = 'rgba(0,0,0,0.05)';
    sctx.fillRect(0, 0, 1, 1);
    c.globalAlpha = 1;
    c.fillStyle = c.createPattern(sc, 'repeat');
    c.fillRect(0, 0, w, h);
  }
  // The legal lines' and the controls' own shading, so they read on the brightest haze, in the edge shading's tone,
  // set once per layout from where they are: across the bottom of the screen, as dark as they need (SHADE) from the
  // bottom edge to just above them, then easing out over a little more than their height; there from the start, as
  // they are.
  const SHADE = 0.82;
  function shadeTexts() {
    const tone = (a) => `rgba(10, 12, 8, ${a.toFixed(3)})`;
    // (an eased fall from a to nothing, as the gradient's stops from p0 to p1)
    const fall = (a, p0, p1, unit) =>
      Array.from(
        { length: 9 },
        (_, i) => `${tone(a * (1 - smooth(i / 8)))} ${f2(lerp(p0, p1, i / 8))}${unit}`,
      ).join(', ');
    const b = L.H - Math.min(rectOf($('#legal')).y1, rectOf(ctrl).y1) + 4;
    const fade = Math.max(64, 1.25 * b);
    shade.style.height = f2(b + fade) + 'px';
    shade.style.background = `linear-gradient(to top, ${tone(SHADE)} 0px, ${fall(SHADE, b, b + fade, 'px')})`;
  }

  // ---------------------------------------------------------------------------------------------------------
  // The film. Times in seconds.
  const T = {
    LIT: filmAt(CLIP.LIT), // the opening clip is fully lit (film time, about 2.12 s)
    DUR: filmAt(CLIP.MEND), // end of the clip after its speed ramp (film time, about 2.75 s): its 4K last frame takes over
    LENS: 0, // the lens takes the picture over, on the clip's last frame (the scenery around it going out of focus)
    VZ: 1.6, // least zoom rate at the peak of the push (natural log per second)
    GLIDE: 1.3, // from the lens taking over to the peak of the push (the push and the eyepiece settling onto the target)
    T2: 0.8, // the push dies out inside the Little Bird (and the pull-out builds up there, the same move backwards)
    // Targeting time on each target, from its box settling to the scope leaving it: the creator (one name to read), the
    // developers (two names), the logo (its first 0.7 s are the lock itself)
    AIMC: 3.3,
    AIMD: 3.8,
    AIML: 3.2,
    OPN: 0, // peak of the push: the lens's picture becomes the Little Bird (the first change of shot)
    L1: 0, // the creator is identified
    GA: 0, // the scope leaves the creator
    X: 0, // peak of the pull-out: the lens's picture becomes the opening shot again (the change of shot, played backwards)
    XR: 0, // the pull-out has died out on the clip's own framing, the lens at rest where the eyepiece closed
    WIDE: 0, // the pull-out at rest: the scope at its least magnification on the trailer's wide shot
    SWING: 1.4, // the view's glide from the first helicopter to the second
    SR: 0, // the view starts swinging towards the second helicopter
    H2: 0, // the view at rest on the second helicopter, under the eyepiece's place
    LENS2: 0, // the second push starts, on the second helicopter
    OPN2: 0, // peak of the second push: the lens's picture becomes the developers' Little Bird
    WE: 0, // the developers are identified
    G0: 0, // the scope leaves the developers for the wall
    LOCK: 0, // the emblem is locked
    END: 0, // the end: the stage has faded out over the presentation
    tLockView: 0, // the locked emblem, still (?t=lock, and with reduced motion)
  };
  let STATUS = [];
  // How much brighter the trailer's frame is than each press-kit picture in the glass at its change of shot (mean
  // light of the lens at the cut, measured on frames rendered without the exposure match)
  const EXPO = { lb: 1.2, l2: 1.42 };
  let TRACK = [];
  const Z = {}; // the opening push's geometry, per layout
  const Z2 = {}; // the second push's (on the second helicopter), per layout

  function build() {
    CH = {};
    // (the second push is set in section 6: until then openCam stays on the first, for the lean measured in section 4)
    T.LENS2 = Infinity;
    const NAMES = [
      'dim',
      'tex',
      'sOpen',
      'lfade',
      'evig',
      'ring',
      'hair',
      'hash',
      'hud',
      'rl',
      'lx',
      'ly',
      'lz',
      'wX',
      'wY',
      'wS',
      'hold',
      'tgC',
      'tgCS',
      'tagC',
      'tagCOut',
      'tgD',
      'tgDS',
      'tagD',
      'tagDOut',
      'lockLO',
      'lockLS',
      'lockLR',
      'tgL',
      'flash',
      'scanC',
      'scanD',
      'out',
      'hudOut',
      'endO',
      'stat',
      'mot',
      'mfocus',
      'boost',
      'mix',
      'wash',
      'warm',
      'vx',
      'vy',
      'vz',
      'opZ',
      'expo',
      'blurIn',
    ];
    for (const n of NAMES) ch(n, 0);
    STATUS = [[0, 'searching']];
    // A status change at tc: the new text starts decoding at tc, the old one is wiped out just before (SWAP).
    const say = (key, tc) => {
      STATUS.push([tc, key]);
    };

    // --- The opening push's geometry. Camera = source point under the lens centre and lens radius r in source px
    // (scale R / r). The camera holds still while the eyepiece closes (the picture covers the screen exactly: any move
    // would show its edge); once the lens has taken over, the push accelerates steadily (its speed grows evenly from
    // rest, so it is seen moving at once) straight onto the helicopter and peaks at the change of shot (GLIDE after
    // the lens takes over), at least at VZ.
    const R = L.R;
    T.LENS = T.DUR + 0.02;
    Z.r0 = R / L.opCover;
    Z.rPeak = R / L.sOpPeak;
    Z.tot = Math.max(0.12, Math.log(Z.r0 / Z.rPeak));
    const SW1 = (T.OPN = T.LENS + T.GLIDE);
    Z.T = Math.min(SW1 - T.LENS, (2 * Z.tot) / T.VZ);
    Z.t0 = SW1 - Z.T;
    Z.rate = (2 * Z.tot) / Z.T;
    // Screen offset of the target (the soldier) from the lens centre in the clip's framing: small or none; it closes.
    Z.q0 = { x: (SCENE.op.aim.x - L.opC0.x) * L.opCover, y: (SCENE.op.aim.y - L.opC0.y) * L.opCover };
    // The push dies out inside the Little Bird at the same zoom rate (no change of speed at the change of shot).
    Z.lbZ = clamp((Z.rate * T.T2) / 3, 0.12, 0.6);

    // --- 1. The opening clip plays full screen (it fades in from black by itself); the HUD (heading strip, MAG)
    // and the status come up, the status already where it will sit under the eyepiece.
    mv('hud', 1, 0.7, 0.6, E.sio);
    mv('stat', 1, 0.8, 0.12, E.sio);
    // (the status label comes in: its frame opens from its centre, then its text decodes letter by letter, SDEC)
    mv('sOpen', 1, 0.8, 0.22, E.out3);

    // --- 2. The eyepiece: once the shot is lit, the scenery dims around the eyepiece as the reticle comes in (it stays
    // dimmed around the lens all along); the lens takes over the picture on the clip's last frame (the same picture at
    // the same place). The push accelerates to its peak: a long shutter and a strong defocus, the change of shot under
    // both, the haze's tint and a washed colour meeting across it; then the push dies out in the Little Bird and the
    // focus comes back.
    const L0 = T.LIT;
    mv('dim', 1, L0 + 0.3, 0.5, E.sio);
    mv('lfade', 1, T.LENS, 0.1, E.sio);
    // (the scope's view: the scenery around the lens goes out of focus as the lens takes the picture over)
    mv('blurIn', 1, T.LENS, 0.6, E.sio);
    ch('mot', 1);
    // (the screen texture over the scenery, once the lens covers the eyepiece: never inside the glass)
    mv('tex', 1, T.LENS + 0.12, 0.6, E.sio);
    mv('evig', 0.45, T.LENS, 0.3, E.sio);
    mv('ring', 1, L0 + 0.5, 0.45, E.sio);
    mv('hair', 1, L0 + 0.68, 0.7, E.io2);
    mv('hash', 1, L0 + 0.93, 0.65, E.sout);
    mv('boost', 4.2, SW1 - 0.25, 0.25, E.sin);
    mv('boost', 0, SW1, 0.33, E.sout);
    // (each change of shot alike: a 0.4 s cross-fade at the peak, inside a defocus of 18 held through it; the incoming
    // picture comes in at the outgoing one's exposure (EXPO: how much brighter the trailer's frame is than each
    // press-kit picture, in the glass at the cut), then eases to its own over 0.3 s, before the stills take over)
    mv('mfocus', 18, SW1 - 0.35, 0.15, E.sin);
    mv('mfocus', 0, SW1 + 0.1, 0.4, E.focus);
    mv('mix', 1, SW1 - 0.2, 0.4, E.sio);
    mv('expo', EXPO.lb - 1, SW1 - 0.2, 0.4, E.sio);
    mv('expo', 0, SW1 + 0.2, 0.3, E.lin);
    mv('wash', 1, SW1 - 0.16, 0.16, E.sin);
    mv('wash', 0, SW1, 0.34, E.sout);
    mv('warm', 1, SW1 - 0.07, 0.1, E.sio);
    mv('warm', 0, SW1 + 0.06, 0.8, E.sio);
    // (the motion canvas hands over to the still layers once the picture is at rest and sharp)
    mv('mot', 0, SW1 + T.T2 - 0.2, 0.14, E.sio);
    mv('evig', 0, SW1 + 0.1, 0.8, E.sio);

    // The eyepiece (the lens on screen) closes on the helicopter, then settles during the push to where the creator
    // will be in his framing: the change of shot happens with the target in the centre.
    ch('lx', L.Leye.x);
    ch('ly', L.Leye.y);
    mv('lx', L.Lopen.x, T.LENS + 0.3, SW1 - T.LENS - 0.35, E.sio);
    mv('ly', L.Lopen.y, T.LENS + 0.3, SW1 - T.LENS - 0.35, E.sio);

    // --- 3. The creator: the push dies out on him, magnification rises; the reticle's line opens for range and
    // magnification; the mustard box settles on him, the diamond drops in.
    ch('wX', L.F1.cx);
    ch('wY', L.F1.cy);
    ch('lz', -Z.lbZ);
    mv('lz', 0, T.OPN, T.T2, E.out3);
    // (the box and "identified" come as soon as the picture is at rest and sharp on him)
    const L1 = (T.L1 = T.OPN + 0.6);
    mv('rl', 1, L1 - 0.07, 0.45, E.sio);
    mv('tgC', 1, L1, 0.32, E.sout);
    ch('tgCS', 1.12);
    mv('tgCS', 1, L1 + 0.02, 0.62, E.glide);
    mv('hold', 1, L1 + 0.1, 0.6, E.sio);
    say('identified', L1 + 0.12);
    const TC = 1.2;
    mv('tagC', 1, L1 + 0.22, TC, E.lin);
    mv('scanC', 1, L1 + 0.22 + TC, 0.75, E.sio);
    // (his name is decoded at 80 % of the tag, then read for about 2.1 s)
    const GA = (T.GA = L1 + T.AIMC);

    // --- 4. Pulling out: the way in, played backwards, the scope staying on the eye. The box, the tag and the line's
    // readouts go (the hand leaves the scope); the scope pulls out of the Little Bird faster and faster; at the peak,
    // inside the blur, the creator in the centre becomes the near helicopter's soldier again; the pull-out dies out on
    // the clip's own framing as the eyepiece settles back where it closed: the scope at its least magnification, both
    // helicopters in view. What follows the motion runs backwards (the push, the camera, the lean, the lens's path, the
    // shutter, the washed colour, the haze's tint, the rim); the scope's reaction at the peak keeps its direction (the
    // lost focus and its spring), as on the way in.
    mv('hold', 0, GA - 0.1, 0.35, E.sio);
    mv('tgC', 0, GA - 0.05, 0.3, E.sin);
    // (the range and the magnification fade and the line's gaps close before anything moves)
    mv('rl', 0, GA - 0.05, 0.4, E.sio);
    mv('tagCOut', 1, GA, 0.3, E.lin);
    // (the take-off starts 0.4 s after the box has gone; its peak is T2 later)
    const X = (T.X = GA + 0.4 + T.T2);
    const XR = (T.XR = X + T.GLIDE);
    // (the scope searches again once it has left the creator: just after the change of shot, under the dying blur)
    say('searching', X + 0.12);
    // (in the Little Bird: the rim and the haze's tint come back, the motion canvas takes the lens back at rest, the
    // pull-out builds up to the push's peak rate)
    mv('evig', 0.45, X - 0.9, 0.8, E.sio);
    mv('warm', 1, X - 0.86, 0.8, E.sio);
    mv('mot', 1, X - T.T2 - 0.06, 0.14, E.sio);
    mv('lz', -Z.lbZ, X - T.T2, T.T2, E.in3);
    // (the peak: a long shutter and a strong defocus, the change of shot under both)
    mv('wash', 1, X - 0.34, 0.34, E.sin);
    mv('boost', 4.2, X - 0.33, 0.33, E.sin);
    mv('mfocus', 18, X - 0.35, 0.15, E.sin);
    mv('warm', 0, X - 0.03, 0.1, E.sio);
    mv('mix', 0, X - 0.2, 0.4, E.sio);
    mv('expo', 1 / EXPO.lb - 1, X - 0.2, 0.4, E.sio);
    mv('expo', 0, X + 0.2, 0.3, E.lin);
    mv('boost', 0, X, 0.25, E.sout);
    mv('wash', 0, X, 0.16, E.sout);
    mv('mfocus', 0, X + 0.1, 0.4, E.focus);
    // The opening shot's push, camera and lean replay backwards by themselves (opT); the eyepiece glides back with
    // them to where it closed.
    mv('lx', L.Leye.x, X + 0.05, T.GLIDE - 0.35, E.sio);
    mv('ly', L.Leye.y, X + 0.05, T.GLIDE - 0.35, E.sio);
    // (the scope stays on the eye: only the rim clears as the pull-out dies out)
    mv('evig', 0, XR - 0.3, 0.3, E.sio);
    T.WIDE = XR;
    // The opening shot around the lens follows the target with it (the point under the lens centre is the one the
    // lens magnifies), so it leans in as the lens moves and back out on the way out (opLean): the least zoom that keeps
    // the picture over the whole screen all along, measured once here over both (after every lens move, and once T.X
    // is set: opT folds time there), never clamped while it plays. (The way out mirrors the way in, so both give the
    // same value.)
    Z.out = 0;
    for (const [a, b] of [
      [T.LENS, T.OPN + 0.3],
      [T.X - 0.3, T.XR],
    ]) {
      for (let t = a; t <= b; t += 1 / 120) {
        const w = opLean(t);
        if (w < 1e-3) continue;
        const c = openCam(t);
        const p = lensPos(t);
        const z = Math.max(
          p.x / c.x,
          (L.W - p.x) / (PICS.op.w - c.x),
          p.y / c.y,
          (L.H - p.y) / (PICS.op.h - c.y),
        );
        Z.out = Math.max(Z.out, Math.log(z / L.opCover) / w);
      }
    }
    Z.out += 0.01;

    // --- 5. Searching for the second helicopter. From rest, the scope swings from the first helicopter to the second,
    // over the town, in one glide with the scope's inertia, pushing in a little: the point under the eyepiece's place
    // (Leye) runs straight from the first helicopter to the second while the zoom grows to sOp2, both on the same
    // curve, so the picture fills the screen all along (see sOp2). The second helicopter lands in the centre of the
    // reticle, where the eyepiece closed on the first (the lens shows the view at its own scale, the swing smeared by
    // the motion canvas). The heading strip turns with the view (about 8 degrees, to 136 SE) and MAG follows the zoom
    // (openCam, magAt); the sharper copy of the picture is swapped in while the view moves fastest (pOpZ: the same
    // picture, so it cannot be seen).
    const SR = (T.SR = T.WIDE);
    const A2 = SCENE.op.aim2;
    mv('vx', A2.x - L.opC0.x, SR, T.SWING, E.glide);
    mv('vy', A2.y - L.opC0.y, SR, T.SWING, E.glide);
    mv('vz', Math.log(L.sOp2 / L.opCover), SR, T.SWING, E.glide);
    mv('opZ', 1, SR + 0.55 * T.SWING - 0.04, 0.08, E.sio);
    const H2 = (T.H2 = SR + T.SWING);

    // --- 6. The second push, the first one's on the second helicopter: from the landing, the push accelerates to its
    // peak while the eyepiece settles to where the developers will be, the scenery around it following the target and
    // leaning in; at the peak, inside the blur, the helicopter becomes the developers' Little Bird in the lens (the
    // scenery around stays the trailer's landscape); the push dies out on them.
    const LENS2 = (T.LENS2 = H2 + 0.15);
    // (the push's geometry, as the first one's: from the panorama's scale to the helicopter's body across 70 % of the
    // glass, so at the peak the dark mass in the centre fills it as the first one did)
    Z2.r0 = R / L.sOp2;
    Z2.sPeak = Math.max(L.sOp2 * 1.5, (0.7 * L.D) / SCENE.op.bodyW2);
    Z2.tot = Math.max(0.12, Math.log(Z2.r0 / (R / Z2.sPeak)));
    const SW2 = (T.OPN2 = LENS2 + T.GLIDE);
    Z2.T = Math.min(SW2 - LENS2, (2 * Z2.tot) / T.VZ);
    Z2.t0 = SW2 - Z2.T;
    Z2.rate = (2 * Z2.tot) / Z2.T;
    Z2.lbZ = clamp((Z2.rate * T.T2) / 3, 0.12, 0.6);
    // (the developers' lens zoom, against the Little Birds' common one)
    Z2.lzD = Math.log(L.s2 / (L.sg * L.s1));
    mv('evig', 0.45, LENS2, 0.3, E.sio);
    // (the world camera waits on the developers' framing: nothing of the Little Birds is in the lens before the change)
    mv('wX', L.wB.x, LENS2, 0.01, E.lin);
    mv('wY', L.wB.y, LENS2, 0.01, E.lin);
    mv('lz', Z2.lzD - Z2.lbZ, LENS2, 0.01, E.lin);
    mv('boost', 4.2, SW2 - 0.25, 0.25, E.sin);
    mv('boost', 0, SW2, 0.33, E.sout);
    // (the change of shot itself, as the first one's)
    mv('mfocus', 18, SW2 - 0.35, 0.15, E.sin);
    mv('mfocus', 0, SW2 + 0.1, 0.4, E.focus);
    mv('mix', 1, SW2 - 0.2, 0.4, E.sio);
    mv('expo', EXPO.l2 - 1, SW2 - 0.2, 0.4, E.sio);
    mv('expo', 0, SW2 + 0.2, 0.3, E.lin);
    mv('wash', 1, SW2 - 0.16, 0.16, E.sin);
    mv('wash', 0, SW2, 0.34, E.sout);
    mv('warm', 1, SW2 - 0.07, 0.1, E.sio);
    mv('warm', 0, SW2 + 0.06, 0.8, E.sio);
    mv('mot', 0, SW2 + T.T2 - 0.2, 0.14, E.sio);
    mv('evig', 0, SW2 + 0.1, 0.8, E.sio);
    mv('lx', L.F2.L.x, LENS2 + 0.3, SW2 - LENS2 - 0.35, E.sio);
    mv('ly', L.F2.L.y, LENS2 + 0.3, SW2 - LENS2 - 0.35, E.sio);
    mv('lz', Z2.lzD, SW2, T.T2, E.out3);
    // The opening shot around the lens leans in again as the lens moves (opLean2): the least zoom that keeps the
    // picture over the whole screen, measured once here, as for the entry.
    Z2.out = 0;
    for (let t = LENS2; t <= SW2 + 0.3; t += 1 / 120) {
      const w = opLean2(t);
      if (w < 1e-3) continue;
      const c = openCam(t);
      const pp = lensPos(t);
      const z = Math.max(
        pp.x / c.x,
        (L.W - pp.x) / (PICS.op.w - c.x),
        pp.y / c.y,
        (L.H - pp.y) / (PICS.op.h - c.y),
      );
      Z2.out = Math.max(Z2.out, Math.log(z / L.sOp2) / w);
    }
    Z2.out += 0.01;

    // --- 7. The developers: allies, the green box, one tag (developer, then publisher); the reticle's line opens.
    const WE = (T.WE = SW2 + 0.6);
    mv('rl', 1, WE - 0.07, 0.45, E.sio);
    mv('tgD', 1, WE - 0.08, 0.32, E.sout);
    ch('tgDS', 1.12);
    mv('tgDS', 1, WE - 0.06, 0.62, E.glide);
    mv('hold', 1, WE - 0.05, 0.6, E.sio);
    say('allies', WE);
    const TDg = 1.5;
    mv('tagD', 1, WE + 0.14, TDg, E.lin);
    mv('scanD', 1, WE + 0.14 + TDg, 0.75, E.sio);
    // (Team17 is decoded at 84 % of the tag, then both names are read for about 2.4 s; the box settled at WE - 0.08)
    const G0 = (T.G0 = WE - 0.08 + T.AIMD);

    // --- 8. The wall: same picture in the lens. The scope glides right to the concrete tower and zooms in more (the
    // scenery around stays put); the red brackets converge with a short snap, the red box and the crosshair settle on
    // the emblem: target locked. (The glide lasts 2 s, so "searching" decodes at its usual pace on the way.)
    mv('tagDOut', 1, G0 - 0.12, 0.3, E.lin);
    mv('tgD', 0, G0 - 0.15, 0.32, E.sin);
    mv('hold', 0, G0 - 0.16, 0.3, E.sio);
    say('searching', G0 + 0.14);
    const GD = 2.0;
    mv('lx', L.F3.L.x, G0 + 0.02, GD, E.glide);
    mv('ly', L.F3.L.y, G0 + 0.02, GD, E.glide);
    mv('wX', L.wW.x, G0, GD + 0.04, E.glide);
    mv('wY', L.wW.y, G0, GD + 0.04, E.glide);
    mv('wS', Math.log(L.F3.s / L.F2.s), G0 + 0.05, GD, E.sio);
    mv('lz', Math.log(L.s3 / (L.sg * L.s1)), G0 + 0.3, GD - 0.22, E.sio);
    T.LOCK = G0 + GD + 0.2;
    mv('lockLO', 1, T.LOCK - 0.36, 0.15, E.sout);
    ch('lockLS', 1.6);
    mv('lockLS', 1, T.LOCK - 0.34, 0.4, E.snap);
    // (they come in turned and straighten as they converge, slowing into the lock while the spread snaps)
    ch('lockLR', 22);
    mv('lockLR', 0, T.LOCK - 0.36, 0.42, E.out3);
    mv('flash', 1, T.LOCK, 0.06, E.sout);
    mv('flash', 0, T.LOCK + 0.06, 0.45, E.sout);
    mv('hold', 1, T.LOCK - 0.2, 0.5, E.sio);
    mv('tgL', 1, T.LOCK + 0.04, 0.32, E.sio);
    say('locked', T.LOCK - 0.02);

    // --- 9. Out, once the logo has been held: the scope eases out, everything fades softly to black, then the stage
    // fades out over the presentation (renderHud).
    const tOut = T.LOCK + T.AIML;
    mv('out', 1, tOut, 1.4, E.sio);
    mv('hudOut', 1, tOut, 1.0, E.sio);
    mv('endO', 1, tOut + 1.45, 0.45, E.sio);
    T.END = tOut + 2.0;
    T.tLockView = T.LOCK + 0.8;
    // What the rangefinder reads: nothing while moving between targets.
    TRACK = [
      [0, null],
      [L1, 'C'],
      [GA + 0.35, null],
      [WE - 0.08, 'D'],
      [G0 - 0.12, null],
      [T.LOCK - 0.34, 'L'],
    ];
  }

  // ---------------------------------------------------------------------------------------------------------
  // Cameras. The opening shot's camera is the source point under the lens centre (x, y) and the lens radius r in
  // source px (scale R / r); the panorama and the lens share it. The two Little Birds share the world camera (x, y,
  // z: CSS px per world unit), their framing under the lens. The lens is a circle at (lx, ly) on screen showing, at
  // its own zoom, the area under its centre. The opening shot runs on its own clock (opT), so the way out replays the
  // way in.
  function sway(t) {
    return {
      x: 0.62 * Math.sin((TAU * t) / 4.9 + 1.1) + 0.28 * Math.sin((TAU * t) / 2.35 + 0.3),
      y: 0.78 * Math.sin((TAU * t) / 3.6 + 0.2) + 0.3 * Math.sin((TAU * t) / 1.95 + 2.2),
    };
  }
  // The opening shot's clock: the film's time, then (from halfway between the two changes of shot, while the Little
  // Bird fills the lens) the same moments backwards, so the way out replays the push, the camera and the lean in
  // reverse, frame for frame, and lands on exactly the framing they started from. Past XR this clock runs below LENS,
  // where the push, the centring and the lean are all at rest: the view's swing adds on top (vx, vy, vz). From LENS2
  // the second push runs on the film's time (openPush2, opLean2).
  const opT = (t) => Math.min(t, T.OPN + T.X - t);
  // (how far the opening shot around the lens leans in, 0..1 of Z.out: in with the push, back out on the way out;
  // and, 0..1 of Z2.out, with the second push)
  const opLean = (t) => E.sio(seg(opT(t), T.LENS, T.OPN + 0.3));
  const opLean2 = (t) => E.sio(seg(t, T.LENS2, T.OPN2 + 0.3));
  // The opening push (lens radius, source px): still, then an accelerating zoom up to the peak (the change of shot),
  // which carries on at the same rate (seen only through the motion blur and the change of shot's cross-fade). (It
  // takes the opening shot's own time: openCam passes opT(t).)
  function openPush(t) {
    let lnz;
    if (t <= Z.t0) lnz = 0;
    else if (t <= T.OPN) {
      const u = (t - Z.t0) / Z.T;
      lnz = Z.tot * u * u;
    } else lnz = Z.tot + Z.rate * Math.min(0.5, t - T.OPN);
    return Z.r0 * Math.exp(-lnz);
  }
  // The second push, the same on the second helicopter, from the panorama's scale (Z2).
  function openPush2(t) {
    let lnz;
    if (t <= Z2.t0) lnz = 0;
    else if (t <= T.OPN2) {
      const u = (t - Z2.t0) / Z2.T;
      lnz = Z2.tot * u * u;
    } else lnz = Z2.tot + Z2.rate * Math.min(0.5, t - T.OPN2);
    return Z2.r0 * Math.exp(-lnz);
  }
  // The camera: still in the clip's framing until the lens takes over, then it centres the target (g = progress:
  // its screen offset from the lens centre, small or none, goes to zero) while the push carries on. Only the lens
  // shows the picture by then, and the lens circle stays well inside the picture all along: no edge guard is needed
  // (and none can make the camera twitch). On the way out, the same backwards: the target's offset opens again as the
  // pull-out dies out, back to the clip's framing. From the search on, the view's swing adds on top (vx, vy): the point
  // under the eyepiece's place glides from the first helicopter to the second (the heading reads it).
  function openCam(t) {
    // (the second push: the second helicopter under the lens centre, as the view's swing left it)
    if (t >= T.LENS2) {
      const r2 = openPush2(t);
      return { x: SCENE.op.aim2.x, y: SCENE.op.aim2.y, r: r2, s: L.R / r2 };
    }
    const u = opT(t);
    const r = openPush(u);
    const sp = L.R / r;
    const g = 1 - E.sio(seg(u, T.LENS, T.OPN - 0.3));
    const aim = SCENE.op.aim;
    // (the target's offset is the push's own, so the swing lands the second helicopter exactly under the lens centre;
    // the lens's scale is the push's times the view's own zoom on the way to the second helicopter)
    return {
      x: aim.x - (Z.q0.x * g) / sp + V('vx', t),
      y: aim.y - (Z.q0.y * g) / sp + V('vy', t),
      r,
      s: sp * Math.exp(V('vz', t)),
    };
  }
  function worldCam(t) {
    const z = L.F1.s * Math.exp(V('wS', t));
    let x = V('wX', t);
    // (on the town, the wall glide's small overshoot never takes the framing past the picture's left edge)
    if (t >= T.WE) x = Math.max(x, L.XB + L.W / (2 * z));
    return { x, y: V('wY', t), z };
  }
  // Where each Little Bird sits in the world (top edges level, at y 0).
  const PLACE = (shot) => (shot === 'l2' ? { X: L.XB, Y: 0, g: L.sg } : { X: 0, Y: 0, g: 1 });
  function lensPos(t) {
    let x = V('lx', t);
    let y = V('ly', t);
    const h = V('hold', t);
    if (h > 0.0001) {
      const sw = sway(t);
      x += sw.x * 2.4 * L.k * h;
      y += sw.y * 2.4 * L.k * h;
    }
    return { x, y };
  }
  // The Little Birds' lens zoom. Outside the Little Bird (before the change of shot, after the change back) it carries
  // on the push or the pull-out at its peak rate (seen only through the motion blur and the change of shot's
  // cross-fade); inside, lz.
  const lensZoom = (t) => {
    // (the second push: the developers' zoom, carried on backwards at the peak rate before its change of shot)
    if (t >= T.OPN2) return L.s1 * Math.exp(V('lz', t));
    if (t >= T.LENS2) return L.s1 * Math.exp(Z2.lzD - Z2.lbZ - Z2.rate * (T.OPN2 - t));
    const te = opT(t);
    return L.s1 * Math.exp(te < T.OPN ? -Z.lbZ - Z.rate * (T.OPN - te) : V('lz', t));
  };
  // Mappings, screen = a + source * s (CSS px).
  // (the scenery's anchor: where the lens rests, without its hold sway; from the glide to the wall on, where it held on
  // the developers, so the scenery stays put while the scope moves over it)
  const sceneAnchor = (t) => {
    const u = t >= T.G0 ? T.G0 : t;
    return { x: V('lx', u), y: V('ly', u) };
  };
  // The panorama: the opening shot around the lens.
  function panoMap(t) {
    const c = openCam(t >= T.G0 ? T.G0 : t);
    const p = sceneAnchor(t);
    // (the lean around the lens, and the view's own push-in on the second helicopter)
    const s = L.opCover * Math.exp(Z.out * opLean(t) + V('vz', t) + Z2.out * opLean2(t));
    return { a: p.x - c.x * s, b: p.y - c.y * s, s };
  }
  function lensMap(shot, t, e = 1) {
    const p = lensPos(t);
    if (shot === 'op') {
      const c = openCam(t);
      const s = c.s * e;
      return { a: p.x - c.x * s, b: p.y - c.y * s, s, lx: p.x, ly: p.y, qx: c.x, qy: c.y };
    }
    const c = worldCam(t);
    const qx = c.x + (p.x - L.W / 2) / c.z;
    const qy = c.y + (p.y - L.H / 2) / c.z;
    const zl = lensZoom(t) * e;
    const P = PLACE(shot);
    return { a: p.x + (P.X - qx) * zl, b: p.y + (P.Y - qy) * zl, s: P.g * zl, lx: p.x, ly: p.y, qx, qy };
  }
  // World rectangles: what the lens shows (from its Little Bird mapping m), and each picture.
  function lensRect(m) {
    const r = L.R / m.s;
    return { x1: m.qx - r, x2: m.qx + r, y1: m.qy - r, y2: m.qy + r };
  }
  const RECT = {
    lb: () => ({ x1: 0, y1: 0, x2: PICS.lb.w, y2: PICS.lb.h }),
    l2: () => ({ x1: L.XB, y1: 0, x2: L.XB + L.sg * PICS.l2.w, y2: L.sg * PICS.l2.h }),
  };
  const meets = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

  // Heading: the opening shot's point under the lens (the scope swinging towards its target), then from the change of
  // shot the world point under the lens (without the hand's sway, so the tape stands still at a hold), and the opening
  // shot's point again after the change back.
  function headingAt(t) {
    const ho = (tt) => HDG.op0 + (openCam(tt).x - L.opC0.x) / HDG.opU;
    const wq = (tt) => {
      const c = worldCam(tt);
      return c.x + (V('lx', tt) - L.W / 2) / c.z;
    };
    // (on the developers' Little Bird: from the bearing the second helicopter was on)
    if (t >= T.OPN2) return ho(T.OPN2) + (wq(t) - wq(T.OPN2)) / HDG.wU;
    if (t < T.OPN || t >= T.X) return ho(t);
    return ho(T.OPN) + (wq(t) - L.qOpn) / HDG.wU;
  }
  function headingRange() {
    let a = Infinity;
    let b = -Infinity;
    for (let t = 0; t <= T.END + 1e-6; t += 0.05) {
      const h = headingAt(t);
      a = Math.min(a, h);
      b = Math.max(b, h);
    }
    const m = L.hdgW / 2 / L.ppd + 12;
    L.h0 = Math.floor(a - m);
    L.h1 = Math.ceil(b + m);
  }

  // ---------------------------------------------------------------------------------------------------------
  // Drawing: only transforms and opacities of layers painted once (the compositor does the rest).
  const last = {};
  const setStyle = (el, prop, v, key) => {
    const k = key || el.id + prop;
    if (last[k] !== v) {
      last[k] = v;
      el.style[prop] = v;
    }
  };
  const setAttr = (el, attr, v, key) => {
    const k = key || el.id + '@' + attr;
    if (last[k] !== v) {
      last[k] = v;
      el.setAttribute(attr, v);
    }
  };
  const setText = (el, v) => {
    const k = el.id + '#text';
    if (last[k] !== v) {
      last[k] = v;
      el.textContent = v;
    }
  };
  // A picture canvas (k canvas px per source px, 1 CSS px per canvas px) at mapping m, relative to (ox, oy).
  function place(el, m, k, op, ox = 0, oy = 0) {
    const vis = op > 0.0005;
    setStyle(el, 'opacity', vis ? op.toFixed(4) : '0');
    if (vis)
      setStyle(
        el,
        'transform',
        `translate(${(m.a - ox).toFixed(2)}px, ${(m.b - oy).toFixed(2)}px) scale(${(m.s / k).toFixed(6)})`,
      );
  }
  function renderPics(t, St) {
    const outF = 1 - E.sio(St.out);
    // The opening shot: the clip while it plays, then its 4K last frame (the same picture), around the lens all film
    // long (the scope's view never changes scene). If the clip cannot play, the last frame stands in, with the clip's
    // own fade from black. Dimmed with the eyepiece left clear until the lens takes the picture over (the hole is only
    // ever right under the lens), then plain; faded with the end.
    const opM = panoMap(t);
    const fromClip = clipReady && t < T.DUR;
    place(pClip, opM, CLIP_SRC.w / PICS.op.w, fromClip ? outF : 0);
    const opA = fromClip ? 0 : (t < T.DUR ? fadeAt(t) : 1) * outF;
    // (the scope's view: once the lens is on screen, the blurred copy comes in over the sharp picture, which goes once
    // covered; the sharp copies stay the lens's sources)
    const bi = St.blurIn;
    place(pOp, opM, L.kbOp, bi < 0.999 ? opA : 0);
    place(pOpB, opM, L.kbOpB, opA * bi);
    const eye = t < T.LENS + 0.12;
    const dim = St.dim * outF;
    setStyle(opDimEye, 'opacity', (eye ? dim : 0).toFixed(4));
    setStyle(opDim, 'opacity', (eye ? 0 : dim).toFixed(4));
    setStyle(tex, 'opacity', (St.tex * outF).toFixed(4));
    setStyle(edge, 'opacity', (St.dim * outF).toFixed(4));
  }
  function renderLens(t, St) {
    const outF = 1 - E.sio(St.out);
    if (!(St.lfade > 0.001 && t >= T.LENS && outF > 0.001)) {
      setStyle(lensWrap, 'opacity', '0');
      return;
    }
    const e = 1 - 0.05 * E.in2(St.out);
    const lp = lensPos(t);
    setStyle(
      lensWrap,
      'transform',
      `translate(${lp.x.toFixed(2)}px, ${lp.y.toFixed(2)}px) scale(${e.toFixed(5)})`,
    );
    setStyle(lensWrap, 'opacity', (St.lfade * outF).toFixed(4));
    // (the still layers show the Little Bird between the two changes of shot, and the developers' from the second;
    // before and after, the lens shows the opening shot, through the motion canvas only. They come in under the opaque
    // motion canvas a quarter of a second after each change of shot: past its peak, the frame's heaviest moment, and
    // well before the motion canvas hands over to them, T2 - 0.2 s after it)
    const stills = (t >= T.OPN + 0.25 && t < T.X) || t >= T.OPN2 + 0.25;
    const mLb = lensMap('lb', t);
    const lr = lensRect(mLb);
    const onA = stills && meets(lr, RECT.lb());
    const onB = stills && meets(lr, RECT.l2());
    place(kLb, mLb, L.kkLb, onA ? 1 : 0, lp.x, lp.y);
    // The town: the reduced copy for the developers, the full one fading in over it as the scope zooms on the wall
    // (small screens only).
    const m2 = lensMap('l2', t);
    if (L.kkL2a) {
      place(kL2a, m2, kL2a.width / PICS.l2.w, onB ? 1 : 0, lp.x, lp.y);
      place(
        kL2,
        m2,
        kL2.width / PICS.l2.w,
        onB ? smooth(seg((m2.s * L.cdpr) / L.kkL2, 0.6, 0.75)) : 0,
        lp.x,
        lp.y,
      );
    } else {
      place(kL2a, m2, 1, 0, lp.x, lp.y);
      place(kL2, m2, kL2.width / PICS.l2.w, onB ? 1 : 0, lp.x, lp.y);
    }
    // The push and the change of shot: the motion canvas, drawn every frame while it is shown (only then).
    const mo = St.mot;
    if (mo > 0.001) drawMotion(t, St);
    setStyle(kMot, 'opacity', mo > 0.001 ? mo.toFixed(4) : '0');
    setStyle(lensTint, 'opacity', St.warm.toFixed(4));
    setStyle(lensEdge, 'opacity', St.evig.toFixed(4));
    setStyle(lensFlash, 'opacity', (0.07 * St.flash).toFixed(4));
  }

  // The motion canvas: the picture under the lens is drawn into a buffer with a margin, smeared over one shutter by
  // doubling passes (a zoom about its fixed point, or a shift), then copied into the glass with the focus blur and the
  // washed colour. Everything relative to the lens centre.
  const SHUTTER = 1 / 40;
  function motionShots(t) {
    const mix = V('mix', t);
    const out = [];
    if (mix < 1) out.push(['op', 1 - mix]);
    if (mix > 0) out.push([t >= T.LENS2 ? 'l2' : 'lb', mix]);
    return out;
  }
  // A shot's lens mapping relative to the lens centre (screen offset = a + source * s).
  function relMap(shot, t) {
    const m = lensMap(shot, t);
    return { a: m.a - m.lx, b: m.b - m.ly, s: m.s };
  }
  // Draws a shot's lens picture into ctx, whose pixel (0, 0) is the lens-relative point (o, o) (CSS px).
  // (src, k: another copy of the same picture, k canvas px per source px)
  function drawPicAt(ctx, shot, m, o, size, src, kSrc, dd) {
    const l2 = L.kkL2a ? [kL2a, L.kkL2a] : [kL2, L.kkL2];
    const cv = src || (shot === 'op' ? kOp : shot === 'l2' ? l2[0] : kLb);
    const k = src ? kSrc : shot === 'op' ? L.kkOp : shot === 'l2' ? l2[1] : L.kkLb;
    // (the target's pixels per CSS px: the screen's, or half of it for the motion canvas under a strong defocus)
    const d = dd || L.cdpr;
    const sx0 = (o - m.a) / m.s;
    const sy0 = (o - m.b) / m.s;
    const sw = size / d / m.s;
    const x0 = Math.max(0, sx0);
    const y0 = Math.max(0, sy0);
    const x1 = Math.min(cv.width / k, sx0 + sw);
    const y1 = Math.min(cv.height / k, sy0 + sw);
    if (x1 <= x0 || y1 <= y0) return;
    ctx.drawImage(
      cv,
      x0 * k,
      y0 * k,
      (x1 - x0) * k,
      (y1 - y0) * k,
      (x0 - sx0) * m.s * d,
      (y0 - sy0) * m.s * d,
      (x1 - x0) * m.s * d,
      (y1 - y0) * m.s * d,
    );
  }
  function drawMotion(t, St) {
    const d = L.cdpr;
    const R = L.R;
    const now = motionShots(t);
    let dom = now[0];
    for (const n of now) if (n[1] > dom[1]) dom = n;
    // The dominant shot's motion over the shutter, as a similarity (the picture now -> one shutter earlier).
    const sh = SHUTTER * (1 + St.boost);
    const m1 = relMap(dom[0], t);
    const m0 = relMap(dom[0], Math.max(0, t - sh));
    let kk = m0.s / m1.s;
    let F = null;
    let b = null;
    if (Math.abs(1 - kk) > 1e-5) F = { x: (m0.a - kk * m1.a) / (1 - kk), y: (m0.b - kk * m1.b) / (1 - kk) };
    else b = { x: m0.a - m1.a, y: m0.b - m1.b };
    const focusPx = Math.abs(St.mfocus) * (R / 390);
    let disp = F
      ? Math.max(Math.abs(1 / kk - 1), Math.abs(1 - kk)) * (Math.hypot(F.x, F.y) + R * 1.42)
      : Math.hypot(b.x, b.y);
    const bufHalf = bufA.width / d / 2 - 4;
    const room = bufHalf - R - 3 * focusPx - 6;
    if (disp > room && disp > 0) {
      const f = Math.max(0, room) / disp;
      if (F) kk = Math.exp(Math.log(kk) * f);
      else b = { x: b.x * f, y: b.y * f };
      disp = Math.max(0, room);
    }
    const half = R + Math.max(0, Math.min(bufHalf - R, disp + 3 * focusPx + 6));
    // (under a blur of about 1.5 device px or more, defocus plus a fortieth of the shutter's smear, the buffers are
    // worked at half resolution: same geometry, a quarter of the pixels; the blur leaves no detail that half the pixels
    // would lose: checked at 45 dB on the glass where the two differ)
    const q = focusPx * d + (disp * d) / 40 >= 1.5 ? 0.5 : 1;
    const dq = d * q;
    const size = Math.min(bufA.width, Math.ceil(2 * half * dq) + 2);
    // Base: each shot on screen (the change of shot is a cross-fade of the two), over the ground colour.
    actx.setTransform(1, 0, 0, 1, 0, 0);
    actx.globalCompositeOperation = 'source-over';
    actx.globalAlpha = 1;
    actx.filter = 'none';
    actx.fillStyle = '#0a0c08';
    actx.fillRect(0, 0, size, size);
    let acc = 0;
    for (const [shot, w] of now) {
      if (w <= 0.0005) continue;
      acc += w;
      actx.globalAlpha = w / acc;
      const m = relMap(shot, t);
      drawPicAt(actx, shot, m, -half, size, null, 0, dq);
      // (at rest the lens draws the panorama's own copy of the opening shot, pOp, so it takes the picture over with the
      // very same pixels, and from the middle of the swing pOpZ, the same picture larger; the lens's own copy, kOp,
      // takes over while each push starts, and gives way to them again as the pull-out dies out)
      const uo = t >= T.LENS2 ? T.LENS + (t - T.LENS2) : opT(t);
      const pa = shot === 'op' ? 1 - E.sio(seg(uo, T.LENS + 0.1, T.LENS + 0.4)) : 0;
      const zc = L.kbOpZ && V('opZ', t) >= 0.999;
      if (pa > 0.001) {
        actx.globalAlpha = (w / acc) * pa;
        drawPicAt(actx, shot, m, -half, size, zc ? pOpZ : pOp, zc ? L.kbOpZ : L.kbOp, dq);
      }
    }
    actx.globalAlpha = 1;
    // Motion blur by doubling passes.
    let src = bufA;
    let dst = bufB;
    // (under a strong defocus, at the peak of each push, a quarter of the samples: the blur hides their steps)
    const samples = clamp(Math.ceil((disp * dq) / 1.6), 1, focusPx * d > 6 ? 16 : 64);
    const passes = samples <= 1 ? 0 : Math.ceil(Math.log2(samples));
    const N = 2 ** passes;
    const FxD = F ? (F.x + half) * dq : 0;
    const FyD = F ? (F.y + half) * dq : 0;
    for (let j = 0; j < passes; j++) {
      const f = 2 ** j / N;
      const dc = dst === bufA ? actx : bctx;
      dc.setTransform(1, 0, 0, 1, 0, 0);
      dc.globalCompositeOperation = 'copy';
      dc.globalAlpha = 1;
      dc.drawImage(src, 0, 0, size, size, 0, 0, size, size);
      dc.globalCompositeOperation = 'source-over';
      dc.globalAlpha = 0.5;
      if (F) {
        const kf = Math.exp(Math.log(kk) * f);
        dc.setTransform(kf, 0, 0, kf, (1 - kf) * FxD, (1 - kf) * FyD);
      } else dc.setTransform(1, 0, 0, 1, f * b.x * dq, f * b.y * dq);
      dc.drawImage(src, 0, 0, size, size, 0, 0, size, size);
      dc.setTransform(1, 0, 0, 1, 0, 0);
      dc.globalAlpha = 1;
      [src, dst] = [dst, src];
    }
    // Into the glass (the whole buffer, offset, so the blurs read real pixels at the rim): focus blur, washed colour,
    // applied as the buffer is drawn (up, from half resolution) at the glass's own size.
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalCompositeOperation = 'copy';
    const wash = 1 - 0.45 * St.wash;
    const ex = 1 + St.expo;
    const fx = [
      focusPx > 0.05 ? `blur(${(focusPx * d).toFixed(2)}px)` : '',
      wash < 0.999 ? `saturate(${wash.toFixed(4)})` : '',
      Math.abs(ex - 1) > 0.0005 ? `brightness(${ex.toFixed(4)})` : '',
    ]
      .join(' ')
      .trim();
    mctx.filter = fx || 'none';
    const off = (half - R) * d;
    mctx.drawImage(src, 0, 0, size, size, -off, -off, size / q, size / q);
    mctx.filter = 'none';
    mctx.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------------------------------------------------
  // Reticle, target markers, range and magnification, tags, HUD.
  const toScreen = (m, p) => ({ x: m.a + p.x * m.s, y: m.b + p.y * m.s });
  const toUnits = (q, lp) => ({ x: 200 + ((q.x - lp.x) * 400) / L.S, y: 200 + ((q.y - lp.y) * 400) / L.S });
  function brackets(q1, q2, arm) {
    const [x1, y1, x2, y2] = [q1.x, q1.y, q2.x, q2.y].map(f2).map(Number);
    return (
      `M${x1} ${f2(y1 + arm)}V${y1}H${f2(x1 + arm)}M${f2(x2 - arm)} ${y1}H${x2}V${f2(y1 + arm)}` +
      `M${x2} ${f2(y2 - arm)}V${y2}H${f2(x2 - arm)}M${f2(x1 + arm)} ${y2}H${x1}V${f2(y2 - arm)}`
    );
  }
  const spreadBox = (b, s) => {
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    return {
      x1: cx + (b.x1 - cx) * s,
      y1: cy + (b.y1 - cy) * s,
      x2: cx + (b.x2 - cx) * s,
      y2: cy + (b.y2 - cy) * s,
    };
  };
  const grow = (b, p) => ({ x1: b.x1 - p, y1: b.y1 - p, x2: b.x2 + p, y2: b.y2 + p });
  function boxUnits(m, b, lp) {
    return [toUnits(toScreen(m, { x: b.x1, y: b.y1 }), lp), toUnits(toScreen(m, { x: b.x2, y: b.y2 }), lp)];
  }
  // Target markers: box (light fill), corner ticks just outside it, a diamond above; on the wall a crosshair.
  const tgEls = (id) => ({
    b: $('#' + id + '-b'),
    k: $('#' + id + '-k'),
    d: $('#' + id + '-d'),
    x: $('#' + id + '-x'),
  });
  const TG = { C: tgEls('tgC'), D: tgEls('tgD'), L: tgEls('tgL') };
  // (returns the frame's pieces as rectangles in reticle units — box, corner ticks, diamond — whenever its place m is
  // known, drawn or not: the hair lines make way for a frame a little before it shows)
  // (gap: the corner, tl tr br bl, whose tick is left out — where a card's leader leaves the box)
  function drawTarget(tg, v, S, m, box, pad, lp, aim, gap) {
    const parts = [tg.b, tg.k, tg.d, tg.x].filter(Boolean);
    const show = v > 0.001 && m;
    if (!show && tg.on) {
      tg.on = false;
      for (const el of parts) {
        setAttr(el, 'd', '');
        setStyle(el, 'fillOpacity', '0');
        setStyle(el, 'strokeOpacity', '0');
      }
    }
    if (!m) return null;
    const u = 400 / L.S;
    const n = f2;
    const [p1, p2] = boxUnits(m, spreadBox(grow(box, pad), S), lp);
    const rects = [[p1.x, p1.y, p2.x, p2.y]];
    const a = 9 * u;
    let K = null;
    if (tg.k) {
      const [q1, q2] = boxUnits(m, spreadBox(grow(box, pad), 1 + (S - 1) * 1.7), lp);
      const o = 5 * u;
      K = [q1.x - o, q1.y - o, q2.x + o, q2.y + o];
      const [X1, Y1, X2, Y2] = K;
      const corners = {
        tl: [X1, Y1, X1 + a, Y1 + a],
        tr: [X2 - a, Y1, X2, Y1 + a],
        br: [X2 - a, Y2 - a, X2, Y2],
        bl: [X1, Y2 - a, X1 + a, Y2],
      };
      for (const c in corners) if (c !== gap) rects.push(corners[c]);
    }
    // (the diamond drops in from a little higher)
    const cx = (p1.x + p2.x) / 2;
    const dh = 6 * u;
    const cy = p1.y - (15 + 8 * (1 - v)) * u;
    rects.push([cx - dh, cy - dh, cx + dh, cy + dh]);
    if (!show) return rects;
    tg.on = true;
    setAttr(tg.b, 'd', `M${n(p1.x)} ${n(p1.y)}H${n(p2.x)}V${n(p2.y)}H${n(p1.x)}Z`);
    setStyle(tg.b, 'fillOpacity', (0.1 * v).toFixed(3));
    setStyle(tg.b, 'strokeOpacity', (0.95 * v).toFixed(3));
    if (K) {
      const [X1, Y1, X2, Y2] = K;
      const ticks = {
        tl: `M${n(X1)} ${n(Y1 + a)}V${n(Y1)}H${n(X1 + a)}`,
        tr: `M${n(X2 - a)} ${n(Y1)}H${n(X2)}V${n(Y1 + a)}`,
        br: `M${n(X2)} ${n(Y2 - a)}V${n(Y2)}H${n(X2 - a)}`,
        bl: `M${n(X1 + a)} ${n(Y2)}H${n(X1)}V${n(Y2 - a)}`,
      };
      setAttr(
        tg.k,
        'd',
        Object.keys(ticks)
          .filter((c) => c !== gap)
          .map((c) => ticks[c])
          .join(''),
      );
      setStyle(tg.k, 'strokeOpacity', (0.9 * v).toFixed(3));
    }
    setAttr(
      tg.d,
      'd',
      `M${n(cx)} ${n(cy - dh)}L${n(cx + dh)} ${n(cy)}L${n(cx)} ${n(cy + dh)}L${n(cx - dh)} ${n(cy)}Z`,
    );
    setStyle(tg.d, 'fillOpacity', (0.35 * v).toFixed(3));
    setStyle(tg.d, 'strokeOpacity', v.toFixed(3));
    if (tg.x && aim) {
      const pa = toUnits(toScreen(m, aim), lp);
      const r = 4.5 * u;
      const r1 = 7 * u;
      const r2 = 12 * u;
      setAttr(
        tg.x,
        'd',
        `M${n(pa.x + r)} ${n(pa.y)}A${n(r)} ${n(r)} 0 1 0 ${n(pa.x - r)} ${n(pa.y)}A${n(r)} ${n(r)} 0 1 0 ${n(pa.x + r)} ${n(pa.y)}` +
          `M${n(pa.x)} ${n(pa.y - r1)}V${n(pa.y - r2)}M${n(pa.x)} ${n(pa.y + r1)}V${n(pa.y + r2)}M${n(pa.x - r1)} ${n(pa.y)}H${n(pa.x - r2)}M${n(pa.x + r1)} ${n(pa.y)}H${n(pa.x + r2)}`,
      );
      setStyle(tg.x, 'strokeOpacity', v.toFixed(3));
    }
    return rects;
  }
  // What the rangefinder reads (metres), and in which colour: a quick roll of figures on a new target, then the
  // target's range, breathing a little.
  function trackAt(t) {
    let k = null;
    let t0 = 0;
    for (const [tt, kk] of TRACK)
      if (t >= tt) {
        k = kk;
        t0 = tt;
      }
    return { k, u: t - t0 };
  }
  function rangeText(t) {
    const { k, u } = trackAt(t);
    if (!k) return '---.-';
    if (u < 0.3) {
      const b = Math.floor(t * 30);
      return (40 + (hash(b * 17 + 3) % 900) + (hash(b + 5) % 10) / 10).toFixed(1);
    }
    const R0 = RANGE[k];
    const q = Math.floor(t * 5);
    return (
      R0.v +
      R0.a * Math.sin((TAU * q) / 5 / 3.1) +
      R0.a * 0.4 * ((hash(q * 7 + 1) % 1000) / 1000 - 0.5)
    ).toFixed(1);
  }

  function renderScope(t, St) {
    const e = 1 - 0.05 * E.in2(St.out);
    const lp = lensPos(t);
    // (the reticle comes in over the closing eyepiece, before the lens takes over the picture)
    if (t < T.LIT) {
      setStyle(scope, 'opacity', '0');
      return;
    }
    setStyle(
      scope,
      'transform',
      `translate(${f2(lp.x - L.S / 2)}px, ${f2(lp.y - L.S / 2)}px) scale(${e.toFixed(4)})`,
    );
    setStyle(scope, 'opacity', (1 - E.sio(St.out)).toFixed(3));
    // (stroke and fill opacities, not element opacities: an SVG element's opacity costs an offscreen pass per frame)
    setStyle(ring, 'strokeOpacity', St.ring.toFixed(3));
    setStyle(glassc, 'fillOpacity', St.ring.toFixed(3));
    const q = L.S / 400;
    // (target geometry in the reticle's units; the lens content is drawn at scale e, the reticle at e too)
    const ue = (m) => ({ a: lp.x + (m.a - lp.x) / e, b: lp.y + (m.b - lp.y) / e, s: m.s / e });
    const outL = 1 - E.sio(St.out);
    // (how far the hair lines make way for a frame: its own fade, DT earlier coming in and DT later going out)
    const DT = 0.3;
    const clear = (k) => Math.max(V(k, t - DT), V(k, t), V(k, t + DT));
    const frames = [];
    const keep = (rects, w) => {
      if (rects && w > 0.001) frames.push({ rects, w });
    };
    // (at the end the whole reticle fades out: the lines do not come back over the wall's frame meanwhile)
    const wC = clear('tgC');
    const wD = clear('tgD');
    const wK = clear('lockLO');
    const wL = clear('tgL');
    const gapAt = (Tg) => (Tg.place ? Tg.place.corner : null);
    keep(
      drawTarget(
        TG.C,
        St.tgC,
        St.tgCS,
        wC > 0.001 ? ue(lensMap('lb', t, e)) : null,
        SCENE.lb.box,
        6,
        lp,
        null,
        gapAt(TAGS.C),
      ),
      wC,
    );
    keep(
      drawTarget(
        TG.D,
        St.tgD,
        St.tgDS,
        wD > 0.001 ? ue(lensMap('l2', t, e)) : null,
        SCENE.l2.box,
        8,
        lp,
        null,
        gapAt(TAGS.D),
      ),
      wD,
    );
    // The wall: the confident snap of the red brackets, then the red box, its diamond and the crosshair.
    if (St.lockLO > 0.001 || wK > 0.001) {
      const m = ue(lensMap('l2', t, e));
      const [p1, p2] = boxUnits(m, spreadBox(grow(EBOX, 8), St.lockLS), lp);
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      if (St.lockLO > 0.001) {
        setAttr(lockL, 'd', brackets(p1, p2, Math.min(16, (p2.x - p1.x) / 4, (p2.y - p1.y) / 4)));
        setAttr(lockL, 'transform', `rotate(${f2(St.lockLR)} ${f2(cx)} ${f2(cy)})`);
      }
      // (each corner, turning, by the box around its two arms)
      const A = Math.min(16, (p2.x - p1.x) / 4, (p2.y - p1.y) / 4);
      const an = (St.lockLR * Math.PI) / 180;
      const [co, si] = [Math.cos(an), Math.sin(an)];
      const turn = (x, y) => [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co];
      keep(
        [
          [p1.x, p1.y, 1, 1],
          [p2.x, p1.y, -1, 1],
          [p2.x, p2.y, -1, -1],
          [p1.x, p2.y, 1, -1],
        ].map(([x, y, sx, sy]) => {
          const pts = [turn(x, y), turn(x + sx * A, y), turn(x, y + sy * A)];
          return [
            Math.min(...pts.map((v) => v[0])),
            Math.min(...pts.map((v) => v[1])),
            Math.max(...pts.map((v) => v[0])),
            Math.max(...pts.map((v) => v[1])),
          ];
        }),
        wK,
      );
    }
    setStyle(lockL, 'strokeOpacity', (St.lockLO * outL * lockBlink(t)).toFixed(3));
    keep(
      drawTarget(TG.L, St.tgL * outL, 1, wL > 0.001 ? ue(lensMap('l2', t, e)) : null, EBOX, 3, lp, EAIM),
      wL,
    );

    // Nothing crosses a frame. Each arm (up, right, down, left) stops RG units short of the nearest piece of a frame
    // it meets (96 units from the centre when none); the range and magnification sit RL units outside the frame on the
    // horizontal line (131 units when none), at least 6 units inside the ring; where there is no room for that (a
    // frame still closing in), a label waits, faded, until it has 8 units again. (the vertical arms are met by what
    // comes within 8 units of x = 200, their long marks' half length; the horizontal ones and their labels within 10 of
    // y = 200)
    const RG = 10;
    const RL = 16;
    const stop = [96, 96, 96, 96];
    let rD = L.rlIn;
    let rM = L.rlIn;
    for (const f of frames) {
      const reach = [0, 0, 0, 0];
      for (const [x1, y1, x2, y2] of f.rects) {
        if (x1 <= 208 && x2 >= 192) {
          if (y1 < 200) reach[0] = Math.max(reach[0], 200 - y1);
          if (y2 > 200) reach[2] = Math.max(reach[2], y2 - 200);
        }
        if (y1 <= 210 && y2 >= 190) {
          if (x2 > 200) reach[1] = Math.max(reach[1], x2 - 200);
          if (x1 < 200) reach[3] = Math.max(reach[3], 200 - x1);
        }
      }
      for (let i = 0; i < 4; i++) stop[i] = Math.max(stop[i], 96 + (Math.max(96, reach[i] + RG) - 96) * f.w);
      if (reach[3]) rD += (reach[3] + RL - rD) * f.w;
      if (reach[1]) rM += (reach[1] + RL - rM) * f.w;
    }
    const lackD = Math.max(0, rD - (186 - L.rlDW / q));
    const lackM = Math.max(0, rM - (186 - L.rlMW / q));
    rD -= lackD;
    rM -= lackM;
    const gapD = [rD - 4, rD + L.rlDW / q + 4];
    const gapM = [rM - 4, rM + L.rlMW / q + 4];
    // Hair lines drawn in from the ring, up to their stop; then the horizontal arms open a gap (from its middle) for
    // the labels. (non-scaling strokes dash in screen px; a piece shorter than 4 units is left out)
    const g = smooth(clamp(St.rl, 0, 1));
    const piece = (d) => (d >= 4 ? d * q + 2 : 0);
    hairs.forEach((h, i) => {
      const p = smooth(seg(St.hair, i * 0.08, i * 0.08 + 0.76));
      const len = 96 * q + 2;
      const gap = i === 1 ? gapM : i === 3 ? gapD : null;
      if (gap && g > 0.001 && p >= 0.999) {
        const c = (gap[0] + gap[1]) / 2;
        const a = c - (c - gap[0]) * g;
        const b = c + (gap[1] - c) * g;
        const d1 = piece(192 - b);
        const da = `${f2(d1)} ${f2((192 - a) * q + 2 - d1)} ${f2(piece(a - stop[i]))} ${f2(len)}`;
        setStyle(h, 'strokeDasharray', da, 'hd' + i);
        setStyle(h.twin, 'strokeDasharray', da, 'td' + i);
      } else {
        const da = `${f2(Math.min(len * p, piece(192 - stop[i])))} ${f2(len)}`;
        setStyle(h, 'strokeDasharray', da, 'hd' + i);
        setStyle(h.twin, 'strokeDasharray', da, 'td' + i);
      }
    });
    hashes.forEach(({ el, k, dir, r }, i) => {
      let o = smooth(seg(St.hash, k * 0.1, k * 0.1 + 0.5)) * smooth(seg(r, stop[dir] + 2, stop[dir] + 6));
      const gap = dir === 1 ? gapM : dir === 3 ? gapD : null;
      if (gap && r >= gap[0] - 3 && r <= gap[1] + 3) o *= 1 - g;
      setStyle(el, 'strokeOpacity', o.toFixed(3), 'hs' + i);
      setStyle(el.twin, 'strokeOpacity', o.toFixed(3), 'ts' + i);
    });
    // Range and magnification on the line.
    setStyle(rlDist, 'opacity', (g * smooth(seg(RL - lackD, 4, 8))).toFixed(3));
    setStyle(rlMag, 'opacity', (g * smooth(seg(RL - lackM, 4, 8))).toFixed(3));
    setStyle(rlDist, 'transform', `translateX(${f2(-(rD - L.rlIn) * q)}px)`);
    setStyle(rlMag, 'transform', `translateX(${f2((rM - L.rlIn) * q)}px)`);
    if (g > 0.001) {
      const tr = trackAt(t);
      setText(rlDist, rangeText(t) + ' M');
      setStyle(rlDist, 'color', tr.k ? TRACK_COL[tr.k] : 'var(--iff-search)');
      setAttr(rlDist, 'class', tr.k === 'L' ? 'rl lk' : 'rl');
      setText(rlMag, 'X ' + magAt(t).toFixed(1));
    }
  }

  // Tags: placed once per layout next to the lens at its hold; the leader's inner end follows its box's corner. The
  // text types over about a second, then stays to be read.
  const TAGS = {
    C: {
      el: $('#tagC'),
      lead: $('#leadC'),
      leadCase: $('#leadCc'),
      end: $('#leadC-end'),
      shot: 'lb',
      inK: 'tagC',
      outK: 'tagCOut',
      scanK: 'scanC',
      leadAt: [0, 0.3],
      openAt: [0.25, 0.53],
      lines: () => [
        ['.role', TEXT.creator, 'type', 0.53, 0.68],
        ['.name', 'Biggy', 'decode', 0.56, 0.9],
      ],
      // (ID 0001: the site's first; the leading zeros greyed, as everywhere)
      // (the range in whole metres, four figures, its leading zeros greyed: it follows the rangefinder, see renderTag)
      meta: (r = RANGE.C.v) => {
        const d = String(Math.round(r)).padStart(4, '0');
        const z = d.match(/^0*/)[0];
        return [
          ['ID ', 0],
          ['000', 1],
          ['1 · RNG ', 0],
          [z, 1],
          [d.slice(z.length) + ' M', 0],
        ];
      },
      live: true,
      metaAt: [0.72, 1],
    },
    D: {
      el: $('#tagD'),
      lead: $('#leadD'),
      leadCase: $('#leadDc'),
      end: $('#leadD-end'),
      shot: 'l2',
      inK: 'tagD',
      outK: 'tagDOut',
      scanK: 'scanD',
      leadAt: [0, 0.24],
      openAt: [0.2, 0.42],
      lines: () => [
        ['.role', TEXT.developer, 'type', 0.42, 0.52],
        ['.name', 'BULKHEAD', 'decode', 0.45, 0.64],
        ['.role.r2', TEXT.publisher, 'type', 0.6, 0.7],
        ['.name.n2', 'Team17', 'decode', 0.64, 0.88],
      ],
      meta: () => [[TEXT.alliesTag, 0]],
      metaAt: [0.88, 1],
    },
  };
  // (the text written as markup, by the meta line and the status, always goes through esc)
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // The meta line's first n letters ('z' parts: leading zeros, greyed).
  const metaHTML = (parts, n) => {
    let out = '';
    let left = n;
    for (const [s, z] of parts) {
      if (left <= 0) break;
      const piece = esc(s.slice(0, left));
      left -= s.length;
      out += z ? `<span class="z">${piece}</span>` : piece;
    }
    return out;
  };
  // Each card's size, measured with its whole text, in its current form (computeLayout measures them first).
  function measureTag(Tg) {
    const el = Tg.el;
    Tg.bg = el.querySelector('.bg');
    Tg.texts = el.querySelectorAll('.role, .name, .meta');
    Tg.scan = el.querySelector('.scan');
    Tg.cs = el.querySelectorAll('.c');
    el.style.width = '';
    for (const [sel, txt] of Tg.lines()) el.querySelector(sel).textContent = txt;
    Tg.metaParts = Tg.meta();
    el.querySelector('.meta').innerHTML = metaHTML(Tg.metaParts, 999);
    Tg.w = Math.ceil(el.offsetWidth) + 1;
    Tg.h = el.offsetHeight;
    el.style.width = Tg.w + 'px';
    Tg.metaLen = Tg.metaParts.reduce((s, [x]) => s + x.length, 0);
    Tg.cache = {};
  }
  function measureTags() {
    for (const Tg of Object.values(TAGS)) measureTag(Tg);
  }
  // (the developers' card's compact form, on or off, and its size again)
  function compactTag(Tg, on) {
    Tg.el.classList.toggle('compact', on);
    measureTag(Tg);
  }
  function placeTags() {
    const { W, R, portrait, M } = L;
    const g = Math.SQRT1_2;
    const hudB = L.hudB + 4;
    // (tags keep the band of air above the legal lines, like the lens)
    const botT = L.botT - L.statusH - 2;
    const lensAt = (F, T0, s) => ({ lp: F.L, m: { a: F.L.x - T0.x * s, b: F.L.y - T0.y * s, s } });
    const plan = {
      C: {
        ...lensAt(L.F1, SCENE.lb.aim, L.s1),
        box: grow(SCENE.lb.box, 6),
        side: portrait ? 'below' : 'right',
        corner: portrait ? 'br' : 'tr',
      },
      D: {
        ...lensAt(L.F2, SCENE.l2.aim, L.s2),
        box: grow(SCENE.l2.box, 8),
        side: portrait ? 'below' : 'right',
        corner: portrait ? 'br' : 'tr',
      },
    };
    for (const [key, pl] of Object.entries(plan)) {
      const Tg = TAGS[key];
      const { lp } = pl;
      const clearR = R + 14;
      const exit = (p, d, r) => {
        const fx = p.x - lp.x;
        const fy = p.y - lp.y;
        const bb = fx * d.x + fy * d.y;
        const q = fx * fx + fy * fy - r * r;
        const s = -bb + Math.sqrt(Math.max(0, bb * bb - q));
        return { x: p.x + d.x * s, y: p.y + d.y * s };
      };
      // Portrait: below the lens and its status, or above the lens when the lens sits too low for that.
      const belowY = lp.y + Math.max(R + 14, L.statusEnd + 8);
      if (pl.side === 'below' && !L.fitsBelow(lp.y, Tg.h) && L.fitsAbove(lp.y, Tg.h)) {
        pl.side = 'above';
        pl.corner = 'tr';
      }
      const b = pl.box;
      const cn = {
        tl: { x: b.x1, y: b.y1 },
        tr: { x: b.x2, y: b.y1 },
        bl: { x: b.x1, y: b.y2 },
        br: { x: b.x2, y: b.y2 },
      }[pl.corner];
      const p0 = toScreen(pl.m, cn);
      const dir = { tl: { x: -g, y: -g }, tr: { x: g, y: -g }, bl: { x: -g, y: g }, br: { x: g, y: g } }[
        pl.corner
      ];
      const p1 = exit(p0, dir, clearR);
      const tw = Tg.w;
      const th = Tg.h;
      let r;
      if (pl.side === 'right') {
        const anchorY = 17;
        let top = clamp(p1.y - anchorY, hudB, botT - th);
        const x1 = clamp(Math.max(p1.x + 34, lp.x + R + 38), 0, W - M - tw);
        // Narrow margins: the tag slides up (or down) along the ring until it clears the glass by 12 px.
        const dxc = Math.max(x1 - lp.x, 0, lp.x - (x1 + tw));
        const need = R + 12;
        if (dxc < need && Math.hypot(dxc, Math.max(top - lp.y, 0, lp.y - top - th)) < need) {
          const dyc = Math.sqrt(need * need - dxc * dxc);
          const up = lp.y - dyc - th;
          const down = lp.y + dyc + 8;
          if (up >= hudB && (p1.y <= lp.y || down + th > botT)) top = up;
          else if (down + th <= botT) top = down;
        }
        r = { x1, y1: top, x2: x1 + tw, y2: top + th };
        const p2 = { x: x1, y: clamp(p1.y, top + 8, top + th - 8) };
        Tg.pts = Math.abs(p2.y - p1.y) > 0.5 ? [p1, { x: lerp(p1.x, p2.x, 0.35), y: p2.y }, p2] : [p1, p2];
      } else if (pl.side === 'above') {
        const left = clamp(p1.x - 24, M, W - M - tw);
        const top = clamp(Math.min(p1.y - 22, lp.y - R - 14) - th, hudB, botT - th);
        r = { x1: left, y1: top, x2: left + tw, y2: top + th };
        const vx = clamp(p1.x, left + 10, left + tw - 10);
        const p2 = { x: vx, y: top + th };
        Tg.pts = Math.abs(vx - p1.x) > 0.5 ? [p1, { x: vx, y: lerp(p1.y, p2.y, 0.4) }, p2] : [p1, p2];
      } else {
        // Below the lens, clear of its status.
        const left = clamp(p1.x - 24, M, W - M - tw);
        let top = Math.max(p1.y + 22, belowY);
        top = clamp(top, hudB, L.botT - th);
        r = { x1: left, y1: top, x2: left + tw, y2: top + th };
        const vx = clamp(p1.x, left + 10, left + tw - 10);
        const p2 = { x: vx, y: top };
        Tg.pts = Math.abs(vx - p1.x) > 0.5 ? [p1, { x: vx, y: lerp(p1.y, p2.y, 0.4) }, p2] : [p1, p2];
      }
      Tg.place = { r, box: pl.box, corner: pl.corner };
      let len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      for (let i = 1; i < Tg.pts.length; i++)
        len += Math.hypot(Tg.pts[i].x - Tg.pts[i - 1].x, Tg.pts[i].y - Tg.pts[i - 1].y);
      Tg.len = len + 12;
      Tg.lead.style.strokeDasharray = Tg.leadCase.style.strokeDasharray = `${Tg.len} ${Tg.len}`;
      Tg.el.style.transform = `translate(${f2(r.x1)}px, ${f2(r.y1)}px)`;
    }
  }
  // Deterministic "random" glyphs for the name decoding (same frame for the same time, so ?t= is repeatable).
  const GLYPHS = 'ABCDEFGHKLMNPRSTUVXYZ0123456789';
  // A change of status, from the time the new text starts decoding (tc): the old text is wiped out from its end
  // (from tc - out, for outDur); the frame slides to the new text's width and takes the new state's colour (from
  // tc - morph, for morphDur); the new text decodes from its start (inDur), as on its first appearance.
  const SWAP = { out: 0.45, outDur: 0.3, morph: 0.2, morphDur: 0.3, inDur: 1.1, inLocked: 0.45 };
  // The first text decodes from at, over dur (its frame has opened at 0.8 s).
  const SDEC = { at: 0.95, dur: 1.8 };
  // The scan line, while it searches: its first sweep rides the decoding, then a sweep across the text every period,
  // each taking pass, the first one gap after the text is read.
  const SCAN = { period: 2.4, pass: 1.9, gap: 0.5 };
  // (the cards' text out of focus until their scan pass, in CSS px)
  const SCAN_FOCUS = 1.2;
  // The lock's confirmation: the label and the red brackets blink twice, very fast (off for 70 ms, 140 ms apart, the
  // edges softened over 15 ms), once "target locked" is decoded; then they stay.
  const lockBlink = (t) => {
    const off = (a) => smooth(seg(t, a, a + 0.015)) - smooth(seg(t, a + 0.07, a + 0.085));
    const b = T.LOCK + 0.5;
    return 1 - 0.88 * (off(b) + off(b + 0.14));
  };
  // (the states' colours as numbers, read once from the style sheet, to blend one into the other)
  const IFF_RGB = {};
  const iffRGB = (k) => {
    if (!IFF_RGB[k]) {
      const v = parseInt(getComputedStyle(stage).getPropertyValue(IFF[k].slice(4, -1)).trim().slice(1), 16);
      IFF_RGB[k] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }
    return IFF_RGB[k];
  };
  // One status text, letter by letter (mode(i)): 'p' as it is, 'g' a scrambled letter (spaces and dots kept), 'h'
  // hidden but keeping its room.
  function statusHTML(str, mode, bucket) {
    let html = '',
      run = '',
      hid = false;
    const flush = () => {
      if (run) html += hid ? '<span class="hid">' + esc(run) + '</span>' : esc(run);
      run = '';
    };
    for (let i = 0; i < str.length; i++) {
      const m = mode(i);
      if ((m === 'h') !== hid) {
        flush();
        hid = m === 'h';
      }
      run +=
        m === 'g' && str[i] !== ' ' && str[i] !== '.'
          ? GLYPHS[hash(i * 131 + bucket * 7919) % GLYPHS.length]
          : str[i];
    }
    flush();
    return html;
  }
  const hash = (a) => {
    let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return x >>> 0;
  };
  function renderTag(Tg, t, St) {
    const el = Tg.el;
    const inP = St[Tg.inK];
    const outP = St[Tg.outK];
    const P = Tg.place;
    const visible = P && inP > 0 && outP < 1;
    if (!visible) {
      setStyle(el, 'opacity', '0', el.id + 'o');
      setAttr(Tg.lead, 'd', '');
      setAttr(Tg.leadCase, 'd', '');
      setAttr(Tg.end, 'opacity', '0');
      return;
    }
    const ease = (a, b) => smooth(seg(inP, a, b));
    // Coming in: the leader draws in; where it meets the card the corners show, then spread while the panel unfolds
    // behind them; then the text writes. Going out, the same backwards: the text fades, the frame folds back to the
    // leader's end and its corners go, then the leader draws back into the target's frame.
    const [oa, ob] = Tg.openAt;
    // (out: the text 0 to 0.3, the fold 0.2 to 0.6, the corners 0.52 to 0.66, then the leader, never apart from them)
    const textOut = smooth(seg(outP, 0, 0.3));
    const leadP = ease(Tg.leadAt[0], Tg.leadAt[1]) * (1 - smooth(seg(outP, 0.64, 1)));
    const shown = smooth(seg(inP, oa - 0.03, oa + 0.02)) * (1 - smooth(seg(outP, 0.52, 0.66)));
    const k = E.sio(seg(inP, oa, ob)) * (1 - E.sio(seg(outP, 0.2, 0.6)));
    const e = 1 - 0.05 * E.in2(St.out);
    const m = lensMap(Tg.shot, t, e);
    const b = P.box;
    const cn = P.corner;
    const p0 = toScreen(m, {
      x: cn === 'tl' || cn === 'bl' ? b.x1 : b.x2,
      y: cn === 'tl' || cn === 'tr' ? b.y1 : b.y2,
    });
    const pts = Tg.pts;
    const dl = `M${f2(p0.x)} ${f2(p0.y)}` + pts.map((p) => `L${f2(p.x)} ${f2(p.y)}`).join('');
    for (const path of [Tg.lead, Tg.leadCase]) {
      setAttr(path, 'd', dl);
      setStyle(path, 'strokeDashoffset', f2(Tg.len * (1 - leadP)), path.id + 'off');
      setStyle(path, 'opacity', '0.9', path.id + 'op');
    }
    const pe = pts[pts.length - 1];
    setAttr(Tg.end, 'x', f2(pe.x - 1.5));
    setAttr(Tg.end, 'y', f2(pe.y - 1.5));
    setAttr(Tg.end, 'opacity', shown.toFixed(3));
    setStyle(el, 'opacity', shown.toFixed(3), el.id + 'o');
    setStyle(el, 'transform', `translate(${f2(P.r.x1)}px, ${f2(P.r.y1)}px)`, el.id + 't');
    Tg.texts.forEach((x, i) => setStyle(x, 'opacity', (1 - textOut).toFixed(3), el.id + 'x' + i));
    {
      const w = Tg.w;
      const h = Tg.h;
      const ox = clamp(pe.x - P.r.x1, 0, w);
      const oy = clamp(pe.y - P.r.y1, 0, h);
      const [x1, y1, x2, y2] = [ox * (1 - k), oy * (1 - k), ox + (w - ox) * k, oy + (h - oy) * k];
      setStyle(
        Tg.bg,
        'clipPath',
        k >= 1 ? 'none' : `inset(${f2(y1)}px ${f2(w - x2)}px ${f2(h - y2)}px ${f2(x1)}px)`,
        el.id + 'clip',
      );
      // (the whole card, a little wider: the corners' size, shrinking as it opens, growing as it folds)
      const mg = 1 + 8 * (1 - k);
      setStyle(
        el,
        'clipPath',
        k >= 1
          ? 'none'
          : `inset(${f2(y1 - mg)}px ${f2(w - x2 - mg)}px ${f2(h - y2 - mg)}px ${f2(x1 - mg)}px)`,
        el.id + 'cl',
      );
      [
        [x1, y1],
        [x2 - w, y1],
        [x1, y2 - h],
        [x2 - w, y2 - h],
      ].forEach(([dx, dy], i) => {
        setStyle(
          Tg.cs[i],
          'transform',
          k >= 1 ? 'none' : `translate(${f2(dx)}px, ${f2(dy)}px)`,
          el.id + 'c' + i,
        );
      });
    }
    // Text: roles type in, names decode left to right, the meta line types in.
    const bucket = Math.floor(t * 20);
    Tg.lines().forEach(([sel, txt, mode, a0, a1], li) => {
      const p = seg(inP, a0, a1);
      let s = '';
      if (mode === 'type') s = txt.slice(0, Math.round(txt.length * p));
      else {
        const nn = txt.length;
        const front = Math.floor(p * (nn + 3));
        for (let i = 0; i < nn; i++) {
          if (i < front - 3) s += txt[i];
          else if (i < front) s += GLYPHS[hash(i * 131 + li * 977 + bucket * 7919) % GLYPHS.length];
        }
        if (p >= 1) s = txt;
      }
      if (Tg.cache[sel] !== s) {
        Tg.cache[sel] = s;
        el.querySelector(sel).textContent = s;
      }
    });
    // (the creator's range follows the rangefinder once it holds on the target, past its quick roll of figures)
    const nm = Math.round(Tg.metaLen * seg(inP, Tg.metaAt[0], Tg.metaAt[1]));
    let parts = Tg.metaParts;
    if (Tg.live) {
      const tr = trackAt(t);
      const r = tr.k === 'C' && tr.u >= 0.3 ? parseFloat(rangeText(t)) : NaN;
      if (isFinite(r)) parts = Tg.meta(r);
    }
    const metaKey = nm + '|' + parts.map(([x]) => x).join('');
    if (Tg.cache.meta !== metaKey) {
      Tg.cache.meta = metaKey;
      el.querySelector('.meta').innerHTML = metaHTML(parts, nm);
    }
    // One scan pass once written.
    const su = St[Tg.scanK];
    if (su > 0 && su < 1) {
      setStyle(Tg.scan, 'transform', `translateX(${f2(-44 + su * (Tg.w + 44))}px)`, el.id + 'st');
      setStyle(Tg.scan, 'opacity', (0.32 * Math.sin(Math.PI * su) ** 0.5).toFixed(3), el.id + 'so');
    } else setStyle(Tg.scan, 'opacity', '0', el.id + 'so');
    // Out of focus while it is written; the scan pulls it into focus as it passes.
    const blur = SCAN_FOCUS * (1 - E.sio(clamp(su, 0, 1)));
    Tg.texts.forEach((x, i) =>
      setStyle(x, 'filter', blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none', el.id + 'xf' + i),
    );
  }

  // MAG = the real magnification of what is on screen against the whole picture at cover: the lens (about 2 on the
  // creator at 1920 x 1080). During the opening push it rises from 1 to the Little Bird's value at the change of shot,
  // and on the way out it falls back to 1 the same way, so the readout is continuous across both changes of shot.
  // From the wide shot, the view's own push-in on the second helicopter multiplies it (1.0 to about 1.3).
  function lbMag(t) {
    return lensZoom(t) / L.lbCover;
  }
  // (the developers' Little Bird: its own lens zoom against its own cover, times how much closer its framing is than
  // the creator's, so the readout climbs from one target to the next as the view goes further)
  function l2Mag(t) {
    return ((lensZoom(t) * L.sg) / L.l2Cover) * L.sg * Math.exp(V('wS', t));
  }
  function magAt(t) {
    // (the second push from the view's own magnification; the developers' takes over once above it, so the readout
    // never drops: their picture's cover is another reference)
    if (t >= T.LENS2) {
      const m0 = L.sOp2 / L.opCover;
      const mP = 1.08 * Math.max(m0, l2Mag(T.OPN2));
      if (t >= T.OPN2) return Math.max(mP, l2Mag(t));
      return lerp(m0, mP, clamp(Math.log(openCam(t).s / L.sOp2) / Math.log(Z2.sPeak / L.sOp2), 0, 1));
    }
    if (t >= T.OPN && t < T.X) return lbMag(t);
    const u = clamp(Math.log(L.R / openPush(opT(t)) / L.opCover) / Math.log(L.sOpPeak / L.opCover), 0, 1);
    return lerp(1, lbMag(T.OPN), u) * Math.exp(V('vz', t));
  }
  function renderHud(t, St) {
    const o = St.hud * (1 - St.hudOut);
    setStyle(hud, 'opacity', o.toFixed(3));
    // The camera feed, with the MAG line: the REC light blinks once a second (on 0.6 s, its edges softened); the signal
    // dips to two bars for a moment at each change of shot, as a link losing a fraction of a second.
    setStyle(feed, 'opacity', o.toFixed(3));
    if (o > 0.001) {
      const ph = t % 1;
      setStyle(
        feedRec,
        'opacity',
        (0.25 + 0.75 * (smooth(seg(ph, 0, 0.06)) - smooth(seg(ph, 0.6, 0.66)))).toFixed(3),
      );
      let dip = 0;
      for (const c of [T.OPN, T.X, T.OPN2])
        dip = Math.max(dip, smooth(seg(t, c - 0.25, c - 0.1)) * (1 - smooth(seg(t, c + 0.15, c + 0.4))));
      feedBars.forEach((b, i) =>
        setStyle(b, 'opacity', (0.22 + 0.78 * clamp(4 - 2 * dip - i, 0, 1)).toFixed(3), 'feedBar' + i),
      );
    }
    setStyle(hdg, 'opacity', o.toFixed(3));
    setText(magEl, magAt(t).toFixed(1));
    // Heading tape: slides on whole device pixels; the boxed value and its cardinal letters.
    const hd = headingAt(t);
    const d = L.cdpr;
    setStyle(
      hdgStrip,
      'transform',
      `translateX(${Math.round((L.hdgW / 2 - (hd - L.h0) * L.ppd) * d) / d}px)`,
    );
    const hr = ((Math.round(hd) % 360) + 360) % 360;
    setText(hdgVal, String(hr).padStart(3, '0') + ' ' + CARD[Math.round(hr / 45) % 8]);
    // Status: the scope's own readout, in the colour of the state. Just under the lens, moving with it (as under the
    // game's recon scope); before the eyepiece forms, already in that place (under the eye), so it never travels.
    // (the change under way: the last one whose wipe has begun; until its new text starts, the old one is shown)
    let ci = 0;
    for (let i = 1; i < STATUS.length; i++) if (t >= STATUS[i][0] - SWAP.out) ci = i;
    const tc = STATUS[ci][0];
    const wiping = ci > 0 && t < tc;
    const nextKey = STATUS[ci][1];
    const prevKey = ci > 0 ? STATUS[ci - 1][1] : nextKey;
    const key = wiping ? prevKey : nextKey;
    const txt = TEXT[key];
    // (the live region, for screen readers: the state, and who each target is once identified, the cards being hidden
    // from them; silent during the warm-up behind the black)
    if (!warming) setText(statusA, TEXT[key === 'identified' ? 'ariaC' : key === 'allies' ? 'ariaD' : key]);
    // (while it searches, the ellipsis is shown as three dots that run, so it has their room)
    const dispOf = (k) => (k === 'searching' ? TEXT[k].replace(/…$/, '...') : TEXT[k]);
    // (each text's full width, measured once per text and layout, so the box never moves while a text decodes, and
    // where its letters run in the box: tx from the box's left, tw wide)
    const measure = (k) => {
      const wk = lang + k;
      if (L.statusW[wk] === undefined) {
        statusBox.style.width = '';
        statusEl.textContent = dispOf(k);
        L.statusW[wk] = { w: statusBox.offsetWidth, tx: statusEl.offsetLeft, tw: statusEl.offsetWidth };
        delete last['statusBoxwidth'];
        delete last['status#html'];
      }
      return L.statusW[wk];
    };
    // (the frame slides from the old text's width to the new one's, its colour from the old state's to the new one's)
    const pm = ci > 0 ? E.sio(seg(t, tc - SWAP.morph, tc - SWAP.morph + SWAP.morphDur)) : 1;
    const bw = lerp(measure(prevKey).w, measure(nextKey).w, pm);
    setStyle(statusBox, 'width', f2(bw) + 'px');
    const searching = key === 'searching';
    const disp = dispOf(key);
    const n = disp.length;
    // (decoding: the letters settle from left to right, three scrambled ones ahead of them, the rest keep their room;
    // the first text from SDEC, each new one from its change, shortened so that it is read for half a second at least
    // before the next wipe)
    const decWin = (i) => {
      if (i === 0) return [SDEC.at, SDEC.at + SDEC.dur];
      const t0 = STATUS[i][0];
      const nextWipe = i + 1 < STATUS.length ? STATUS[i + 1][0] - SWAP.out : Infinity;
      const dur = STATUS[i][1] === 'locked' ? SWAP.inLocked : SWAP.inDur;
      return [t0, t0 + Math.min(dur, Math.max(0.4, nextWipe - t0 - 0.5))];
    };
    const [d0, d1] = decWin(wiping ? ci - 1 : ci);
    const dp = wiping ? 1 : seg(t, d0, d1);
    const shown = Math.floor(dp * (n + 3));
    // (wiping out: the letters go from the end, three scrambled ones ahead of the wipe)
    const po = wiping ? seg(t, tc - SWAP.out, tc - SWAP.out + SWAP.outDur) : 0;
    const gone = Math.floor(po * (n + 3));
    // (the dots run once the text is read: none, one, two, three, every 0.32 s; the missing ones keep their room)
    const dots = searching && disp !== txt && dp >= 1 ? Math.floor(t / 0.32) % 4 : 3;
    const html = statusHTML(
      disp,
      (i) => {
        if (i >= shown) return 'h';
        if (i >= shown - 3) return 'g';
        const j = n - 1 - i;
        if (j < gone - 3) return 'h';
        if (j < gone) return 'g';
        return searching && i >= n - 3 && i - (n - 3) >= dots ? 'h' : 'p';
      },
      Math.floor(t * 20),
    );
    // (the scan line, only while it searches: its first sweep rides the decoding, its bright edge on the scrambled
    // letters, the letters settling right behind it; then a sweep across the text every SCAN.period; su: how far the
    // current sweep is across the letters; it fades in and out at their ends, and as the text is wiped out)
    let su = -1;
    if (searching) {
      if (t < d1) su = Math.min(1, (dp * (n + 3)) / n);
      else if (t - d1 >= SCAN.gap) su = ((t - d1 - SCAN.gap) % SCAN.period) / SCAN.pass;
    }
    const scanOn = 1 - smooth(seg(po, 0, 0.3));
    if (su >= 0 && su < 1 && scanOn > 0.001) {
      const g = measure(key);
      setStyle(sscan, 'transform', `translateX(${f2(g.tx + su * g.tw - 30)}px)`);
      setStyle(sscan, 'opacity', (0.6 * scanOn * Math.sin(Math.PI * su) ** 0.5).toFixed(3));
    } else setStyle(sscan, 'opacity', '0');
    if (last['status#html'] !== html) {
      last['status#html'] = html;
      statusEl.innerHTML = html;
    }
    setStyle(sbg, 'transform', `scaleX(${St.sOpen.toFixed(4)})`);
    if (pm < 1) {
      const a = iffRGB(prevKey),
        b = iffRGB(nextKey);
      setStyle(
        statusBox,
        'color',
        `rgb(${Math.round(lerp(a[0], b[0], pm))}, ${Math.round(lerp(a[1], b[1], pm))}, ${Math.round(lerp(a[2], b[2], pm))})`,
      );
    } else setStyle(statusBox, 'color', IFF[nextKey]);
    setStyle(statusBox, 'opacity', (St.stat * (1 - St.hudOut) * lockBlink(t)).toFixed(3));
    const lp = lensPos(t);
    const ly = lp.y + L.statusDy * (1 - 0.05 * E.in2(St.out));
    setStyle(statusBox, 'transform', `translate(${f2(lp.x)}px, ${f2(ly)}px) translate(-50%, -50%)`);
    // (the square: a working device's light while it searches, a crisp blink, steady once a target is found and
    // through each change (it steadies as the wipe starts); on the first text, it lights up as the letters decode)
    const ph = t % 0.9;
    const blink = searching
      ? lerp(
          0.22 + 0.78 * (smooth(seg(ph, 0, 0.06)) - smooth(seg(ph, 0.5, 0.56))),
          1,
          smooth(seg(po, 0, 0.3)),
        )
      : 1;
    setStyle(sq, 'opacity', (blink * (ci === 0 ? smooth(seg(dp, 0, 0.12)) : 1)).toFixed(3));
    // The end: once the scope has eased out to black, the stage fades out over the home page's presentation (then it
    // is off: frame, finish); the controls go first.
    setStyle(stage, 'opacity', (1 - St.endO).toFixed(3));
    const ended = St.endO > 0.02;
    if (last.ended !== ended) {
      last.ended = ended;
      stage.classList.toggle('ended', ended);
      // (the page's scrollbar comes back now, under the black: the presentation does not shift as it comes in)
      stage.classList.toggle('lock', !ended);
      // (a control that had the focus goes out of reach: the focus will go into the presentation)
      if (ended && ctrl.contains(document.activeElement)) focusHome = true;
      ctrl.inert = ended;
      // (the presentation's replay control comes in with it)
      if (ended) offerReplay();
    }
  }

  let NAMES_STATE = [];
  let laidOut = false; // a layout made at a real size is in place (not while the window has no size: see relayout)
  let warming = false; // the warm-up behind the black is under way (see the start): the live region says nothing
  function renderAt(t) {
    if (!laidOut) return;
    const St = {};
    for (const n of NAMES_STATE) St[n] = V(n, t);
    renderPics(t, St);
    renderLens(t, St);
    renderScope(t, St);
    for (const Tg of Object.values(TAGS)) renderTag(Tg, t, St);
    renderHud(t, St);
  }

  // ---------------------------------------------------------------------------------------------------------
  // Playback. Our own clock drives the film; during the opening it follows the clip's own time (through the speed
  // ramp: film time = filmAt(media time), the playback rate set every frame), so the 4K last frame takes over from
  // the clip exactly on its last frame.
  let playing = false;
  let startAt = 0;
  let tNow = 0;
  let raf = 0;
  let onClip = false; // the film clock follows the clip
  let clipOK = false; // the clip can play (through, or for a still, to its seek)
  let clipReady = false; // the clip is on screen (loaded, and playing or seeked)
  // (counts every play() and showAt(): a clip's play promise or a start that resolves late, once another play or a
  // still has come, never starts a second loop)
  let playId = 0;
  const perf = { dts: [], js: [], at: [], lastTs: 0, lastLog: 0 };
  let lastFrameTs = 0;
  function frame(ts) {
    if (!playing) return;
    const tPrev = tNow;
    if (onClip) {
      const ct = pClip.currentTime;
      if (pClip.ended || ct >= CLIP.MEND - 0.002) {
        onClip = false;
        startAt = ts - Math.max(T.DUR, tPrev) * 1000;
      } else {
        tNow = Math.max(tPrev, filmAt(ct));
        const rate = Math.round(rateAt(tNow) * 100) / 100;
        if (Math.abs(pClip.playbackRate - rate) > 0.001) pClip.playbackRate = rate;
      }
    } else if (lastFrameTs && ts - lastFrameTs > 100) {
      // A hitch (tab switch, busy machine) pauses the film instead of making it jump ahead.
      startAt += ts - lastFrameTs - 1000 / 60;
    }
    lastFrameTs = ts;
    if (!onClip) tNow = (ts - startAt) / 1000;
    if (PERF) {
      if (perf.lastTs) {
        perf.dts.push(ts - perf.lastTs);
        perf.at.push(tPrev);
      }
      perf.lastTs = ts;
    }
    if (tNow >= T.END) {
      tNow = T.END;
      playing = false;
    }
    const j0 = performance.now();
    renderAt(tNow);
    if (PERF) {
      perf.js.push(performance.now() - j0);
      if (Math.floor(tNow) > perf.lastLog) {
        logPerf(`${perf.lastLog}–${perf.lastLog + 1} s`, perf.lastLog);
        perf.lastLog = Math.floor(tNow);
      }
    }
    if (playing) raf = requestAnimationFrame(frame);
    else {
      if (PERF) logPerf('whole film', null);
      // (the film is over: the stage has faded out over the presentation, see renderHud; seen, as when skipped)
      markSeen();
      finish();
    }
  }
  function logPerf(label, sec) {
    const idx = perf.dts
      .map((_, i) => i)
      .filter((i) => sec === null || (perf.at[i] >= sec && perf.at[i] < sec + 1));
    const d = idx.map((i) => perf.dts[i]);
    const j = idx.map((i) => perf.js[i] || 0).sort((a, b) => a - b);
    const all = [...perf.dts].sort((a, b) => a - b);
    const pc = (arr, p) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0);
    const refresh = pc(all, 0.5);
    const s = [...d].sort((a, b) => a - b);
    const long = idx.filter((i) => perf.dts[i] > refresh * 1.5);
    console.log(
      `[perf ${label}] frames ${d.length} · frame ms p50 ${pc(s, 0.5).toFixed(1)} p95 ${pc(s, 0.95).toFixed(1)} max ${(s[s.length - 1] || 0).toFixed(1)} · dropped ${long.length} (refresh ≈ ${refresh.toFixed(1)} ms) · js ms p50 ${pc(j, 0.5).toFixed(2)} max ${(j[j.length - 1] || 0).toFixed(2)}` +
        (sec === null && long.length
          ? ` · long frames at t = ${long.map((i) => `${perf.at[i].toFixed(2)}s (${perf.dts[i].toFixed(0)} ms)`).join(', ')}`
          : ''),
    );
    // (?perf=1 on someone else's screen: the whole film's result is also shown at the end, over the presentation, to be
    // read off a screenshot, with the film's anchors to tell where each slow frame fell)
    if (sec === null) {
      document.getElementById('perfOut')?.remove();
      const box = document.createElement('pre');
      box.id = 'perfOut';
      box.style.cssText =
        'position:fixed;left:12px;top:56px;z-index:99;margin:0;padding:8px 10px;max-width:calc(100vw - 24px);white-space:pre-wrap;font:12px/1.5 monospace;color:#e4e6da;background:rgba(10,12,8,0.86);border:1px solid rgba(200,206,170,0.38)';
      const at = (v) => v.toFixed(2);
      box.textContent =
        `PERF  ${innerWidth}x${innerHeight} @${devicePixelRatio}  refresh ~${refresh.toFixed(1)} ms  frames ${d.length}  slow ${long.length}\n` +
        `anchors: lens ${at(T.LENS)} · zoom 1 ${at(T.OPN)} · back ${at(T.X)} · zoom 2 ${at(T.OPN2)} · wall ${at(T.G0)} · lock ${at(T.LOCK)}\n` +
        (long.length
          ? 'slow frames: ' + long.map((i) => `${at(perf.at[i])}s ${perf.dts[i].toFixed(0)}ms`).join(' · ')
          : 'no slow frame');
      document.body.appendChild(box);
    }
  }
  function play() {
    const id = ++playId;
    cancelAnimationFrame(raf);
    perf.dts = [];
    perf.js = [];
    perf.at = [];
    perf.lastTs = 0;
    perf.lastLog = 0;
    tNow = 0;
    playing = true;
    lastFrameTs = 0;
    const go = () => {
      if (id !== playId) return;
      raf = requestAnimationFrame((ts) => {
        startAt = ts;
        if (PERF && console.timeStamp) console.timeStamp('film-start');
        frame(ts);
      });
    };
    // Autoplay refused (for example iOS Low Power Mode): our own clock, and the 4K last frame stands in for the clip
    // with the clip's own fade-in (never the paused clip's black first frame).
    const refused = () => {
      if (id !== playId) return;
      onClip = false;
      clipReady = false;
      pClip.pause();
      go();
    };
    if (!clipOK) {
      refused();
      return;
    }
    pClip.currentTime = 0;
    pClip.playbackRate = 1;
    onClip = true;
    clipReady = true;
    const p = pClip.play();
    if (p && p.then) p.then(go, refused);
    else go();
  }
  function showAt(t) {
    playId++;
    playing = false;
    onClip = false;
    cancelAnimationFrame(raf);
    tNow = t;
    renderAt(t);
  }

  // The layout, the film's channels and every painting, for the window's size. A window of no size (a hidden pane,
  // say) has nothing to lay out: nothing is computed, painted or rendered until it has one (the next resize).
  const hasSize = () => stage.clientWidth > 0 && stage.clientHeight > 0;
  function relayout() {
    laidOut = hasSize();
    if (!laidOut) return false;
    computeLayout();
    build();
    NAMES_STATE = Object.keys(CH);
    headingRange();
    placeTags();
    paintFixed();
    paintPano();
    paintHeading();
    paintTexture();
    shadeTexts();
    // (the layout rewrote styles and texts: every remembered value goes, every target marker is cleared again)
    for (const k of Object.keys(last)) delete last[k];
    for (const tg of Object.values(TG)) tg.on = true;
    return true;
  }
  let rsz = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rsz);
    // (redrawn at once, playing or not: the film's frame of this tick was drawn with the old layout; nothing while the
    // stage is off or on its way out)
    rsz = requestAnimationFrame(() => {
      if (active && !leaving && relayout()) renderAt(tNow);
    });
  });

  // ---------------------------------------------------------------------------------------------------------
  // The stage's life. It is on from the page's first paint (the style sheet shows it before any script runs: black,
  // the legal lines and the skip control, the presentation under it), loads and plays the film, then gives way to the
  // presentation: at the film's end (renderHud fades it out), on skip (a short dip to black first, never a hard cut), or
  // as soon as the film cannot play (a picture that fails, a load longer than LOAD_LIMIT). Once off, the film lets go
  // of its memory (no animation frame, every canvas emptied, the clip unloaded) and the presentation's replay control
  // can bring it back. With reduced motion: no film, the presentation.
  let active = true; // the stage is shown (from the page's start, or from a replay)
  let leaving = false; // the stage is on its way out
  let filmShown = false; // the black cover has lifted: the film (or a still) is on screen
  // The intro once per visit: seen (ended or skipped) in this tab's session, the next home pages open on the
  // presentation (IntroFilm.astro reads the mark before anything is drawn). Nothing else is stored.
  const SEEN = 'wardogs-intro-seen';
  function markSeen() {
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {}
  }
  let runId = 0; // counts every start and every stop: a load that resolves after a skip does nothing
  let runAbort = null; // the current start's listeners
  let focusHome = false; // the focus was on a control that went out of reach: it goes into the presentation
  let canReplay = true; // the film can play: the presentation offers it again
  const pending = new Set(); // the pictures loading
  const homeFocus = home.querySelector('main') || home;
  // The presentation's replay control: shown as soon as the stage starts going out, so that it comes in with the
  // presentation, in the same fade (not when the film cannot play; with reduced motion, it offers the film instead of
  // replaying it: see HomePage.astro).
  function offerReplay() {
    if (replayBtn) replayBtn.hidden = !canReplay;
  }
  // (a load that has not ended in this time gives way to the presentation. The clip has at least CLIP_WAIT from the
  // start to be able to play through, and at least CLIP_GRACE once the pictures are in (until then it shares the
  // bandwidth with them), within the load's limit; else its 4K last frame stands in, with the clip's own fade)
  const LOAD_LIMIT = 15000;
  const CLIP_WAIT = 6000;
  const CLIP_GRACE = 3000;

  // Stops whatever runs (the load, the warm-up, the film) and returns the new run's number.
  function stop() {
    if (runAbort) runAbort.abort();
    runAbort = null;
    for (const im of pending) {
      im.onload = im.onerror = null;
      im.removeAttribute('src');
    }
    pending.clear();
    playId++;
    playing = false;
    warming = false;
    cancelAnimationFrame(raf);
    pClip.pause();
    return ++runId;
  }
  // The film's memory, released once the stage is off: the clip's buffer, every canvas, the pictures.
  function release() {
    pClip.removeAttribute('src');
    pClip.load();
    if (IMG.paint) IMG.paint.width = IMG.paint.height = 0;
    for (const c of [pOp, pOpB, pOpZ, kOp, kLb, kL2a, kL2, kMot, bufA, bufB, tex, hdgStrip])
      c.width = c.height = 0;
    for (const k of Object.keys(IMG)) IMG[k] = null;
    FEATHER = null;
    Object.assign(painted, { kbOp: 0, kbOpZ: -1, kbOpB: 0, kkOp: 0, kkLb: 0, kkL2: 0, kkL2a: -1, hdg: '' });
    clipOK = clipReady = onClip = false;
    laidOut = false;
    for (const k of Object.keys(last)) delete last[k];
  }
  // Off: the presentation is in reach (the focus goes into it if it was on the stage), the film's memory released, the
  // stage set back to its first state for a replay.
  function finish() {
    stop();
    const refocus = focusHome || stage.contains(document.activeElement);
    active = leaving = filmShown = focusHome = false;
    stage.hidden = true;
    document.documentElement.classList.remove('intro-play');
    stage.style.transition = stage.style.opacity = '';
    stage.classList.remove('ended', 'still', 'lock');
    ctrl.inert = false;
    cover.style.opacity = veil.style.opacity = '';
    home.inert = false;
    release();
    offerReplay();
    if (refocus) homeFocus.focus({ preventScroll: true });
  }
  // Out: the film stops where it is and the stage fades out over the presentation.
  function fadeOut() {
    // (seen: the film was on screen, or skipped; a load that failed does not count)
    if (filmShown || leaving) markSeen();
    const id = stop();
    // (the page's scrollbar comes back now, under the black: the presentation does not shift as it comes in)
    stage.classList.add('ended');
    stage.classList.remove('lock');
    offerReplay();
    stage.style.transition = 'opacity 0.5s ease';
    stage.style.opacity = '0';
    setTimeout(() => {
      if (id === runId) finish();
    }, 520);
  }
  // Skip: straight out while the film is still loading behind the black; during the film, a short dip to black first.
  // (the focus, on the controls, goes into the presentation)
  function skip() {
    if (!active || leaving) return;
    leaving = true;
    if (ctrl.contains(document.activeElement)) focusHome = true;
    ctrl.inert = true;
    stage.classList.remove('still');
    if (!filmShown) {
      fadeOut();
      return;
    }
    veil.style.opacity = '1';
    const id = runId;
    setTimeout(() => {
      if (id === runId) fadeOut();
    }, 320);
  }
  // Replay, from the presentation: it dims to black under the stage, then the film starts again (its media come from
  // the browser's cache). The focus, on the replay control, goes on to skip.
  function replay() {
    if (active) return;
    // (with reduced motion the film never starts by itself: here the visitor asked for it)
    if (reducedMotion.matches) document.documentElement.classList.add('intro-play');
    // (a home page opened on the presentation, the intro seen: its mark no longer hides the stage)
    document.documentElement.classList.remove('intro-seen');
    const fromButton = document.activeElement === replayBtn;
    active = true;
    home.inert = true;
    stage.style.transition = 'none';
    stage.style.opacity = '0';
    stage.hidden = false;
    void stage.offsetWidth;
    stage.style.transition = 'opacity 0.32s ease';
    stage.style.opacity = '1';
    if (fromButton) skipBtn.focus({ preventScroll: true });
    const id = runId;
    setTimeout(() => {
      if (id !== runId || !active) return;
      stage.style.transition = '';
      stage.classList.add('lock');
      start();
    }, 320);
  }

  // (a window of no size yet: the start waits until it has one)
  const sized = () =>
    new Promise((res) => {
      if (hasSize()) {
        res();
        return;
      }
      const on = () => {
        if (hasSize()) {
          window.removeEventListener('resize', on);
          res();
        }
      };
      window.addEventListener('resize', on);
    });
  // Start: black until the three pictures are decoded, the clip able to play through (or given up for its 4K last
  // frame), the emblem painted, the window given a size and every layer painted once; then a few moments are shown
  // behind the black (the compositor gets every layer), then a few quiet frames, then the film.
  function start() {
    const id = ++runId;
    runAbort = new AbortController();
    const { signal } = runAbort;
    const t0 = performance.now();
    relayout();
    const loadImg = (src) =>
      new Promise((res, rej) => {
        const im = new Image();
        im.decoding = 'async';
        pending.add(im);
        // Playing: decode off the main thread first (no hitch later). A requested moment (?t=): the plain load event.
        im.onload = () => {
          pending.delete(im);
          if (im.decode && PARAM_T === null)
            im.decode().then(
              () => res(im),
              () => res(im),
            );
          else res(im);
        };
        im.onerror = () => {
          pending.delete(im);
          rej(new Error('could not load ' + src));
        };
        im.src = src;
      });
    // (the faces: if one fails, the fallback faces stand in rather than holding the start)
    const fontsLoaded = document.fonts
      ? Promise.all(
          ['500 1em "Barlow Semi Condensed"', '600 1em "Barlow Semi Condensed"', '400 1em Barlow'].map((f) =>
            document.fonts.load(f),
          ),
        ).catch(() => {})
      : Promise.resolve();
    const stills = Promise.all([
      loadImg(PICS.op.src),
      loadImg(PICS.lb.src),
      loadImg(PICS.l2.src),
      Promise.all(PAINT_LAYERS.map(loadImg)),
      loadImg(GRAIN),
      fontsLoaded,
    ]);
    // The clip: only when the film plays (or a requested moment inside it).
    const wantClip = PARAM_T === null || parseFloat(PARAM_T) < T.DUR;
    const clipLoaded = new Promise((res) => {
      if (!wantClip) {
        res(false);
        return;
      }
      let done = false;
      const end = (ok) => {
        if (!done) {
          done = true;
          res(ok);
        }
      };
      pClip.addEventListener('canplaythrough', () => end(true), { once: true, signal });
      pClip.addEventListener('error', () => end(false), { once: true, signal });
      // (a requested still waits less, for a frame it can seek: a headless screenshot under a virtual-time budget must
      // still get one)
      if (PARAM_T !== null) setTimeout(() => end(pClip.readyState >= 2), 1200);
      else
        stills.then(
          () => {
            // (the clip's last moment: CLIP_WAIT from the start, or CLIP_GRACE after the pictures, whichever is later,
            // and at most a second short of the load's limit)
            const el = performance.now() - t0;
            const wait = Math.min(Math.max(CLIP_WAIT - el, CLIP_GRACE), LOAD_LIMIT - 1000 - el);
            setTimeout(() => end(pClip.readyState >= 4), Math.max(0, wait));
          },
          () => end(false),
        );
      pClip.src = CLIP_SRC.src;
    });
    let limitTimer = 0;
    const limit = new Promise((_, rej) => {
      limitTimer = setTimeout(() => rej(new Error('the media took too long to load')), LOAD_LIMIT);
    });
    Promise.race([Promise.all([stills, clipLoaded]), limit])
      .then(([[op, lb, l2, paint, grain], clipFine]) => {
        clearTimeout(limitTimer);
        if (id !== runId) return false;
        clipOK = clipFine;
        // (a clip that cannot play through in time is not used: its download stops)
        if (wantClip && !clipOK) {
          pClip.removeAttribute('src');
          pClip.load();
        }
        IMG.paint = buildPaint(l2, ...paint);
        Object.assign(IMG, { op, lb, l2, grain });
        // (the faces are in now: the next layout measures every width with them, tags, status, reticle)
        fontsIn = true;
        return sized().then(() => true);
      })
      .then((go) => {
        if (!go || id !== runId) return;
        relayout();
        const reveal = () => {
          cover.style.opacity = '0';
          filmShown = true;
        };
        if (PARAM_T !== null) {
          stage.classList.add('still');
          const t =
            PARAM_T === 'end'
              ? T.END
              : PARAM_T === 'lock'
                ? T.tLockView
                : clamp(parseFloat(PARAM_T) || 0, 0, T.END);
          // (the end: the presentation, as when the film ends)
          if (t >= T.END) {
            finish();
            return;
          }
          if (t < T.DUR && clipOK) {
            // Seek the clip to the media time of this film time. If the seek does not complete (a headless screenshot
            // under a virtual-time budget may never get 'seeked'), render anyway: the 4K last frame, with the clip's
            // own fade, stands in.
            pClip.pause();
            let done = false;
            const draw = (seeked) => {
              if (done || id !== runId) return;
              done = true;
              clipReady = seeked;
              if (!seeked)
                console.warn(
                  '[intro] the clip did not seek in time: its 4K last frame stands in for t = ' + t,
                );
              showAt(t);
              reveal();
            };
            pClip.addEventListener('seeked', () => draw(true), { once: true, signal });
            setTimeout(() => draw(false), 1500);
            pClip.currentTime = Math.min(mediaAt(t), CLIP.MLAST);
            return;
          }
          showAt(t);
          reveal();
          return;
        }
        // Warm-up behind the black: each kind of frame shown once (the opening shot, the eyepiece, the push and the
        // change of shot, the creator, the pull-out and its change of shot, the wide shot in the scope, the swing to the
        // second helicopter (both copies of the picture) and its landing, the second push, the developers, the wall).
        const warm = [
          0.6,
          T.LIT + 0.3,
          T.DUR - 0.03,
          T.LENS + 0.05,
          T.OPN - 0.3,
          T.OPN - 0.1,
          T.OPN,
          T.OPN + 0.1,
          T.OPN + 0.3,
          T.OPN + 0.5,
          T.OPN + 0.7,
          T.L1 + 0.03,
          T.L1 + 0.3,
          T.L1 + 1.2,
          T.GA + 0.15,
          T.X - 0.45,
          T.X - 0.1,
          T.X,
          T.X + 0.1,
          T.X + 0.3,
          T.X + 0.7,
          T.XR - 0.1,
          T.XR + 0.05,
          T.XR + 0.3,
          T.SR + 0.55 * T.SWING,
          T.H2,
          T.LENS2 + 0.05,
          T.OPN2 - 0.3,
          T.OPN2 - 0.1,
          T.OPN2,
          T.OPN2 + 0.1,
          T.OPN2 + 0.3,
          T.OPN2 + 0.5,
          T.WE + 0.5,
          T.WE + 1.6,
          T.G0 + 0.6,
          T.G0 + 1.2,
          T.LOCK - 0.33,
          T.LOCK - 0.2,
          T.LOCK,
          T.LOCK + 0.1,
          T.LOCK + 0.5,
          T.END - 1,
        ];
        // (the black cover is a hair short of opaque meanwhile, so the browser really composites what lies under it; the
        // live region stays silent: its first words are the film's first status)
        cover.style.opacity = '0.996';
        warming = true;
        // (each moment is held for three frames, so its layers are really rasterised before the next one)
        let held = 0;
        const step = () => {
          if (id !== runId) return;
          if (warm.length) {
            renderAt(warm[0]);
            if (++held >= 3) {
              warm.shift();
              held = 0;
            }
            requestAnimationFrame(step);
            return;
          }
          for (const k of Object.keys(last)) delete last[k];
          warming = false;
          showAt(0);
          // The first frame of the film is black: reveal the page, then wait until the GPU has caught up with the
          // warm-up and the first composite (a few quick frames in a row), so the film's first second never stutters.
          reveal();
          const pid = playId;
          let prev = 0;
          let quick = 0;
          const s0 = performance.now();
          const settle = (ts) => {
            if (id !== runId || pid !== playId) return; // (skipped meanwhile)
            quick = prev && ts - prev < 34 ? quick + 1 : 0;
            prev = ts;
            if (quick >= 5 || ts - s0 > 3000) {
              play();
              return;
            }
            requestAnimationFrame(settle);
          };
          requestAnimationFrame(settle);
        };
        requestAnimationFrame(step);
      })
      .catch((err) => {
        // (no film: the presentation, without the replay control, which would have nothing to play)
        clearTimeout(limitTimer);
        if (id !== runId) return;
        console.warn(`[intro] ${err.message}: the home page shows its presentation instead.`);
        canReplay = false;
        fadeOut();
      });
  }

  // The stage takes over: the presentation goes out of reach under it, and the film starts. Not with reduced motion,
  // nor when the script comes so late that the style sheet has already hidden the stage (see IntroFilm.astro).
  skipBtn.addEventListener('click', skip);
  if (replayBtn) replayBtn.addEventListener('click', replay);
  // (back on the page from the browser's history, the film possibly frozen mid-way: the presentation)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && active) finish();
  });
  reducedMotion.addEventListener('change', () => {
    if (active && reducedMotion.matches && !document.documentElement.classList.contains('intro-play'))
      finish();
    else if (!active) offerReplay();
  });
  const late = getComputedStyle(stage).visibility === 'hidden';
  stage.classList.add('live', 'lock');
  if (late || reducedMotion.matches || document.documentElement.classList.contains('intro-seen')) {
    finish();
    return;
  }
  home.inert = true;
  start();
}
