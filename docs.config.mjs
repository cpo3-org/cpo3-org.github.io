import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const latestRelease = '0.0.1';
export const releases = ['0.0.1'];
export const versions = [
  { id: 'latest', label: `Latest (${latestRelease})`, base: '/site', source: `versions/${latestRelease}` },
  ...releases.map((id) => ({ id, label: id, base: `/site/${id}`, source: `versions/${id}` })),
  { id: 'dev', label: 'Development', base: '/site/dev', source: 'src/content' },
];

const versionId = process.env.DOCS_VERSION || 'latest';
export const currentVersion = versions.find(({ id }) => id === versionId);
if (!currentVersion) throw new Error(`Unknown documentation version: ${versionId}`);

export function sourcePath(version, path = '') {
  return resolve(version.source, path);
}

export const sidebar = JSON.parse(readFileSync(sourcePath(currentVersion, 'sidebar.json'), 'utf8'));

/** Keep the current page when available; otherwise use the target Overview. */
export function versionDestination(version, pathname, from = currentVersion) {
  const page = pathname.startsWith(`${from.base}/`)
    ? pathname.slice(from.base.length + 1).replace(/\/$/, '') : '';
  const slug = page || 'index';
  const exists = ['md', 'mdx'].some((ext) => existsSync(sourcePath(version, `docs/${slug}.${ext}`)));
  return { href: `${version.base}/${exists && page ? `${page}/` : ''}`, samePage: exists };
}
