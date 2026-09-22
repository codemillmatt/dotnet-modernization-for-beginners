using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;
using Azure.Core;
using Azure.Identity;
using Microsoft.Data.SqlClient;

namespace BookCatalog.Data;

public sealed record AzureDeployment(string SubscriptionId, string ResourceGroup, string ServerName, string ServerFqdn, string Database)
{
    public static AzureDeployment Parse(string json)
    {
        using var document = Configuration.ParseJson(json);
        if (document.RootElement.ValueKind != JsonValueKind.Object)
            throw new TransferException("Use the unmodified outputs object from the reviewed Azure lab deployment.");
        var values = new Dictionary<string, string>();
        var patterns = new Dictionary<string, string>
        {
            ["resourceGroup"] = "^rg-bookcatalog-[a-z0-9-]+$",
            ["subscriptionId"] = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            ["appName"] = "^bc-web-[a-z0-9-]+$",
            ["appUrl"] = "^https://bc-web-[a-z0-9-]+\\.azurewebsites\\.net$",
            ["sqlServerName"] = "^bc-sql-[a-z0-9-]+$",
            ["sqlServerFqdn"] = "^bc-sql-[a-z0-9-]+\\.database\\.windows\\.net$",
            ["databaseName"] = "^BookCatalogLab$",
            ["keyVaultName"] = "^bc-kv-[a-z0-9-]+$",
            ["identityClientId"] = "^[0-9a-fA-F-]{36}$",
            ["identityPrincipalId"] = "^[0-9a-fA-F-]{36}$"
        };
        foreach (var entry in document.RootElement.EnumerateObject())
            if (!patterns.ContainsKey(entry.Name))
                throw new TransferException("Unexpected deployment output. Use outputs from examples\\azure\\main.bicep.");
        foreach (var (key, pattern) in patterns)
        {
            if (!document.RootElement.TryGetProperty(key, out var entry) || entry.ValueKind != JsonValueKind.Object
                || !entry.TryGetProperty("type", out var type) || type.ValueKind != JsonValueKind.String
                || !string.Equals(type.GetString(), "string", StringComparison.OrdinalIgnoreCase)
                || !entry.TryGetProperty("value", out var value) || value.ValueKind != JsonValueKind.String
                || entry.EnumerateObject().Any(p => p.Name is not ("type" or "value"))
                || !Regex.IsMatch(value.GetString()!, pattern, RegexOptions.CultureInvariant))
                throw new TransferException($"Invalid deployment output: {key}.");
            values.Add(key, value.GetString()!);
        }
        if (values["sqlServerFqdn"] != $"{values["sqlServerName"]}.database.windows.net"
            || values["appUrl"] != $"https://{values["appName"]}.azurewebsites.net"
            || !Guid.TryParse(values["identityClientId"], out _) || !Guid.TryParse(values["identityPrincipalId"], out _))
            throw new TransferException("Deployment outputs do not match each other.");
        return new(values["subscriptionId"], values["resourceGroup"], values["sqlServerName"], values["sqlServerFqdn"], values["databaseName"]);
    }
}

