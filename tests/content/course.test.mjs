import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { chapters, references } from "../../webpage/scripts/chapters.js";
import { normalizePath, parseRoute, routeForPath } from "../../webpage/scripts/routes.js";
import { createProgressStore } from "../../webpage/scripts/state.js";
import { eras, eraPalette, getEra, referenceEra } from "../../webpage/scripts/eras.js";
import { illustrations, illustrationPath } from "../../webpage/scripts/illustrations.js";
import { zipEntries } from "./zip-entries.mjs";
import { selectPublicContent } from "../../webpage/tools/public-content.mjs";

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

test("manifest preserves identifiers, five core chapters, and optional deployment", () => {
  assert.equal(chapters.filter(chapter => chapter.core).length, 5);
  assert.equal(chapters.find(chapter => chapter.slug === "overview").core, false);
  assert.equal(chapters.find(chapter => chapter.slug === "04-cloud").core, true);
  assert.ok(chapters.filter(chapter => chapter.core).every(chapter => chapter.exerciseRevision > 1));
  assert.ok(references.some(item => item.path === "04-cloud/deployment.md"));
  assert.ok(references.some(item => item.path === "docs/learner-record.md"));
  assert.ok(references.some(item => item.path === "docs/instructor-guide.md"));
  assert.ok(references.some(item => item.path === "tools/BookCatalog.Data/README.md"));
  assert.equal(new Set(documents).size, documents.length);
  for (const item of [...chapters, ...references]) assert.ok(existsSync(join(root, item.path)));
});

test("routes constrain references and preserve sections", () => {
  assert.equal(routeForPath("01-assessment/../README.md", "-prerequisites"), "#/overview?section=-prerequisites");
  assert.equal(routeForPath("04-cloud/deployment.md", "delete-the-dedicated-lab-group"),
    "#/reference?path=04-cloud%2Fdeployment.md&section=delete-the-dedicated-lab-group");
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
  assert.ok(!files.some(path => /[/\\](bin|obj|packages|history|\.bookcatalog-lab|\.azure-lab)[/\\]/i.test(path)));
  const entries = zipEntries(readFileSync(join(root, "_site/downloads/samples.zip")));
  for (const path of [
    "tools/BookCatalog.Data/README.md", "tools/BookCatalog.Data/BookCatalog.Data.csproj",
    "tests/BookCatalog.Data.Tests/BookCatalog.Data.Tests.csproj",
    "tests/BookCatalog.Tests/BookCatalog.Tests.csproj", "scripts/Test-DataTransfer.ps1",
    "scripts/Test-LegacyApp.ps1", "scripts/Test-ModernizedApp.ps1", "docs/learner-record.md", "docs/instructor-guide.md",
    "04-cloud/deployment.md", ".config/dotnet-tools.json",
    "shared-legacy-app/src/BookCatalog.Web/Properties/AssemblyInfo.cs",
    "examples/modernized/src/BookCatalog.Web/Program.cs", "DOWNLOAD-README.txt"
  ]) assert.ok(entries.get(path)?.length > 0, path);
  assert.ok([...entries.keys()].some(path => /^tools\/BookCatalog.Data\/.*\.cs$/.test(path)));
  assert.ok([...entries.keys()].some(path => /^tests\/BookCatalog.Data.Tests\/.*\.cs$/.test(path)));
  assert.ok(![...entries.keys()].some(path =>
    /(^|\/)(bin|obj|packages|history|\.bookcatalog-lab|\.azure-lab|snapshots|secrets\.json)(\/|$)|\.(mdf|ldf|pfx)$/i.test(path)));
  assert.match(entries.get("README.md").toString("utf8"), /https:\/\/github.com\/.*\/blob\/main\/00-introduction\/README.md/);
  for (const illustration of illustrations) {
    for (const mode of ["light", "dark"]) {
      const path = illustrationPath(illustration.id, mode);
      assert.equal(read(`_site/content/${path}`), read(path));
      assert.ok(entries.get(path)?.length > 0, path);
    }
  }
});

test("public previews include authored helper files without exposing untracked local data", () => {
  const safe = [
    "tools/BookCatalog.Data/Program.cs", "tools/BookCatalog.Data/BookCatalog.Data.csproj",
    "tools/BookCatalog.Data/README.md", "tests/BookCatalog.Data.Tests/TransferTests.cs",
    "scripts/Test-DataTransfer.ps1", "docs/learner-record.md", "docs/instructor-guide.md", "04-cloud/deployment.md",
    "docs/illustrations/journey-light.svg", "docs/illustrations/azure-dark.svg"
  ];
  const privateFiles = [
    "tools/BookCatalog.Data/.bookcatalog-lab/records.json", "tools/BookCatalog.Data/snapshot.json",
    "tools/BookCatalog.Data/private-notes.md", "tools/BookCatalog.Data/bin/Generated.cs",
    "tools/BookCatalog.Data/secrets.json", "shared-legacy-app/App_Data/books.mdf",
    "docs/private-notes.md", "scripts/private-script.ps1", "examples/azure/.env",
    "examples/azure/.azure-lab/state.json", "docs/illustrations/private.svg", "docs/illustrations/private-notes.md"
  ];
  assert.deepEqual(selectPublicContent([], [...safe, ...privateFiles]), [...safe].sort());
  assert.deepEqual(selectPublicContent([
    "examples/azure/secrets.json", "examples/azure/.bookcatalog-lab/records.json",
    "examples/modernized/appsettings.Test.Local.json", "tools/BookCatalog.Data/obj/Generated.cs"
  ], []), []);
});

test("validation covers data transfer without publishing feature branches", () => {
  const validation = read(".github/workflows/course-validation.yml");
  assert.match(validation, /dotnet test tests\/BookCatalog\.Data\.Tests\/BookCatalog\.Data\.Tests\.csproj/);
  assert.match(validation, /windows-legacy:[\s\S]*runs-on: windows-latest[\s\S]*scripts\/Test-DataTransfer\.ps1/);
  assert.match(validation, /scripts\/Test-DataTransfer\.ps1[\s\S]*scripts\/Test-ModernizedApp\.ps1/);
  assert.doesNotMatch(validation, /actions\/deploy-pages|pages: write/);
  const pages = read(".github/workflows/pages.yml");
  assert.match(pages, /deploy:\s+if: github\.ref == 'refs\/heads\/main'\s+needs: validate/);
});
