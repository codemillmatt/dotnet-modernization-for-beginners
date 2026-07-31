import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';

const sidebar = JSON.parse(readFileSync(new URL('./src/generated-sidebar.json', import.meta.url), 'utf8'));

const site = process.env.SITE_URL ?? 'https://codemillmatt.github.io';
const base = process.env.SITE_BASE ?? '/dotnet-modernization-for-beginners';

function textContent(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textContent).join('');
}

// Starlight has no built-in Mermaid support. Swap fenced ```mermaid blocks for a
// `div.mermaid` so the client-side initializer can render them, and so a failed
// render degrades to readable diagram source rather than a blank space.
function rehypeMermaid() {
  return (tree) => {
    const walk = (node) => {
      if (!node?.children) return;
      node.children.forEach((child, index) => {
        if (child.type === 'element' && child.tagName === 'pre') {
          const code = child.children?.find((n) => n.type === 'element' && n.tagName === 'code');
          const classes = code?.properties?.className ?? [];
          if (Array.isArray(classes) && classes.includes('language-mermaid')) {
            node.children[index] = {
              type: 'element',
              tagName: 'div',
              properties: { className: ['mermaid'] },
              children: [{ type: 'text', value: textContent(code).trim() }],
            };
            return;
          }
        }
        walk(child);
      });
    };
    walk(tree);
  };
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: '.NET Modernization for Beginners',
      description:
        'Upgrade an ASP.NET MVC 5 and EF6 application to .NET 10 and migrate it to Azure using GitHub Copilot modernization.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/codemillmatt/dotnet-modernization-for-beginners',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/codemillmatt/dotnet-modernization-for-beginners/edit/main/',
      },
      sidebar,
      customCss: ['./src/styles/course.css'],
      components: {
        Head: './src/components/Head.astro',
      },
      favicon: '/favicon.svg',
      lastUpdated: true,
      pagination: true,
      credits: false,
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeMermaid],
  },
});
