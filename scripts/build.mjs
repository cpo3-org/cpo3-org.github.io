import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { versions } from '../docs.config.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const staging = '.version-build';
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging);

for (const version of versions) {
  console.log(`\nBuilding ${version.label} at ${version.base}/`);
  const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', DOCS_VERSION: version.id,
      DOCS_OUT_DIR: `${staging}/${version.id}` },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

// Only replace the preview/deployment output after every version builds successfully.
rmSync('dist', { recursive: true, force: true });
for (const version of versions) {
  cpSync(`${staging}/${version.id}`, version.id === 'latest' ? 'dist' : `dist/${version.id}`, {
    recursive: true,
  });
}
rmSync(staging, { recursive: true });
console.log('\nAll documentation versions are in dist/.');
