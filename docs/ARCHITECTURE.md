# Architecture

## Aujourd'hui : un site statique

- **Astro en sortie statique.** Chaque page est construite en HTML au moment du build, puis servie telle quelle par le CDN de Vercel. Il n'y a ni serveur, ni base de données, ni cookie, ni traceur : le site lui-même ne collecte aucune donnée sur les visiteurs. Seul Vercel, en tant qu'hébergeur, traite les journaux techniques des requêtes (adresse IP, navigateur).
- **Deux langues.** L'anglais sert de référence et se trouve à la racine (`/`), le français sous `/fr/` (routage i18n d'Astro, `astro.config.mjs`). Tous les textes sont dans `src/i18n/ui.ts`. Une clé absente en français fait échouer `astro check`.
- **Pages.** Une page = un fichier dans `src/pages/`. Une page française reprend le même composant que la page anglaise avec `lang="fr"` : le contenu vit dans `src/components/`, pas dans les pages. La page 404 fait exception : elle est unique et bilingue, car Vercel ne sert que `/404.html`.
- **Mention obligatoire.** Le pied de page commun (`src/components/SiteFooter.astro`) porte sur chaque page la mention « projet non officiel, sans lien avec BULKHEAD, Team17 ni Twitch ».
- **Rien de chargé depuis ailleurs.** Pas de script tiers, pas de police externe, pas d'outil de mesure d'audience.

### Sécurité

- **Politique de sécurité du contenu (CSP)** : Astro l'écrit dans une balise `<meta>` de chaque page (`security.csp`). Elle n'autorise que les ressources du site et les empreintes de ses propres scripts et styles. Elle bloque donc la barre d'outils de Vercel sur les aperçus : cette barre est désactivée dans les réglages du projet Vercel.
- **En-têtes HTTP** (`vercel.json`) : interdiction d'afficher le site dans un cadre (`frame-ancestors 'none'`, `X-Frame-Options`), `nosniff`, `Referrer-Policy`, `Permissions-Policy` et `Cross-Origin-Opener-Policy`. Vercel ajoute HTTPS et HSTS.
- **Dépôt public** : aucun secret n'y entre. Les réglages GitHub (blocage des secrets à l'envoi, protection de `main`, Dependabot) sont décrits dans `CLAUDE.md`.

### Déploiement

- Vercel est branché directement sur le dépôt GitHub. Un push sur `main` met le site en ligne, et chaque pull request reçoit un aperçu, visible seulement une fois connecté à Vercel.
- La CI GitHub (`.github/workflows/ci.yml`) vérifie la mise en forme, les types et le build à chaque push sur `main` et à chaque pull request.

## Plus tard : un backend et une base de données

Ce n'est pas prévu pour la première version, mais **le site peut en avoir besoin s'il évolue**. La base actuelle a été choisie pour ne rien avoir à refaire ce jour-là.

### Ce qui pourrait le demander

- La régie du loadout accessible depuis le site, à l'étude dans la feuille de route de l'appli une fois l'extension validée. Elle demanderait une connexion avec Twitch.
- Des annonces ou des notes de mise à jour publiées sans redéployer le site.
- Des comptes, des avis, un formulaire de contact, ou des statistiques si une source de données autorisée existe.

### Comment l'ajouter

1. **Rendu côté serveur, route par route.** Ajouter l'adaptateur Vercel d'Astro (`npx astro add vercel`). Le site reste statique par défaut. Seules les routes qui l'indiquent (`export const prerender = false`) et les points d'API (`src/pages/api/`) tournent côté serveur, sous forme de fonctions Vercel.
2. **Base de données gérée.** Branchée par la Marketplace de Vercel (par exemple Postgres ou Redis). Le choix se fera selon le besoin réel, le moment venu.
3. **Secrets.** Les noms des variables sont déclarés dans un schéma typé avec `astro:env`, et leurs valeurs sont saisies dans Vercel. Jamais dans le dépôt. Un `.env.example` sans valeurs peut en lister les noms.
4. **Code serveur à part.** Il ira dans `src/server/`. Il ne doit jamais être importé par un composant envoyé au navigateur.
5. **Sécurité à ajouter à ce moment-là** :
   - validation de chaque entrée côté serveur ;
   - contrôle de l'origine des formulaires (`security.checkOrigin`, actif par défaut) ;
   - limitation du nombre de requêtes ;
   - sessions en cookies `HttpOnly`, `Secure`, `SameSite` ;
   - CSP mise à jour pour les services appelés.
6. **Obligations.**
   - Mettre à jour la politique de confidentialité, selon le RGPD : données collectées, durée de conservation, base légale et droits des personnes.
   - Ajouter un bandeau de consentement si des cookies non essentiels apparaissent.
   - Vérifier les limites du plan gratuit de Vercel (usage non commercial, quotas des fonctions).
7. **L'extension ne change pas.** Elle reste sans serveur et ne collecte aucune donnée sur les viewers. Un backend du site ne doit rien changer à ce que l'extension promet, sauf à mettre à jour l'appli et à repasser la revue Twitch.
