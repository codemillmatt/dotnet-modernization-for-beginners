// Generates the Starlight content collection from the course Markdown at the
// repository root. The Markdown files are the source of truth: they stay readable
// on GitHub, keep their existing front matter, and are never edited by this script.
//
// A file is published to the site when its front matter has a `permalink`.
// `title`, `nav_order`, `parent`, and `has_children` drive the sidebar.

import { readFile, writeFile, mkdir, rm, readdir, cp } from 'node:fs/promises';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(siteRoot, '..');
const outDir = join(siteRoot, 'src/content/docs');

const SKIP_DIRS = new Set([
  'node_modules', 'vendor', '_site', 'work', 'site', '.git', '.github', 'dist',
]);

const CALLOUTS = {
  note: 'note',
  tip: 'tip',
  warning: 'caution',
  danger: 'danger',
};

async function findMarkdown(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      await findMarkdown(join(dir, entry.name), acc);
    } else if (entry.name.endsWith('.md')) {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

function parseFrontMatter(raw) {
  if (!raw.startsWith('---\n')) return { data: null, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { data: null, body: raw };
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\n/, '');
  const data = {};
  for (const line of block.split('\n')) {
    const match = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[match[1]] = value;
  }
  return { data, body };
}

// Jekyll attaches a callout to the block *above* the `{: .class }` marker.
// Starlight wants the block wrapped in an aside, so walk backwards to the start
// of that block and fence it.
function convertCallouts(body) {
  const lines = body.split('\n');
  const out = [];
  for (const line of lines) {
    const marker = /^\{:\s*\.([a-z-]+)\s*\}\s*$/.exec(line);
    if (!marker) {
      out.push(line);
      continue;
    }
    const kind = CALLOUTS[marker[1]];
    if (!kind) continue;

    let start = out.length;
    while (start > 0 && out[start - 1].trim() !== '') start -= 1;

    const block = out.splice(start).map((l) => l.replace(/^>\s?/, ''));
    out.push(`:::${kind}`, ...block, ':::');
  }
  return out.join('\n');
}

function toUrl(permalink, base) {
  const clean = permalink === '/' ? '/' : `/${permalink.replace(/^\/|\/$/g, '')}/`;
  return base ? `${base.replace(/\/$/, '')}${clean}` : clean;
}

// `docs/VALIDATION.md` on GitHub has to become `/reference/validation/` on the
// site, so every relative Markdown link is resolved against the permalink map.
function rewriteLinks(body, sourcePath, permalinkByFile, base) {
  return body.replace(/\]\((?!https?:|mailto:|#)([^)\s]+?\.md)(#[^)\s]*)?\)/g, (whole, target, hash = '') => {
    const resolved = relative(repoRoot, resolve(dirname(sourcePath), target));
    const permalink = permalinkByFile.get(resolved);
    if (!permalink) return whole;
    return `](${toUrl(permalink, base)}${hash})`;
  });
}

// Images are authored relative to the file so they render on GitHub. On the site
// they're served from `public/`, so make the path absolute.
function rewriteAssets(body, sourcePath, base) {
  return body.replace(/\]\((?!https?:|\/)([^)\s]+\.(?:png|jpe?g|gif|svg|webp))\)/gi, (whole, target) => {
    const resolved = relative(repoRoot, resolve(dirname(sourcePath), target));
    if (!resolved.startsWith('assets/')) return whole;
    return `](${base}/${resolved})`;
  });
}

// Starlight addresses the root page as the empty slug; every other page is the
// permalink without its surrounding slashes.
function slugFor(permalink) {
  return permalink.replace(/^\/|\/$/g, '');
}

