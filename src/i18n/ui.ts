// Texts of the site. English is the reference; French says the same thing.
// Facts about the extension must match the app's README on master.

export const languages = {
  en: 'English',
  fr: 'Français',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

const en = {
  'meta.title': 'WARDOGS Companion',
  'meta.description':
    'WARDOGS Companion, an unofficial community Twitch extension that shows a streamer’s full WARDOGS loadout live on stream.',
  'nav.switchLabel': 'Language',
  'home.status': 'Website under construction',
  'home.tagline': 'Your WARDOGS loadout, live on stream.',
  'home.lead':
    'An unofficial community Twitch extension that shows a streamer’s full WARDOGS loadout in a panel over the video, item by item, with the prices, sizes and weights the game uses.',
  'footer.disclaimer':
    'WARDOGS Companion is an independent, unofficial community project. It is not affiliated with BULKHEAD, Team17 or Twitch. WARDOGS and its names, logos and visuals belong to their respective rights holders.',
  'footer.copyright': '© 2026 BiggyQLF. All rights reserved.',
  'footer.legalLabel': 'Legal',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'privacy.description': 'Privacy policy of WARDOGS Companion, the unofficial community Twitch extension.',
  'terms.description': 'Terms of use of WARDOGS Companion, the unofficial community Twitch extension.',
};

const fr: Record<keyof typeof en, string> = {
  'meta.title': 'WARDOGS Companion',
  'meta.description':
    'WARDOGS Companion, une extension Twitch communautaire et non officielle qui affiche tout le loadout WARDOGS du streamer en direct sur le stream.',
  'nav.switchLabel': 'Langue',
  'home.status': 'Site en construction',
  'home.tagline': 'Ton loadout WARDOGS, en direct sur le stream.',
  'home.lead':
    'Une extension Twitch communautaire et non officielle qui affiche tout le loadout WARDOGS du streamer dans un panneau par-dessus la vidéo, objet par objet, avec les prix, les encombrements et les poids du jeu.',
  'footer.disclaimer':
    'WARDOGS Companion est un projet communautaire indépendant et non officiel. Il n’est affilié ni à BULKHEAD, ni à Team17, ni à Twitch. WARDOGS, ses noms, logos et visuels appartiennent à leurs ayants droit.',
  'footer.copyright': '© 2026 BiggyQLF. Tous droits réservés.',
  'footer.legalLabel': 'Informations légales',
  'footer.privacy': 'Confidentialité',
  'footer.terms': 'Conditions',
  'privacy.description':
    'Politique de confidentialité de WARDOGS Companion, l’extension Twitch communautaire et non officielle.',
  'terms.description':
    'Conditions d’utilisation de WARDOGS Companion, l’extension Twitch communautaire et non officielle.',
};

export const ui: Record<Lang, typeof en> = { en, fr };

export function useTranslations(lang: Lang) {
  return (key: keyof typeof en): string => ui[lang][key];
}
