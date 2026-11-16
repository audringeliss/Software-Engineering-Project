using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.Json;
using GuessWho.Server.Database;
using GuessWho.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace GuessWho.Server.Services;

public sealed class GameRoomStore
{
    private const string CodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, object> _roomLocks = new(StringComparer.OrdinalIgnoreCase);
    private readonly IDbContextFactory<AppDbContext> _dbContextFactory;

    public GameRoomStore(IDbContextFactory<AppDbContext> dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
        RestoreRooms();
    }

    private object GetRoomLock(string code) =>
        _roomLocks.GetOrAdd(code, _ => new object());

    public GameRoom Create(string creatorName)
    {
        while (true)
        {
            var code = CreateCode();
            var room = new GameRoom
            {
                Code = code,
                CreatorId = Guid.NewGuid().ToString("N"),
                CreatorName = creatorName.Trim(),
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow
            };

            if (_rooms.TryAdd(code, room))
            {
                var roomLock = GetRoomLock(code);
                lock (roomLock)
                {
                    try
                    {
                        Save(room);
                        return room;
                    }
                    catch
                    {
                        _rooms.TryRemove(code, out _);
                        _roomLocks.TryRemove(code, out _);
                        throw;
                    }
                }
            }
        }
    }

    public GameRoom? Find(string code)
    {
        return _rooms.TryGetValue(code.Trim(), out var room) ? room : null;
    }

    public string? Join(GameRoom room, string playerName)
    {
        var roomLock = GetRoomLock(room.Code);
        lock (roomLock)
        {
            if (room.JoinerId is not null)
            {
                return null;
            }

            room.JoinerId = Guid.NewGuid().ToString("N");
            room.JoinerName = playerName.Trim();
            room.Status = "WaitingForTarget";
            room.LastActivityAt = DateTime.UtcNow;
            Save(room);
            return room.JoinerId;
        }
    }

    /// <summary>
    /// Executes a mutation action and persists the room state atomically under a single lock per room.
    /// </summary>
    public T? ExecuteAtomic<T>(string code, Func<GameRoom, T> action)
    {
        var room = Find(code);
        if (room == null) return default;

        var roomLock = GetRoomLock(code);
        lock (roomLock)
        {
            room = Find(code);
            if (room == null) return default;

            var result = action(room);
            room.LastActivityAt = DateTime.UtcNow;
            Save(room);
            return result;
        }
    }

    public void Save(GameRoom room)
    {
        var roomLock = GetRoomLock(room.Code);
        lock (roomLock)
        {
            using var db = _dbContextFactory.CreateDbContext();
            using var transaction = db.Database.BeginTransaction();

            var roomEntity = db.GameRooms
                .Include(entity => entity.Players)
                .Include(entity => entity.GameSession)
                    .ThenInclude(session => session!.QuestionHistory)
                .SingleOrDefault(entity => entity.Code == room.Code);

            if (roomEntity is null)
            {
                roomEntity = new GameRoomEntity
                {
                    Code = room.Code,
                    CreatedAt = room.CreatedAt
                };
                db.GameRooms.Add(roomEntity);
            }

            UpdatePlayer(roomEntity, room.CreatorId, "creator", room.CreatorName);
            if (room.JoinerId is not null && room.JoinerName is not null)
            {
                UpdatePlayer(roomEntity, room.JoinerId, "joiner", room.JoinerName);
            }

            var playerIds = new HashSet<string> { room.CreatorId };
            if (room.JoinerId is not null)
            {
                playerIds.Add(room.JoinerId);
            }

            foreach (var stalePlayer in roomEntity.Players.Where(player => !playerIds.Contains(player.PlayerId)).ToList())
            {
                db.RoomPlayers.Remove(stalePlayer);
            }

            var session = roomEntity.GameSession ?? new GameSessionEntity { RoomCode = room.Code };
            roomEntity.GameSession = session;
            session.Status = room.Status;
            session.Category = room.Category;
            session.ProposedCategory = room.ProposedCategory;
            session.ProposedCategoryByRole = room.ProposedCategoryByRole;
            session.BoardJson = JsonSerializer.Serialize(room.Board);
            session.TargetCardId = room.TargetCardId;
            session.CreatorTargetCardId = room.CreatorTargetCardId;
            session.JoinerTargetCardId = room.JoinerTargetCardId;
            session.CreatorFlippedCardIdsJson = JsonSerializer.Serialize(room.CreatorFlippedCardIds);
            session.JoinerFlippedCardIdsJson = JsonSerializer.Serialize(room.JoinerFlippedCardIds);
            session.CurrentTurnRole = room.CurrentTurnRole;
            session.PendingQuestion = room.PendingQuestion;
            session.PendingQuestionAskedByRole = room.PendingQuestionAskedByRole;
            session.WinnerRole = room.WinnerRole;
            session.LastActivityAt = room.LastActivityAt;

            var historyEntities = session.QuestionHistory.OrderBy(history => history.Sequence).ToList();
            for (var index = 0; index < room.QuestionHistory.Count; index++)
            {
                var entry = room.QuestionHistory[index];
                var history = index < historyEntities.Count
                    ? historyEntities[index]
                    : new QuestionHistoryEntity { RoomCode = room.Code, Sequence = index };
                history.Sequence = index;
                history.Question = entry.Question;
                history.Answer = entry.Answer;
                history.AskedByRole = entry.AskedByRole;
                if (index >= historyEntities.Count)
                {
                    session.QuestionHistory.Add(history);
                }
            }

            foreach (var extraHistory in historyEntities.Skip(room.QuestionHistory.Count))
            {
                db.QuestionHistories.Remove(extraHistory);
            }

            db.SaveChanges();
            transaction.Commit();
        }
    }

