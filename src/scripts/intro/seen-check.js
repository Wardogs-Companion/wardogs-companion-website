// The intro once per visit: seen in this tab's session (ended or skipped, see film.js), the home page opens on the
// page under it at once (the console, or the presentation), before anything is drawn. A link straight to a section of
// the console (/#extension…: its sections, station.js READ_SECTIONS) skips it too, as seen. Nothing else is stored.
// Rendered inline as it is by IntroFilm.astro; its hash goes into the CSP from this same file
// (src/integrations/game-media.mjs).
try {
  if (/^#(extension|screenshots|discord|about)$/.test(location.hash)) {
    document.documentElement.classList.add('intro-seen');
    sessionStorage.setItem('wardogs-intro-seen', '1');
  } else if (sessionStorage.getItem('wardogs-intro-seen'))
    document.documentElement.classList.add('intro-seen');
} catch {}
