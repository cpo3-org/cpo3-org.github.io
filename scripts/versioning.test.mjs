import assert from 'node:assert/strict';
import test from 'node:test';
import { versions, versionDestination } from '../docs.config.mjs';
import versionLinks from '../src/lib/version-links.mjs';

test('switching versions preserves nested pages in every direction', () => {
  for (const from of versions) {
    for (const to of versions) {
      assert.deepEqual(versionDestination(to, `${from.base}/reference/python/`, from), {
        href: `${to.base}/reference/python/`, samePage: true,
      });
    }
  }
});

test('missing pages fall back to Overview; Overview remains at the version root', () => {
  for (const from of versions) {
    for (const to of versions) {
      assert.deepEqual(versionDestination(to, `${from.base}/not-in-this-version/`, from), {
        href: `${to.base}/`, samePage: false,
      });
      assert.deepEqual(versionDestination(to, `${from.base}/`, from), {
        href: `${to.base}/`, samePage: true,
      });
    }
  }
});

test('internal Markdown, HTML, and MDX links follow the build version', () => {
  const tree = { children: [
    { type: 'link', url: '/site/settings/#termination-tolerances' },
    { type: 'definition', url: '/site/reference/' },
    { type: 'html', value: '<a href="/site/installation/">Install</a>' },
    { type: 'mdxJsxFlowElement', attributes: [{ name: 'href', value: '/site/getting-started/' }] },
    { type: 'link', url: 'https://github.com/cpo3-org/cpo3' },
    { type: 'link', url: '#local-anchor' },
    { type: 'code', value: 'href="/site/example/"' },
  ] };
  versionLinks({ base: '/site/0.0.1' })(tree);
  assert.equal(tree.children[0].url, '/site/0.0.1/settings/#termination-tolerances');
  assert.equal(tree.children[1].url, '/site/0.0.1/reference/');
  assert.equal(tree.children[2].value, '<a href="/site/0.0.1/installation/">Install</a>');
  assert.equal(tree.children[3].attributes[0].value, '/site/0.0.1/getting-started/');
  assert.equal(tree.children[4].url, 'https://github.com/cpo3-org/cpo3');
  assert.equal(tree.children[5].url, '#local-anchor');
  assert.equal(tree.children[6].value, 'href="/site/example/"');
});
