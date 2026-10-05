# Feuille de route du site

## Maintenant

- Base propre : Astro, anglais et français, CSP et en-têtes de sécurité, CI, dépôt public protégé.
- L'accueil, en ligne sur https://wardogs-companion.vercel.app : l'intro (le film de la lunette, environ 25 s, qu'on peut passer ou revoir), puis la console, l'ordinateur de la tour de WARDOGS recréé. Ses écrans mènent aux sections du site : l'extension (ce qu'elle apporte aux viewers et au streamer, ce qui arrive), ses captures, le serveur Discord et le projet. La présentation simple (« Site en bêta ») reste le repli sous la console (sans script, ou si la console ne peut pas se charger).
- Identité visuelle : Barlow Semi Condensed et Barlow, comme l'appli, hébergées sur le site et déclarées pour tout le site (`src/styles/global.css`) ; la faction choisie par le visiteur sur le radar de la console (Lonestar, Valkyra ou Manticore), gardée dans son navigateur.
- L'extension, disponible sur Twitch et ouverte à tous : la page Extension propose « Installer sur Twitch » (son adresse : `src/scripts/station/links.js`).
- Une adresse par section de la console : `/extension`, `/screenshots`, `/discord`, `/about` (et `/fr/…`), générées depuis la liste des sections.
- Pages juridiques de l'extension, dont Twitch demande les adresses : `/privacy`, `/terms`, `/fr/privacy` et `/fr/terms`. Ces adresses ne changent plus. Les textes sont les fichiers Markdown de `src/content/legal/`, affichés tels quels.

## Ensuite

- **Référencement.** L'adresse est `https://wardogs-companion.vercel.app` (`site` dans `astro.config.mjs`). Reste à ajouter les balises `hreflang` dans l'en-tête des pages, l'image de partage (Open Graph) et le plan du site.

## À décider

- **Section « Team »** : qui y figure.
- **Annonces et notes de mise à jour officielles** : des liens et des résumés rédigés par nous, en attendant l'avis de BULKHEAD.
- **Images du jeu** : l'intro et la console en montrent pour présenter le projet à BULKHEAD, retirées sur simple demande (stockage privé, jamais dans le dépôt, retirables en un déploiement : voir [ARCHITECTURE.md](ARCHITECTURE.md#les-médias-du-jeu)). Aucune autre sans leur accord.
- **Nom de domaine.**

## Plus tard, si le site évolue

- Un backend et une base de données : voir [ARCHITECTURE.md](ARCHITECTURE.md#plus-tard--un-backend-et-une-base-de-données).
- La régie du loadout accessible depuis le site, à l'étude dans la feuille de route de l'appli une fois l'extension validée.
