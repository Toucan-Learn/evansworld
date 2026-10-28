import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const output = new URL('docs/', root);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'assets', 'games', 'art'])
  cpSync(new URL(`dist/${entry}`, root), new URL(entry, output), { recursive: true });
writeFileSync(new URL('.nojekyll', output), '');
console.log('GitHub Pages output ready in docs/: homepage, games, logo and galaxy.');
