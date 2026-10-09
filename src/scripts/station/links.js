// The project's places elsewhere, in one place: the extension's own page on Twitch, where a streamer installs it; the
// Discord server's permanent invitation (its code is case-sensitive); and the site's source code. The console offers
// them (station.js LINKS); the pages without it offer the invitation: the home page's presentation (HomePage.astro),
// which offers the extension's page too, and the page not found (404.astro). Markdown cannot read them, so they are
// also written out in README.md (the invitation) and in the site's legal notice, src/content/site/ (the source code):
// change them there too.

// The extension's page on Twitch, without a version number (Twitch's own link ends with one, -0.0.1): it shows the
// version on Twitch, whichever it is. Without it the site does not build (HomePage.astro), so that no page ever offers
// a button to nowhere.
export const TWITCH_EXTENSION = 'https://dashboard.twitch.tv/extensions/hfhubjrsv0x7qqdcmnzjf5bxcnc2tm';
export const DISCORD_INVITE = 'https://discord.gg/THkQU8Nr2Q';
export const SOURCE_CODE = 'https://github.com/Wardogs-Companion/wardogs-companion-website';
