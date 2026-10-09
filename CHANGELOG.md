# Changelog

All notable changes to the Wardogs Companion website. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions follow [Semantic Versioning](https://semver.org/): 0.x while the site is in beta.

## [Unreleased]

### Changed

- The extension's privacy policy and terms of use, updated on October 9, 2026 for the extension update that adds presets: their names and roles are public; the channel's name is published as the display name when that field is left empty; clearing the published loadout removes the presets too. Each opens on a note that says what changed.

## [0.2.0] - 2026-10-08

### Added

- A legal notice page (`/legal`, `/fr/legal`): the publisher, the host, intellectual property and the site's own personal data, linked from the foot of every page and from the console's legal lines.
- A FAQ at the end of the EXTENSION page: the questions visitors ask most, each opening its answer (free? official? on a phone? data?), and help on Discord.
- The entries of the console's main menu show a label (their name, code and description) when pointed at or reached with the keyboard: unlike the menu drawn on the screen, it grows with the browser's zoom.
- The site's version, at the foot of the console and of every page ("Website v0.2.0"), read from `package.json`.
- Link previews: a page shared on Discord, X or elsewhere shows a card with its title, a sentence about it and the project's logo, in the page's language.
- For search engines: each page gives its canonical address and its version in the other language (hreflang), and the site has a sitemap (`/sitemap.xml`, listed in `/robots.txt`).

### Changed

- Clearer small words: the SCREENSHOTS entry of the console's menu reads "8 images" (not "8 views"), its terminal says the extension is hosted by Twitch (not "server: none"), the Discord server is "free, open to all", and the French captions say "l’extension", as the rest of the site.
- The EXTENSION page links to the privacy policy, under "Good to know" and under the FAQ's answer about data, as a button of the console's own kind.
- The legal pages get a table of contents, beside the text on wide screens and folded above it on phones; the extension's privacy policy and terms say in one line that they cover the extension, with a link to the website's legal notice.
- The notice says it in full: the project is not endorsed or supported by BULKHEAD, Team17 or Twitch (the footer, the ABOUT page, the FAQ). The extension is said to be free where visitors arrive, "No data collected" reads "No data collected about viewers", and the ABOUT page gives rights holders an address to write to.
- Where the console cannot show (without JavaScript, or if it fails to load), the home page says what the extension does and that it is coming soon, with a link to the Discord server; the "page not found" page links to it too.
- On phones lying down up to 700 px wide (an iPhone SE, a small Android), the legal lines of the intro and of the console run across the whole width above their buttons, as on a phone held upright: about four lines instead of up to eight, and more room for the console. On phones, the console's buttons now sit where the intro's do, so that nothing moves when the film gives way to the console. The intro's legal lines no longer leave a word alone on their last line either.
- On phones, a page read takes more of the screen: only the sections' bar stays at the bottom, and the legal lines and the animation and sound buttons move to the end of the page, as a footer.
- One address per page, without a trailing slash: `/fr/`, `/privacy/`, `/terms/`… now redirect to `/fr`, `/privacy`, `/terms`…
- The Discord server's new permanent invite, https://discord.gg/THkQU8Nr2Q.
- Typography: curly quotes and apostrophes throughout the console, titles in lines of even length and no word left alone at the end of a paragraph, numbers kept with their unit.

### Fixed

- On a computer at 100%, the console's [ skip ], [ sound ] and [ animations ] buttons read right: at 13 px their i looked like a capital I ("skIp"); they are 14 px, as the intro's.
- In low windows (a phone lying down with its browser's bar showing), the call's box (112 dialled on the keypad) is set a little tighter where it would not fit, so that it stays whole above the legal lines; in the very lowest, only its top line may still be cut, its buttons always in reach.
- On phones lying down and on tablets, the console's legal lines no longer run under its sound and animation buttons (in French, with the sound on, they could); and wherever they wrap, they no longer leave a word alone on their last line.
- On tablets, the SCREENSHOTS viewer's screen is as tall as its captures and their margins, without the large empty bands above and below them; phones and computers unchanged.
- On phones and upright tablets, the site's name and the language switch at the top of the home page no longer sit on the console's bright gauges: a soft shade behind them keeps them readable.
- Found by a review on phones and tablets: the legal lines at the foot of the console no longer break inside the notice; the Discord invite shows in its real case (its code is case-sensitive); the ABOUT page's status badges no longer wrap; the roadmap's next step stays visible while it blinks; the marks of the annotated screenshots no longer hide the extension's logo, its publish button or a label; "In figures" no longer leaves a dot at a line's end, one figure a line on phones; the numbers of the steps line up.

## [0.1.2] - 2026-10-07

### Changed

- In the intro film, the game's developer and publisher, BULKHEAD and Team17, are presented as the game's creators ("Game creators identified") rather than as allies, so that nothing suggests a partnership: the project is not affiliated with them.

## [0.1.1] - 2026-10-06

### Fixed

- On phones, and on screens about 1,100 pixels wide, the "Choose an item" screenshot of the EXTENSION page ran past the edge of the screen and the page scrolled sideways: it now fits the screen.

## [0.1.0] - 2026-10-05

The beta, online at https://wardogs-companion.vercel.app.

### Added

- The home page: a short intro film, then the WARDOGS tower's computer, recreated as an interactive console whose screens lead to the site's sections: the extension, its screenshots, the Discord server and the project.
- One address per section: `/extension`, `/screenshots`, `/discord` and `/about`, in English and in French (`/fr/…`).
- The extension's privacy policy and terms of use: `/privacy` and `/terms` (and `/fr/privacy`, `/fr/terms`).
- English and French throughout.

[Unreleased]: https://github.com/Wardogs-Companion/wardogs-companion-website/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Wardogs-Companion/wardogs-companion-website/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Wardogs-Companion/wardogs-companion-website/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Wardogs-Companion/wardogs-companion-website/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Wardogs-Companion/wardogs-companion-website/releases/tag/v0.1.0
