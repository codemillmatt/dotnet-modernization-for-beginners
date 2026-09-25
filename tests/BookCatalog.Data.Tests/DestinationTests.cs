using System.Text.Json;
using System.Text.Json.Nodes;
using Azure.Core;
using BookCatalog.Data;

namespace BookCatalog.Data.Tests;

public class DestinationTests
{
    internal static string DeploymentJson()
    {
        var values = new Dictionary<string, string>
        {
            ["resourceGroup"] = "rg-bookcatalog-test", ["subscriptionId"] = "11111111-1111-1111-1111-111111111111",
            ["appName"] = "bc-web-test", ["appUrl"] = "https://bc-web-test.azurewebsites.net",
            ["sqlServerName"] = "bc-sql-test", ["sqlServerFqdn"] = "bc-sql-test.database.windows.net",
            ["databaseName"] = "BookCatalogLab", ["keyVaultName"] = "bc-kv-test",
            ["identityClientId"] = "22222222-2222-2222-2222-222222222222",
            ["identityPrincipalId"] = "33333333-3333-3333-3333-333333333333"
        };
        return JsonSerializer.Serialize(values.ToDictionary(p => p.Key, p => new { type = "String", value = p.Value }));
    }

    [Theory]
    [InlineData("Server=production;Database=BookCatalogModernizedLab;Integrated Security=True")]
    [InlineData("Server=(localdb)\\MSSQLLocalDB;Database=master;Integrated Security=True")]
    [InlineData("Server=(localdb)\\MSSQLLocalDB;Database=BookCatalog;Integrated Security=True")]
    [InlineData("Server=(localdb)\\MSSQLLocalDB;Database=BookCatalogModernizedLab;User ID=sa;Password=secret")]
    [InlineData("Server=(localdb)\\MSSQLLocalDB;Database=BookCatalogModernizedLab;Integrated Security=True;AttachDbFilename=source.mdf")]
    [InlineData("Server=(localdb)\\MSSQLLocalDB;Database=BookCatalogModernizedLab;Integrated Security=True;Failover Partner=elsewhere")]
    [InlineData("Server=(localdb)\\MSSQLLocalDB;Database=BookCatalogModernizedLab;Integrated Security=True;User ID=unexpected")]
    public void RefusesWrongDestinationAndCredentialModes(string connection)
        => Assert.Throws<TransferException>(() => Configuration.ValidateLocal(connection, Environment.CurrentDirectory, true));

    [Fact]
    public void AcceptsOnlyTheSeparateLocalLab()
    {
        var configuration = Configuration.ValidateLocal(
            "Server=(localdb)\\MSSQLLocalDB;Database=BookCatalogModernizedLab;Integrated Security=True;TrustServerCertificate=True",
            Environment.CurrentDirectory, true);
        Assert.Equal(Configuration.LocalDatabase, configuration.InitialCatalog);
        Assert.False(configuration.Pooling);
    }

    [Fact]
    public void ResolvesDataDirectoryRelativeToTheWebConfigNotProcessDirectory()
    {
        var directory = Path.Combine(Environment.CurrentDirectory, "legacy-web");
        var configuration = Configuration.ValidateLocal(
            "Data Source=(LocalDB)\\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\\BookCatalog.mdf;Integrated Security=True",
            directory, false);
        Assert.Equal(Path.Combine(directory, "App_Data", "BookCatalog.mdf"), configuration.AttachDBFilename);
        Assert.Throws<TransferException>(() => Configuration.ValidateLocal(
            "Data Source=(LocalDB)\\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\\..\\elsewhere.mdf;Integrated Security=True", directory, false));
    }

    [Theory]
    [InlineData("sqlServerFqdn", "production.database.windows.net")]
    [InlineData("sqlServerFqdn", "bc-sql-different.database.windows.net")]
    [InlineData("databaseName", "Production")]
    [InlineData("resourceGroup", "rg-production")]
    [InlineData("subscriptionId", "not-a-subscription")]
    [InlineData("appUrl", "https://bc-web-other.azurewebsites.net")]
    public void RefusesUnexpectedAzureOutputs(string field, string value)
    {
        var root = JsonNode.Parse(DeploymentJson())!;
        root[field]!["value"] = value;
        Assert.Throws<TransferException>(() => AzureDeployment.Parse(root.ToJsonString()));
    }

    [Fact]
    public void RefusesMissingAzureOutputAndUnexpectedSecrets()
    {
        var root = JsonNode.Parse(DeploymentJson())!.AsObject();
        root.Remove("subscriptionId");
        Assert.Throws<TransferException>(() => AzureDeployment.Parse(root.ToJsonString()));
        root = JsonNode.Parse(DeploymentJson())!.AsObject();
        root.Add("password", "not-allowed");
        Assert.Throws<TransferException>(() => AzureDeployment.Parse(root.ToJsonString()));
    }

