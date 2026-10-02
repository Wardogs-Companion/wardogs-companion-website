// @ts-check
import { defineConfig } from 'astro/config';
import introMedia from './src/integrations/intro-media.mjs';

export default defineConfig({
  // Adresse de production. À changer si un nom de domaine est ajouté.
  site: 'https://wardogs-companion.vercel.app',
  // Médias du jeu pour l'intro de l'accueil : récupérés au build depuis le stockage privé, jamais dans le dépôt.
  integrations: [introMedia()],
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    // Shiki écrit des styles en ligne que la CSP bloquerait ; le site n'affiche pas de code.
    syntaxHighlight: false,
  },
  security: {
    // Astro écrit la politique dans une balise <meta> et y ajoute les empreintes
    // de ses propres scripts et styles. Les en-têtes HTTP sont dans vercel.json.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
