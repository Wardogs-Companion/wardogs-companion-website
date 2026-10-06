// For search engines (/robots.txt): the whole site may be read, and where its map is. The game's media keep their own
// noindex (vercel.json). The address comes from astro.config.mjs (site).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap.xml', site).href}`, ''].join('\n'),
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
