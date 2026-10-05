// The game's media that the site shows (© BULKHEAD / Team17) are never in this repository. They live in a private
// Vercel Blob store; this integration fetches them while the site is built and writes them into the build output,
// under /media/. Two groups, both for the home page, each shown only when all its files are there:
// - intro: the WARDOGS reveal trailer's opening clip, its last frame and two press-kit pictures (the intro film);
// - console: the tower's computer rebuilt from the game's pictures, the factions' emblems and captures of the
//   extension (the console that follows the film).
//
// - Each group's files: game-media.json, committed (names, sizes and SHA-256, never a pixel), written by
//   scripts/game-media-manifest.mjs. A file is taken only if it matches it byte for byte.
// - Token: read from the build's own environment, never from a file. On Vercel, VERCEL_OIDC_TOKEN (short-lived,
//   preferred) or BLOB_READ_WRITE_TOKEN, both given to the project by the connected store. Never printed.
// - No token (GitHub CI, a fork, a local build): one warning, and the site is built without the groups.
// - A group none of whose files can be fetched (all gone from the store, which is how the media are taken down: see
//   docs/ARCHITECTURE.md; or the token refused, the network down): one warning, and the site is built without it.
//   Some files only, or a file that does not match the list: the build fails, rather than go live half broken.
// - Local test: INTRO_MEDIA_DIR or CONSOLE_MEDIA_DIR=<a folder holding the group's files> takes them from there
//   instead (a missing or different file then fails), for `astro build` and `astro dev` alike (the dev server serves
//   them). The folders stay outside the repository.
//
// Plain JavaScript, like astro.config.mjs: it runs in Node at build time, and the project carries no Node type
// definitions (types in JSDoc comments only).
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

// The private store (its address is not a secret: without a token it answers 403).
const STORE = 'https://ctfqc1l6chxiqqbo.private.blob.vercel-storage.com/';
const MANIFEST = new URL('./game-media.json', import.meta.url);
/** @typedef {'intro' | 'console'} Group */
// Each group's place, in the store and on the site (/media/<prefix>), and the variable naming its local folder.
/** @type {Record<Group, { prefix: string, env: string }>} */
const GROUPS = {
  intro: { prefix: 'intro/', env: 'INTRO_MEDIA_DIR' },
  console: { prefix: 'console/v1/', env: 'CONSOLE_MEDIA_DIR' },
};
const GROUP_IDS = /** @type {Group[]} */ (Object.keys(GROUPS));
// The intro's files, by the names its film gives them.
const INTRO = {
  clip: 'opening-clip.mp4',
  op: 'opening-last-4k.jpg',
  lb: 'littlebird-1.jpg',
  l2: 'littlebird-2.jpg',
};
// (the types `astro dev` serves them with)
/** @type {Record<string, string>} */
const TYPES = { '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webp': 'image/webp' };
const PARALLEL = 6; // downloads at a time

const VIRTUAL_ID = 'virtual:wardogs/game-media';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
// The intro's once-per-visit check, rendered inline (before anything is drawn) by IntroFilm.astro.
const SEEN_CHECK = new URL('../scripts/intro/seen-check.js', import.meta.url);

/** @typedef {{ name: string, bytes: number, sha256: string }} Entry */
/** @typedef {{ entry: Entry, body?: Buffer, problem?: string, wrong?: boolean }} Result (wrong: not the listed file) */

/**
 * @param {Entry} entry
 * @param {Buffer} body
 * @returns {string | null} the problem, or null
 */
function check(entry, body) {
  if (body.length !== entry.bytes) return `${body.length} bytes, expected ${entry.bytes}`;
  if (createHash('sha256').update(body).digest('hex') !== entry.sha256)
    return 'not the listed file (SHA-256)';
  return null;
}

/**
 * @param {Entry} entry
 * @param {string} url
 * @param {string[]} tokens
 * @returns {Promise<Result>}
 */
