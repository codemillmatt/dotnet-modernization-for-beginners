import { cp, lstat, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chapters, references } from "../scripts/chapters.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = join(root, "_site");
const stage = await mkdtemp(join(root, ".site-build-"));
const excluded = new Set(["bin", "obj", "packages", "node_modules", ".git", ".vs", "TestResults"]);
const extensions = new Set([".md", ".cs", ".cshtml", ".css", ".json", ".sln", ".csproj", ".config",
  ".asax", ".png", ".svg", ".bicep", ".mjs", ".csv", ".ps1"]);
async function copySource(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.name.endsWith(".user")) continue;
    if (entry.isSymbolicLink()) throw new Error(`The source contains a symbolic link: ${entry.name}`);
    if (entry.isDirectory()) await copySource(join(source, entry.name), join(destination, entry.name));
    else if (extensions.has(extname(entry.name).toLowerCase())) await cp(join(source, entry.name), join(destination, entry.name));
  }
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with exit ${result.status}.`);
}
try {
  for (const path of ["index.html", "styles.css", "app.js", ".nojekyll", "scripts", "assets"]) {
    await cp(join(root, "webpage", path), join(stage, path), { recursive: true });
  }
  await mkdir(join(stage, "content"), { recursive: true });
  await cp(join(root, "README.md"), join(stage, "content/README.md"));
  await cp(join(root, "LICENSE"), join(stage, "content/LICENSE"));
  for (const chapter of chapters.slice(1)) {
    const directory = dirname(chapter.path);
    await copySource(join(root, directory), join(stage, "content", directory));
  }
  for (const directory of ["shared-legacy-app", "examples/modernized", "examples/azure", "examples/assessments"]) {
    await copySource(join(root, directory), join(stage, "content", directory));
  }
  for (const reference of references) {
    await mkdir(dirname(join(stage, "content", reference.path)), { recursive: true });
    await cp(join(root, reference.path), join(stage, "content", reference.path));
  }
  for (const path of ["README.md", "package.json", "package-lock.json", ".config/dotnet-tools.json"]) {
    await mkdir(dirname(join(stage, "content", path)), { recursive: true });
    await cp(join(root, path), join(stage, "content", path));
  }
  await copySource(join(root, "tests/BookCatalog.Tests"), join(stage, "content/tests/BookCatalog.Tests"));
  await copySource(join(root, "scripts"), join(stage, "content/scripts"));
  await mkdir(join(stage, "vendor/github-slugger"), { recursive: true });
  for (const [source, target] of [
    ["marked/lib/marked.umd.js", "vendor/marked.umd.js"],
    ["marked/LICENSE", "vendor/marked-LICENSE"],
    ["dompurify/dist/purify.min.js", "vendor/purify.min.js"],
    ["dompurify/LICENSE", "vendor/dompurify-LICENSE"],
    ["github-slugger/index.js", "vendor/github-slugger/index.js"],
    ["github-slugger/regex.js", "vendor/github-slugger/regex.js"],
    ["github-slugger/LICENSE", "vendor/github-slugger/LICENSE"],
    ["@fontsource/outfit/files/outfit-latin-700-normal.woff2", "assets/outfit-latin-700-normal.woff2"],
    ["@fontsource/outfit/LICENSE", "assets/Outfit-LICENSE"]
  ]) await cp(join(root, "node_modules", source), join(stage, target));
  run(process.execPath, [join(root, "webpage/tools/render-mermaid.mjs"), join(stage, "content"), join(stage, "diagrams")]);
  await mkdir(join(stage, "downloads"));
  const python = process.platform === "win32" ? "python" : "python3";
  run(python, [join(root, "webpage/tools/package-samples.py"), join(stage, "content"), join(stage, "downloads/samples.zip")]);
  await writeFile(join(stage, ".workshop-build"), "dotnet-modernization-workshop\n");
  let existing;
  try { existing = await lstat(output); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (existing) {
    if (existing.isSymbolicLink() || await readFile(join(output, ".workshop-build"), "utf8") !== "dotnet-modernization-workshop\n") {
      throw new Error("Refuse to replace an unknown _site directory.");
    }
    await rm(output, { recursive: true });
  }
  await rename(stage, output);
  console.log("The workshop artifact is ready in _site.");
} finally {
  await rm(stage, { recursive: true, force: true });
}
