import { illustrations, illustrationPath } from "../../scripts/illustrations.js";
import { renderIllustration, renderSoundcheckHeader } from "../../tools/illustration-art.mjs";
import classic from "./season.js";

// Classic owns the default lesson illustrations in docs/ and its generated soundcheck header.
export function renderSeasonArt() {
  const outputs = illustrations.flatMap(item => ["light", "dark"].map(mode => [illustrationPath(item.id, mode), renderIllustration(item.id, mode)]));
  const soundcheck = classic.eras.soundcheck;
  for (const [mode, file] of [["light", soundcheck.art], ["dark", soundcheck.artDark]]) {
    outputs.push([`webpage/seasons/classic/assets/${file}`, renderSoundcheckHeader(mode)]);
  }
  return outputs;
}
