import { test } from "node:test";
import assert from "node:assert/strict";
import { chapters } from "../../webpage/scripts/chapters.js";
import { createProgressStore } from "../../webpage/scripts/state.js";

const key = "dotnet-modernization-workshop:v2:/workshop/";
function storage(saved) {
  const values = new Map([[key, JSON.stringify(saved)], ["unrelated", "keep"]]);
  return { values, getItem: name => values.get(name) ?? null, setItem: (name, value) => values.set(name, value) };
}
const old = {
  version: 2, completed: chapters.filter(item => item.core).map(item => item.slug),
  previousReading: ["01-assessment"], theme: "dark", lastVisited: "03-upgrade-execution"
};

test("v2 completed chapters become history, not revised artifact, data, or Azure-plan completion", () => {
  const data = storage(old);
  const store = createProgressStore(data, key);
  assert.equal(store.value.version, 3);
  assert.deepEqual(store.value.completed, []);
  assert.deepEqual(store.value.previousCompleted, old.completed.map(slug => ({ slug, revision: 1 })));
  assert.deepEqual(store.value.previousReading, ["01-assessment"]);
  assert.equal(store.value.theme, "dark");
  assert.equal(store.value.lastVisited, "03-upgrade-execution");
  assert.equal(data.values.get("unrelated"), "keep");
  assert.deepEqual(createProgressStore(data, key).value, store.value);
});

test("only changed exercise revisions lose current completion", () => {
  const data = storage({
    ...old, version: 3, completed: ["00-introduction", "01-assessment", "04-cloud"],
    completionRevisions: { "00-introduction": 2, "01-assessment": 1, "04-cloud": 2 },
    previousCompleted: [{ slug: "02-planning", revision: 1 }]
  });
  const store = createProgressStore(data, key);
  assert.deepEqual(store.value.completed, ["00-introduction", "04-cloud"]);
  assert.deepEqual(store.value.completionRevisions, { "00-introduction": 2, "04-cloud": 2 });
  assert.deepEqual(store.value.previousCompleted, [
    { slug: "02-planning", revision: 1 }, { slug: "01-assessment", revision: 1 }
  ]);
  store.toggle("01-assessment");
  assert.equal(store.value.completionRevisions["01-assessment"], 2);
  store.toggle("01-assessment");
  assert.equal(store.value.completionRevisions["01-assessment"], undefined);
  assert.ok(store.value.previousCompleted.some(item => item.slug === "01-assessment"));
});

test("reference and overview visits preserve resume, and reset preserves theme", () => {
  const store = createProgressStore(storage(old), key);
  store.visit("overview");
  store.visit("reference");
  assert.equal(store.value.lastVisited, "03-upgrade-execution");
  store.reset();
  assert.equal(store.value.theme, "dark");
  assert.equal(store.value.lastVisited, "");
  assert.deepEqual(store.value.completed, []);
  assert.deepEqual(store.value.previousCompleted, []);
});

test("malformed completion does not discard valid preferences", () => {
  const data = storage({ ...old, completed: "invalid" });
  const store = createProgressStore(data, key);
  assert.match(store.warning, /could not read/);
  assert.equal(store.value.theme, "dark");
  assert.equal(store.value.lastVisited, "03-upgrade-execution");
  assert.deepEqual(store.value.completed, []);
});

test("unknown chapters and invalid revision values never count or become resume destinations", () => {
  const data = storage({
    ...old, version: 3, completed: ["overview", "reference", "bad", "01-assessment"],
    completionRevisions: { "01-assessment": "2" }, lastVisited: "reference"
  });
  const store = createProgressStore(data, key);
  assert.deepEqual(store.value.completed, []);
  assert.equal(store.value.lastVisited, "");
});
