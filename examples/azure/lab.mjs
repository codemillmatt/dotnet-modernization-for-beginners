import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isIP } from "node:net";
import { pathToFileURL } from "node:url";

export function deploymentValues(raw) {
  const result = Object.fromEntries(Object.entries(raw).map(([key, entry]) => [key, entry.value]));
  const patterns = {
    resourceGroup: /^rg-bookcatalog-[a-z0-9-]+$/,
    subscriptionId: /^[0-9a-f-]{36}$/i,
    appName: /^bc-web-[a-z0-9-]+$/,
    sqlServerName: /^bc-sql-[a-z0-9-]+$/,
    sqlServerFqdn: /^bc-sql-[a-z0-9-]+\.database\.windows\.net$/,
    databaseName: /^BookCatalogLab$/,
    keyVaultName: /^bc-kv-[a-z0-9-]+$/,
    identityClientId: /^[0-9a-f-]{36}$/i,
    identityPrincipalId: /^[0-9a-f-]{36}$/i
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    if (typeof result[key] !== "string" || !pattern.test(result[key])) {
      throw new Error(`Invalid deployment output: ${key}. Use outputs from the reviewed lab template.`);
    }
  }
  if (result.sqlServerFqdn !== `${result.sqlServerName}.database.windows.net`) {
    throw new Error("The SQL server outputs do not match.");
  }
  return result;
}

export function cliInvocation(args, platform = process.platform) {
  const argumentsList = [...args, "--only-show-errors"];
  if (platform !== "win32") return { command: "az", args: argumentsList, env: process.env };
  // Keep arguments out of PowerShell source and cmd.exe command parsing.
  return {
    command: "powershell.exe",
    args: ["-NoProfile", "-NonInteractive", "-Command",
      "$ErrorActionPreference='Stop'; $arguments=ConvertFrom-Json $env:BOOKCATALOG_AZ_ARGUMENTS; & az @arguments; exit $LASTEXITCODE"],
    env: { ...process.env, BOOKCATALOG_AZ_ARGUMENTS: JSON.stringify(argumentsList) }
  };
}

export function azure(args) {
  const invocation = cliInvocation(args);
  try {
    return execFileSync(invocation.command, invocation.args, {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: invocation.env
    }).trim();
  } catch (error) {
    const detail = error.stderr?.trim() || error.message;
    throw new Error(`Azure CLI failed for ${args.slice(0, 3).join(" ")} (exit ${error.status ?? "unknown"}).\n${detail}`);
  }
}