function escapeYaml(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// Must stay in step with the `base` in astro.config.mjs, or generated links and
// image paths will drop the GitHub Pages subpath.
const base = (process.env.SITE_BASE ?? '/dotnet-modernization-for-beginners').replace(/\/$/, '');

const SITE_TITLE = '.NET Modernization for Beginners';
// The hero tagline is the home page's own opening paragraph, so it is written
// once in README.md and lifted from there rather than duplicated here.
const takeLeadParagraph = (body) => {
  const stripped = body.trimStart().replace(/^#\s+.*\n+/, '');
  const [lead, ...rest] = stripped.split(/\n\s*\n/);
  return { lead: lead.replace(/\s*\n\s*/g, ' ').trim(), body: rest.join('\n\n') };
};
const SITE_DESCRIPTION =
  'A hands-on course on assessing, planning, and executing a .NET modernization with GitHub Copilot.';
const REPO_URL = 'https://github.com/codemillmatt/dotnet-modernization-for-beginners';

const files = await findMarkdown(repoRoot);
const pages = [];

for (const file of files) {
  const raw = await readFile(file, 'utf8');
  const { data, body } = parseFrontMatter(raw);
  if (!data?.permalink) continue;
  pages.push({ file, rel: relative(repoRoot, file), data, body });
}

if (pages.length === 0) {
  throw new Error('No pages found. Expected Markdown files with a `permalink` in front matter.');
}

const permalinkByFile = new Map(pages.map((p) => [p.rel, p.data.permalink]));

await rm(outDir, { recursive: true, force: true });

for (const page of pages) {
  const slug = slugFor(page.data.permalink);
  let content = convertCallouts(page.body);
  content = rewriteLinks(content, page.file, permalinkByFile, base);
  content = rewriteAssets(content, page.file, base);

  // Starlight renders the title from front matter, so drop the leading H1 to
  // avoid printing it twice.
  content = content.trimStart().replace(/^#\s+.*\n+/, '');

  const order = page.data.nav_order ? Number(page.data.nav_order) : 999;
  const isHome = slug === '';
  let tagline = '';
  if (isHome) {
    const lead = takeLeadParagraph(content);
    tagline = lead.lead;
    content = lead.body;
  }

  const frontMatter = isHome
    ? [
        '---',
        `title: ${escapeYaml(SITE_TITLE)}`,
        `description: ${escapeYaml(SITE_DESCRIPTION)}`,
        `editUrl: ${escapeYaml(`${REPO_URL}/edit/main/${page.rel}`)}`,
        'template: splash',
        'hero:',
        `  title: ${escapeYaml(SITE_TITLE)}`,
        `  tagline: ${escapeYaml(tagline)}`,
        '  actions:',
        '    - text: Start chapter 00',
        `      link: ${escapeYaml(toUrl('/setup/', base))}`,
        '      icon: right-arrow',
        '    - text: View on GitHub',
        `      link: ${escapeYaml(REPO_URL)}`,
        '      icon: external',
        '      variant: minimal',
        '---',
        '',
      ].join('\n')
    : [
        '---',
        `title: ${escapeYaml(page.data.title ?? slug)}`,
        `editUrl: ${escapeYaml(`${REPO_URL}/edit/main/${page.rel}`)}`,
        'sidebar:',
        `  order: ${order}`,
        '---',
        '',
      ].join('\n');

  const target = join(outDir, `${isHome ? 'index' : slug}.md`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, frontMatter + content, 'utf8');
}

// Group children under their `parent` title, matching the Jekyll nav.
const byTitle = new Map(pages.map((p) => [p.data.title, p]));
const roots = pages.filter((p) => !p.data.parent);
const childrenOf = new Map();
for (const page of pages) {
  if (!page.data.parent) continue;
  if (!childrenOf.has(page.data.parent)) childrenOf.set(page.data.parent, []);
  childrenOf.get(page.data.parent).push(page);
}

const byOrder = (a, b) => Number(a.data.nav_order ?? 999) - Number(b.data.nav_order ?? 999);

// The home page is reachable from the site title, so keep it out of the sidebar.
const sidebar = roots
  .filter((page) => slugFor(page.data.permalink) !== '')
  .sort(byOrder)
  .map((page) => {
  const children = childrenOf.get(page.data.title);
  const link = { label: page.data.title, slug: slugFor(page.data.permalink) };
  if (!children?.length) return link;
  return {
    label: page.data.title,
    items: [
      { label: `${page.data.title} overview`, slug: slugFor(page.data.permalink) },
      ...children.sort(byOrder).map((child) => ({
        label: child.data.title,
        slug: slugFor(child.data.permalink),
      })),
    ],
  };
  });

// Images are authored relative to the Markdown so they render on GitHub. Copy the
// whole tree into `public/` so the rewritten absolute paths resolve on the site.
await rm(join(siteRoot, 'public/assets'), { recursive: true, force: true });
await cp(join(repoRoot, 'assets'), join(siteRoot, 'public/assets'), { recursive: true });

await writeFile(
  join(siteRoot, 'src/generated-sidebar.json'),
  `${JSON.stringify(sidebar, null, 2)}\n`,
  'utf8',
);

const missingTitles = pages.filter((p) => !p.data.title).map((p) => p.rel);
if (missingTitles.length) {
  throw new Error(`Pages missing a front matter title: ${missingTitles.join(', ')}`);
}

const orphanParents = [...childrenOf.keys()].filter((parent) => !byTitle.has(parent));
if (orphanParents.length) {
  throw new Error(`Front matter references unknown parent pages: ${orphanParents.join(', ')}`);
}

console.log(`Prepared ${pages.length} pages and ${sidebar.length} top-level sidebar entries.`);
