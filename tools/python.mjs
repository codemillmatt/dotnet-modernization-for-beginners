import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export function selectPython(run = spawnSync, platform = process.platform) {
  const candidates = platform === "win32"
    ? [["py", "-3"], ["python"], ["python3"]] : [["python3"], ["python"]];
  for (const [command, ...prefix] of candidates) {
    const probe = run(command, [...prefix, "-c",
      "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)"],
    { encoding: "utf8", windowsHide: true, timeout: 10000 });
    if (!probe.error && probe.status === 0) return { command, prefix };
  }
  throw new Error("Python 3.9 or later was not found. On Windows, install Python with the py launcher.");
}

export function runPython(args, options = {}) {
  const { command, prefix } = selectPython();
  // Once selected, run the script only once. Script failures are not interpreter failures.
  const result = spawnSync(command, [...prefix, ...args], { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = runPython(process.argv.slice(2));
  process.exitCode = result.status ?? 1;
}
