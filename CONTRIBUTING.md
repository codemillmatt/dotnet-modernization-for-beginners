---
title: Contributing
nav_order: 30
permalink: /contributing/
---

# Contributing

Keep learner instructions reproducible, evidence-based, accessible, and free of
identities or live cloud values.

Before opening a change:

```powershell
.\scripts\Test-CourseContent.ps1
dotnet build .\checkpoints\03-modernized\BookCatalog.slnx --configuration Release
dotnet test .\checkpoints\04-validated\BookCatalog.Validation.slnx --configuration Release
az bicep build --file .\checkpoints\05-cloud-ready\infra\main.bicep
```

On Windows, also build `shared-legacy-app\BookCatalog.sln`. It ships no tests by design —
the Chapter 03 exercise asks learners to write them, so adding a test project there would
quietly invalidate the exercise. CI enforces this.

## The documentation site

The chapter Markdown at the repository root is the single source of truth. The site in
`site/` is an [Astro Starlight](https://starlight.astro.build) app that generates its pages
from those files at build time, so **never edit anything under `site/src/content/docs/`** —
it is regenerated and gitignored.

```bash
cd site
npm install
npm run dev        # http://localhost:4321/dotnet-modernization-for-beginners/
```

To check what CI will publish:

```bash
npm run build
npm run check-links
npm run preview
```

`site/scripts/build-content.mjs` decides what ships. A Markdown file becomes a page when its
front matter has a `permalink`; `title`, `nav_order`, and `parent` drive the sidebar. The
script also rewrites relative `.md` links to site URLs and converts `{: .note }`-style
callouts into Starlight asides, which is why the same file reads correctly on GitHub and on
the site.

Do not add UI screenshots unless visual state is necessary and durable
instructions cannot express it. If an image is required, use synthetic values,
write meaningful alternative text, and inspect every pixel for identities,
resource names, IDs, URLs, terminal history, and local paths.
