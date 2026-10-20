import { getEra as eraFor } from "../../scripts/eras.js";
import halloween from "./season.js";

const getEra = id => eraFor(id, halloween);

export function halloweenMotifs(p) {
  const pumpkin = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-4-38q-4-20 12-26" fill="none" stroke="${p.a}" stroke-width="9" stroke-linecap="round"/>
    <ellipse rx="55" ry="43" fill="${p.b}" stroke="${p.ink}" stroke-width="3"/>
    <ellipse rx="30" ry="43" fill="none" stroke="${p.ink}" stroke-width="2"/>
    <path d="M-30-8l10-13 8 13M12-8l8-13 10 13" fill="${p.ink}"/>
    <path d="M-21 9q21 26 42 0" fill="${p.c}" stroke="${p.ink}" stroke-width="3" stroke-linejoin="round"/>
  </g>`;
  const ghost = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-42 47V-12a42 42 0 0 1 84 0v59L22 35 0 49-22 35Z" fill="${p.surface}" stroke="${p.accent}" stroke-width="3"/>
    <ellipse cx="-14" cy="-8" rx="4" ry="7" fill="${p.ink}"/><ellipse cx="14" cy="-8" rx="4" ry="7" fill="${p.ink}"/>
    <path d="M-8 11q8 9 16 0" fill="none" stroke="${p.ink}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="-25" cy="7" rx="7" ry="4" fill="${p.b}" opacity=".55"/><ellipse cx="25" cy="7" rx="7" ry="4" fill="${p.b}" opacity=".55"/>
  </g>`;
  const star = (x, y, scale = 1) => `<path transform="translate(${x} ${y}) scale(${scale})" d="M0-14 4-4 14 0 4 4 0 14-4 4-14 0-4-4Z" fill="${p.c}"/>`;
  const moon = (x, y, r = 48) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.c}"/><circle cx="${x + r * .48}" cy="${y - r * .24}" r="${r * .82}" fill="${p.paper}"/>`;
  const bat = (x, y, scale = 1) => `<path transform="translate(${x} ${y}) scale(${scale})" d="M0 0-5-9-9-3Q-29-24-52-14q15 5 11 22 14-11 21 5Q-7 5 0 14 7 5 20 13q7-16 21-5-4-17 11-22Q29-24 9-3L5-9Z" fill="${p.accent}"/>`;
  const book = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M-90-50Q-45-66 0-40q45-26 90-10V65Q45 49 0 76-45 49-90 65Z" fill="${p.surface}" stroke="${p.accent}" stroke-width="5"/>
    <path d="M0-40V76M-70-24l48 6m-48 16 48 6m-48 16 48 6M22-18l48-6M22 4l48-6M22 26l48-6" fill="none" stroke="${p.line}" stroke-width="3"/>
    ${star(48, 42, .6)}
  </g>`;
  return { pumpkin, ghost, star, moon, bat, book };
}

export function renderHalloweenHeader(id, mode) {
  if (!["light", "dark"].includes(mode)) throw new Error(`Unknown illustration theme: ${mode}`);
  const era = getEra(id);
  const p = era[mode];
  const { pumpkin, ghost, star, moon, bat, book } = halloweenMotifs(p);
  const shelf = (y, heights) => `<g stroke="${p.accent}" stroke-width="3">${heights.map((h, i) =>
    `<rect x="${70 + i * 40}" y="${y - h}" width="31" height="${h}" rx="3" fill="${[p.a, p.b, p.c][i % 3]}"/><path d="M${78 + i * 40} ${y - h + 12}h15"/>`).join("")}<path d="M53 ${y}H455" stroke-width="9"/></g>`;
  const scenes = {
    "pumpkin-patch": () => `${moon(382, 86, 52)}${bat(150, 87, .7)}
      <path d="M16 341Q129 230 254 326T504 308V458H16Z" fill="${p.a}"/>
      <path d="M16 409Q170 342 300 405T504 394V480H16Z" fill="${p.accent}"/>
      <path d="M244 450q-47-65 25-114t-8-57" fill="none" stroke="${p.c}" stroke-width="20" stroke-linecap="round"/>
      ${pumpkin(118, 351, 1.25)}${pumpkin(389, 378, 1.5)}${pumpkin(310, 304, .65)}${ghost(263, 192, 1.1)}
      <path d="M58 433q-30-51 5-77m-5 57q40-44 61-6" fill="none" stroke="${p.c}" stroke-width="5"/>`,
    "haunted-library": () => `<path d="M38 443V160a222 222 0 0 1 444 0v283Z" fill="${p.soft}" stroke="${p.accent}" stroke-width="7"/>
      ${shelf(232, [89, 107, 75, 96, 82, 100, 87, 93, 71, 88])}
      ${shelf(392, [111, 89, 104, 84, 98, 103, 79, 106, 88, 94])}
      ${ghost(263, 115, .9)}${book(260, 348, 1.15)}${star(414, 92)}${star(94, 101, .6)}`,
    "trick-or-treat": () => `<path d="M60 182 260 39l200 143" fill="${p.a}" stroke="${p.accent}" stroke-width="6"/>
      <path d="M90 185H430V423H90Z" fill="${p.soft}" stroke="${p.accent}" stroke-width="5"/>
      <path d="M179 421V243a81 81 0 0 1 162 0v178" fill="${p.accent}"/>
      <path d="M65 194q195 65 390 0" fill="none" stroke="${p.ink}" stroke-width="3"/>
      ${[94, 160, 226, 292, 358, 424].map((x, i) => `<circle cx="${x}" cy="${211 + Math.sin(i / 5 * Math.PI) * 31}" r="10" fill="${i % 2 ? p.c : p.b}"/>`).join("")}
      ${ghost(260, 315, .9)}${pumpkin(102, 412, .9)}${pumpkin(417, 416, 1)}
      <path d="M157 441h208m-230 18h254" stroke="${p.accent}" stroke-width="10"/>
      ${star(66, 94)}${star(451, 105)}`,
    "ghost-bureau": () => `<rect x="58" y="65" width="389" height="346" rx="4" transform="rotate(-5 250 240)" fill="${p.c}" stroke="${p.accent}" stroke-width="4"/>
      <rect x="94" y="88" width="329" height="330" rx="3" fill="${p.surface}" stroke="${p.accent}" stroke-width="3"/>
      <path d="M123 121h152m-152 19h94M125 340h246m-246 23h180" stroke="${p.line}" stroke-width="6"/>
      ${ghost(248, 242, 1.4)}
      <circle cx="353" cy="313" r="66" fill="${p.paper}" fill-opacity=".65" stroke="${p.accent}" stroke-width="12"/>
      <path d="m399 363 66 65" stroke="${p.accent}" stroke-width="23" stroke-linecap="round"/>
      ${star(415, 74, .9)}`,
    spellbook: () => `${moon(415, 88, 44)}${star(112, 120)}${star(340, 179, .7)}
      <path d="M166 220 259 35l68 185Z" fill="${p.accent}"/>
      <path d="m208 146 85 9-11 31-91-12Z" fill="${p.b}"/><path d="M124 223q130-64 263 0-129 42-263 0" fill="${p.accent}"/>
      ${book(260, 337, 1.8)}${star(262, 330, 1.8)}${star(70, 265, .6)}${star(453, 333)}`,
    "monster-lab": () => `<path d="M46 408H475M66 424v35m390-35v35" stroke="${p.accent}" stroke-width="12"/>
      <path d="M90 190V105h56v85l58 162q13 40-30 40H63q-40 0-26-40Z" fill="${p.surface}" stroke="${p.accent}" stroke-width="5"/>
      <path d="M64 281h108l25 73q9 28-23 28H63q-27 0-18-28Z" fill="${p.a}"/>
      <circle cx="115" cy="316" r="8" fill="${p.surface}"/><circle cx="145" cy="352" r="12" fill="${p.surface}"/>
      <path d="M273 175h150v187q0 40-75 40t-75-40Z" fill="${p.a}" stroke="${p.accent}" stroke-width="5"/>
      <path d="M269 174v-43l29 14 25-21 25 18 30-17 28 17 22-13v45" fill="${p.accent}"/>
      <path d="M247 256h25m152 0h26" stroke="${p.line}" stroke-width="16"/>
      <circle cx="318" cy="248" r="9" fill="${p.ink}"/><circle cx="380" cy="248" r="9" fill="${p.ink}"/>
      <path d="M320 301q29 30 58 0m-37 11v10m17-10v10" fill="none" stroke="${p.ink}" stroke-width="5"/>
      ${star(238, 91)}${star(153, 64, .6)}
      <circle cx="112" cy="66" r="11" fill="${p.a}"/><circle cx="91" cy="37" r="6" fill="${p.a}"/>`,
    "moonlit-sky": () => `${moon(304, 180, 126)}${bat(137, 160, .9)}${bat(407, 280, .65)}
      ${[[66, 72], [207, 48], [447, 90], [109, 283], [266, 339], [459, 365]].map(([x, y]) => star(x, y, .8)).join("")}
      <path d="M15 433q60-74 117-24 45-72 98-14 60-79 127-16 83-61 148 26v75H15Z" fill="${p.a}"/>
      <path d="M17 460q99-75 176-4 82-76 160-15 73-37 150 0v39H17Z" fill="${p.accent}"/>
      ${ghost(151, 352, .75)}`,
    "pumpkin-shed": () => `<path d="M45 178 258 37l216 141Z" fill="${p.b}" stroke="${p.accent}" stroke-width="5"/>
      <path d="M68 178h385v259H68Z" fill="${p.soft}" stroke="${p.accent}" stroke-width="5"/>
      <path d="M100 181v250m64-250v250m64-250v250m64-250v250m64-250v250m64-250v250" stroke="${p.line}" stroke-width="2"/>
      <path d="M88 323h344" stroke="${p.accent}" stroke-width="10"/>
      ${pumpkin(155, 285, 1)}${pumpkin(346, 387, 1.1)}
      <path d="M337 202v75m-19-75h38m-34 75h29" stroke="${p.accent}" stroke-width="8" stroke-linecap="round"/>
      ${star(259, 126, 1.2)}`,
    "raven-lookout": () => `${moon(344, 142, 97)}
      <path d="M70 422 251 244l64 72 63-38 100 144Z" fill="${p.a}"/>
      <path d="M57 407h357M132 407V144m0 86-69-48m69 97 72-64" stroke="${p.accent}" stroke-width="13" stroke-linecap="round"/>
      <path d="M155 230q-9-80 58-100 44-12 53 26l38 19-39 9q6 57-54 69l-54 52Z" fill="${p.accent}"/>
      <circle cx="244" cy="158" r="5" fill="${p.c}"/>
      <path d="M209 187q-45 8-44 48" fill="none" stroke="${p.a}" stroke-width="4"/>
      ${star(64, 85)}${star(437, 67, .6)}${star(429, 244, .8)}`,
    "ghost-scrapbook": () => `<rect x="58" y="67" width="398" height="362" rx="3" fill="${p.b}" transform="rotate(5 260 240)"/>
      <rect x="55" y="59" width="390" height="362" rx="3" fill="${p.soft}" stroke="${p.accent}" stroke-width="4"/>
      <path d="M87 59v362" stroke="${p.accent}" stroke-width="5" stroke-dasharray="4 18"/>
      <rect x="126" y="114" width="255" height="242" fill="${p.surface}" stroke="${p.line}" stroke-width="3" transform="rotate(-7 250 240)"/>
      ${ghost(254, 226, 1.3)}<path d="M156 329h177" stroke="${p.line}" stroke-width="4"/>
      <path d="m109 103 84-16m117 269 82-15" stroke="${p.c}" stroke-width="25" opacity=".8"/>
      ${pumpkin(403, 389, .7)}${star(403, 97, .7)}`,
    "enchanted-garden": () => `<path d="M62 428V231a198 198 0 0 1 396 0v197Z" fill="${p.soft}" stroke="${p.accent}" stroke-width="6"/>
      <path d="M260 33v395M62 231h396M118 92q48 132 0 336M402 92q-48 132 0 336" fill="none" stroke="${p.line}" stroke-width="3"/>
      <path d="M91 428q-30-147 77-195m-16 195q34-109-28-145M419 428q15-146-91-204" fill="none" stroke="${p.a}" stroke-width="11"/>
      ${[0, 1, 2, 3].map(i => `<ellipse cx="${101 + i * 12}" cy="${349 - i * 30}" rx="24" ry="10" transform="rotate(-30 ${101 + i * 12} ${349 - i * 30})" fill="${p.a}"/>`).join("")}
      ${book(260, 350, 1.05)}${ghost(261, 196, .9)}${star(164, 170)}${star(354, 157)}${pumpkin(388, 398, .65)}`
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="480" viewBox="0 0 520 480" role="img" aria-labelledby="title" data-scene="${era.scene}" data-theme="${mode}">
    <title id="title">${era.label}</title>
    <rect width="520" height="480" rx="26" fill="${p.paper}"/>
    ${scenes[era.scene]()}
  </svg>`;
}

export async function renderSeasonArt() {
  const { illustrations } = await import("../../scripts/illustrations.js");
  const { renderIllustration } = await import("./illustration-art.mjs");
  const outputs = illustrations.flatMap(item => ["light", "dark"].map(mode =>
    [`webpage/seasons/halloween/illustrations/${item.id}-${mode}.svg`, renderIllustration(item.id, mode)]));
  for (const [id, era] of Object.entries(halloween.eras)) {
    for (const [mode, file] of [["light", era.art], ["dark", era.artDark]]) {
      outputs.push([`webpage/seasons/halloween/assets/${file}`, renderHalloweenHeader(id, mode)]);
    }
  }
  return outputs;
}
