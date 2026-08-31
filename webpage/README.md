# Course Webpage

This folder contains the static GitHub Pages reader. Course content stays in the repository's existing README files and is not duplicated here.

## Local preview

From the repository root, run:

```powershell
py -3 -m http.server 4173
```

Then open <http://localhost:4173/webpage/>.

## JavaScript structure

| File | Responsibility |
|------|----------------|
| `app.js` | Application initialization and event wiring |
| `scripts/config.js` | Chapter manifest and content location |
| `scripts/dom.js` | Shared DOM element references |
| `scripts/state.js` | Persisted prerequisite and learner-exercise completion state |
| `scripts/ui.js` | Navigation, outline, pager, accessible drawers, and theme UI |
| `scripts/reader.js` | Markdown loading, link rewriting, and Mermaid rendering |

The Pages workflow copies this folder into the deployment root and stages the course READMEs and assets under `content/`. No package manager or build framework is required.

Run `py -3 scripts\validate_repo.py` from the repository root to check chapter navigation, local links, images, required assets, and the reader's accessibility hooks. `py -3 scripts\prepare_site.py _site` assembles the same artifact published by GitHub Pages.