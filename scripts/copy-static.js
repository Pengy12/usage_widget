// tsc only emits compiled JS; this copies the renderer's non-TypeScript
// assets (HTML, CSS) into dist/renderer alongside it.
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'src', 'renderer');
const DEST = path.join(__dirname, '..', 'dist', 'renderer');

fs.mkdirSync(DEST, { recursive: true });

for (const entry of fs.readdirSync(SRC)) {
  if (entry.endsWith('.ts')) continue;
  fs.copyFileSync(path.join(SRC, entry), path.join(DEST, entry));
}
