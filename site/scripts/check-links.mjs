// Verifies every internal link in the built site resolves to a real page or asset.
//
// The course Markdown links with relative `.md` paths so it reads correctly on
// GitHub; `build-content.mjs` rewrites those to site URLs. That rewrite is the
// easiest thing in this pipeline to get silently wrong, so the build fails loudly
// here rather than shipping dead links.

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(siteRoot, 'dist');
const base = (process.env.SITE_BASE ?? '/dotnet-modernization-for-beginners').replace(/\/$/, '');

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    throw new Error(`No build output at ${dir}. Run \`npm run build\` first.`);
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, out);
    else out.push(path);
  }
  return out;
}

const files = await walk(distDir);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

const routes = new Set(
  htmlFiles
    .filter((file) => file.endsWith('index.html'))
    .map((file) => `${base}/${relative(distDir, file).replace(/index\.html$/, '')}`),
);
const assets = new Set(files.map((file) => `${base}/${relative(distDir, file)}`));

const broken = new Set();

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const page = `${base}/${relative(distDir, file).replace(/index\.html$/, '')}`;

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    // Only internal links are ours to guarantee.
    if (!href.startsWith(`${base}/`)) continue;
    const target = href.split('#')[0].split('?')[0];
    if (routes.has(target) || assets.has(target) || routes.has(`${target}/`)) continue;
    broken.add(`${page} -> ${href}`);
  }
}

// A link the rewriter missed still points at a repository path such as
// `docs/VALIDATION.md`, which 404s on the site.
const unrewritten = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const page = `${base}/${relative(distDir, file).replace(/index\.html$/, '')}`;
  for (const match of html.matchAll(/href="([^"]*\.md)"/g)) {
    if (/^(?:[a-z]+:)?\/\//i.test(match[1])) continue;
    unrewritten.add(`${page} -> ${match[1]}`);
  }
}

if (broken.size || unrewritten.size) {
  if (broken.size) {
    console.error(`Broken internal links (${broken.size}):`);
    for (const problem of broken) console.error(`  ${problem}`);
  }
  if (unrewritten.size) {
    console.error(`Links still pointing at repository Markdown (${unrewritten.size}):`);
    for (const problem of unrewritten) console.error(`  ${problem}`);
  }
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} pages: ${routes.size} routes, no broken internal links.`);
