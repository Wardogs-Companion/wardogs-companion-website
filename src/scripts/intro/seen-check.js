// The intro once per visit: seen in this tab's session (ended or skipped, see film.js), the home page opens on the
// presentation at once, before anything is drawn. Nothing else is stored. Rendered inline as it is by IntroFilm.astro;
// its hash goes into the CSP from this same file (src/integrations/game-media.mjs).
try {
  if (sessionStorage.getItem('wardogs-intro-seen')) document.documentElement.classList.add('intro-seen');
} catch {}