async function download(entry, url, tokens) {
  let problem = '';
  let wrong = false;
  for (const token of tokens) {
    // (each token gets two tries: a short network hiccup does not cost the group)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(60_000),
        });
        if (res.status === 404) return { entry, problem: 'not in the store (404)' };
        if (res.status === 401 || res.status === 403) {
          problem = `refused (${res.status})`;
          break; // (the next token, if any)
        }
        if (!res.ok) {
          problem = `HTTP ${res.status}`;
          continue;
        }
        const body = Buffer.from(await res.arrayBuffer());
        const bad = check(entry, body);
        if (!bad) return { entry, body };
        [problem, wrong] = [bad, true];
      } catch (err) {
        // (never the error's own message: it can quote the request's headers, the token with them)
        problem = err instanceof Error && err.name === 'TimeoutError' ? 'timed out' : 'network error';
      }
    }
  }
  return { entry, problem, wrong };
}

/**
 * @param {Entry} entry
 * @param {string} dir
 * @returns {Promise<Result>}
 */
async function fromFolder(entry, dir) {
  let body;
  try {
    body = await readFile(join(dir, entry.name));
  } catch {
    return { entry, problem: 'not found' };
  }
  const bad = check(entry, body);
  return bad ? { entry, problem: bad, wrong: true } : { entry, body };
}

/**
 * `work` on every item, PARALLEL at a time, the results in the items' order.
 * @template T, R
 * @param {T[]} items
 * @param {(item: T) => Promise<R>} work
 * @returns {Promise<R[]>}
 */
async function inTurn(items, work) {
  /** @type {R[]} */
  const out = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await work(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, items.length) }, worker));
  return out;
}

/**
 * The failures, by problem, a few names each (a group taken down is a hundred times the same 404).
 * @param {Result[]} results
 */
function report(results) {
  /** @type {Map<string, string[]>} */
  const by = new Map();
  for (const r of results) by.set(r.problem ?? '', [...(by.get(r.problem ?? '') ?? []), r.entry.name]);
  return [...by]
    .map(([problem, names]) => {
      const more = names.length > 3 ? ` and ${names.length - 3} more` : '';
      return `${problem}: ${names.slice(0, 3).join(', ')}${more}`;
    })
    .join('; ');
}

