import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkLinks } from './check-links.mjs';

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'cpo3-links-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

test('resolves root, relative, same-site, encoded and version links and HTML anchors', (t) => {
  const root = fixture(t, {
    'index.html': `<a href="/guide/?tab=python#x&amp;y">Guide</a>
      <a href="https://cpo3-org.github.io/guide/#caf%C3%A9">Same site</a>
      <a href="/files/a%20b.pdf#page=2">PDF</a>
      <a href="/404/">Not found page</a>
      <div class="version-select"><select><option value="/v0.0.1/guide/">v0.0.1</option></select></div>
      <select><option value="dark">Dark</option></select>
      <a href="https://example.com/missing#absent">External</a>
      <a href="//example.com/missing">External</a><a href="mailto:test@example.com">Mail</a>
      <!-- <a href="/missing/">Comment</a> -->
      <pre>&lt;a href="/missing/"&gt;</pre>`,
    'guide/index.html': `<h2 id="x&amp;y">Title</h2><a name="café"></a>
      <a href="../#">Home</a><a href="#x&amp;y">Local</a>
      <a href="#:~:text=Title">Text fragment</a><a href="#top">Top</a>
      <img src="../logo.svg"><script src="/app.js"></script><link rel="stylesheet" href="/style.css">`,
    'v0.0.1/guide/index.html': '<a href="../../guide/#x&amp;y">Latest</a>',
    '404.html': '<p>Not found</p>',
    'logo.svg': '<svg/>', 'app.js': '', 'style.css': '', 'files/a b.pdf': '',
  });
  const result = checkLinks(root);
  assert.equal(result.pages, 4);
  assert.equal(result.checked, 13);
  assert.deepEqual(result.errors, []);
});

test('reports missing files, missing anchors, malformed links and absent versions', (t) => {
  const root = fixture(t, {
    'index.html': `<a href="/missing/">Missing</a>
      <a href="#absent">Anchor</a>
      <a href="https://cpo3-org.github.io/guide/#absent">Same site anchor</a>
      <img src="/missing.png">
      <div class="version-select"><select><option value="/dev/guide/">Development</option></select></div>
      <a href="/%ZZ">Invalid path</a>`,
    'guide/index.html': '<h2 id="present">Present</h2>',
  });
  const result = checkLinks(root);
  assert.equal(result.errors.length, 6);
  assert.ok(result.errors.some((error) => error.includes('/dev/guide/ — target does not exist')));
  assert.ok(result.errors.some((error) => error.includes('index.html:2: #absent — anchor')));
  const cli = spawnSync(process.execPath, [fileURLToPath(new URL('./check-links.mjs', import.meta.url)), root], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /anchor #absent does not exist/);
});

test('fails when the build output is missing or empty', (t) => {
  const root = fixture(t, {});
  assert.throws(() => checkLinks(root), /No HTML pages/);
  assert.throws(() => checkLinks(join(root, 'missing')), /ENOENT/);
});
