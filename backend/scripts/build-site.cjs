const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const source = path.resolve(root, 'frontend');
const output = path.resolve(root, 'dist');
const rootPrefix = `${root}${path.sep}`;

for (const target of [source, output]) {
  if (!target.startsWith(rootPrefix)) {
    throw new Error(`Refusing to access a path outside the project: ${target}`);
  }
}

if (!fs.existsSync(path.join(source, 'index.html'))) {
  throw new Error('Missing frontend/index.html');
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });
console.log('Built static site: frontend/ -> dist/');
