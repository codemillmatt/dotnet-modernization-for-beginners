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
const recordedBookCatalogFiles = [
  "examples/assessments/bookcatalog/README.md",
  "examples/assessments/bookcatalog/assessment-excerpts.md",
  "examples/assessments/bookcatalog/planning-excerpts.md",
  "examples/assessments/bookcatalog/execution-excerpts.md",
  ...["legacy-preview", "ch1-1-upgrade-agent-dashboard", "ch1-2-dashboard-assessment",
    "ch1-3-assessment-view", "ch2-1-dashboard-plan", "ch3-1-dashboard-task1-done",
    "ch3-2-most-tasks-complete"].map(name => `examples/assessments/bookcatalog/images/${name}.png`)
];

test("each chapter has the planned era and complete palettes", () => {
  assert.deepEqual(chapters.map(chapter => chapter.era),
    ["1960s", "1970s", "soundcheck", "1980s", "1990s", "2000s-2010s", "2020s"]);
  const keys = Object.keys(eraPalette("1960s", "light")).sort();
  for (const [id, era] of Object.entries(eras)) {
    assert.ok(existsSync(join(root, "webpage/assets", era.art)));
    if (era.artDark) assert.ok(existsSync(join(root, "webpage/assets", era.artDark)));
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

test("manifest preserves identifiers and the sequential chapter path", () => {
  assert.deepEqual(chapters.map(chapter => [chapter.slug, chapter.number]), [
    ["overview", "01"], ["00-introduction", "02"], ["prerequisites", "03"],
    ["01-assessment", "04"], ["02-planning", "05"], ["03-upgrade-execution", "06"], ["04-cloud", "07"]
  ]);
  assert.equal(chapters.filter(chapter => chapter.core).length, 6);
  assert.equal(chapters.find(chapter => chapter.slug === "overview").core, false);
  assert.equal(chapters.find(chapter => chapter.slug === "04-cloud").core, true);
  assert.ok(chapters.filter(chapter => chapter.core).every(chapter => chapter.exerciseRevision > 1));
  assert.ok(references.some(item => item.path === "04-cloud/deployment.md"));
  assert.ok(references.some(item => item.path === "docs/learner-record.md"));
  assert.ok(references.some(item => item.path === "docs/instructor-guide.md"));
  assert.ok(references.some(item => item.path === "tools/BookCatalog.Data/README.md"));
  for (const path of ["docs/data-transfer.md", "docs/advanced-checks.md", "docs/author-filter.md",
    "examples/assessments/bookcatalog/README.md"]) {
    assert.ok(references.some(item => item.path === path));
    assert.ok(!chapters.some(item => item.path === path));
  }
  assert.equal(new Set(documents).size, documents.length);
  for (const item of [...chapters, ...references]) assert.ok(existsSync(join(root, item.path)));
});

test("routes constrain references and preserve sections", () => {
  assert.equal(routeForPath("01-assessment/../README.md", "-prerequisites"), "#/overview?section=-prerequisites");
  assert.equal(routeForPath("04-cloud/deployment.md", "delete-the-dedicated-lab-group"),
    "#/reference?path=04-cloud%2Fdeployment.md&section=delete-the-dedicated-lab-group");
  assert.equal(parseRoute("#/reference?path=docs%2Fvalidation.md").chapter.path, "docs/validation.md");
  assert.equal(routeForPath("prerequisites/README.md", "run-bookcatalog"),
    "#/prerequisites?section=run-bookcatalog");
  assert.equal(parseRoute("#/prerequisites").chapter.number, "03");
  assert.throws(() => parseRoute("#/reference?path=../../secret"), /not in the course/);
  assert.throws(() => normalizePath("../../secret"), /leaves the course/);
  assert.throws(() => parseRoute("#/unknown"), /not in the course/);
});

test("the completed reference has its own future era without adding a course step", () => {
  const reference = parseRoute("#/reference?path=examples%2Fmodernized%2FREADME.md").chapter;
  assert.equal(reference.era, "2050s");
  assert.equal(reference.slug, "reference");
  assert.ok(!reference.core);
  assert.deepEqual(references.filter(item => item.era).map(item => item.path), ["examples/modernized/README.md"]);
  assert.ok(existsSync(join(root, "webpage/assets", getEra("2050s").art)));
  assert.equal(routeForPath(reference.path), "#/reference?path=examples%2Fmodernized%2FREADME.md");
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
    assert.equal(sdk.version, "10.0.100");
    assert.equal(sdk.rollForward, "latestMajor");
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
test("setup uses a copyable official clone and accepts newer stable SDKs", () => {
  const setup = read("prerequisites/README.md");
  assert.match(setup, /git clone https:\/\/github\.com\/microsoft\/dotnet-modernization-for-beginners\.git bookcatalog-course/);
  assert.doesNotMatch(setup, /<course-repository-url>/);
  assert.match(setup, /\*\*`10\.0\.401` is supported\.\*\*/);
  assert.match(setup, /later stable major versions/i);
  assert.match(setup, /Visual Studio Installer[\s\S]*Individual components/);
});
test("assessment uses the recorded dashboard workflow without a mandatory report edit", () => {
  const assessment = read("01-assessment/README.md");
  assert.match(assessment, /Why assess the app/);
  assert.match(assessment, /team or management/);
  assert.match(assessment, /@Modernize Run an assessment for BookCatalog/);
  assert.match(assessment, /Upgrade Agent Dashboard/);
  assert.match(assessment, /Keep it unchanged/);
  assert.match(assessment, /zero packages[\s\S]*seven package issues/);
  assert.doesNotMatch(assessment, /<details>|Earlier detailed-review links|Copilot writes the report/);
});
test("the required upgrade rebuilds demo data without preservation or side-by-side prerequisites", () => {
  const planning = read("02-planning/README.md");
  const execution = read("03-upgrade-execution/README.md");
  assert.ok(planning.indexOf("## Ask for the plan") < planning.indexOf("## Understand the choices"));
  for (const lesson of [planning, execution]) {
    const match = lesson.match(/```text\r?\n([\s\S]*?)```/);
    assert.ok(match, "The lesson must include a copyable modernization prompt.");
    const prompt = match[1];
    assert.match(prompt, /^@Modernize /);
    assert.match(prompt, /in place[\s\S]*EF Core/i);
    assert.match(prompt, /BookCatalogModernizedLab/);
    assert.match(prompt, /recreate that demo database/i);
    assert.match(prompt, /Do not add [^\n]*(?:preservation|shared-schema)/i);
    assert.match(prompt, /saved edits (?:must survive a restart|across normal app restarts)/i);
    assert.doesNotMatch(lesson, /Leave the legacy database unchanged|separate-database boundary|finish its export first|import your snapshot|Stop before the first upgraded-app launch/i);
  }
  assert.match(planning, /Direct Migration to ASP\.NET Core APIs/);
  assert.match(planning, /Some versions also create `upgrade-options\.md`/);
  assert.match(execution, /Stop[\s\S]*plan\.md, scenario-instructions\.md, tasks\.md, and pending task instructions/);
  assert.match(execution, /still in progress after more than five hours/);
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
  assert.deepEqual([...entries.keys()].filter(path => path.startsWith("examples/assessments/bookcatalog/")).sort(),
    [...recordedBookCatalogFiles].sort(), "The ZIP must contain only the reviewed BookCatalog evidence files.");
  for (const path of [
    "tools/BookCatalog.Data/README.md", "tools/BookCatalog.Data/BookCatalog.Data.csproj",
    "tests/BookCatalog.Data.Tests/BookCatalog.Data.Tests.csproj",
    "tests/BookCatalog.Tests/BookCatalog.Tests.csproj", "scripts/Test-DataTransfer.ps1",
    "scripts/Test-LegacyApp.ps1", "scripts/Test-ModernizedApp.ps1", "docs/learner-record.md", "docs/instructor-guide.md",
    "docs/data-transfer.md", "docs/advanced-checks.md", "docs/author-filter.md",
    ...recordedBookCatalogFiles,
    "04-cloud/deployment.md", ".config/dotnet-tools.json",
    "examples/modernized/compose.yaml", "examples/modernized/Start-BookCatalog.ps1",
    "examples/modernized/Test-Quickstart.ps1", "examples/modernized/.gitignore",
    "shared-legacy-app/src/BookCatalog.Web/Properties/AssemblyInfo.cs",
    "examples/modernized/src/BookCatalog.Web/Program.cs", "DOWNLOAD-README.txt"
  ]) assert.ok(entries.get(path)?.length > 0, path);
  assert.ok([...entries.keys()].some(path => /^tools\/BookCatalog.Data\/.*\.cs$/.test(path)));
  assert.ok([...entries.keys()].some(path => /^tests\/BookCatalog.Data.Tests\/.*\.cs$/.test(path)));
  assert.ok(![...entries.keys()].some(path =>
    /(^|\/)(bin|obj|packages|history|\.bookcatalog-lab|\.azure-lab|snapshots|secrets\.json)(\/|$)|\.(mdf|ldf|pfx)$/i.test(path)));
  assert.match(entries.get("README.md").toString("utf8"),
    /https:\/\/github.com\/microsoft\/dotnet-modernization-for-beginners\/blob\/main\/00-introduction\/README.md/);
  const brokenLinks = [];
  for (const [path, bytes] of entries) {
    if (!path.endsWith(".md")) continue;
    for (const match of bytes.toString("utf8").matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1].split("#")[0].split("?")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const resolved = normalizePath(`${path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : ""}${target}`);
      if (!entries.has(resolved) && ![...entries.keys()].some(name => name.startsWith(`${resolved}/`))) {
        brokenLinks.push(`${path}: ${target}`);
      }
    }
  }
  assert.deepEqual(brokenLinks, [], "ZIP Markdown links and images must resolve without a repository checkout.");
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
    "docs/illustrations/journey-light.svg", "docs/illustrations/azure-dark.svg",
    "docs/illustrations/soundcheck-light.svg", "docs/illustrations/soundcheck-dark.svg",
    "prerequisites/README.md", "docs/data-transfer.md", "docs/advanced-checks.md", "docs/author-filter.md",
    "examples/modernized/compose.yaml", "examples/modernized/Start-BookCatalog.ps1",
    "examples/modernized/Test-Quickstart.ps1", "examples/modernized/.gitignore",
    ...recordedBookCatalogFiles
  ];
  const privateFiles = [
    "tools/BookCatalog.Data/.bookcatalog-lab/records.json", "tools/BookCatalog.Data/snapshot.json",
    "tools/BookCatalog.Data/private-notes.md", "tools/BookCatalog.Data/bin/Generated.cs",
    "tools/BookCatalog.Data/secrets.json", "shared-legacy-app/App_Data/books.mdf",
    "docs/private-notes.md", "scripts/private-script.ps1", "examples/azure/.env",
    "examples/azure/.azure-lab/state.json", "docs/illustrations/private.svg", "docs/illustrations/private-notes.md",
    "examples/modernized/.env", "examples/modernized/.env.local", "examples/modernized/private-compose.yaml",
    "examples/modernized/private-helper.ps1",
    "examples/assessments/bookcatalog/private-notes.md", "examples/assessments/bookcatalog/assessment.json",
    "examples/assessments/bookcatalog/images/private.png", "examples/assessments/bookcatalog/.appmod/report.md",
    "examples/assessments/bookcatalog/.github/upgrades/run/assessment.md", "examples/assessments/bookcatalog/books.mdf",
    "examples/assessments/bookcatalog/final-mod-agent-files/tasks.md",
    "examples/assessments/bookcatalog/runtime-acceptance.md",
    "examples/assessments/bookcatalog/images/ch4-private-dashboard.png"
  ];
  assert.deepEqual(selectPublicContent([], [...safe, ...privateFiles]), [...safe].sort());
  const rawEvidence = privateFiles.filter(path => path.startsWith("examples/assessments/bookcatalog/"));
  assert.deepEqual(selectPublicContent([...recordedBookCatalogFiles, ...rawEvidence], []),
    [...recordedBookCatalogFiles].sort(), "Tracking raw evidence must not make it public.");
  assert.deepEqual(selectPublicContent([
    "examples/azure/secrets.json", "examples/azure/.bookcatalog-lab/records.json",
    "examples/modernized/.env", "examples/modernized/.env.local", "examples/modernized/private-compose.yaml",
    "examples/modernized/appsettings.Test.Local.json", "tools/BookCatalog.Data/obj/Generated.cs",
    "examples/assessments/bookcatalog/private-notes.md", "examples/assessments/bookcatalog/assessment.json",
    "examples/assessments/bookcatalog/images/private.png", "shared-legacy-app/.appmod/report.md",
    "shared-legacy-app/.github/upgrades/run/assessment.md", "examples/assessments/bookcatalog/books.mdf"
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