export async function bootstrap(values, clientIp, schema, dependencies = {}) {
  if (isIP(clientIp) !== 4 || clientIp === "0.0.0.0") {
    throw new Error("Supply your public IPv4 address. Do not use 0.0.0.0.");
  }
  if (!schema.includes("CREATE TABLE [Books]") && !schema.includes("CREATE TABLE [dbo].[Books]")) {
    throw new Error("The schema does not create the expected Books table.");
  }
  const run = dependencies.azure ?? azure;
  const connect = dependencies.connect ?? connectSql;
  const account = JSON.parse(run(["account", "show", "-o", "json"]));
  if (account.id !== values.subscriptionId) throw new Error("Select the subscription from the deployment outputs.");
  const firewallName = `workshop-${randomUUID()}`;
  const firewall = ["sql", "server", "firewall-rule"];
  const scope = ["--resource-group", values.resourceGroup, "--server", values.sqlServerName, "--name", firewallName];
  let connection;
  let failure;
  let ruleAttempted = false;
  try {
    ruleAttempted = true;
    run([...firewall, "create", ...scope, "--start-ip-address", clientIp, "--end-ip-address", clientIp, "-o", "none"]);
    const token = JSON.parse(run(["account", "get-access-token", "--resource", "https://database.windows.net/", "-o", "json"])).accessToken;
    if (!token) throw new Error("Azure CLI returned no SQL access token.");
    connection = await connect(values, token);
    await connection.initialize(schema, values.identityPrincipalId);
    const connectionString = `Server=tcp:${values.sqlServerFqdn},1433;Database=${values.databaseName};Authentication=Active Directory Managed Identity;User Id=${values.identityClientId};Encrypt=True;TrustServerCertificate=False;`;
    run(["keyvault", "secret", "set", "--vault-name", values.keyVaultName,
      "--name", "ConnectionStrings--BookCatalogContext", "--value", connectionString, "-o", "none"]);
  } catch (error) {
    failure = error;
  } finally {
    const errors = [];
    if (failure) errors.push(failure);
    if (connection) {
      try { await connection.close(); } catch (error) { errors.push(error); }
    }
    if (ruleAttempted) {
      try { run([...firewall, "delete", ...scope, "-o", "none"]); } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new AggregateError(errors, errors.map(error => error.message).join("\n"));
  }
}

async function connectSql(values, token) {
  const { default: sql } = await import("mssql");
  const pool = new sql.ConnectionPool({
    server: values.sqlServerFqdn, database: values.databaseName,
    authentication: { type: "azure-active-directory-access-token", options: { token } },
    options: { encrypt: true, trustServerCertificate: false },
    pool: { max: 1, min: 0 }, requestTimeout: 120000
  });
  try {
    await pool.connect();
  } catch (error) {
    await pool.close();
    throw error;
  }
  return {
    async initialize(schema, principalId) {
      const hash = createHash("sha256").update(schema).digest("hex");
      const status = await pool.request().query(
        "SELECT COUNT(*) AS tableCount FROM sys.tables WHERE is_ms_shipped = 0");
      if (status.recordset[0].tableCount === 0) {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
          for (const batch of schema.split(/^\s*GO\s*$/mi).filter(value => value.trim())) {
            await new sql.Request(transaction).batch(batch);
          }
          await new sql.Request(transaction).query(
            "CREATE TABLE dbo.WorkshopSchema (Fingerprint varchar(64) NOT NULL)");
          await new sql.Request(transaction).input("fingerprint", sql.VarChar(64), hash)
            .query("INSERT INTO dbo.WorkshopSchema VALUES (@fingerprint)");
          await transaction.commit();
        } catch (error) {
          try { await transaction.rollback(); } catch (rollbackError) {
            throw new AggregateError([error, rollbackError], "Schema creation and rollback failed. Check the lab database.");
          }
          throw error;
        }
      } else {
        const marker = await pool.request().query("SELECT OBJECT_ID('dbo.WorkshopSchema') AS marker");
        if (!marker.recordset[0].marker) throw new Error("Refuse to modify an existing database without a workshop marker.");
        const stored = await pool.request().query("SELECT Fingerprint FROM dbo.WorkshopSchema");
        if (stored.recordset.length !== 1 || stored.recordset[0].Fingerprint !== hash) {
          throw new Error("The existing lab schema differs. Do not use this helper to migrate data.");
        }
      }
      await pool.request().input("principal", sql.UniqueIdentifier, principalId).query(`
        DECLARE @sid varbinary(16) = CONVERT(varbinary(16), @principal);
        IF DATABASE_PRINCIPAL_ID('BookCatalogRuntime') IS NULL
        BEGIN
          DECLARE @create nvarchar(max) =
            N'CREATE USER [BookCatalogRuntime] WITH SID = ' + CONVERT(nvarchar(34), @sid, 1) + N', TYPE = E';
          EXEC sp_executesql @create;
        END;
        IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'BookCatalogRuntime' AND sid <> @sid)
          THROW 50001, 'The existing runtime identity differs.', 1;
        GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.Books TO [BookCatalogRuntime];
      `);
    },
    close: () => pool.close()
  };
}

export function cleanup(values, confirmed, run = azure) {
  if (!confirmed) throw new Error("Cleanup requires --confirm-delete. It deletes the entire dedicated lab group.");
  const account = JSON.parse(run(["account", "show", "-o", "json"]));
  if (account.id !== values.subscriptionId) throw new Error("Select the subscription from the deployment outputs.");
  if (run(["group", "show", "--name", values.resourceGroup, "--query", "tags.workshop", "-o", "tsv"]) !== "dotnet-modernization") {
    throw new Error("The group has no matching workshop tag. Refuse to delete it.");
  }
  run(["group", "delete", "--name", values.resourceGroup, "--yes"]);
  if (run(["group", "exists", "--name", values.resourceGroup, "-o", "tsv"]) !== "false") {
    throw new Error("The lab group still exists. Cleanup is not complete.");
  }
}

async function main(args) {
  const [action, outputsPath, ...rest] = args;
  if (!["bootstrap", "cleanup"].includes(action) || !outputsPath) {
    throw new Error("Use: node examples/azure/lab.mjs bootstrap outputs.json public-ip schema.sql OR cleanup outputs.json --confirm-delete");
  }
  const values = deploymentValues(JSON.parse((await readFile(outputsPath, "utf8")).replace(/^\uFEFF/, "")));
  if (action === "cleanup") {
    cleanup(values, rest.length === 1 && rest[0] === "--confirm-delete");
    console.log("The dedicated lab group no longer exists.");
  } else {
    if (rest.length !== 2) throw new Error("Supply the public IPv4 address and the reviewed schema file.");
    await bootstrap(values, rest[0], await readFile(rest[1], "utf8"));
    console.log("The schema, runtime identity, and Key Vault value are ready. The temporary client rule is removed.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
