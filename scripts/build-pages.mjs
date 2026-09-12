import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const output = new URL('docs/', root);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'assets', 'music', 'games'])
  cpSync(new URL(`dist/${entry}`, root), new URL(entry, output), { recursive: true });
writeFileSync(new URL('.nojekyll', output), '');
const { tracks } = JSON.parse(readFileSync(new URL('data/music-provenance.json', root), 'utf8'));
for (const track of tracks) {
  const bytes = readFileSync(new URL(track.src, output));
  if (createHash('sha256').update(bytes).digest('hex') !== track.sha256)
    throw new Error(`Published audio differs: ${track.src}`);
}
console.log('GitHub Pages output ready in docs/: homepage, games, logo, galaxy and all 38 tracks.');
