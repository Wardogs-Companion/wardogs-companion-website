# Site de Wardogs Companion

Ce dossier contient le site web de Wardogs Companion : Astro 7, statique, en anglais et en français. Il complète l'extension Twitch (l'appli) et le serveur Discord (le bot), mais c'est un projet indépendant, avec son propre dépôt.

Le projet complet est regroupé dans un dossier parent : `../app` contient l'appli, `../discord-bot` le bot, `site/` ce site.

L'utilisateur parle français : réponds en français. Le site est en anglais (référence) et en français.

## Règles

- **Le dépôt est public.** Tout ce qui est commité est visible par tous, pour toujours, même après suppression. Jamais de secret, de jeton, de mot de passe ni d'adresse mail personnelle. Rien de `../admin` sauf les logos validés de `../admin/Art`. Aucun chemin local de la machine.
- **N'écris que dans ce dossier.** L'appli est en lecture seule : lis uniquement ce qui est sur sa branche `master`, avec `git -C <appli> show master:<fichier>`. N'y lance jamais d'écriture, de commande npm, de checkout ni de commit, car elle est développée en parallèle. Ne touche pas au bot.
- **Fidèle à l'appli.**
  - N'annonce que ce qui existe sur master. Ce qui est « À venir » reste « coming soon », et ne promets aucune date.
  - Les chiffres (273 objets, familles, équipes, cartes, classes) viennent du `README.md` de l'appli.
  - Le nom s'écrit « Wardogs Companion » (décision de l'utilisateur du 02/10/2026). L'appli et les textes actuels du site écrivent encore « WARDOGS Companion » : on les aligne quand on y touche (le site à l'intégration de la console ; l'appli, c'est à l'utilisateur de décider). Le jeu, lui, reste WARDOGS.
  - Chaque page porte la mention : projet communautaire, non officiel, sans lien avec BULKHEAD, Team17 ni Twitch. Elle est dans le pied de page commun, `src/components/SiteFooter.astro`.
- **Médias du jeu : jamais dans le dépôt**, car ils appartiennent à leurs ayants droit (BULKHEAD, Team17). Les logos de Wardogs Companion sont à nous.
  - Seul l'accueil en montre, pour présenter le projet à BULKHEAD, et ils sont retirés sur simple demande de leur part : l'intro (l'ouverture de la bande-annonce, vidéo et dernière image, et deux photos du dossier de presse) et la console (l'ordinateur de la tour recréé à partir d'images du jeu, les emblèmes des factions, des captures de l'extension). Ces fichiers sont dans le stockage privé Vercel Blob `wardogs-companion-intro-media` : le build les récupère et le site les sert sous `/media/` (`src/integrations/game-media.mjs`, voir `docs/ARCHITECTURE.md`). Tout ce qui pourrait les mettre dans le dépôt est interdit : copie dans `public/` ou `src/`, capture d'écran de l'intro ou de la console, fichier de test qui les contient. Aucun autre média du jeu sans leur accord.
  - Les captures du jeu qui servent de modèle sont dans `reference-ordinateur/` (l'ordinateur des tours : tirées de vidéos, découpées par partie, avec des fiches) et `reference-intro/` (les lunettes du jeu). Ces dossiers sont ignorés par Git : ils ne doivent jamais être commités ni copiés dans `public/` ou `src/`.
- **Hébergement gratuit Vercel (plan Hobby) = usage non commercial** : pas de publicité, de dons, de sponsors ni de liens affiliés.
- **Deux langues, même contenu.** Chaque texte s'ajoute dans `src/i18n/`, en anglais et en français : `ui.ts` pour les pages, `station.ts` pour la console (le français y a la même forme que l'anglais, vérifiée par le typage). Chaque page anglaise a son équivalent dans `src/pages/fr/`, sauf `404.astro` : elle est unique et bilingue, car Vercel ne sert que `/404.html`.
- **Rien de chargé depuis ailleurs** : pas de script tiers, de police externe ni de traceur. Tout ajout doit rester compatible avec la CSP (`astro.config.mjs`) et les en-têtes (`vercel.json`).
- **Un push sur `main` met le site en ligne.** Avant chaque push : `npm run format:check` et `npm run build` doivent passer. Pour un changement visible important, passe par une branche et une pull request pour avoir un aperçu Vercel.
- **Git.** Messages de commit en français. Pousse après chaque commit sur `main`. Pas de force-push : `main` est protégée.
- **Dépendances.** Versions exactes dans `package.json`. Demande avant d'en ajouter une.

