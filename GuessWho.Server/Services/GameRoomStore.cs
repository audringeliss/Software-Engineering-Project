using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace GuessWho.Server.Services;

public sealed class GameRoomStore
{
    private const string CodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new(StringComparer.OrdinalIgnoreCase);

    public GameRoom Create(string creatorName)
    {
        while (true)
        {
            var code = CreateCode();
            var room = new GameRoom
            {
                Code = code,
                CreatorId = Guid.NewGuid().ToString("N"),
                CreatorName = creatorName.Trim()
            };

            if (_rooms.TryAdd(code, room))
            {
                return room;
            }
        }
    }

    public GameRoom? Find(string code)
    {
        return _rooms.TryGetValue(code.Trim(), out var room) ? room : null;
    }

    public string? Join(GameRoom room, string playerName)
    {
        lock (room)
        {
            if (room.JoinerId is not null)
            {
                return null;
            }

            room.JoinerId = Guid.NewGuid().ToString("N");
            room.JoinerName = playerName.Trim();
            room.Status = "WaitingForTarget";
            return room.JoinerId;
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
