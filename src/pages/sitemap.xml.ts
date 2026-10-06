// The site map for search engines (/sitemap.xml, named in /robots.txt): every page in each language, at the address
// the site links to, which is also its canonical address (BaseLayout). A page more: one entry more here.
import type { APIRoute } from 'astro';
import { getRelativeLocaleUrl } from 'astro:i18n';
import { consoleMedia } from 'virtual:wardogs/game-media';
import { languages, type Lang } from '../i18n/ui';
import { SECTIONS, sectionPath } from '../scripts/station/sections.js';

// each page, by its address in a language: the home page and the console's sections (only with the console: without
// it, their addresses are the home page, HomePage.astro), then the legal pages
const pages: ((lang: Lang) => string)[] = [
  ...[undefined, ...(consoleMedia ? SECTIONS : [])].map((id) => (lang: Lang) => sectionPath(lang, id)),
  ...['privacy', 'terms'].map((doc) => (lang: Lang) => getRelativeLocaleUrl(lang, doc)),
];

export const GET: APIRoute = ({ site }) => {
  const urls = pages.flatMap((at) =>
    (Object.keys(languages) as Lang[]).map((lang) => new URL(at(lang), site).href),
  );
  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
      '</urlset>',
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
