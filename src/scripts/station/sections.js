// The console's sections, in the order of its menu: each read on its reading screen (station.js) and given its own
// address, /<id> in English and /fr/<id> in French (src/pages/[section].astro, src/pages/fr/[section].astro). A section
// more: one id more here, and its texts (src/i18n/station.ts: its menu entry, its title, its page).
export const SECTIONS = ['extension', 'screenshots', 'discord', 'about'];

/**
 * The address of a section in a language, or of the home page without a section.
 * @param {'en' | 'fr'} lang
 * @param {string | null} [id]
 */
export const sectionPath = (lang, id) => (lang === 'fr' ? '/fr/' : '/') + (id ?? '');
