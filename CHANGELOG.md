# Changelog

All notable changes to the Wardogs Companion website. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the versions follow [Semantic Versioning](https://semver.org/): 0.x while the site is in beta.

## [Unreleased]

### Added

- A FAQ at the end of the EXTENSION page: the questions visitors ask most, each opening its answer (free? official? on a phone? data?), and help on Discord.

### Changed

- On phones, a page read takes more of the screen: only the sections' bar stays at the bottom, and the legal notice and the animation and sound buttons move to the end of the page, as a footer.

### Fixed

- On phones and upright tablets, the site's name and the language switch at the top of the home page no longer sit on the console's bright gauges: a soft shade behind them keeps them readable.

## [0.2.0] - 2026-10-06

### Added

- The entries of the console's main menu show a label (their name, code and description) when pointed at or reached with the keyboard: unlike the menu drawn on the screen, it grows with the browser's zoom.
- The site's version, at the foot of the console and of every page ("Website v0.2.0"), read from `package.json`.
- Link previews: a page shared on Discord, X or elsewhere shows a card with its title, a sentence about it and the project's logo, in the page's language.
- For search engines: each page gives its canonical address and its version in the other language (hreflang), and the site has a sitemap (`/sitemap.xml`, listed in `/robots.txt`).

### Changed

- One address per page, without a trailing slash: `/fr/`, `/privacy/`, `/terms/`… now redirect to `/fr`, `/privacy`, `/terms`…
- The Discord server's new permanent invite, https://discord.gg/THkQU8Nr2Q.
- Typography: curly quotes and apostrophes throughout the console, titles in lines of even length and no word left alone at the end of a paragraph, numbers kept with their unit.

### Fixed

- Found by a review on phones and tablets: the legal lines at the foot of the console no longer break inside the notice; the Discord invite shows in its real case (its code is case-sensitive); the ABOUT page's status badges no longer wrap; the roadmap's next step stays visible while it blinks; the marks of the annotated screenshots no longer hide the extension's logo, its publish button or a label; "In figures" no longer leaves a dot at a line's end, one figure a line on phones; the numbers of the steps line up.

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
[0.2.0]: https://github.com/Wardogs-Companion/wardogs-companion-website/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Wardogs-Companion/wardogs-companion-website/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Wardogs-Companion/wardogs-companion-website/releases/tag/v0.1.0