/** @returns {import('astro').AstroIntegration} */
export default function gameMedia() {
  /** The groups the site has, each file by its name in the group. @type {Map<Group, Map<string, Buffer>>} */
  const ready = new Map();
  return {
    name: 'wardogs:game-media',
    hooks: {
      // (before Astro reads any .env file: the token comes from the real environment)
      'astro:config:setup': async ({ command, updateConfig, logger }) => {
        // The inline check's hash, from the very file the page renders, into the CSP's script-src (the two never drift
        // apart).
        const seen = await readFile(SEEN_CHECK, 'utf8');
        updateConfig({
          security: {
            csp: {
              scriptDirective: { hashes: ['sha256-' + createHash('sha256').update(seen).digest('base64')] },
            },
          },
        });

        /** @type {Record<Group, Entry[]>} */
        const lists = JSON.parse(await readFile(MANIFEST, 'utf8'));
        const listed = new Set(lists.intro.map((e) => e.name));
        if (!Object.values(INTRO).every((name) => listed.has(name)))
          throw new Error('game media: game-media.json lacks one of the intro film files.');

        if (command === 'build' || command === 'dev') {
          // (the store is read by a build only: a dev server takes a group from its local folder, or goes without)
          const tokens = /** @type {string[]} */ (
            command === 'build'
              ? [process.env.VERCEL_OIDC_TOKEN, process.env.BLOB_READ_WRITE_TOKEN].filter((t) => !!t)
              : []
          );
          /** @type {Group[]} */
          const untokened = [];
          for (const group of GROUP_IDS) {
            const { prefix, env } = GROUPS[group];
            const dir = process.env[env];
            /** @type {Result[]} */
            let results;
            if (dir) {
              results = await Promise.all(lists[group].map((entry) => fromFolder(entry, dir)));
              const failed = results.filter((r) => !r.body);
              if (failed.length) throw new Error(`${group} media: ${env} is set but ${report(failed)}.`);
            } else if (tokens.length) {
              results = await inTurn(lists[group], (entry) =>
                download(entry, STORE + prefix + entry.name, tokens),
              );
              const failed = results.filter((r) => !r.body);
              if (failed.length === results.length && !failed.some((r) => r.wrong)) {
                logger.warn(
                  `No ${group} media could be fetched from the private Blob store (${report(failed)}). ` +
                    `The site is built without them.`,
                );
                continue;
              }
              if (failed.length) throw new Error(`${group} media: the build stops here (${report(failed)}).`);
            } else {
              untokened.push(group);
              continue;
            }
            ready.set(group, new Map(results.map((r) => [r.entry.name, /** @type {Buffer} */ (r.body)])));
            const mb = results.reduce((s, r) => s + r.entry.bytes, 0) / 1e6;
            logger.info(
              `${group} media ready (${results.length} files, ${mb.toFixed(1)} MB, ` +
                `from ${dir ? env : 'the Blob store'}).`,
            );
          }
          if (command === 'build' && untokened.length)
            logger.warn(
              'No Blob token in the environment (BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN): the site is built ' +
                `without the ${untokened.join(' and ')} media. Local test: set ` +
                `${untokened.map((g) => GROUPS[g].env).join(' or ')}.`,
            );
        }

        // The pages read the result from a virtual module: where each group is on the site, or null.
        /** @param {Group} group */
        const base = (group) => (ready.has(group) ? '/media/' + GROUPS[group].prefix : null);
        const intro = base('intro');
        const introMedia =
          intro && Object.fromEntries(Object.entries(INTRO).map(([k, name]) => [k, intro + name]));
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'wardogs:game-media',
                /** @param {string} id */
                resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
                /** @param {string} id */
                load: (id) =>
                  id === RESOLVED_ID
                    ? `export const introMedia = ${JSON.stringify(introMedia)};\n` +
                      `export const consoleMedia = ${JSON.stringify(base('console'))};\n`
                    : undefined,
              },
            ],
          },
        });
      },
      'astro:config:done': ({ injectTypes }) => {
        injectTypes({
          filename: 'game-media.d.ts',
          content:
            `declare module '${VIRTUAL_ID}' {\n` +
            "  /** The intro media's site paths, or null when the site was built without them. */\n" +
            '  export const introMedia: { clip: string; op: string; lb: string; l2: string } | null;\n' +
            '  /** Where the console media are on the site (their names: game-media.json), or null without them. */\n' +
            '  export const consoleMedia: string | null;\n' +
            '}\n',
        });
      },
      // `astro dev`: the groups taken from their local folders, served under the same addresses as the build's, and
      // only the files the list names
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const path = (req.url ?? '').split('?')[0];
          for (const [group, files] of ready) {
            const base = '/media/' + GROUPS[group].prefix;
            const body = path.startsWith(base) ? files.get(path.slice(base.length)) : undefined;
            if (!body) continue;
            res.setHeader('Content-Type', TYPES[extname(path)] ?? 'application/octet-stream');
            res.setHeader('Content-Length', body.length);
            res.end(body);
            return;
          }
          next();
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        for (const [group, files] of ready) {
          const out = new URL('media/' + GROUPS[group].prefix, dir);
          for (const [name, body] of files) {
            const file = new URL(name, out);
            await mkdir(new URL('.', file), { recursive: true });
            await writeFile(file, body);
          }
          logger.info(`${group} media written to media/${GROUPS[group].prefix}.`);
        }
        ready.clear();
      },
    },
  };
}
