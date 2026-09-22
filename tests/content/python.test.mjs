import { test } from "node:test";
import assert from "node:assert/strict";
import { selectPython, runPython } from "../../tools/python.mjs";

test("Windows prefers py -3 and skips unavailable aliases", () => {
  const calls = [];
  const run = (command, args) => {
    calls.push([command, args]);
    return { status: command === "python3" ? 0 : 9009 };
  };
  assert.deepEqual(selectPython(run, "win32"), { command: "python3", prefix: [] });
  assert.deepEqual(calls.map(call => call[0]), ["py", "python", "python3"]);
  assert.equal(calls[0][1][0], "-3");
  assert.deepEqual(selectPython(() => ({ status: 0 }), "win32"), { command: "py", prefix: ["-3"] });
});

test("portable Python detection reports missing runtimes", () => {
  assert.deepEqual(selectPython(() => ({ status: 0 }), "linux"), { command: "python3", prefix: [] });
  assert.throws(() => selectPython(() => ({ error: Error("missing") }), "win32"), /Python 3.9/);
});

test("a real Python script failure is returned without retrying", () => {
  const result = runPython(["-c", "import sys; print('once'); sys.exit(7)"], { encoding: "utf8", stdio: "pipe" });
  assert.equal(result.status, 7);
  assert.equal(result.stdout.trim(), "once");
});
