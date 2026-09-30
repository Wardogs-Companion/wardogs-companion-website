<p align="center">
  <img src="docs/images/logo-horizontal-dark.png" alt="WARDOGS Companion" width="520">
</p>

<h3 align="center">The website of WARDOGS Companion.</h3>

<p align="center">
  WARDOGS Companion is an unofficial community Twitch extension that shows a streamer's full WARDOGS loadout<br>
  in a panel over the video, item by item. This repository holds its website.
</p>

---

## Status

The website is under construction: for now it shows a single home page, in English and in French.

## Stack

- [Astro](https://astro.build) 7, static output, TypeScript in strict mode.
- English is the reference language; French says the same thing (`src/i18n/ui.ts`).
- Hosted on [Vercel](https://vercel.com): every push to `main` goes live, every pull request gets a preview.
- No server, no database, no cookies and no tracking for now. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how a backend could be added later.

## Development

Requirements: Node.js 24 (see `.nvmrc`) and npm.

```bash
npm install
npm run dev
```

| Script            | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Local development server on `http://localhost:4321`.        |
| `npm run check`   | Type and template check (`astro check`).                    |
| `npm run build`   | Check, then build the static site into `dist/`.             |
| `npm run preview` | Serves the content of `dist/`.                              |
| `npm run format`  | Formats the code (Prettier); `format:check` only checks it. |

```text
.
├── public/              pictures and icons served as they are
├── src/
│   ├── components/      page sections
│   ├── i18n/            English and French texts
│   ├── layouts/         HTML skeleton shared by every page
│   ├── pages/           one file per route; French pages live in pages/fr/
│   └── styles/          shared style sheets
├── docs/                architecture and roadmap (in French), README picture
├── astro.config.mjs     Astro configuration (languages, content security policy)
└── vercel.json          HTTP security headers
```

## Security

This repository is public and holds no secrets. Please report security issues privately: see [SECURITY.md](SECURITY.md).

## License and credits

Copyright © 2026 BiggyQLF. All rights reserved. The code is public so that it can be read, but no license is granted beyond the rights GitHub's Terms of Service give its users (viewing and forking on GitHub): see [LICENSE](LICENSE).

WARDOGS, its names, logos, visuals and game elements belong to their rights holders (BULKHEAD, Team17). This project is independent and is not affiliated with BULKHEAD, Team17 or Twitch.
