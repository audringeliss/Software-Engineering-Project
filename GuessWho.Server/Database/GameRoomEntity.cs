namespace GuessWho.Server.Database;

public sealed class GameRoomEntity
{
    public string Code { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public ICollection<RoomPlayerEntity> Players { get; set; } = new List<RoomPlayerEntity>();
    public GameSessionEntity? GameSession { get; set; }
}