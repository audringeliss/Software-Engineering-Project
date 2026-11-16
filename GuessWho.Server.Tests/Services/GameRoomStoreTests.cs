using GuessWho.Server.Database;
using GuessWho.Server.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace GuessWho.Server.Tests.Services;

public sealed class GameRoomStoreTests
{
    private readonly IDbContextFactory<AppDbContext> _factory;

    public GameRoomStoreTests()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        _factory = new PooledDbContextFactory<AppDbContext>(options);
        using var db = _factory.CreateDbContext();
        db.Database.EnsureCreated();
    }

    [Fact]
    public void Create_GeneratesValidRoomWithCorrectDefaults()
    {
        var store = new GameRoomStore(_factory);
        var room = store.Create("HostPlayer");

        Assert.NotNull(room);
        Assert.Equal(6, room.Code.Length);
        Assert.Equal("HostPlayer", room.CreatorName);
        Assert.Equal("WaitingForPlayer", room.Status);
    }

    [Fact]
    public void Join_SucceedsForEmptyRoomAndUpdatesStatus()
    {
        var store = new GameRoomStore(_factory);
        var room = store.Create("HostPlayer");

        var joinerId = store.Join(room, "GuestPlayer");

        Assert.NotNull(joinerId);
        Assert.Equal("GuestPlayer", room.JoinerName);
        Assert.Equal("WaitingForTarget", room.Status);
    }

    [Fact]
    public void Join_ReturnsNullWhenRoomIsAlreadyFull()
    {
        var store = new GameRoomStore(_factory);
        var room = store.Create("HostPlayer");

        store.Join(room, "FirstGuest");
        var secondJoinerId = store.Join(room, "SecondGuest");

        Assert.Null(secondJoinerId);
    }

    [Fact]
    public async Task ConcurrentRoomUpdatesAreThreadSafe()
    {
        var store = new GameRoomStore(_factory);
        var room = store.Create("HostPlayer");

        var tasks = Enumerable.Range(0, 30).Select(_ => Task.Run(() =>
        {
            store.ExecuteAtomic(room.Code, r =>
            {
                r.CreatorFlippedCardIds.Add(Guid.NewGuid().ToString());
                return true;
            });
        }));

        await Task.WhenAll(tasks);

        var finalRoom = store.Find(room.Code);
        Assert.NotNull(finalRoom);
        Assert.Equal(30, finalRoom.CreatorFlippedCardIds.Count);
    }
}