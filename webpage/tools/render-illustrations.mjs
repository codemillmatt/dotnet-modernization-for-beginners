import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { illustrations, illustrationPath } from "../scripts/illustrations.js";
import { renderIllustration } from "./illustration-art.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export async function renderIllustrations({ check = false } = {}) {
  for (const illustration of illustrations) {
    for (const mode of ["light", "dark"]) {
      const path = illustrationPath(illustration.id, mode);
      const file = join(root, path);
      const svg = `${renderIllustration(illustration.id, mode).trim().replace(/[ \t]+$/gm, "")}\n`;
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
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { check: { type: "boolean", default: false } } });
  await renderIllustrations(values);
  console.log(`${values.check ? "Checked" : "Created"} ${illustrations.length} original illustrations in light and dark themes.`);
}
