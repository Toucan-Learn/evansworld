import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const { tracks } = JSON.parse(readFileSync(new URL('data/music-provenance.json', root), 'utf8'));
if (tracks.length !== 38) throw new Error('Expected the complete 38-track bank.');
for (const track of tracks) {
  let bytes;
  try { bytes = readFileSync(new URL(`public/${track.src}`, root)); }
  catch { throw new Error(`Missing ${track.src}. Prepare the pinned audio bank with scripts/prepare-music.py before building.`); }
  if (createHash('sha256').update(bytes).digest('hex') !== track.sha256)
    throw new Error(`Audio artifact does not match provenance: ${track.src}`);
}
console.log('Verified all 38 generated music artifacts.');
