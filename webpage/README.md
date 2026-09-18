<a id="workshop-website"></a>
# Course website

The reader uses the course READMEs as its source. Edit those files instead of generated HTML.

## Build and preview

Use Node 24 or later, npm, and Python 3.9 or later. CI uses Node 24. Keep a compatible installed runtime.

From the repository root, check the tools:

```powershell
node --version
npm --version
py -3 --version
```

```bash
node --version
npm --version
python3 --version
```

Install missing tools from [Node.js](https://nodejs.org/) or [Python](https://www.python.org/downloads/).
On Windows, include the Python launcher (`py`) when installing Python.
A Windows Store alias alone is not a working Python installation.

Restore dependencies for a clean clone, then build:

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
On Windows, it briefly retries a busy output-directory rename and reports each retry.
If the error persists, close the preview and retry the build. A persistent error still fails the build.

The artifact includes local fonts, scripts, illustrations, and reference downloads. The reader does not need a CDN.

Both the build and `npm run test:language` use `tools/python.mjs`.
On Windows, it checks `py -3`, then `python`, then `python3`.
Other platforms check `python3`, then `python`.
It selects a working Python 3.9+ interpreter before running the script.
A script error stops the command. The launcher does not retry the script with another interpreter.

## Source ownership

| File | Responsibility |
| --- | --- |
| `scripts/chapters.js` | Chapter order, stable identifiers, and reference routes |
| `scripts/reader.js` | Markdown, links, themed illustrations, and code copy |
| `scripts/illustrations.js` | Illustration locations, captions, and text descriptions |
| `scripts/state.js` | Exercise revisions, completion history, and old reading marks |
| `scripts/ui.js` | Navigation, outline, drawers, and theme |
| `styles.css` | Color, typography, and responsive layout |
| `assets/` | Original illustrations |
| `tools/build.mjs` | Curated content and local dependency assets |
| `tools/public-content.mjs` | Public source allowlist for tracked and new files |
| `tools/illustration-art.mjs` | Original vector compositions using the page palettes |
| `tools/render-illustrations.mjs` | Reproducible light and dark SVG images |
| `../docs/illustrations/` | Generated image files used by the READMEs and website |

New reference documents belong in `scripts/chapters.js`. The build uses this shared list.
The learner record, optional deployment, instructor guide, and selected-record helper are reference routes.
Instructor preparation is not a required chapter.

The download contains sample source, helper source, both application test projects, and their supporting scripts.
The build combines tracked files with explicitly allowed new public files. It does not require staging or a commit.
New helper `.cs` and `.csproj` files and declared reference documents are allowed before a commit.
Add other public files to the allowlist deliberately. Do not broaden it to all untracked files.
Local snapshots, databases, credentials, build outputs, and `.bookcatalog-lab` are excluded.

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
| Plan for Azure | 2020s | Sculptural shapes and quieter controls |

`scripts/chapters.js` selects the era. `scripts/eras.js` supplies its palettes and typography.

The reader sets `data-era` before it loads chapter content. `data-theme` retains the selected color mode.

References use a quiet 2020s treatment. They look the same on direct access and after chapter navigation.

## Course illustrations

The course uses original illustrations instead of Mermaid diagrams. Each composition uses its chapter's palette and visual style.

The READMEs embed ordinary SVG images with descriptive alternative text. They work without website scripts.
The website switches between light and dark image files when the reader changes the theme.
Each image has a full-size link and an expandable text explanation. These remain useful on small screens.

Edit the artwork in `tools/illustration-art.mjs`. Edit captions and descriptions in `scripts/illustrations.js`.
Edit the shared colors in `scripts/eras.js`. Do not edit the generated SVG files by hand.

After changing artwork or palettes, regenerate the images from the repository root:

```powershell
npm run illustrations
npm run build
```

The build checks that the saved images match their source. It stops with regeneration instructions if an image is missing or outdated.
Include both variants from `docs/illustrations/` when committing an artwork change.
README wording changes need only a normal site build.

Only the declared image files enter the public content allowlist. Arbitrary files in `docs/illustrations/` are not published.
The image generator does not need a browser or an image service. The browser tests still use Playwright.

Keep technical labels, relationships, optional steps, and access boundaries accurate when changing a composition.
Original era-inspired shapes do not require historical photographs or third-party logos.

Keep code legible in every era. Do not add simulated CRT effects, flashing elements, or patterns behind paragraphs.

## Progress and privacy

The reader stores progress in this browser. It does not send progress to a server.

Completion means the learner marked a chapter after its checks. It does not mean the website tested the application.

There are five core chapters. The overview does not count.
Chapter 04 completion means an Azure assessment and migration plan. Paid deployment remains an optional reference.

Storage schema 3 uses the existing `dotnet-modernization-workshop:v2:<site-root-path>` key for continuity.
Each completion records the chapter's `exerciseRevision` from `scripts/chapters.js`.
Increase that revision when required evidence changes, not for a wording-only edit.
Marks with unchanged revisions still count. Earlier revisions remain in `previousCompleted` as history.
Schema 2 marks become revision 1 history because the revised course adds artifact and data checks.
The older `dotnet-modernization-course-progress` key contains reading marks only. The reader does not change that key.

Migration keeps the theme and a valid last chapter. Reference pages do not replace the resume destination.
Reset removes this course's progress and history, but keeps the theme and unrelated browser data.

## Checks and publication

Run the commands in [the validation guide](../docs/validation.md).

The Pages workflow builds this artifact on its existing triggers. Pull request checks do not publish the site.
The deployment job runs only on `main`, including manual runs. Feature-branch validation cannot deploy.

Keep chapter slugs and public anchors stable. Add an alias before changing a published section identifier.