public sealed class AzureTarget(AzureDeployment deployment, Func<string[], Task<string>> runCli,
    Func<string, Task<AccessToken>>? getToken = null)
{
    public async Task<SqlConnection> ConnectAsync()
    {
        using var account = Configuration.ParseJson(await runCli(["account", "show", "-o", "json"]));
        var tenant = ValidateAccount(account.RootElement, deployment);
        using var user = Configuration.ParseJson(await runCli(["ad", "signed-in-user", "show", "-o", "json"]));
        if (!Guid.TryParse(StringValue(user.RootElement, "id"), out var signedInUser))
            throw new TransferException("Cannot confirm the signed-in Azure CLI user.");
        using var admins = Configuration.ParseJson(await runCli([
            "sql", "server", "ad-admin", "list", "--subscription", deployment.SubscriptionId,
            "--resource-group", deployment.ResourceGroup, "--server-name", deployment.ServerName, "-o", "json"]));
        if (admins.RootElement.ValueKind != JsonValueKind.Array || !admins.RootElement.EnumerateArray().Any(a =>
                Guid.TryParse(StringValue(a, "sid"), out var id) && id == signedInUser
                && string.Equals(StringValue(a, "tenantId"), tenant, StringComparison.OrdinalIgnoreCase)))
            throw new TransferException("The CLI user is not the approved SQL administrator from the lab deployment.");
        using var server = Configuration.ParseJson(await runCli([
            "sql", "server", "show", "--subscription", deployment.SubscriptionId, "--resource-group", deployment.ResourceGroup,
            "--name", deployment.ServerName, "-o", "json"]));
        ValidateServer(server.RootElement, deployment);
        var tag = await runCli(["group", "show", "--subscription", deployment.SubscriptionId, "--name", deployment.ResourceGroup,
            "--query", "tags.workshop", "-o", "tsv"]);
        if (tag.Trim() != "dotnet-modernization")
            throw new TransferException("The resource group is not marked as a dotnet-modernization lab.");

        var token = await (getToken ?? GetCliTokenAsync)(tenant);
        ValidateTokenIdentity(token, signedInUser, tenant);
        var connection = new SqlConnection(new SqlConnectionStringBuilder
        {
            DataSource = $"tcp:{deployment.ServerFqdn},1433",
            InitialCatalog = deployment.Database,
            Encrypt = true,
            TrustServerCertificate = false,
            Pooling = false,
            ConnectTimeout = 30,
            ConnectRetryCount = 0,
            ApplicationName = "BookCatalog selected-record helper"
        }.ConnectionString) { AccessToken = token.Token };
        // The caller owns opening and disposing this connection, including on connection failure.
        return connection;
    }

    public static string ValidateAccount(JsonElement account, AzureDeployment deployment)
    {
        var tenant = StringValue(account, "tenantId");
        if (!string.Equals(StringValue(account, "id"), deployment.SubscriptionId, StringComparison.OrdinalIgnoreCase)
            || account.ValueKind != JsonValueKind.Object || !account.TryGetProperty("user", out var user)
            || StringValue(user, "type") != "user" || !Guid.TryParse(tenant, out _)
            || StringValue(account, "environmentName") != "AzureCloud")
            throw new TransferException("Select the deployment subscription in AzureCloud and sign in as its approved administrator user. Service principals are not accepted.");
        return tenant!;
    }

    public static void ValidateServer(JsonElement server, AzureDeployment deployment)
    {
        var expectedId = $"/subscriptions/{deployment.SubscriptionId}/resourceGroups/{deployment.ResourceGroup}/providers/Microsoft.Sql/servers/{deployment.ServerName}";
        if (!string.Equals(StringValue(server, "id"), expectedId, StringComparison.OrdinalIgnoreCase)
            || StringValue(server, "fullyQualifiedDomainName") != deployment.ServerFqdn)
            throw new TransferException("The live SQL server does not match the approved deployment outputs.");
    }

    private async Task<AccessToken> GetCliTokenAsync(string tenant)
    {
        var credential = new AzureCliCredential(new AzureCliCredentialOptions
        {
            TenantId = tenant,
            Subscription = deployment.SubscriptionId,
            ProcessTimeout = TimeSpan.FromSeconds(30)
        });
        return await credential.GetTokenAsync(new TokenRequestContext(["https://database.windows.net/.default"]));
    }

    public static void ValidateTokenIdentity(AccessToken token, Guid user, string tenant)
    {
        // SQL validates the signature/audience. This additional claim check prevents a CLI
        // account switch between administrator validation and token acquisition.
        try
        {
            var segments = token.Token.Split('.');
            if (segments.Length != 3 || token.ExpiresOn <= DateTimeOffset.UtcNow.AddMinutes(1))
                throw new TransferException("The SQL access token is invalid or expired.");
            var encoded = segments[1].Replace('-', '+').Replace('_', '/');
            var bytes = Convert.FromBase64String(encoded.PadRight((encoded.Length + 3) / 4 * 4, '='));
            using var claims = JsonDocument.Parse(bytes);
            if (!Guid.TryParse(StringValue(claims.RootElement, "oid"), out var id) || id != user
                || !string.Equals(StringValue(claims.RootElement, "tid"), tenant, StringComparison.OrdinalIgnoreCase))
                throw new TransferException("Azure CLI identity changed or does not match the approved SQL administrator.");
        }
        catch (FormatException) { throw new TransferException("Cannot validate the SQL access token's identity."); }
        catch (JsonException) { throw new TransferException("Cannot validate the SQL access token's identity."); }
    }

    private static string? StringValue(JsonElement value, string name)
        => value.ValueKind == JsonValueKind.Object && value.TryGetProperty(name, out var property)
            && property.ValueKind == JsonValueKind.String ? property.GetString() : null;

    public static async Task<string> RunCliAsync(string[] arguments)
    {
        var start = new ProcessStartInfo
        {
            FileName = OperatingSystem.IsWindows() ? "powershell.exe" : "az",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };
        if (OperatingSystem.IsWindows())
        {
            foreach (var argument in new[] { "-NoProfile", "-NonInteractive", "-Command",
                "$ErrorActionPreference='Stop'; $arguments=ConvertFrom-Json $env:BOOKCATALOG_AZ_ARGUMENTS; & az @arguments; exit $LASTEXITCODE" })
                start.ArgumentList.Add(argument);
            start.Environment["BOOKCATALOG_AZ_ARGUMENTS"] = JsonSerializer.Serialize(arguments.Concat(["--only-show-errors"]));
        }
        else
            foreach (var argument in arguments.Concat(["--only-show-errors"])) start.ArgumentList.Add(argument);
        using var process = Process.Start(start) ?? throw new TransferException("Cannot start Azure CLI.");
        var stdout = process.StandardOutput.ReadToEndAsync();
        var stderr = process.StandardError.ReadToEndAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(60));
        try { await process.WaitForExitAsync(timeout.Token); }
        catch (OperationCanceledException)
        {
            process.Kill(entireProcessTree: true);
            throw new TransferException("Azure CLI timed out. No transfer was attempted.");
        }
        await stderr;
        if (process.ExitCode != 0)
            throw new TransferException("Azure CLI validation failed. Check login, subscription, user permissions, and the reviewed deployment outputs.");
        return await stdout;
    }
}
