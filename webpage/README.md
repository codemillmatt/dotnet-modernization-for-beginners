# Workshop website

The reader uses the course READMEs as its source. Edit those files instead of generated HTML.

## Build and preview

Use Node 24, npm, and Python 3. From the repository root:

```powershell
npm ci
npm run build
npm run preview
```

```bash
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/`. Stop the preview with Ctrl+C.

The build creates `_site`. It refuses to replace an existing directory without its build marker.

The artifact includes local fonts, scripts, diagrams, and reference downloads. The reader does not need a CDN.

## Source ownership

| File | Responsibility |
| --- | --- |
| `scripts/chapters.js` | Chapter order, stable identifiers, and reference routes |
| `scripts/reader.js` | Markdown, links, diagrams, and code copy |
| `scripts/state.js` | Browser progress and migration of old reading marks |
| `scripts/ui.js` | Navigation, outline, drawers, and theme |
| `styles.css` | Color, typography, and responsive layout |
| `assets/` | Original illustrations |
| `tools/build.mjs` | Curated content and local dependency assets |
| `tools/render-mermaid.mjs` | Light and dark diagram assets |

The default theme uses the selected retro-resort design. A previous saved choice or explicit theme link takes precedence.

## Progress and privacy

The reader stores progress in this browser. It does not send progress to a server.

Completion means the learner marked a chapter after its checks. It does not mean the website tested the application.

Azure is optional. Old reading marks remain separate from completion of the new workshop checks.

## Checks and publication

Run the commands in [the validation guide](../docs/validation.md).

The Pages workflow builds this artifact on its existing triggers. Pull request checks do not publish the site.

Keep chapter slugs and public anchors stable. Add an alias before changing a published section identifier.
