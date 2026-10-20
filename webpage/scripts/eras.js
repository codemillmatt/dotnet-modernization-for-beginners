import classic from "../seasons/classic/season.js";

export const referenceEra = "2020s";

// Era IDs are stable across seasons so routes and saved progress never change; the active season owns the look.
let season = classic;
export let eras = classic.eras;

export function useSeason(pack) {
  const missing = Object.keys(classic.eras).filter(id => !Object.hasOwn(pack.eras, id));
  if (missing.length) throw new Error(`Season ${pack.id} is missing eras: ${missing.join(", ")}`);
  season = pack;
  eras = pack.eras;
}

export const activeSeason = () => season;
export const seasonAsset = (file, pack = season) => `seasons/${pack.id}/assets/${file}`;

export function getEra(id, pack = season) {
  if (!Object.hasOwn(pack.eras, id)) throw new Error(`Unknown visual era: ${id}`);
  return pack.eras[id];
}

export function eraPalette(id, mode, pack = season) {
  if (!["light", "dark"].includes(mode)) throw new Error(`Unknown color mode: ${mode}`);
  const era = getEra(id, pack);
  const p = era[mode];
  return {
    paper: p.paper, surface: p.surface, ink: p.ink, muted: p.muted, soft: p.soft, line: p.line,
    teal: p.accent, turquoise: p.a, coral: p.b, gold: p.c,
    "button-bg": p.accent, "button-text": p.accentText, link: p.accent, focus: p.accent,
    selected: p.selected, "selected-text": p.selectedText, shadow: p.ink,
    "heading-font": era.heading, "ui-font": era.interface, "panel-radius": era.radius, "control-radius": era.control
  };
}

export function applyEra(id, mode, root = document.documentElement) {
  const palette = eraPalette(id, mode);
  const era = getEra(id);
  root.dataset.era = id;
  root.dataset.season = season.id;
  if (era.scene) root.dataset.scene = era.scene;
  else delete root.dataset.scene;
  for (const [name, value] of Object.entries(palette)) root.style.setProperty(`--${name}`, value);
  root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute("content", palette.paper);
}
