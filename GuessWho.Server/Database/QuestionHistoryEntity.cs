namespace GuessWho.Server.Database;

public sealed class QuestionHistoryEntity
{
    public int Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string AskedByRole { get; set; } = string.Empty;

    public GameSessionEntity GameSession { get; set; } = null!;
}