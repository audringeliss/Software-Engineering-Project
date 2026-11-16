namespace GuessWho.Server.Database;

public sealed class RoomPlayerEntity
{
    public string PlayerId { get; set; } = string.Empty;
    public string RoomCode { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public GameRoomEntity Room { get; set; } = null!;
}
