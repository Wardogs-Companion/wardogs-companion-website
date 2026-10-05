# Architecture

## Aujourd'hui : un site statique

- **Astro en sortie statique.** Chaque page est construite en HTML au moment du build, puis servie telle quelle par le CDN de Vercel. Il n'y a ni serveur, ni base de données, ni cookie, ni traceur : le site lui-même ne collecte aucune donnée sur les visiteurs. Seul Vercel, en tant qu'hébergeur, traite les journaux techniques des requêtes (adresse IP, navigateur).
- **Deux langues.** L'anglais sert de référence et se trouve à la racine (`/`), le français sous `/fr/` (routage i18n d'Astro, `astro.config.mjs`). Tous les textes sont dans `src/i18n/` : `ui.ts` pour les pages, `station.ts` pour la console de l'accueil (le français y est typé sur l'anglais : même forme, sinon `astro check` échoue). Une clé absente en français fait échouer `astro check`.
- **Pages.** Une page = un fichier dans `src/pages/`. Une page française reprend le même composant que la page anglaise avec `lang="fr"` : le contenu vit dans `src/components/`, pas dans les pages. La page 404 fait exception : elle est unique et bilingue, car Vercel ne sert que `/404.html`.
- **Mention obligatoire.** Le pied de page commun (`src/components/SiteFooter.astro`) porte sur chaque page la mention « projet non officiel, sans lien avec BULKHEAD, Team17 ni Twitch ». Sur l'accueil, quand la console s'affiche, ce sont ses lignes légales qui la portent, avec les liens vers la confidentialité et les conditions.
- **Rien de chargé depuis ailleurs.** Pas de script tiers, pas de police externe, pas d'outil de mesure d'audience. Les polices (Barlow, licence SIL OFL dans `public/fonts/`) et les médias du jeu sont servis par le site lui-même.

### L'intro de l'accueil

