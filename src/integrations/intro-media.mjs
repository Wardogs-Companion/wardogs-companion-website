// The intro's game media (the WARDOGS reveal trailer's opening clip and three pictures, © BULKHEAD / Team17) are never in
// this repository. They live in a private Vercel Blob store; this integration fetches them while the site is built and
// writes them into the build output, under /media/intro/. The home page includes the intro only when they are there.
//
// - Token: read from the build's own environment, never from a file. On Vercel, VERCEL_OIDC_TOKEN (short-lived,
//   preferred) or BLOB_READ_WRITE_TOKEN, both given to the project by the connected store. Never printed.
// - No token (GitHub CI, a fork, a local build): one warning, and the site is built without the intro.
// - Every file missing from the store: one warning, and the site is built without the intro (that is how the media are
//   taken down: see docs/ARCHITECTURE.md). Some files only: the build fails, rather than go live half broken.
// - Local test only: INTRO_MEDIA_DIR=<a folder holding the four files> copies them from there instead (then a missing
//   file fails the build). The folder stays outside the repository.
//
// Plain JavaScript, like astro.config.mjs: it runs in Node at build time, and the project carries no Node type
// definitions (types in JSDoc comments only).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// The private store (its address is not a secret: without a token it answers 403).
const STORE = 'https://ctfqc1l6chxiqqbo.private.blob.vercel-storage.com/intro/';
// Where the site serves them (public/ never holds them).
const SITE_DIR = 'media/intro/';
/** @typedef {'clip' | 'op' | 'lb' | 'l2'} Key */
const FILES = {
  clip: { name: 'opening-clip.mp4', type: 'video/mp4' },
  op: { name: 'opening-last-4k.jpg', type: 'image/jpeg' },
  lb: { name: 'littlebird-1.jpg', type: 'image/jpeg' },
  l2: { name: 'littlebird-2.jpg', type: 'image/jpeg' },
};
const KEYS = /** @type {Key[]} */ (Object.keys(FILES));

const VIRTUAL_ID = 'virtual:wardogs/intro-media';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * A file is what it claims: not empty, the expected type, the length announced, and the format's own signature.
 * @param {Key} key
 * @param {Buffer} body
 * @param {string | null} type
 * @param {string | null} length
 * @returns {string | null} the problem, or null
 */
function check(key, body, type, length) {
  const want = FILES[key].type;
  if (!body.length) return 'empty';
  if (type !== null && !type.startsWith(want)) return `type ${type}, expected ${want}`;
  if (length !== null && Number(length) !== body.length) return `${body.length} of ${length} bytes`;
  const jpeg = body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  const mp4 = body.toString('latin1', 4, 8) === 'ftyp';
  if (want === 'image/jpeg' ? !jpeg : !mp4)
    return 'not a ' + (want === 'image/jpeg' ? 'JPEG' : 'MP4') + ' file';
  return null;
}

/** @typedef {{ key: Key, body?: Buffer, problem?: string, missing?: boolean }} Result */

/**
 * @param {Key} key
 * @param {string[]} tokens
 * @returns {Promise<Result>}
 */
async function download(key, tokens) {
  const url = STORE + FILES[key].name;
  let problem = '';
  for (const token of tokens) {
    // (each token gets two tries: a short network hiccup does not cost the intro)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(60_000),
        });
        if (res.status === 404) return { key, missing: true, problem: 'not in the store (404)' };
        if (res.status === 401 || res.status === 403) {
          problem = `refused (${res.status})`;
          break; // (the next token, if any)
        }
        if (!res.ok) {
          problem = `HTTP ${res.status}`;
          continue;
        }
        const body = Buffer.from(await res.arrayBuffer());
        const bad = check(key, body, res.headers.get('content-type'), res.headers.get('content-length'));
        if (!bad) return { key, body };
        problem = bad;
      } catch (err) {
        // (never the error's own message: it can quote the request's headers, the token with them)
        problem = err instanceof Error && err.name === 'TimeoutError' ? 'timed out' : 'network error';
      }
    }
  }
  return { key, problem };
}

