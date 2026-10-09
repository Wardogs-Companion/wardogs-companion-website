// Texts of the site. English is the reference; French says the same thing.
// Facts about the extension must match the app's README on master.

export const languages = {
  en: 'English',
  fr: 'Français',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

const en = {
  'meta.title': 'Wardogs Companion',
  'meta.description':
    'Wardogs Companion, a free, unofficial community Twitch extension that shows a streamer’s full WARDOGS loadout live on stream.',
  // the picture under a shared link (public/images/og-card.png: the logo alone)
  'meta.imageAlt': 'The Wardogs Companion logo',
  'nav.switchLabel': 'Language',
  'home.status': 'Website in beta',
  'home.tagline': 'Your WARDOGS loadout, live on stream.',
  'home.lead':
    'A free, unofficial community Twitch extension that shows a streamer’s full WARDOGS loadout in a panel over the video, item by item, with the prices, sizes and weights the game uses.',
  // the presentation, where the console does not show (HomePage.astro): what it does, its state (the console's
  // EXTENSION page says it with the same words: station.ts, its hero's status), where to install it and to talk about it
  'home.how':
    'The streamer prepares their loadout in an editor on Twitch, and viewers open it with one click. Nothing is read from the game: the streamer enters everything.',
  'ext.state': 'Available',
  'ext.stateText': 'On Twitch now, open to all: install it on your channel from Twitch.',
  'home.install': 'Install on Twitch',
  'home.join': 'Join the Discord',
  // The intro film on the home page (IntroFilm.astro). No-break spaces ( ) keep the legal lines from breaking
  // before a dash, after © or around the slash of BULKHEAD / Team17. ariaC, ariaD: what screen readers are told once
  // each target is identified (the cards on screen are hidden from them).
  'intro.searching': 'Searching for target…',
  'intro.identified': 'Target identified',
  'intro.allies': 'Game creators identified',
  'intro.locked': 'Target locked',
  'intro.creator': 'Creator of Wardogs Companion',
  'intro.developer': 'Developer',
  'intro.publisher': 'Publisher',
  'intro.alliesTag': 'WARDOGS',
  'intro.ariaC': 'Target identified: creator of Wardogs Companion, Biggy',
  'intro.ariaD': 'Game creators identified: developer BULKHEAD, publisher Team17',
  'intro.skip': '[ skip intro ]',
  'intro.skipName': 'Skip intro',
  'intro.legal1': 'Community project — unofficial, not affiliated with BULKHEAD, Team17 or Twitch.',
  'intro.legal2':
    'Footage and screenshots: WARDOGS reveal trailer and press kit © BULKHEAD / Team17 — shown to present this project to them, removed on request.',
  'intro.replay': 'Replay intro',
  'intro.watch': 'Watch intro',
  'footer.disclaimer':
    'Wardogs Companion is an independent, unofficial community project. It is not endorsed or supported by BULKHEAD, Team17 or Twitch, and is not affiliated with them. WARDOGS and its names, logos and visuals belong to their respective rights holders.',
  'footer.copyright': '© 2026 BiggyQLF. All rights reserved.',
  // the site's version, from package.json (SiteFooter.astro, Station.astro): {version} is replaced there
  'footer.version': 'Website v{version}',
  'footer.legalLabel': 'Legal',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.legal': 'Legal notice',
  'privacy.description': 'Privacy policy of Wardogs Companion, the unofficial community Twitch extension.',
  'terms.description': 'Terms of use of Wardogs Companion, the unofficial community Twitch extension.',
  'legal.description':
    'Legal notice of the Wardogs Companion website: its publisher, its host, rights and the site’s own personal data.',
  // the legal pages: the extension's texts say what they cover ({link}: the site's legal notice); their contents
  'legal.context':
    'This text covers the Wardogs Companion extension for Twitch. The website itself has its own {link}.',
  'legal.contextLink': 'legal notice',
  'legal.contents': 'Contents',
  'legal.sections': '{n} sections',
  // the page not found (404.astro), one page in both languages: where to go back, and where to ask
  'notFound.title': 'Page not found',
  'notFound.description': 'This page does not exist.',
  'notFound.home': 'Back to the home page',
  'notFound.question': 'Have a question?',
  'notFound.ask': 'Ask it on Discord',
};

const fr: Record<keyof typeof en, string> = {
  'meta.title': 'Wardogs Companion',
  'meta.description':
    'Wardogs Companion, une extension Twitch gratuite, communautaire et non officielle qui affiche tout le loadout WARDOGS du streamer en direct sur le stream.',
  'meta.imageAlt': 'Le logo de Wardogs Companion',
  'nav.switchLabel': 'Langue',
  'home.status': 'Site en bêta',
  'home.tagline': 'Ton loadout WARDOGS, en direct sur le stream.',
  'home.lead':
    'Une extension Twitch gratuite, communautaire et non officielle qui affiche tout le loadout WARDOGS du streamer dans un panneau par-dessus la vidéo, objet par objet, avec les prix, les encombrements et les poids du jeu.',
  'home.how':
    'Le streamer prépare son loadout dans une régie sur Twitch, et ses viewers l’ouvrent d’un clic. Rien n’est lu dans le jeu : le streamer saisit tout lui-même.',
  'ext.state': 'Disponible',
  'ext.stateText': 'Sur Twitch dès maintenant, ouverte à tous : installe-la sur ta chaîne depuis Twitch.',
  'home.install': 'Installer sur Twitch',
  'home.join': 'Rejoindre le Discord',
  'intro.searching': 'Recherche de la cible…',
  'intro.identified': 'Cible identifiée',
  'intro.allies': 'Créateurs du jeu identifiés',
  'intro.locked': 'Cible verrouillée',
  'intro.creator': 'Créateur de Wardogs Companion',
  'intro.developer': 'Développeur',
  'intro.publisher': 'Éditeur',
  'intro.alliesTag': 'WARDOGS',
  'intro.ariaC': 'Cible identifiée : créateur de Wardogs Companion, Biggy',
  'intro.ariaD': 'Créateurs du jeu identifiés : développeur BULKHEAD, éditeur Team17',
  'intro.skip': '[ passer l’intro ]',
  'intro.skipName': 'Passer l’intro',
  'intro.legal1': 'Projet communautaire — non officiel, sans lien avec BULKHEAD, Team17 ni Twitch.',
  'intro.legal2':
    'Images : bande-annonce de WARDOGS et dossier de presse © BULKHEAD / Team17 — montrées pour leur présenter ce projet, retirées sur simple demande.',
  'intro.replay': 'Revoir l’intro',
  'intro.watch': 'Voir l’intro',
  'footer.disclaimer':
    'Wardogs Companion est un projet communautaire indépendant et non officiel. Il n’est ni approuvé ni soutenu par BULKHEAD, Team17 ou Twitch, et n’a aucun lien avec eux. WARDOGS, ses noms, logos et visuels appartiennent à leurs ayants droit.',
  'footer.copyright': '© 2026 BiggyQLF. Tous droits réservés.',
  'footer.version': 'Site v{version}',
  'footer.legalLabel': 'Informations légales',
  'footer.privacy': 'Confidentialité',
  'footer.terms': 'Conditions',
  'footer.legal': 'Mentions légales',
  'privacy.description':
    'Politique de confidentialité de Wardogs Companion, l’extension Twitch communautaire et non officielle.',
  'terms.description':
    'Conditions d’utilisation de Wardogs Companion, l’extension Twitch communautaire et non officielle.',
  'legal.description':
    'Mentions légales du site Wardogs Companion : son éditeur, son hébergeur, les droits et les données personnelles du site.',
  'legal.context':
    'Ce texte concerne l’extension Wardogs Companion pour Twitch. Le site lui-même a ses {link}.',
  'legal.contextLink': 'mentions légales',
  'legal.contents': 'Sommaire',
  'legal.sections': '{n} parties',
  'notFound.title': 'Page introuvable',
  'notFound.description': 'Cette page n’existe pas.',
  'notFound.home': 'Retour à l’accueil',
  'notFound.question': 'Une question ?',
  'notFound.ask': 'Pose-la sur le Discord',
};

export const ui: Record<Lang, typeof en> = { en, fr };

export function useTranslations(lang: Lang) {
  return (key: keyof typeof en): string => ui[lang][key];
}
