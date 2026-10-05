// Writes one group's list in src/integrations/game-media.json: the name, size and SHA-256 of every file in a folder
// (sub-folders included), never a pixel. Run it when a group's files change, then send the same files to the private
// store under the group's prefix (docs/ARCHITECTURE.md).
//
//   npm run media:manifest -- <intro|console> <folder>
//
// The console's names carry `.game.` (`keys/a-colonne-1.game.webp`): .gitignore keeps any such file out of the
// repository, wherever it is copied.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const MANIFEST = new URL('../src/integrations/game-media.json', import.meta.url);
const [group, dir] = process.argv.slice(2);
if (!dir || (group !== 'intro' && group !== 'console')) {
  console.error('Usage: npm run media:manifest -- <intro|console> <folder>');
  process.exit(1);
}

const names = (await readdir(dir, { recursive: true, withFileTypes: true }))
  .filter((d) => d.isFile())
  .map((d) => relative(dir, join(d.parentPath, d.name)).split(sep).join('/'))
  .sort();
const unmarked = group === 'console' ? names.filter((n) => !/\.game\.\w+$/.test(n)) : [];
if (!names.length || unmarked.length) {
  console.error(names.length ? `Names without .game.: ${unmarked.join(', ')}` : `No file in ${dir}`);
  process.exit(1);
}

const files = [];
for (const name of names) {
  const body = await readFile(join(dir, name));
  files.push({ name, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') });
}
const manifest = JSON.parse(await readFile(MANIFEST, 'utf8').catch(() => '{}'));
manifest[group] = files;
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
const mb = files.reduce((s, f) => s + f.bytes, 0) / 1e6;
console.log(
  `${group}: ${files.length} files, ${mb.toFixed(2)} MB, written to src/integrations/game-media.json`,
);