/**
 * @param {string} dir
 * @returns {Promise<Result[]>}
 */
async function fromFolder(dir) {
  return Promise.all(
    KEYS.map(async (key) => {
      try {
        const body = await readFile(join(dir, FILES[key].name));
        const bad = check(key, body, null, null);
        return bad ? { key, problem: bad } : { key, body };
      } catch {
        return { key, missing: true, problem: 'not found' };
      }
    }),
  );
}

/** @returns {import('astro').AstroIntegration} */
export default function introMedia() {
  /** The four files, once fetched (null: the site is built without the intro). @type {Map<Key, Buffer> | null} */
  let media = null;
  return {
    name: 'wardogs:intro-media',
    hooks: {
      // (only for a build, and before Astro reads any .env file: the token comes from the real environment)
      'astro:config:setup': async ({ command, updateConfig, logger }) => {
        if (command === 'build') {
          const dir = process.env.INTRO_MEDIA_DIR;
          const tokens = /** @type {string[]} */ (
            [process.env.VERCEL_OIDC_TOKEN, process.env.BLOB_READ_WRITE_TOKEN].filter((t) => !!t)
          );
          /** @type {Result[] | null} */
          let results = null;
          if (dir) {
            results = await fromFolder(dir);
            const bad = results.filter((r) => !r.body);
            if (bad.length)
              throw new Error(
                `intro media: INTRO_MEDIA_DIR is set but ${bad.map((r) => `${FILES[r.key].name} (${r.problem})`).join(', ')}`,
              );
          } else if (tokens.length) {
            results = await Promise.all(KEYS.map((key) => download(key, tokens)));
            const got = results.filter((r) => r.body).length;
            const report = results
              .filter((r) => !r.body)
              .map((r) => `${FILES[r.key].name}: ${r.problem}`)
              .join('; ');
            if (got === 0) {
              logger.warn(
                `No intro media could be fetched from the private Blob store (${report}). ` +
                  'The home page is built without the intro.',
              );
              results = null;
            } else if (got < results.length) {
              throw new Error(`intro media: partial download, the build stops here (${report}).`);
            }
          } else {
            logger.warn(
              'No Blob token in the environment (BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN): ' +
                'the home page is built without the intro. Local test: set INTRO_MEDIA_DIR.',
            );
          }
          if (results) {
            media = new Map(results.map((r) => [r.key, /** @type {Buffer} */ (r.body)]));
            const mb = [...media.values()].reduce((s, b) => s + b.length, 0) / 1e6;
            logger.info(
              `Intro media ready (${media.size} files, ${mb.toFixed(1)} MB, from ${dir ? 'INTRO_MEDIA_DIR' : 'the Blob store'}).`,
            );
          }
        }
        // The pages read the result from a virtual module: the media's site paths, or null.
        const paths = media ? Object.fromEntries(KEYS.map((k) => [k, '/' + SITE_DIR + FILES[k].name])) : null;
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'wardogs:intro-media',
                /** @param {string} id */
                resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
                /** @param {string} id */
                load: (id) =>
                  id === RESOLVED_ID ? `export const introMedia = ${JSON.stringify(paths)};` : undefined,
              },
            ],
          },
        });
      },
      'astro:config:done': ({ injectTypes }) => {
        injectTypes({
          filename: 'intro-media.d.ts',
          content:
            `declare module '${VIRTUAL_ID}' {\n` +
            "  /** The intro media's site paths, or null when the site was built without them. */\n" +
            '  export const introMedia: { clip: string; op: string; lb: string; l2: string } | null;\n' +
            '}\n',
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!media) return;
        const out = new URL(SITE_DIR, dir);
        await mkdir(out, { recursive: true });
        for (const [key, body] of media) await writeFile(new URL(FILES[key].name, out), body);
        logger.info(`Intro media written to ${SITE_DIR}.`);
        media = null;
      },
    },
  };
}
