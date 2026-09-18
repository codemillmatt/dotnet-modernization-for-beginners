import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { chapters, references } from "../../webpage/scripts/chapters.js";
import { normalizePath, parseRoute, routeForPath } from "../../webpage/scripts/routes.js";
import { createProgressStore } from "../../webpage/scripts/state.js";
import { eras, eraPalette, getEra, diagramTheme, referenceEra } from "../../webpage/scripts/eras.js";

const root = resolve(import.meta.dirname, "../..");
const read = path => readFileSync(join(root, path), "utf8");
const documents = [...chapters, ...references].map(item => item.path);

test("each chapter has the planned era and complete palettes", () => {
  assert.deepEqual(chapters.map(chapter => chapter.era),
    ["1960s", "1970s", "1980s", "1990s", "2000s-2010s", "2020s"]);
  const keys = Object.keys(eraPalette("1960s", "light")).sort();
  for (const [id, era] of Object.entries(eras)) {
    assert.ok(existsSync(join(root, "webpage/assets", era.art)));
    for (const mode of ["light", "dark"]) {
      const palette = eraPalette(id, mode);
      assert.deepEqual(Object.keys(palette).sort(), keys);
      assert.ok(Object.values(palette).every(value => typeof value === "string" && value.length));
      assert.equal(diagramTheme(id, mode).themeVariables.primaryTextColor, palette.ink);
    }
  }
  assert.equal(referenceEra, "2020s");
  assert.throws(() => getEra("unknown"), /Unknown visual era/);
  assert.throws(() => eraPalette("1960s", "unknown"), /Unknown color mode/);
});

test("all declared local links and images resolve", () => {
  const failures = [];
  for (const path of documents) {
    for (const match of read(path).matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1].split("#")[0].split("?")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      if (!existsSync(resolve(root, dirname(path), target))) failures.push(`${path}: ${target}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("manifest preserves chapter identifiers and the optional Azure boundary", () => {
  assert.equal(chapters.filter(chapter => chapter.core).length, 4);
  assert.equal(chapters.find(chapter => chapter.slug === "04-cloud").core, false);
  assert.equal(new Set(documents).size, documents.length);
  for (const item of [...chapters, ...references]) assert.ok(existsSync(join(root, item.path)));
});

test("routes constrain references and preserve sections", () => {
  assert.equal(routeForPath("01-assessment/../README.md", "-prerequisites"), "#/overview?section=-prerequisites");
  assert.equal(parseRoute("#/reference?path=docs%2Fvalidation.md").chapter.path, "docs/validation.md");
  assert.throws(() => parseRoute("#/reference?path=../../secret"), /not in the course/);
  assert.throws(() => normalizePath("../../secret"), /leaves the course/);
  assert.throws(() => parseRoute("#/unknown"), /not in the course/);
});

function memory(entries = []) {
  const values = new Map(entries);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
test("old reading marks do not award new activity completion", () => {
  const storage = memory([["dotnet-modernization-course-progress", '["01-assessment","unknown"]'], ["other-app", "keep"]]);
  const store = createProgressStore(storage, "course");
  assert.deepEqual(store.value.previousReading, ["01-assessment"]);
  assert.deepEqual(store.value.completed, []);
  store.toggle("01-assessment");
  store.visit("01-assessment");
  store.theme("dark");
  const reloaded = createProgressStore(storage, "course");
  assert.deepEqual(reloaded.value.completed, ["01-assessment"]);
  assert.equal(reloaded.value.lastVisited, "01-assessment");
  reloaded.reset();
  assert.deepEqual(reloaded.value.completed, []);
  assert.equal(reloaded.value.theme, "dark");
  assert.equal(storage.values.get("other-app"), "keep");
  assert.equal(storage.values.get("dotnet-modernization-course-progress"), '["01-assessment","unknown"]');
});
test("unavailable storage reports its limit and retains in-session changes", () => {
  const store = createProgressStore({ getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } }, "course");
  store.toggle("01-assessment");
  assert.deepEqual(store.value.completed, ["01-assessment"]);
  assert.match(store.warning, /this visit/);
  assert.throws(() => store.toggle("bad"), /Unknown/);
});
test("malformed progress recovers without deleting other data", () => {
  const storage = memory([["course", "{invalid"], ["other-app", "keep"]]);
  const store = createProgressStore(storage, "course");
  assert.match(store.warning, /could not read/);
  store.toggle("02-planning");
  assert.deepEqual(createProgressStore(storage, "course").value.completed, ["02-planning"]);
  assert.equal(storage.values.get("other-app"), "keep");
  const invalidFields = memory([["course", '{"version":2,"completed":"not-an-array"}']]);
  assert.match(createProgressStore(invalidFields, "course").warning, /could not read/);
});

test("starter stays classic and uses a stable SDK policy", () => {
  const project = read("shared-legacy-app/src/BookCatalog.Web/BookCatalog.Web.csproj");
  assert.match(project, /<TargetFrameworkVersion>v4.8/);
  assert.doesNotMatch(project, /<Project Sdk=/);
  assert.match(read("shared-legacy-app/src/BookCatalog.Web/Web.config"), /AttachDbFilename=/);
  for (const path of ["shared-legacy-app/global.json", "examples/modernized/global.json"]) {
    const { sdk } = JSON.parse(read(path));
    assert.equal(sdk.rollForward, "latestFeature");
    assert.equal(sdk.allowPrerelease, false);
  }
});
test("new lesson prose does not restore the recorded-run guarantees", () => {
  const prose = chapters.map(chapter => read(chapter.path)).join("\n");
  for (const obsolete of ["No Source Control", "Skip source control", "one-developer, few-day", "AdminController.cs",
    ".github/upgrades/scenarios/dotnet-version-upgrade", "watched the agent auto-recover", "no global.json exists"]) {
    assert.ok(!prose.toLowerCase().includes(obsolete.toLowerCase()), obsolete);
  }
  assert.ok(!existsSync(join(root, ".github/upgrades/scenarios/dotnet-version-upgrade/scenario.json")));
});
test("cloud reference keeps initialization and identity permissions separate", () => {
  assert.match(read("examples/azure/main.bicep"), /azureADOnlyAuthentication: true/);
  assert.match(read("examples/azure/main.bicep"), /name: 'InitializeDatabase', value: 'false'/);
  assert.doesNotMatch(read("examples/azure/main.bicep"), /administratorLoginPassword/);
  assert.doesNotMatch(read("examples/azure/lab.mjs"), /db_owner|db_ddladmin/);
  assert.match(read("examples/azure/lab.mjs"), /GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.Books/);
});
test("sample source downloads retain required project source", {
  skip: !existsSync(join(root, "_site")) && "Build the website before checking its artifact."
}, () => {
  assert.ok(existsSync(join(root, "_site/content/shared-legacy-app/src/BookCatalog.Web/Properties/AssemblyInfo.cs")));
  assert.ok(existsSync(join(root, "_site/content/shared-legacy-app/NuGet.Config")));
  const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)]);
  const files = walk(join(root, "_site/content"));
  assert.ok(!files.some(path => /[/\\](bin|obj|packages|history)[/\\]/.test(path)));
});
