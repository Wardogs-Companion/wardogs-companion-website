# Site de WARDOGS Companion

Ce dossier contient le site web de WARDOGS Companion : Astro 7, statique, en anglais et en français. Il complète l'extension Twitch (l'appli) et le serveur Discord (le bot), mais c'est un projet indépendant, avec son propre dépôt.

Le projet complet est regroupé dans un dossier parent : `../app` contient l'appli, `../discord-bot` le bot, `site/` ce site.

L'utilisateur parle français : réponds en français. Le site est en anglais (référence) et en français.

## Règles

- **Le dépôt est public.** Tout ce qui est commité est visible par tous, pour toujours, même après suppression. Jamais de secret, de jeton, de mot de passe ni d'adresse mail personnelle. Rien de `../admin` sauf les logos validés de `../admin/Art`. Aucun chemin local de la machine.
- **N'écris que dans ce dossier.** L'appli est en lecture seule : lis uniquement ce qui est sur sa branche `master`, avec `git -C <appli> show master:<fichier>`. N'y lance jamais d'écriture, de commande npm, de checkout ni de commit, car elle est développée en parallèle. Ne touche pas au bot.
- **Fidèle à l'appli.**
  - N'annonce que ce qui existe sur master. Ce qui est « À venir » reste « coming soon », et ne promets aucune date.
  - Les chiffres (273 objets, familles, équipes, cartes, classes) viennent du `README.md` de l'appli.
  - Le nom s'écrit « WARDOGS Companion », avec WARDOGS en capitales.
  - Chaque page porte la mention : projet communautaire, non officiel, sans lien avec BULKHEAD, Team17 ni Twitch. Elle est dans le pied de page commun, `src/components/SiteFooter.astro`.
- **Pas d'images du jeu** tant que BULKHEAD n'a pas donné son accord, car elles appartiennent à leurs ayants droit. Les logos de WARDOGS Companion sont à nous.
- **Hébergement gratuit Vercel (plan Hobby) = usage non commercial** : pas de publicité, de dons, de sponsors ni de liens affiliés.
- **Deux langues, même contenu.** Chaque texte s'ajoute dans `src/i18n/ui.ts`, en anglais et en français. Chaque page anglaise a son équivalent dans `src/pages/fr/`, sauf `404.astro` : elle est unique et bilingue, car Vercel ne sert que `/404.html`.
- **Rien de chargé depuis ailleurs** : pas de script tiers, de police externe ni de traceur. Tout ajout doit rester compatible avec la CSP (`astro.config.mjs`) et les en-têtes (`vercel.json`).
- **Un push sur `main` met le site en ligne.** Avant chaque push : `npm run format:check` et `npm run build` doivent passer. Pour un changement visible important, passe par une branche et une pull request pour avoir un aperçu Vercel.
- **Git.** Messages de commit en français. Pousse après chaque commit sur `main`. Pas de force-push : `main` est protégée.
- **Dépendances.** Versions exactes dans `package.json`. Demande avant d'en ajouter une.

## Où sont les choses

| Quoi                                     | Fichier                        |
| ---------------------------------------- | ------------------------------ |
| Textes anglais et français               | `src/i18n/ui.ts`               |
| Textes juridiques, affichés tels quels   | `src/content/legal/`           |
| Squelette HTML commun (`<head>`, icônes) | `src/layouts/BaseLayout.astro` |
| Contenu des pages, pied de page commun   | `src/components/`              |
| Routes (le français sous `fr/`)          | `src/pages/`                   |
| Couleurs, fond quadrillé, styles communs | `src/styles/global.css`        |
| Langues, CSP                             | `astro.config.mjs`             |
| En-têtes HTTP de sécurité                | `vercel.json`                  |
| Logos et icônes                          | `public/`                      |
| Architecture, backend possible plus tard | `docs/ARCHITECTURE.md`         |
| Feuille de route                         | `docs/ROADMAP.md`              |

## Commandes

| Commande          | Effet                                            |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Serveur local sur `http://localhost:4321`.       |
| `npm run check`   | Vérifie les types et les modèles.                |
| `npm run build`   | Vérifie, puis construit le site dans `dist/`.    |
| `npm run preview` | Sert `dist/`, seul moyen de tester la CSP.       |
| `npm run format`  | Met en forme ; `format:check` vérifie seulement. |

## Protections du dépôt GitHub

Les réglages ont été faits une fois ; ne les affaiblis pas sans accord :

- blocage des secrets à l'envoi (secret scanning et push protection) ;
- règle sur `main` : ni force-push ni suppression ;
- Dependabot : alertes, correctifs de sécurité et mises à jour mensuelles (`.github/dependabot.yml`) ;
- signalement privé des failles (`SECURITY.md`) ;
- Actions : jeton en lecture seule, actions épinglées par leur empreinte, validation obligatoire des workflows venant de forks ;
- Wiki, Projects et Issues désactivés : le support passe par Discord.

## Couleurs des équipes

Les couleurs d'équipe sont reprises de l'appli (`src/profile/model.ts`) :

- bleu Lonestar `#69b8ff` ;
- rouge Valkyra `#ff6966` ;
- vert Manticore `#69d58c`.

L'accent par défaut, `#ff535b`, est celui de la régie de l'appli quand aucune équipe n'est choisie (`src/editor/LiveConfiguration.tsx`, `src/styles/components.css`).

## Plus tard

Un backend et une base de données sont possibles si le site évolue. La façon de les ajouter sans tout refaire, et ce qu'il faudra alors sécuriser, sont décrites dans `docs/ARCHITECTURE.md`.
