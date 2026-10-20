# Seasonal looks

This guide is for people who work on the course website. Course authors and learners don't need it.

A season changes how the website looks for a holiday or event. It doesn't change the course.
Chapter text, code samples, chapter slugs, era IDs, and saved learner progress stay the same in every season.

The **classic** season is the permanent default. Every other season is an optional pack that sits beside it.

## How it works

```text
webpage/seasons/
├── seasons.js        The switch: which season is active, and when
├── classic/          The default look
└── halloween/        One seasonal pack
```

1. `seasons.js` runs first in the page head. It picks a season and loads that pack's stylesheet and favicon before the page draws.
2. `app.js` loads the pack's `season.js` for palettes, art, and decorative copy. Then it renders the chapter.
3. If a pack fails to load, the site falls back to classic.

The page records the choice on `<html data-season="...">`. Packs with named scenes also set `data-scene`.

## Turn a season on or off

Edit `seasonConfig` at the top of `seasons.js`:

```js
const seasonConfig = {
  active: "auto",
  fallback: "classic",
  packs: ["classic", "halloween"],
  calendar: [
    { season: "halloween", from: "10-01", to: "11-02" }
  ]
};
```

| Setting | What it does |
| --- | --- |
| `active: "auto"` | Follows the `calendar`. Outside every window, the site uses `fallback`. |
| `active: "halloween"` | Pins one season, whatever the date. |
| `active: "classic"` | Turns every season off. |
| `calendar` | Inclusive `MM-DD` windows in the visitor's local time. A window can cross the new year, such as `12-15` to `01-05`. |

With `auto`, Halloween starts on October 1 and ends after November 2 with no deploy needed.

To roll back a season early, set `active: "classic"` and publish. Nothing else needs to change.

## Preview a season

Add `?season=<id>` before the `#` in any page URL:

```text
http://127.0.0.1:4173/?season=halloween#/overview
http://127.0.0.1:4173/?season=classic#/04-cloud
```

The preview works for any ID in `packs`, whatever the calendar says. An unknown ID is ignored.
The preview lasts only for that URL. Remove the parameter to see the scheduled season again.

## What a pack contains

| File | Responsibility |
| --- | --- |
| `season.js` | Era palettes, fonts, header art names, hero art, and decorative copy such as the tagline and footer |
| `season.css` | The complete stylesheet for the season |
| `assets/` | Chapter header art and `favicon.svg` |
| `art.mjs` | Optional generator for the pack's SVG art |
| `illustration-art.mjs` | Optional generator for seasonal lesson illustrations |
| `illustrations/` | Optional seasonal lesson illustrations in light and dark versions |

## Change a season

Edit only that season's folder. The other seasons aren't affected.

| To change | Edit |
| --- | --- |
| Colors, fonts, or the light and dark palettes | `eras` in `season.js` |
| Tagline, sidebar text, footer, or section labels | `copy` in `season.js` |
| The start page art and caption | `hero` in `season.js` |
| Layout, borders, shapes, and decoration | `season.css` |
| Chapter header art | `art.mjs`, or replace files in `assets/` |
| Lesson illustrations | `illustration-art.mjs` |
| An illustration's title or text description | `illustrationText` in `season.js` |

Then follow these steps:

1. If you changed generated art or palettes, run `npm run illustrations` from the repository root.
2. Run `npm run preview` and open the page with `?season=<id>`.
3. Run `npm test` and `npx playwright test`.

Each `season.css` is a complete stylesheet. A layout fix that applies to every season must go into each `season.css`.

## Add a season

1. Copy an existing folder, such as `halloween/`, to a new folder named for the season, such as `winter/`.
2. In the new `season.js`, set `id` to the folder name.
3. Keep every era ID from classic. Routes and saved progress depend on them, and the tests reject a pack with a missing era.
4. Add the ID to `packs` in `seasons.js`. Add a `calendar` window if the season should start on its own.
5. Replace the palettes, art, copy, and styles. Run `npm run illustrations` if the pack has `art.mjs`.
6. Add the new ID to the season list in `tests/site/eras.spec.js`. The site tests then check every chapter in that season for contrast, art, and narrow layouts.
7. Preview with `?season=<id>` and run the checks.

Packs with `illustrations: true` must ship light and dark versions of every lesson illustration in `illustrations/`.
Without that flag, the pack uses the classic illustrations.
Repository READMEs always show the classic illustrations from `docs/illustrations/`.

## Design rules for every season

- Every stop on the journey should look different from the others.
- Keep the tone friendly. Avoid jump scares, flashing, gore, and decoration behind lesson text.
- Keep body text and code in readable fonts. Save expressive lettering for headings and art.
- Meet the contrast checks in both light and dark modes.

## Halloween

The pack is an illustrated **Halloween field guide**, not a costume over the classic eras.
Original ink-cut-style scenes use a shared arched frame, fine engraving lines, botanical silhouettes,
and small, friendly characters. The interface stays quiet: tinted navigation, restrained controls,
generous reading space, and no texture behind lesson text. Each scene has its own palette and header
material in both light and dark modes.

| Page | Setting | Visual language |
| --- | --- | --- |
| Start | Pumpkin patch | Forest green and burnt orange, a winding moonlit trail, carved pumpkins, and woodland foliage |
| Meet the app and tools | Haunted library | Moss-green shelves, warm brass, bookish type, double rules, and a lantern-lit reading room |
| Setup | Trick-or-treat porch | Mulberry and dusty rose, rounded panels, hanging porch lights, and printed setup tickets |
| Assess the app | Ghost detective bureau | Petrol blue, square case-file frames, typewriter headings, and a lamplit investigation desk |
| Choose the plan | Witch's spellbook | Aubergine and muted lilac, fine inset cover rules, celestial geometry, and open spellbook pages |
| Upgrade and check | Monster laboratory | Botanical green, precise instrument-like panels, etched glassware, and a friendly monster |
| Plan for Azure | Moonlit sky | Twilight blue, spacious open headers, a large crescent, distant hills, and fine star shapes |

References use the moonlit sky. The legacy quickstart is a pumpkin shed, and the instructor companion is a raven's lookout.
The previous sample run is a ghost story scrapbook. The completed reference is an enchanted conservatory.

`art.mjs` owns the header compositions and the shared pumpkin, ghost, and botanical motifs.
`illustration-art.mjs` uses the same palettes and characters for the technical diagrams. Keep its labels,
arrows, and access boundaries intact when restyling it. Regenerate and commit both light and dark SVGs
after changing either source. No image service, remote font, or extra runtime dependency is required.
