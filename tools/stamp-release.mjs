// Release preparation only. GitHub Pages serves the generated files directly;
// no build tooling is required on the phone or at runtime.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];
const name = process.argv.slice(3).join(' ');
if (!/^0\.\d+\.\d+[a-z]$/.test(version) || !/^[A-Z][A-Z &-]+$/.test(name)) {
    console.error('Usage: node tools/stamp-release.mjs 0.3.4i "FINAL ENGINE POLISH"');
    process.exit(1);
}
const stamp = version.replace(/\./g, '');
function update(path, transform) {
    const filename = resolve(root, path);
    const previous = readFileSync(filename, 'utf8');
    const next = transform(previous);
    if (next !== previous) writeFileSync(filename, next);
}
update('js/content/build.js', source => source
    .replace(/version: '0\.\d+\.\d+[a-z]'/, `version: '${version}'`)
    .replace(/name: '[^']*'/, `name: '${name}'`));
for (const path of ['index.html', 'js/core/world.js', 'sw.js']) {
    update(path, source => source.replace(/\?v=\d+[a-z]/g, `?v=${stamp}`));
}
update('sw.js', source => source
    .replace(/(const CACHE = CACHE_PREFIX \+ ')[^']*(';)/, `$1${stamp}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}$2`)
    .replace(/(url\.searchParams\.get\('v'\) === ')\d+[a-z](')/, `$1${stamp}$2`));
update('tests/update-reliability.mjs', source => source.replace(/\d+[a-z]/g, (match, offset, text) => text.slice(Math.max(0, offset - 24), offset).endsWith('ovad_clean_engine_v') ? match : stamp));
console.log(`Stamped ${version} · ${name}. Commit the resulting files with the release.`);