- **Ce que voit le visiteur.** L'accueil (`/` et `/fr/`) s'ouvre sur un film d'environ 25 s, dessiné par la page (`src/components/IntroFilm.astro`, code dans `src/scripts/intro/film.js`), puis passe la main à la console de la tour (voir plus bas) ; sans la console, à la présentation. « Passer l'intro » y mène tout de suite ; la console (ou la présentation) propose de revoir l'intro. Les mentions légales et le bouton pour passer sont affichés dès le premier affichage, avant tout script.
- **Animations réduites.** Si le visiteur a réduit les animations (réglage de son système), le film ne se lance jamais seul : la console (ou la présentation) s'affiche directement et propose « Voir l'intro » ; le film ne joue que s'il le demande.
- **Sans film.** Sans JavaScript, la page montre la présentation ; si un média manque (fichier retiré du stockage, build sans jeton, requête en échec, chargement de plus de 15 s), la page passe directement à la console (ou à la présentation), sans message d'erreur ni écran noir.
- **Une fois par visite.** Une fois le film vu (fini ou passé), les accueils suivants du même onglet s'ouvrent sans lui, et proposent de le revoir ; une nouvelle visite le rejoue. Le film ne garde qu'une marque dans le `sessionStorage` de l'onglet (`wardogs-intro-seen`), effacée à sa fermeture et jamais envoyée : ce n'est ni un cookie ni un traceur. Un petit script en ligne (`src/scripts/intro/seen-check.js`) la lit avant tout affichage, pour que l'accueil s'ouvre directement sur la console (ou la présentation) sans laisser voir l'intro.
- **Textes.** Ceux du film sont dans `src/i18n/ui.ts` (clés `intro.*`) ; le film prend la langue de la page.
- **CSP.** Les images que le film peignait lui-même (couches de peinture de l'emblème, grain) sont des fichiers SVG fixes dans `public/images/intro/`, refaits par `npm run intro:svg` (`scripts/intro-svg.mjs`) si leurs constantes changent (`src/scripts/intro/emblem.js`). Le script du film est un fichier du site (`/_astro/…`), autorisé par `script-src 'self'`. Le seul ajout à la CSP est l'empreinte du petit script en ligne « une fois par visite », calculée par l'intégration des médias du jeu sur le fichier même que la page affiche : les deux ne peuvent pas diverger.

### La console de l'accueil

- **Ce que voit le visiteur.** Après le film, l'accueil est l'ordinateur de la tour de WARDOGS, recréé : la salle s'allume, on presse l'interrupteur, et ses écrans mènent aux sections du site (l'extension, les captures, le Discord, le projet). Composant `src/components/Station.astro`, code dans `src/scripts/station/` (`station.js`, les sons `sounds.js`, les mesures de la salle `data/`), styles dans `src/styles/station.css` (chaque règle sous `#station`), textes dans `src/i18n/station.ts`, sons dans `public/sounds/` (enregistrements CC0, `CREDITS.txt`). Ses images sont des médias du jeu (voir plus bas).
- **Avec le film.** Chaque composant a son script ; ils se retrouvent dans `src/scripts/home.js`. Pendant le film, la console ne fait rien : elle ne se construit qu'une fois le film parti (sa construction, environ 0,1 s ici, ferait saccader le film), sous le noir ; la salle s'éclaire environ 0,7 s après la fin du film. Elle prend alors le focus. Si le film est rejoué depuis son coin (« Revoir l'intro »), elle s'arrête dessous (ni image, ni touche, ni son ; un appel ou un code en cours sont annulés) puis reprend telle qu'elle était, par un fondu.
- **La présentation reste le repli**, sous la console : sans script ; si aucun script ne prend la console en charge au bout de 8 s (son fichier n'arrive pas), ou s'il arrive après ce délai ; si la console ne finit pas de se charger dans les 15 s qui suivent son ouverture ; si sa construction échoue (`#station[data-state]` : `loading`, `ready`, `error`). La console y laisse la page, sans message. Son script recopie cet état sur `<html data-station>` (vide avant lui), qui tient la page immobile sous elle : jamais de `:has()` depuis la racine de la page, avec lequel Chromium recalcule les styles de toute la page à chaque changement dans la console.
- **Langues.** EN / FR, dans son coin, mènent à la même page dans l'autre langue (`/` ↔ `/fr/`, `/extension` ↔ `/fr/extension`… : voir « Une adresse par section »).
- **Mouvement réduit.** Elle s'ouvre allumée et immobile ; le bouton « [ animations ] » permet au visiteur de les rallumer pour elle seule (les règles de base de `global.css` ne la touchent pas).
- **Ce qu'elle garde dans le navigateur.** Dans le `sessionStorage` de l'onglet, effacé à sa fermeture : la console allumée (`wardogs.console.on`), le son et son volume (`wardogs.sound`, `wardogs.volume`), le choix des animations (`wardogs.reduce`), les sections lues (`wardogs.console.visited`, `wardogs.console.since`). Dans le `localStorage` : la faction rejointe sur le radar (`wardogs.faction`), avec sa date, oubliée 13 mois après. Rien n'est envoyé : ce ne sont ni des cookies ni des traceurs, seulement des préférences d'affichage.
- **Une adresse par section.** `/extension`, `/screenshots`, `/discord`, `/about` (et `/fr/extension`…), générées depuis la liste des sections (`src/scripts/station/sections.js`, `src/pages/[section].astro`) : l'accueil, ouvert sur la section (`<html data-section>`). Le film est sauté (et compté comme vu pour la visite, `seen-check.js`), la console s'ouvre allumée et lit la section. L'adresse suit ensuite la section lue, le titre de l'onglet et les liens EN / FR avec elle (`history.replaceState`, sans entrée d'historique), et redevient celle de l'accueil au retour au menu.
- **Inspection.** `?ct=<secondes>`, `?perf=1` et `?lite=0/1` : voir le README.

### Les médias du jeu

- **Jamais dans le dépôt.** L'accueil montre des médias du jeu, © BULKHEAD / Team17, pour leur présenter le projet ; ils sont retirés sur simple demande. Ils sont dans un stockage privé Vercel Blob, `wardogs-companion-intro-media` (son nom date de l'intro), relié au projet Vercel (production, aperçus, développement). Sans autorisation, leurs adresses répondent 403. Deux groupes :
  - `intro/` : l'ouverture de la bande-annonce de WARDOGS (vidéo et sa dernière image en 4K) et deux photos du dossier de presse, 4 fichiers ;
  - `console/v1/` : l'ordinateur de la tour recréé à partir d'images du jeu (salle, pièces, touches), les emblèmes des factions et des captures de l'extension, 95 fichiers WebP (3,9 Mo). Leurs noms portent `.game.`, que `.gitignore` exclut partout.
- **La liste.** `src/integrations/game-media.json`, commitée, donne pour chaque groupe le nom, la taille et l'empreinte SHA-256 de chaque fichier, jamais un pixel. `npm run media:manifest -- <intro|console> <dossier>` la refait à partir d'un dossier.
- **Récupérés au build.** L'intégration `src/integrations/game-media.mjs` (déclarée dans `astro.config.mjs`) les télécharge pendant `astro build` avec le jeton que Vercel met dans l'environnement du build (`VERCEL_OIDC_TOKEN`, sinon `BLOB_READ_WRITE_TOKEN`), vérifie chaque fichier contre la liste (taille et empreinte) et les écrit dans `dist/media/<groupe>/`. Le jeton n'est jamais affiché ni écrit dans le site. Les pages savent par un module virtuel (`virtual:wardogs/game-media`) quels groupes sont là ; l'accueil est construit sans ceux qui manquent.
  - Sans jeton (CI GitHub, fork, build local) : un avertissement, et le build réussit sans les médias.
  - Aucun fichier d'un groupe récupéré (tous retirés du stockage, jeton refusé, réseau) : un avertissement, et le build réussit sans ce groupe.
  - Une partie seulement des fichiers d'un groupe, ou un fichier différent de la liste : le build échoue, plutôt que de mettre en ligne un accueil à moitié cassé.
  - Test local : `INTRO_MEDIA_DIR=<dossier>` et `CONSOLE_MEDIA_DIR=<dossier>` prennent les fichiers dans un dossier de la machine, hors du dépôt (un fichier manquant ou différent fait alors échouer le build), pour `npm run build` comme pour `npm run dev`, qui les sert alors aux mêmes adresses.
- **En-têtes** (`vercel.json`, `/media/`) : `Cross-Origin-Resource-Policy: same-origin` (d'autres sites ne peuvent pas les afficher chez eux), `X-Robots-Tag: noindex` (pas d'indexation par les moteurs de recherche) et `Cache-Control: public, max-age=0, must-revalidate` (le navigateur revérifie à chaque visite : un retrait vaut dès le déploiement suivant).
- **Les changer** (console) : envoyer les nouveaux fichiers sous un nouveau préfixe (`console/v2/`), refaire la liste et changer le préfixe dans `GROUPS` (`game-media.mjs`), dans le même commit. Les déploiements en cours gardent leurs fichiers ; l'ancien préfixe se supprime ensuite.
- **Les retirer vite**, par exemple à la demande de BULKHEAD :
  1. supprimer tous les fichiers du groupe dans le stockage (Vercel, onglet Storage, `wardogs-companion-intro-media`, dossier `intro/` ou `console/v1/`) : un groupe à moitié retiré fait échouer le build ;
  2. redéployer la production (Vercel, Deployments, Redeploy, ou un push sur `main`) : le build ne les trouve plus et l'accueil passe sans ce groupe ;
  3. supprimer les anciens déploiements (Vercel, Deployments), production et aperçus : chacun garde sa propre copie des fichiers, encore accessible par son adresse.

  Les navigateurs qui les ont déjà en cache peuvent les garder un temps ; rien n'en reste dans le dépôt.

### Sécurité

- **Politique de sécurité du contenu (CSP)** : Astro l'écrit dans une balise `<meta>` de chaque page (`security.csp`). Elle n'autorise que les ressources du site et les empreintes de ses propres scripts et styles. Elle bloque donc la barre d'outils de Vercel sur les aperçus : cette barre est désactivée dans les réglages du projet Vercel.
- **En-têtes HTTP** (`vercel.json`) : interdiction d'afficher le site dans un cadre (`frame-ancestors 'none'`, `X-Frame-Options`), `nosniff`, `Referrer-Policy`, `Permissions-Policy` et `Cross-Origin-Opener-Policy`. Vercel ajoute HTTPS et HSTS.
- **Dépôt public** : aucun secret n'y entre. Les réglages GitHub (blocage des secrets à l'envoi, protection de `main`, Dependabot) sont décrits dans `CLAUDE.md`.
- **Jeton des builds** : les builds Vercel (production et aperçus) ont dans leur environnement `BLOB_READ_WRITE_TOKEN`, qui peut aussi écrire dans le stockage des médias du jeu. La protection des forks de Vercel (Git Fork Protection) est activée : n'autorise jamais le déploiement d'une pull request venant d'un fork, car son code s'exécuterait avec ce jeton.

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
