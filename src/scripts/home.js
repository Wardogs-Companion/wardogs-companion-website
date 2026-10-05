// The home page's two pieces meet here: the intro film (IntroFilm.astro) and the console (Station.astro), each mounted
// by its own component's script, so that a build without one of them loads none of its code. The film's script runs
// first (its component comes first in the page); the console's, after it, waits under the film while it plays (built
// only once the film is gone, so that its build costs the film nothing) and opens then; replayed, the film holds it
// again.

/** @type {{ start: () => void, hold: () => void } | null} */
let station = null;
let filmPlaying = false;

/** The film is mounted and about to play (filmGone follows at once if it does not). */
export function filmMounting() {
  filmPlaying = true;
}
/** The film is gone, or does not play: the console opens. */
export function filmGone() {
  filmPlaying = false;
  station?.start();
}
/** The film is replayed: the console stands under it. */
export function filmReplaying() {
  filmPlaying = true;
  station?.hold();
}
/** Whether the console, mounting now, waits under the film. */
export function filmIsPlaying() {
  return filmPlaying;
}
/** @param {{ start: () => void, hold: () => void }} s the console, mounted */
export function stationMounted(s) {
  station = s;
}
