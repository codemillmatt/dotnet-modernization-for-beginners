import { test } from "node:test";
import assert from "node:assert/strict";
import { bootstrap, cleanup, cliInvocation, deploymentValues } from "../../examples/azure/lab.mjs";

const values = {
  resourceGroup: "rg-bookcatalog-test", subscriptionId: "11111111-1111-1111-1111-111111111111",
  appName: "bc-web-test", sqlServerName: "bc-sql-test", sqlServerFqdn: "bc-sql-test.database.windows.net",
  databaseName: "BookCatalogLab", keyVaultName: "bc-kv-test",
  identityClientId: "22222222-2222-2222-2222-222222222222",
  identityPrincipalId: "33333333-3333-3333-3333-333333333333"
};
const schema = "CREATE TABLE [Books] ([Id] int);";
function mocks(fail = "") {
  const calls = [];
  let closed = false;
  return {
    calls, get closed() { return closed; },
    azure(args) {
      calls.push(args);
      if (args[0] === "account" && args[1] === "show") return JSON.stringify({ id: values.subscriptionId });
      if (args[1] === "get-access-token") return JSON.stringify({ accessToken: "test-token" });
      if (fail === "secret" && args[0] === "keyvault") throw new Error("Secret write failed.");
      if (fail === "firewall" && args[3] === "create") throw new Error("Firewall create failed.");
      if (args[0] === "group" && args[1] === "exists") return "false";
      if (args[0] === "group" && args[1] === "show") return "dotnet-modernization";
      return "";
    },
    async connect() {
      if (fail === "connect") throw new Error("SQL connection failed.");
      return {
        async initialize() { if (fail === "schema") throw new Error("Schema failed."); },
        async close() { closed = true; }
      };
    }
  };
}

test("outputs are scoped to the dedicated lab", () => {
  const raw = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value }]));
  assert.deepEqual(deploymentValues(raw), values);
  assert.throws(() => deploymentValues({ ...raw, resourceGroup: { value: "production" } }), /Invalid/);
  assert.throws(() => deploymentValues({ ...raw, sqlServerFqdn: { value: "bc-sql-other.database.windows.net" } }), /do not match/);
});
test("Windows CLI arguments are data, not interpolated shell source", () => {
  const args = ["keyvault", "secret", "set", "--value", "Database=BookCatalogLab;User Id=sample;"];
  const invocation = cliInvocation(args, "win32");
  assert.equal(invocation.command, "powershell.exe");
  assert.deepEqual(JSON.parse(invocation.env.BOOKCATALOG_AZ_ARGUMENTS), [...args, "--only-show-errors"]);
  assert.ok(!invocation.args.join(" ").includes("Database=BookCatalogLab"));
  assert.deepEqual(cliInvocation(args, "darwin").args, [...args, "--only-show-errors"]);
});
test("bootstrap removes its exact client rule and closes SQL", async () => {
  const mock = mocks();
  await bootstrap(values, "203.0.113.10", schema, mock);
  const create = mock.calls.find(args => args[3] === "create");
  const remove = mock.calls.find(args => args[3] === "delete");
  assert.ok(create);
  assert.equal(create[create.indexOf("--name") + 1], remove[remove.indexOf("--name") + 1]);
  assert.equal(create[create.indexOf("--start-ip-address") + 1], "203.0.113.10");
  assert.equal(create[create.indexOf("--end-ip-address") + 1], "203.0.113.10");
  assert.ok(mock.closed);
  const secret = mock.calls.find(args => args[0] === "keyvault");
  assert.match(secret[secret.indexOf("--value") + 1], /Active Directory Managed Identity/);
  assert.doesNotMatch(secret.join(" "), /test-token/);
});
for (const failure of ["firewall", "connect", "schema", "secret"]) {
  test(`bootstrap cleans the firewall after ${failure} failure`, async () => {
    const mock = mocks(failure);
    await assert.rejects(bootstrap(values, "203.0.113.10", schema, mock));
    assert.ok(mock.calls.some(args => args[3] === "delete"));
  });
}
test("invalid input and subscription mismatches cause no mutation", async () => {
  const mock = mocks();
  await assert.rejects(bootstrap(values, "0.0.0.0", schema, mock), /IPv4/);
  await assert.rejects(bootstrap(values, "not-an-ip", schema, mock), /IPv4/);
  assert.equal(mock.calls.length, 0);
  await assert.rejects(bootstrap(values, "203.0.113.10", schema, {
    azure: () => JSON.stringify({ id: "another-subscription" })
  }), /Select the subscription/);
});
test("cleanup needs confirmation and checks the exact group", () => {
  const mock = mocks();
  assert.throws(() => cleanup(values, false, mock.azure), /confirm-delete/);
  assert.equal(mock.calls.length, 0);
  cleanup(values, true, mock.azure);
  assert.deepEqual(mock.calls.at(-1), ["group", "exists", "--name", values.resourceGroup, "-o", "tsv"]);
});
test("cleanup failures do not look successful", () => {
  assert.throws(() => cleanup(values, true, args =>
    args[0] === "account" ? JSON.stringify({ id: values.subscriptionId })
      : args[1] === "show" ? "dotnet-modernization" : "true"
  ), /not complete/);
});
test("cleanup refuses a group without the workshop marker", () => {
  assert.throws(() => cleanup(values, true, args =>
    args[0] === "account" ? JSON.stringify({ id: values.subscriptionId }) : ""
  ), /Refuse to delete/);
});
