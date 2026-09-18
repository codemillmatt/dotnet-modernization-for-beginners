import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chapters, references } from "../../webpage/scripts/chapters.js";
import { illustrations, illustrationPath } from "../../webpage/scripts/illustrations.js";
import { eras } from "../../webpage/scripts/eras.js";
import { renderIllustration } from "../../webpage/tools/illustration-art.mjs";
import { renderIllustrations } from "../../webpage/tools/render-illustrations.mjs";

const root = resolve(import.meta.dirname, "../..");

test("each chapter embeds its own original illustration as a normal README image", async () => {
  assert.equal(illustrations.length, chapters.length);
  assert.equal(new Set(illustrations.map(item => item.id)).size, illustrations.length);
  for (const chapter of chapters) {
    const matching = illustrations.filter(item => item.document === chapter.path);
    assert.equal(matching.length, 1, chapter.path);
    const [illustration] = matching;
    assert.equal(illustration.era, chapter.era);
    assert.ok(illustration.description.length > 100);
    const markdown = await readFile(resolve(root, chapter.path), "utf8");
    const images = [...markdown.matchAll(/!\[([^\]]+)\]\(([^)\s]+)\)/g)];
    const path = resolve(root, illustrationPath(illustration.id, "light"));
    const embedded = images.filter(match => resolve(root, dirname(chapter.path), match[2]) === path);
    assert.equal(embedded.length, 1, chapter.path);
    assert.ok(embedded[0][1].length > 60, "README images need meaningful alternative text.");
  }
  for (const document of [...chapters, ...references]) {
    const markdown = await readFile(resolve(root, document.path), "utf8");
    assert.doesNotMatch(markdown, /^```mermaid\b/m, document.path);
  }
});

test("saved image variants exactly match their artwork and shared palettes", async () => {
  await renderIllustrations({ check: true });
  for (const illustration of illustrations) {
    for (const mode of ["light", "dark"]) {
      const saved = await readFile(resolve(root, illustrationPath(illustration.id, mode)), "utf8");
      assert.doesNotMatch(saved, /[ \t]+$/m, "Generated images must not contain trailing whitespace.");
    }
    const variants = ["light", "dark"].map(mode => {
      const svg = renderIllustration(illustration.id, mode);
      assert.match(svg, /<svg\b/);
      assert.match(svg, /viewBox=/);
      assert.match(svg, /<title\b/);
      assert.match(svg, /<desc\b/);
      assert.ok(svg.includes(eras[illustration.era][mode].ink));
      assert.doesNotMatch(svg, /<(?:script|foreignObject|image)\b|\son\w+=/i);
      assert.doesNotMatch(svg, /(?:href|src)=["']https?:/i);
      assert.ok(svg.length < 150_000, "Keep illustrations lightweight.");
      return svg;
    });
    assert.notEqual(variants[0], variants[1]);
  }
});

test("illustration selection rejects unknown IDs and themes", () => {
  assert.throws(() => illustrationPath("../private", "light"), /Unknown illustration/);
  assert.throws(() => illustrationPath("journey", "sepia"), /Unknown color mode/);
  assert.throws(() => renderIllustration("../private", "light"));
  assert.throws(() => renderIllustration("journey", "sepia"));
});
