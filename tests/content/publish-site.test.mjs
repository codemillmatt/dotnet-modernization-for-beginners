import { test } from "node:test";
import assert from "node:assert/strict";
import { publishSite } from "../../webpage/tools/publish-site.mjs";

test("publishing uses a single rename when the directory is ready", async () => {
  const calls = [];
  await publishSite("stage", "output", {
    move: async (...args) => calls.push(args),
    wait: async () => assert.fail("A successful rename must not wait."),
    warn: () => assert.fail("A successful rename must not warn.")
  });
  assert.deepEqual(calls, [["stage", "output"]]);
});

test("transient Windows directory locks retry with a visible warning", async () => {
  const waits = [], warnings = [];
  let calls = 0;
  await publishSite("stage", "output", {
    platform: "win32",
    move: async () => {
      if (++calls < 3) throw Object.assign(new Error("Locked"), { code: "EPERM" });
    },
    wait: async delay => waits.push(delay),
    warn: message => warnings.push(message)
  });
  assert.equal(calls, 3);
  assert.deepEqual(waits, [250, 500]);
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every(message => message.includes("EPERM")));
});

test("persistent Windows rename failures propagate after bounded retries", async () => {
  let calls = 0;
  const error = Object.assign(new Error("Access denied"), { code: "EACCES" });
  await assert.rejects(publishSite("stage", "output", {
    platform: "win32",
    move: async () => { calls++; throw error; },
    wait: async () => {},
    warn: () => {}
  }), candidate => candidate === error);
  assert.equal(calls, 5);
});

test("unrelated and non-Windows failures are not retried", async () => {
  for (const [platform, code] of [["win32", "ENOENT"], ["linux", "EPERM"]]) {
    let calls = 0;
    const error = Object.assign(new Error("Rename failed"), { code });
    await assert.rejects(publishSite("stage", "output", {
      platform,
      move: async () => { calls++; throw error; },
      wait: async () => assert.fail("This error must not be retried."),
      warn: () => assert.fail("This error must not be reported as transient.")
    }), candidate => candidate === error);
    assert.equal(calls, 1);
  }
});
