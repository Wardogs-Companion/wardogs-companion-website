// The console's sounds: real recordings, CC0 (their sources: public/sounds/CREDITS.txt), cut and levelled into
// public/sounds/. This file only plays them, with the Web Audio API:
// - one-shot sounds (the power button, a bay's relay, a screen switched on, the knob's detent, the "ready" beep, a key of
//   the keypad, the phone's ring, its handset picked up and hung up), each with its own level in the mix and, for the
//   ones that repeat, a slight change of pitch each time (no two relays alike);
// - the room's bed (the transformer's hum), a seamless loop whose level rises as the bays get power;
// - a gentle compressor on the whole, so that sounds that overlap never clip; then the visitor's volume (the console's
//   knob), and an analyser that the console's audio monitor reads (what is heard, after the volume).
// Usage: const snd = await createConsoleSounds(audioContext, '/sounds/'); snd.press(t); snd.relay(t); …
// The files can be fetched beforehand (fetchConsoleSounds(base), no audio context needed: no gesture needed either),
// so that only their decoding is left once the visitor turns the sound on.
// Every time argument is in the context's clock (ctx.currentTime + delay); nothing plays before a user gesture.
const FILES = [
  'bouton',
  'relais',
  'ecran',
  'ecran-petit',
  'tic',
  'bip',
  'pave',
  'sonnerie',
  'decroche',
  'raccroche',
  'ronflement',
];
// the mix: each sound's level (the files are levelled: one-shots peak at -3 dBFS, the beds at -20 dBFS RMS), and how
// much its pitch may vary from one time to the next
// (the room's hum low: a constant bed, heard under everything else)
// (the keypad's piezo: a pure 4 kHz tone, piercing at full level, so below the ready beep)
// (the phone's ring: an office phone's bells, a call meant to be heard, below the power button's press)
// (its handset: dry clicks close by, a little over the ring, as one's own hand is nearer than the bells)
const MIX = {
  bouton: 0.9,
  relais: 0.7,
  ecran: 0.45,
  'ecran-petit': 0.22,
  tic: 0.28,
  bip: 0.32,
  pave: 0.2,
  sonnerie: 0.4,
  decroche: 0.5,
  raccroche: 0.55,
  ronflement: 0.12,
};
const VARY = { relais: 0.04, ecran: 0.03, 'ecran-petit': 0.06, tic: 0.05 };

// the files, fetched (each as an ArrayBuffer, by name)
export async function fetchConsoleSounds(base) {
  const data = {};
  await Promise.all(
    FILES.map(async (n) => {
      const r = await fetch(`${base}${n}.m4a`);
      if (!r.ok) throw new Error(`${base}${n}.m4a ${r.status}`);
      data[n] = await r.arrayBuffer();
    }),
  );
  return data;
}

export async function createConsoleSounds(ctx, base, fetched = null) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const volume = ctx.createGain();
  volume.gain.value = 1;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0;
  master.connect(comp).connect(volume).connect(analyser).connect(ctx.destination);
  const data = await (fetched || fetchConsoleSounds(base)),
    buf = {};
  // (decoding takes the buffer over: a copy, so that the fetched files can be decoded again for another context)
  await Promise.all(
    FILES.map(async (n) => {
      buf[n] = await ctx.decodeAudioData(data[n].slice(0));
    }),
  );

  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const at = (delay = 0) => ctx.currentTime + delay;
  // a one-shot sound at time t
  function play(name, t = at(), { rate = 1, level = 1 } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = buf[name];
    src.playbackRate.value = rate * (VARY[name] ? 1 + (rnd() * 2 - 1) * VARY[name] : 1);
    const g = ctx.createGain();
    g.gain.value = MIX[name] * level;
    src.connect(g).connect(master);
    src.start(Math.max(t, ctx.currentTime));
    src.level = g; // (its gain, so that it can be faded out: cut)
    return src;
  }

  // the bed: started once, silent, then its level follows the power (k from 0, off, to 1, every bay on)
  let beds = null;
  function startBeds() {
    if (beds) return beds;
    beds = {};
    for (const n of ['ronflement']) {
      const src = ctx.createBufferSource();
      src.buffer = buf[n];
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g).connect(master);
      src.start(ctx.currentTime);
      beds[n] = { src, g };
    }
    return beds;
  }
  function bedLevel(k, t = at(), ramp = 1.5) {
    const b = startBeds();
    for (const n in b) {
      b[n].g.gain.cancelScheduledValues(t);
      b[n].g.gain.setTargetAtTime(MIX[n] * k, t, ramp / 3);
    }
  }

  return {
    master,
    analyser,
    // the visitor's volume (a gain), set smoothly so that turning the knob never clicks
    setVolume: (g) => volume.gain.setTargetAtTime(g, ctx.currentTime, 0.03),
    press: (t) => play('bouton', t),
    // the phone's ring (one ring; the console rings it every 6 s); its handset picked up, hung up; cut: a sound cut
    // short (the ring, when the phone is answered), faded out over 60 ms
    ring: (t) => play('sonnerie', t),
    pickUp: (t) => play('decroche', t),
    hangUp: (t) => play('raccroche', t),
    cut: (src) => {
      if (!src) return;
      const t = ctx.currentTime;
      src.level.gain.setTargetAtTime(0, t, 0.02);
      try {
        src.stop(t + 0.08);
      } catch {
        /* already over */
      }
    },
    relay: (t) => play('relais', t),
    // a screen switched on; small: a small display (only the tube's crackle)
    screen: (t, small = false) => play(small ? 'ecran-petit' : 'ecran', t),
    // the knob's detent: a small dry click (the key's click, higher and softer); the sound switch: a firm clac
    detent: (t) => play('tic', t, { rate: 1.35, level: 0.55 }),
    toggle: (t) => play('bouton', t, { rate: 1.12, level: 0.65 }),
    // SYSTEM READY: the beep twice, as a computer's power-on test does
    ready: (t = at()) => {
      play('bip', t);
      play('bip', t + 0.2);
    },
    // a key of the keypad: its piezo's beep, the same every time, as a real keypad's
    key: (t) => play('pave', t),
    // the reading screen, with the station's own sounds (its relays, its knob's detent, its tubes' crackle and
    // switch-on): locked (a relay, lighter); a tab of its page (the detent, louder); its page switched off (a tube's
    // crackle, softer); the screen on again at the framing (a screen switched on, lower)
    lock: (t) => play('relais', t, { rate: 1.15, level: 0.64 }),
    tab: (t) => play('tic', t, { rate: 1.35, level: 1 }),
    pageOff: (t) => play('ecran-petit', t, { level: 0.8 }),
    screenOn: (t) => play('ecran', t, { level: 0.7 }),
    bedLevel,
    // everything off at once (the sound is cut, or the page leaves)
    stop() {
      if (beds) {
        for (const n in beds) {
          try {
            beds[n].src.stop();
          } catch {}
        }
        beds = null;
      }
    },
  };
}