## Où sont les choses

| Quoi                                     | Fichier                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| Textes anglais et français               | `src/i18n/ui.ts` ; la console : `src/i18n/station.ts`      |
| Textes juridiques, affichés tels quels   | `src/content/legal/`                                       |
| Squelette HTML commun (`<head>`, icônes) | `src/layouts/BaseLayout.astro`                             |
| Contenu des pages, pied de page commun   | `src/components/`                                          |
| Intro de l'accueil (le film)             | `src/components/IntroFilm.astro`, `src/scripts/intro/`     |
| Médias du jeu de l'accueil (au build)    | `src/integrations/game-media.mjs`, liste `game-media.json` |
| Routes (le français sous `fr/`)          | `src/pages/`                                               |
| Couleurs, fond quadrillé, styles communs | `src/styles/global.css`                                    |
| Langues, CSP                             | `astro.config.mjs`                                         |
| En-têtes HTTP de sécurité                | `vercel.json`                                              |
| Logos, icônes, polices (Barlow)          | `public/`                                                  |
| Architecture, backend possible plus tard | `docs/ARCHITECTURE.md`                                     |
| Feuille de route                         | `docs/ROADMAP.md`                                          |
| Modèles de l'ordinateur (jamais commit)  | `reference-ordinateur/`                                    |
| Modèles de l'intro (jamais commit)       | `reference-intro/`                                         |

## Commandes

| Commande                 | Effet                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `npm run dev`            | Serveur local sur `http://localhost:4321`.                                                     |
| `npm run check`          | Vérifie les types et les modèles.                                                              |
| `npm run build`          | Vérifie, puis construit le site dans `dist/`.                                                  |
| `npm run preview`        | Sert `dist/`, seul moyen de tester la CSP.                                                     |
| `npm run format`         | Met en forme ; `format:check` vérifie seulement.                                               |
| `npm run intro:svg`      | Refait les images SVG de l'intro (`public/images/intro/`).                                     |
| `npm run media:manifest` | Refait la liste d'un groupe de médias du jeu : `-- intro <dossier>` ou `-- console <dossier>`. |

Sans jeton Vercel Blob (build local, CI GitHub), le site est construit sans l'intro ni la console, et `npm run dev` ne les montre pas. Pour les tester en local : `INTRO_MEDIA_DIR=<dossier des 4 fichiers>` et `CONSOLE_MEDIA_DIR=<dossier des fichiers de la console>`, avec `npm run build` puis `npm run preview`, ou avec `npm run dev`. Ces dossiers restent hors du dépôt. Paramètres d'inspection : pour l'intro, `?t=<secondes>` (une image fixe du film, `?t=lock`, `?t=end`) ; pour la console, `?ct=<secondes>` (une image fixe) et `?lite=1` ou `?lite=0` (version allégée ou complète) ; pour les deux, `?perf=1` (temps des images). Détails dans le README.

## Protections du dépôt GitHub

Les réglages ont été faits une fois ; ne les affaiblis pas sans accord :

- blocage des secrets à l'envoi (secret scanning et push protection) ;
- règle sur `main` : ni force-push ni suppression ;
- Dependabot : alertes, correctifs de sécurité et mises à jour mensuelles (`.github/dependabot.yml`) ;
- signalement privé des failles (`SECURITY.md`) ;
- Actions : jeton en lecture seule, actions épinglées par leur empreinte, validation obligatoire des workflows venant de forks ;
- Wiki, Projects et Issues désactivés : le support passe par Discord ;
- Vercel : protection des forks (Git Fork Protection) activée. N'autorise jamais le déploiement d'une pull request venant d'un fork : les builds ont le jeton `BLOB_READ_WRITE_TOKEN`, qui peut écrire dans le stockage des médias de l'intro.

## Couleurs des équipes

Les couleurs d'équipe sont reprises de l'appli (`src/profile/model.ts`) :

- bleu Lonestar `#69b8ff` ;
- rouge Valkyra `#ff6966` ;
- vert Manticore `#69d58c`.

L'accent par défaut, `#ff535b`, est celui de la régie de l'appli quand aucune équipe n'est choisie (`src/editor/LiveConfiguration.tsx`, `src/styles/components.css`).

## Plus tard

Un backend et une base de données sont possibles si le site évolue. La façon de les ajouter sans tout refaire, et ce qu'il faudra alors sécuriser, sont décrites dans `docs/ARCHITECTURE.md`.
