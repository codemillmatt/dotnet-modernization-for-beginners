import { extname } from "node:path";
import { chapters, references } from "../scripts/chapters.js";
import { illustrations, illustrationPath } from "../scripts/illustrations.js";

const exact = new Set([
  ...chapters.map(item => item.path), ...references.map(item => item.path),
  ...illustrations.flatMap(item => ["light", "dark"].map(mode => illustrationPath(item.id, mode))),
  "LICENSE", "package.json", "package-lock.json", ".config/dotnet-tools.json",
  "scripts/Test-DataTransfer.ps1", "scripts/Test-ModernizedApp.ps1"
]);
const roots = [
  ...chapters.slice(1).map(item => item.slug), "shared-legacy-app", "examples/modernized",
  "examples/azure", "examples/assessments", "tests/BookCatalog.Tests",
  "tests/BookCatalog.Data.Tests", "tools/BookCatalog.Data", "scripts"
];
const extensions = new Set([".md", ".cs", ".cshtml", ".css", ".json", ".sln", ".csproj", ".config",
  ".asax", ".png", ".svg", ".bicep", ".mjs", ".csv", ".ps1"]);
const excluded = new Set(["bin", "obj", "packages", "node_modules", ".git", ".vs", "testresults",
  "history", ".bookcatalog-lab", ".azure-lab", "app_data", "snapshots"]);

export function selectPublicContent(tracked, untracked) {
  const safe = path => !path.split("/").some(part => excluded.has(part.toLowerCase()))
    && !/(^|\/)(secrets\.json|\.env(?:\..*)?)$|\.local\.json$|\.user$/i.test(path);
  const supported = path => exact.has(path) ||
    (roots.some(root => path.startsWith(`${root}/`)) && extensions.has(extname(path).toLowerCase()));
  // Newly authored public helper code is usable in previews before staging or committing.
  // Do not copy arbitrary untracked JSON, Markdown, databases, or local configuration.
  const newPublic = path => exact.has(path) ||
    /^(tools\/BookCatalog\.Data|tests\/BookCatalog\.Data\.Tests)\/(?:[^/]+\/)*[^/]+\.(cs|csproj)$/.test(path);
  return [...new Set([
    ...tracked.filter(path => safe(path) && supported(path)),
    ...untracked.filter(path => safe(path) && newPublic(path))
  ])].sort();
}
