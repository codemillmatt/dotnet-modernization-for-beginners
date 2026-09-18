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

The Start page uses the retro-resort design. The chapter controls the visual era. Your saved light/dark choice remains separate.

## Visual eras

The full interface changes with each chapter. Light/dark mode remains a separate choice.

| Page | Era | Main accents |
| --- | --- | --- |
| Start | 1960s | Resort-poster illustration and geometric sunbursts |
| Get ready | 1970s | Broad curved stripes and warm layered panels |
| Assess the app | 1980s | Large angular shapes and bright geometric frames |
| Choose the plan | 1990s | Beveled controls and desktop-style panels |
| Upgrade and check | 2000s / 2010s | Glossy details and layered web-app surfaces |
| Explore Azure | 2020s | Sculptural shapes and quieter controls |

`scripts/chapters.js` selects the era. `scripts/eras.js` supplies its palettes and typography.

The reader sets `data-era` before it loads chapter content. `data-theme` retains the selected color mode.

References use a quiet 2020s treatment. They look the same on direct access and after chapter navigation.

The diagram tool uses the same palettes. Its asset hashes include the era and color definitions.

Keep code legible in every era. Do not add simulated CRT effects, flashing elements, or patterns behind paragraphs.

## Progress and privacy

The reader stores progress in this browser. It does not send progress to a server.

Completion means the learner marked a chapter after its checks. It does not mean the website tested the application.

Azure is optional. Old reading marks remain separate from completion of the new workshop checks.

## Checks and publication

Run the commands in [the validation guide](../docs/validation.md).

The Pages workflow builds this artifact on its existing triggers. Pull request checks do not publish the site.

Keep chapter slugs and public anchors stable. Add an alias before changing a published section identifier.
