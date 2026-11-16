using GuessWho.Server.Database;
using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace GuessWho.Server.Tests.Database;

public sealed class DatabasePersistenceTests
{
    [Fact]
    public async Task DatabaseAppliesMigrationsSuccessfully()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        using var db = new AppDbContext(options);
        await db.Database.MigrateAsync();

        var canConnect = await db.Database.CanConnectAsync();
        Assert.True(canConnect);
    }
}