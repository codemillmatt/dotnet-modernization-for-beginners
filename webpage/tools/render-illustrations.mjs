import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import "../seasons/seasons.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Every season pack may ship an art.mjs that returns [path, svg] pairs to generate.
export async function seasonArtOutputs() {
  const outputs = [];
  for (const id of globalThis.courseSeasons.seasonConfig.packs) {
    const art = await import(`../seasons/${id}/art.mjs`).catch(error => {
      if (error.code === "ERR_MODULE_NOT_FOUND" && error.message.includes(`seasons/${id}/art.mjs`)) return null;
      throw error;
    });
    if (art) outputs.push(...await art.renderSeasonArt());
  }
  return outputs;
}

export async function renderIllustrations({ check = false } = {}) {
  const outputs = await seasonArtOutputs();
  for (const [path, artwork] of outputs) {
    const file = join(root, path);
    const svg = `${artwork.trim().replace(/[ \t]+$/gm, "")}\n`;
    if (check) {
    let existing;
    try {
      existing = await readFile(file, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      throw new Error(`Missing illustration: ${path}. Run npm run illustrations.`);
    }
    if (existing.replace(/\r\n/g, "\n") !== svg.replace(/\r\n/g, "\n")) {
      throw new Error(`Stale illustration: ${path}. Run npm run illustrations.`);
    }
    } else {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, svg);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { check: { type: "boolean", default: false } } });
  await renderIllustrations(values);
  console.log(`${values.check ? "Checked" : "Created"} generated season artwork in light and dark themes.`);
}
