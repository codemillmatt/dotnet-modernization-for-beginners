:on error exit

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '$(RuntimeIdentityName)')
BEGIN
    CREATE USER [$(RuntimeIdentityName)]
        FROM EXTERNAL PROVIDER
        WITH OBJECT_ID = '$(RuntimeIdentityObjectId)';
END;

ALTER ROLE db_datareader ADD MEMBER [$(RuntimeIdentityName)];
ALTER ROLE db_datawriter ADD MEMBER [$(RuntimeIdentityName)];
