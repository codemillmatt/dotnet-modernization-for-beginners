using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Microsoft.Data.SqlClient;

namespace BookCatalog.Data;

public static partial class Configuration
{
    public const string LocalDatabase = "BookCatalogModernizedLab";

    public static SqlConnectionStringBuilder ReadLocal(string path, bool destination)
    {
        string connectionString;
        if (Path.GetExtension(path).Equals(".config", StringComparison.OrdinalIgnoreCase))
        {
            using var reader = XmlReader.Create(path, new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null });
            var entries = XDocument.Load(reader).Root?.Element("connectionStrings")?.Elements("add")
                .Where(e => (string?)e.Attribute("name") == "BookCatalogContext").ToArray();
            if (entries?.Length != 1 || entries[0].Attribute("connectionString") is null)
                throw new TransferException("The configuration must contain exactly one BookCatalogContext connection string.");
            connectionString = entries[0].Attribute("connectionString")!.Value;
        }
        else if (Path.GetExtension(path).Equals(".json", StringComparison.OrdinalIgnoreCase))
        {
            using var json = ParseJson(File.ReadAllText(path));
            if (json.RootElement.ValueKind != JsonValueKind.Object
                || !json.RootElement.TryGetProperty("ConnectionStrings", out var strings)
                || strings.ValueKind != JsonValueKind.Object
                || !strings.TryGetProperty("BookCatalogContext", out var value) || value.ValueKind != JsonValueKind.String)
                throw new TransferException("The configuration needs ConnectionStrings:BookCatalogContext.");
            connectionString = value.GetString()!;
        }
        else throw new TransferException("Use Web.config or appsettings.json, not an environment variable or secret file.");

        return ValidateLocal(connectionString, Path.GetDirectoryName(Path.GetFullPath(path))!, destination);
    }

    public static SqlConnectionStringBuilder ValidateLocal(string connectionString, string configDirectory, bool destination)
    {
        SqlConnectionStringBuilder supplied;
        try { supplied = new(connectionString); }
        catch (ArgumentException) { throw new TransferException("Invalid local SQL connection configuration."); }
        if (!LocalServerPattern().IsMatch(supplied.DataSource) || !supplied.IntegratedSecurity
            || supplied.UserID.Length != 0 || supplied.Password.Length != 0
            || supplied.Authentication != SqlAuthenticationMethod.NotSpecified
            || supplied.FailoverPartner.Length != 0 || supplied.UserInstance)
            throw new TransferException("Local configuration must use an explicit named LocalDB instance and Windows integrated security, without credentials or failover.");
        if (destination && (supplied.InitialCatalog != LocalDatabase || supplied.AttachDBFilename.Length != 0))
            throw new TransferException($"Local destination must be the existing {LocalDatabase} database, without AttachDbFilename.");
        if (!destination && supplied.InitialCatalog.Length == 0 && supplied.AttachDBFilename.Length == 0)
            throw new TransferException("The source must identify an existing database or its attached MDF file.");

        var attachedFile = supplied.AttachDBFilename;
        const string dataDirectory = "|DataDirectory|";
        if (attachedFile.StartsWith(dataDirectory, StringComparison.OrdinalIgnoreCase))
        {
            var root = Path.GetFullPath(Path.Combine(configDirectory, "App_Data"));
            var relativeFile = attachedFile[dataDirectory.Length..].TrimStart('\\', '/')
                .Replace('\\', Path.DirectorySeparatorChar);
            attachedFile = Path.GetFullPath(Path.Combine(root, relativeFile));
            if (!attachedFile.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                throw new TransferException("AttachDbFilename must stay inside the configuration's App_Data directory.");
        }
        else if (attachedFile.Length > 0)
            attachedFile = Path.GetFullPath(attachedFile, configDirectory);

        return new()
        {
            DataSource = supplied.DataSource,
            InitialCatalog = supplied.InitialCatalog,
            AttachDBFilename = attachedFile,
            IntegratedSecurity = true,
            Encrypt = false,
            TrustServerCertificate = true,
            Pooling = false,
            ConnectTimeout = 15,
            ConnectRetryCount = 0,
            ApplicationName = "BookCatalog selected-record helper"
        };
    }

    public static JsonDocument ParseJson(string json)
    {
        try { return JsonDocument.Parse(json, new JsonDocumentOptions { AllowDuplicateProperties = false }); }
        catch (JsonException) { throw new TransferException("Invalid JSON configuration or deployment outputs."); }
    }

    [GeneratedRegex(@"^\(localdb\)\\[A-Za-z0-9][A-Za-z0-9_-]{0,99}$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex LocalServerPattern();
}
