# Feuille de route du site

## Maintenant

- Base propre : Astro, anglais et français, CSP et en-têtes de sécurité, CI, dépôt public protégé.
- L'accueil, en ligne sur https://wardogs-companion.vercel.app : l'intro (le film de la lunette, environ 25 s, qu'on peut passer ou revoir), puis une présentation simple, « en construction », sur fond quadrillé. L'ordinateur de la tour remplacera ensuite la présentation.
- Pages juridiques de l'extension, dont Twitch demande les adresses : `/privacy`, `/terms`, `/fr/privacy` et `/fr/terms`. Ces adresses ne changent plus. Les textes sont les fichiers Markdown de `src/content/legal/`, affichés tels quels.

## Ensuite

- **Identité visuelle.**
  - Barlow Semi Condensed et Barlow, comme l'appli, hébergées sur le site (aucune police chargée depuis ailleurs) : déjà dans `public/fonts/` pour l'intro, à étendre au reste du site.
  - Couleur d'équipe choisie par le visiteur : bleu Lonestar, rouge Valkyra ou vert Manticore, gardée dans son navigateur.
- **Accueil complet** : ce que l'extension apporte aux viewers et au streamer, et le catalogue, avec les chiffres de l'appli sur master.
- **Liens vers l'extension Twitch et le serveur Discord**, dès qu'ils seront publics.
- **Référencement.** L'adresse est `https://wardogs-companion.vercel.app` (`site` dans `astro.config.mjs`). Reste à ajouter les balises `hreflang`, l'image de partage (Open Graph) et le plan du site.

## À décider

- **Section « Team »** : qui y figure.
- **Annonces et notes de mise à jour officielles** : des liens et des résumés rédigés par nous, en attendant l'avis de BULKHEAD.
- **Images du jeu** : l'intro en montre pour présenter le projet à BULKHEAD, retirées sur simple demande (stockage privé, jamais dans le dépôt, retirables en un déploiement : voir [ARCHITECTURE.md](ARCHITECTURE.md#les-médias-du-jeu-de-lintro)). Aucune autre sans leur accord.
- **Nom de domaine.**

## Plus tard, si le site évolue

- Un backend et une base de données : voir [ARCHITECTURE.md](ARCHITECTURE.md#plus-tard--un-backend-et-une-base-de-données).
- La régie du loadout accessible depuis le site, à l'étude dans la feuille de route de l'appli une fois l'extension validée.