    [Theory]
    [InlineData("22222222-2222-2222-2222-222222222222", "user", "AzureCloud")]
    [InlineData("11111111-1111-1111-1111-111111111111", "servicePrincipal", "AzureCloud")]
    [InlineData("11111111-1111-1111-1111-111111111111", "user", "AzureUSGovernment")]
    public void RefusesWrongSubscriptionIdentityOrCloud(string subscription, string identity, string cloud)
    {
        using var account = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            id = subscription, user = new { type = identity }, environmentName = cloud, tenantId = Guid.NewGuid()
        }));
        Assert.Throws<TransferException>(() => AzureTarget.ValidateAccount(account.RootElement, AzureDeployment.Parse(DeploymentJson())));
    }

    [Fact]
    public async Task FailedAzureAccountCheckStopsBeforeAnyTokenOrSqlConnection()
    {
        var calls = new List<string[]>();
        var target = new AzureTarget(AzureDeployment.Parse(DeploymentJson()), args =>
        {
            calls.Add(args);
            return Task.FromResult("{\"id\":\"wrong\"}");
        });
        await Assert.ThrowsAsync<TransferException>(target.ConnectAsync);
        Assert.Single(calls);
        Assert.Equal(["account", "show", "-o", "json"], calls[0]);
    }

    [Fact]
    public async Task ApprovedCloudPathUsesOnlyExplicitCliUserAndEncryptedLabConnection()
    {
        var deployment = AzureDeployment.Parse(DeploymentJson());
        var calls = new List<string[]>();
        var user = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var tenant = "55555555-5555-5555-5555-555555555555";
        var target = new AzureTarget(deployment, args =>
        {
            calls.Add(args);
            return Task.FromResult(args[0] switch
            {
                "account" => JsonSerializer.Serialize(new { id = deployment.SubscriptionId, tenantId = tenant,
                    environmentName = "AzureCloud", user = new { type = "user" } }),
                "ad" => JsonSerializer.Serialize(new { id = user }),
                "sql" when args[2] == "ad-admin" => JsonSerializer.Serialize(new[] { new { sid = user, tenantId = tenant } }),
                "sql" => JsonSerializer.Serialize(new
                {
                    id = $"/subscriptions/{deployment.SubscriptionId}/resourceGroups/{deployment.ResourceGroup}/providers/Microsoft.Sql/servers/{deployment.ServerName}",
                    fullyQualifiedDomainName = deployment.ServerFqdn
                }),
                "group" => "dotnet-modernization",
                _ => throw new InvalidOperationException("Unexpected CLI operation")
            });
        }, selectedTenant =>
        {
            Assert.Equal(tenant, selectedTenant);
            return Task.FromResult(Token(user, tenant));
        });
        await using var connection = await target.ConnectAsync();
        Assert.Equal(5, calls.Count);
        Assert.All(calls, args => Assert.DoesNotContain("create", args));
        Assert.All(calls, args => Assert.DoesNotContain("get-access-token", args));
        var configuration = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connection.ConnectionString);
        Assert.Equal("tcp:bc-sql-test.database.windows.net,1433", configuration.DataSource);
        Assert.Equal("BookCatalogLab", configuration.InitialCatalog);
        Assert.Equal(Microsoft.Data.SqlClient.SqlConnectionEncryptOption.Mandatory, configuration.Encrypt);
        Assert.False(configuration.TrustServerCertificate);
        Assert.False(configuration.Pooling);
        Assert.Empty(configuration.Password);
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("{\"id\":42}")]
    [InlineData("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"user\":42}")]
    public void MalformedCloudAccountIsRejectedWithoutImplicitCoercion(string json)
    {
        using var account = JsonDocument.Parse(json);
        Assert.Throws<TransferException>(() => AzureTarget.ValidateAccount(account.RootElement, AzureDeployment.Parse(DeploymentJson())));
    }

    [Fact]
    public void RefusesTokenForAnotherUserTenantOrAnExpiredToken()
    {
        var user = Guid.NewGuid();
        var tenant = Guid.NewGuid().ToString();
        AzureTarget.ValidateTokenIdentity(Token(user, tenant), user, tenant);
        Assert.Throws<TransferException>(() => AzureTarget.ValidateTokenIdentity(Token(Guid.NewGuid(), tenant), user, tenant));
        Assert.Throws<TransferException>(() => AzureTarget.ValidateTokenIdentity(Token(user, Guid.NewGuid().ToString()), user, tenant));
        Assert.Throws<TransferException>(() => AzureTarget.ValidateTokenIdentity(new AccessToken("not-a-jwt", DateTimeOffset.UtcNow.AddHours(1)), user, tenant));
        Assert.Throws<TransferException>(() => AzureTarget.ValidateTokenIdentity(new AccessToken(Token(user, tenant).Token, DateTimeOffset.UtcNow.AddMinutes(-1)), user, tenant));
    }

    [Fact]
    public async Task NonAdministratorStopsBeforeTokenAcquisition()
    {
        var deployment = AzureDeployment.Parse(DeploymentJson());
        var tenant = Guid.NewGuid().ToString();
        var user = Guid.NewGuid();
        var acquiredToken = false;
        var target = new AzureTarget(deployment, args => Task.FromResult(args[0] switch
        {
            "account" => JsonSerializer.Serialize(new { id = deployment.SubscriptionId, tenantId = tenant,
                environmentName = "AzureCloud", user = new { type = "user" } }),
            "ad" => JsonSerializer.Serialize(new { id = user }),
            "sql" => "[]",
            _ => throw new InvalidOperationException("Must stop at administrator validation")
        }), _ =>
        {
            acquiredToken = true;
            return Task.FromResult(Token(user, tenant));
        });
        await Assert.ThrowsAsync<TransferException>(target.ConnectAsync);
        Assert.False(acquiredToken);
    }

    private static AccessToken Token(Guid user, string tenant)
    {
        var json = JsonSerializer.SerializeToUtf8Bytes(new { oid = user, tid = tenant });
        var payload = Convert.ToBase64String(json).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return new AccessToken($"header.{payload}.signature", DateTimeOffset.UtcNow.AddHours(1));
    }
}