    public static string? GetRole(GameRoom room, string playerId)
    {
        if (room.CreatorId == playerId)
        {
            return "creator";
        }

        return room.JoinerId == playerId ? "joiner" : null;
    }

    private void RestoreRooms()
    {
        using var db = _dbContextFactory.CreateDbContext();

        var storedRooms = db.GameRooms
            .AsNoTracking()
            .AsSplitQuery()
            .Include(room => room.Players)
            .Include(room => room.GameSession)
                .ThenInclude(session => session!.QuestionHistory)
            .ToList();

        var cutoffTime = DateTime.UtcNow.AddHours(-2);
        var gameOverCutoff = DateTime.UtcNow.AddMinutes(-15);

        // Perform cleanup filtering in-memory to prevent EF Core translation errors on unmapped properties
        var staleRoomCodes = storedRooms
            .Where(room => room.GameSession != null &&
                (room.CreatedAt < cutoffTime ||
                 (room.GameSession.Status == "GameOver" && room.CreatedAt < gameOverCutoff)))
            .Select(room => room.Code)
            .ToList();

        if (staleRoomCodes.Count > 0)
        {
            var entitiesToRemove = db.GameRooms.Where(room => staleRoomCodes.Contains(room.Code)).ToList();
            db.GameRooms.RemoveRange(entitiesToRemove);
            db.SaveChanges();
        }

        var activeRooms = storedRooms.Where(room => !staleRoomCodes.Contains(room.Code)).ToList();

        foreach (var storedRoom in activeRooms)
        {
            var creator = storedRoom.Players.Single(player => player.Role == "creator");
            var joiner = storedRoom.Players.SingleOrDefault(player => player.Role == "joiner");
            var session = storedRoom.GameSession
                ?? throw new InvalidOperationException($"Room {storedRoom.Code} has no game session.");

            var room = new GameRoom
            {
                Code = storedRoom.Code,
                CreatedAt = storedRoom.CreatedAt,
                LastActivityAt = session.LastActivityAt,
                CreatorId = creator.PlayerId,
                CreatorName = creator.Name,
                JoinerId = joiner?.PlayerId,
                JoinerName = joiner?.Name,
                Status = session.Status,
                Category = session.Category,
                ProposedCategory = session.ProposedCategory,
                ProposedCategoryByRole = session.ProposedCategoryByRole,
                Board = JsonSerializer.Deserialize<List<Card>>(session.BoardJson)
                    ?? throw new InvalidOperationException($"Room {storedRoom.Code} has invalid board data."),
                TargetCardId = session.TargetCardId,
                CreatorTargetCardId = session.CreatorTargetCardId,
                JoinerTargetCardId = session.JoinerTargetCardId,
                CurrentTurnRole = session.CurrentTurnRole,
                PendingQuestion = session.PendingQuestion,
                PendingQuestionAskedByRole = session.PendingQuestionAskedByRole,
                WinnerRole = session.WinnerRole
            };

            foreach (var cardId in JsonSerializer.Deserialize<List<string>>(session.CreatorFlippedCardIdsJson)
                ?? throw new InvalidOperationException($"Room {storedRoom.Code} has invalid creator card state."))
            {
                room.CreatorFlippedCardIds.Add(cardId);
            }

            foreach (var cardId in JsonSerializer.Deserialize<List<string>>(session.JoinerFlippedCardIdsJson)
                ?? throw new InvalidOperationException($"Room {storedRoom.Code} has invalid joiner card state."))
            {
                room.JoinerFlippedCardIds.Add(cardId);
            }

            foreach (var history in session.QuestionHistory.OrderBy(history => history.Sequence))
            {
                room.QuestionHistory.Add(new RoomQuestionHistoryResponse(
                    history.Question,
                    history.Answer,
                    history.AskedByRole));
            }

            _rooms.AddOrUpdate(room.Code, room, (_, _) =>
                throw new InvalidOperationException($"Duplicate room code {room.Code} in database."));
        }
    }

    private static void UpdatePlayer(GameRoomEntity room, string playerId, string role, string name)
    {
        var player = room.Players.SingleOrDefault(existing => existing.PlayerId == playerId);
        if (player is null)
        {
            room.Players.Add(new RoomPlayerEntity
            {
                PlayerId = playerId,
                RoomCode = room.Code,
                Role = role,
                Name = name
            });
            return;
        }

        player.Role = role;
        player.Name = name;
    }

    private static string CreateCode()
    {
        return string.Create(6, CodeCharacters, static (span, characters) =>
        {
            for (var index = 0; index < span.Length; index++)
            {
                span[index] = characters[RandomNumberGenerator.GetInt32(characters.Length)];
            }
        });
    }
}