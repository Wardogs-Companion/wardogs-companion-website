// The intro once per visit: seen in this tab's session (ended or skipped, see film.js), the home page opens on the
// page under it at once (the console, or the presentation), before anything is drawn. A section's own address
// (/extension…: the root element marked data-section, BaseLayout.astro) skips it too, as seen. Nothing else is stored.
// Rendered inline as it is by IntroFilm.astro; its hash goes into the CSP from this same file
// (src/integrations/game-media.mjs).
try {
  if (document.documentElement.dataset.section) {
    document.documentElement.classList.add('intro-seen');
    sessionStorage.setItem('wardogs-intro-seen', '1');
  } else if (sessionStorage.getItem('wardogs-intro-seen'))
    document.documentElement.classList.add('intro-seen');
} catch {}
