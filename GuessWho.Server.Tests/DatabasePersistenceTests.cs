using GuessWho.Server.Database;
using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace GuessWho.Server.Tests;

public sealed class DatabasePersistenceTests
{
    [Fact]
    public void RoomAndSessionStateAreRestoredFromRelationalDatabase()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        var factory = new PooledDbContextFactory<AppDbContext>(options);

        using (var db = factory.CreateDbContext())
        {
            db.Database.EnsureCreated();
        }

        var store = new GameRoomStore(factory);
        var creatorRoom = store.Create("Creator");
        var joinerId = store.Join(creatorRoom, "Joiner");
        Assert.NotNull(joinerId);

        creatorRoom.Category = "animals";
        creatorRoom.Status = "Playing";
        creatorRoom.CreatorTargetCardId = "cat";
        creatorRoom.JoinerTargetCardId = "dog";
        creatorRoom.PendingQuestion = "Does it have fur?";
        creatorRoom.PendingQuestionAskedByRole = "creator";
        creatorRoom.Board.Add(new Card
        {
            Id = "cat",
            Name = "Cat",
            Category = "animals",
            Attributes = new List<string> { "fur" }
        });
        creatorRoom.CreatorFlippedCardIds.Add("dog");
        creatorRoom.QuestionHistory.Add(
            new RoomQuestionHistoryResponse("Does it have fur?", "True", "creator"));
        store.Save(creatorRoom);

        var restoredRoom = Assert.IsType<GameRoom>(new GameRoomStore(factory).Find(creatorRoom.Code));

        Assert.Equal(creatorRoom.CreatorId, restoredRoom.CreatorId);
        Assert.Equal(joinerId, restoredRoom.JoinerId);
        Assert.Equal("Joiner", restoredRoom.JoinerName);
        Assert.Equal("Playing", restoredRoom.Status);
        Assert.Equal("animals", restoredRoom.Category);
        Assert.Equal("cat", restoredRoom.CreatorTargetCardId);
        Assert.Equal("Does it have fur?", restoredRoom.PendingQuestion);
        Assert.Contains("dog", restoredRoom.CreatorFlippedCardIds);
        Assert.Equal("cat", Assert.Single(restoredRoom.Board).Id);
        Assert.Equal(new RoomQuestionHistoryResponse("Does it have fur?", "True", "creator"),
            Assert.Single(restoredRoom.QuestionHistory));
    }
}