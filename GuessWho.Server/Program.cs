using GuessWho.Server.Services;
using Microsoft.EntityFrameworkCore;
using GuessWho.Server.Database;
using Microsoft.Data.Sqlite;
using GuessWho.Server.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddScoped<CardDataLoader>();
builder.Services.AddSingleton<GameState>();
builder.Services.AddSingleton<GameRoomStore>();
builder.Services.AddSingleton<RoomActionExecutor<GameRoom>>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=guesswho.db";
var sqliteConnection = new SqliteConnectionStringBuilder(connectionString);
if (sqliteConnection.DataSource != ":memory:" && !Path.IsPathRooted(sqliteConnection.DataSource))
{
    sqliteConnection.DataSource = Path.Combine(builder.Environment.ContentRootPath, sqliteConnection.DataSource);
}
builder.Services.AddDbContextFactory<AppDbContext>(options =>
    options.UseSqlite(sqliteConnection.ToString()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsSqlite())
    {
        var connection = db.Database.GetDbConnection();
        connection.Open();
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'Users')
                """;
            using var reader = command.ExecuteReader();
            reader.Read();
            var hasUsersTable = reader.GetInt64(0) != 0;
            reader.Close();

            if (hasUsersTable)
            {
                using var baselineCommand = connection.CreateCommand();
                baselineCommand.CommandText = """
                    CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                        "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                        "ProductVersion" TEXT NOT NULL
                    );
                    INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                    VALUES ('20261025135005_InitialCreate', '10.0.13');
                    """;
                baselineCommand.ExecuteNonQuery();
            }
        }
        finally
        {
            connection.Close();
        }
    }

    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

app.MapHub<GameHub>("/gamehub");

app.Run();

public partial class Program { }