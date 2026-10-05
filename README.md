<p align="center">
  <img src="docs/images/logo-horizontal-dark.png" alt="Wardogs Companion" width="520">
</p>

<h3 align="center">The website of Wardogs Companion.</h3>

<p align="center">
  Wardogs Companion is an unofficial community Twitch extension that shows a streamer's full WARDOGS loadout<br>
  in a panel over the video, item by item. This repository holds its website.
</p>

---

## Status

The website is in beta, in English and in French, at **https://wardogs-companion.vercel.app**: the home page opens on a short intro film, then on the console, the WARDOGS tower's computer recreated, whose screens lead to the site's sections (the extension, its screenshots, the Discord server, the project); the extension's privacy policy and terms of use have their own pages.

## Stack

- [Astro](https://astro.build) 7, static output, TypeScript in strict mode.
- English is the reference language; French says the same thing (`src/i18n/ui.ts`; the console's texts: `src/i18n/station.ts`).
- Hosted on [Vercel](https://vercel.com): every push to `main` goes live, every pull request gets a preview.
- No server, no database, no cookies and no tracking for now. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how a backend could be added later.
- The home page's game media (the intro's footage, the console's pictures) are never in this repository: the build fetches them from private storage (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). Without them, for example in a fork, the home page shows a simple presentation only.

## Development

Requirements: Node.js 24 (see `.nvmrc`) and npm.

```bash
npm install
npm run dev
```

| Script                   | Purpose                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `npm run dev`            | Local development server on `http://localhost:4321`.                                       |
| `npm run check`          | Type and template check (`astro check`).                                                   |
| `npm run build`          | Check, then build the static site into `dist/`.                                            |
| `npm run preview`        | Serves the content of `dist/`.                                                             |
| `npm run format`         | Formats the code (Prettier); `format:check` only checks it.                                |
| `npm run intro:svg`      | Redraws the intro's SVG pictures into `public/images/intro/`.                              |
| `npm run media:manifest` | Rewrites the list of a group of game media (`-- intro <folder>` or `-- console <folder>`). |

```text
.
├── public/              pictures, icons and fonts served as they are
├── scripts/             one-off generators (the intro's SVG pictures, the game media's lists)
├── src/
│   ├── components/      page sections
│   ├── i18n/            English and French texts
│   ├── integrations/    build steps (the game media)
│   ├── layouts/         HTML skeleton shared by every page
│   ├── pages/           one file per route; French pages live in pages/fr/
│   ├── scripts/         browser code (the intro film, the console)
│   └── styles/          shared style sheets
├── docs/                architecture and roadmap (in French), README picture
├── astro.config.mjs     Astro configuration (languages, content security policy)
└── vercel.json          HTTP security headers
```

### Inspecting the intro film

The home page's intro film (`/` and `/fr/`) can be inspected with two query parameters, on the live site or on any build that has the intro's media. `npm run dev` and builds without the media (a fork, a local build) have no film, so the parameters do nothing there.

| Parameter      | Effect                                                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?perf=1`      | Logs the film's frame times to the browser's developer console every second. When the film plays to its end, the whole film's result is also shown over the page (its slow frames and when they fell), to be read off a screenshot.                  |
| `?t=<seconds>` | Freezes the film on one frame, that many seconds from its start (the film lasts about 25 s), for example `?t=12.5`. `?t=lock` shows its last shot, the project's emblem locked in the scope; `?t=end` shows the page as it is once the film is over. |

The film does not always start by itself: with reduced motion turned on in the system, or once it has been watched or skipped in the same tab, the home page opens straight on the console. The parameters then apply when **Watch intro** or **Replay intro**, at the top of the page, is pressed. After a visit, opening the address in a new tab also works.

For example: `https://wardogs-companion.vercel.app/?perf=1`.

### Inspecting the console

The home page's console (the tower's computer, `src/components/Station.astro`), which the intro film hands over to, has three query parameters of its own, on any build that has the console's media.

| Parameter             | Effect                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `?perf=1`             | Shows, in a corner, the frames per second and the longest frame of each half second; with no frames to draw (motion reduced, a page read at rest), why.                                                                  |
| `?ct=<seconds>`       | Freezes the console as it is that many seconds after it opens (once the intro film is over or skipped), for example `?ct=25`. The main power is pressed at about 4.6 s, and the room is lit and at rest from about 20 s. |
| `?lite=1` / `?lite=0` | Forces the light version (made for computers without a graphics card: no walk-in, fewer moving layers) or the full one. Without it, the console picks the light version when the browser draws in software.              |

For example: `https://wardogs-companion.vercel.app/?ct=25`.

Each section of the console has its own address: `/extension`, `/screenshots`, `/discord` and `/about` (and `/fr/extension`… in French). They open the console straight on that section, without the intro film; the address follows the section read.

## Security

This repository is public and holds no secrets. Please report security issues privately: see [SECURITY.md](SECURITY.md).

## License and credits

Copyright © 2026 BiggyQLF. All rights reserved. The code is public so that it can be read, but no license is granted beyond the rights GitHub's Terms of Service give its users (viewing and forking on GitHub): see [LICENSE](LICENSE).

WARDOGS, its names, logos, visuals and game elements belong to their rights holders (BULKHEAD, Team17). This project is independent and is not affiliated with BULKHEAD, Team17 or Twitch.

The Barlow and Barlow Semi Condensed typefaces are under the SIL Open Font License 1.1 ([public/fonts/OFL.txt](public/fonts/OFL.txt)). The console's sounds are real recordings from Freesound, under Creative Commons 0, their authors credited in [public/sounds/CREDITS.txt](public/sounds/CREDITS.txt).
