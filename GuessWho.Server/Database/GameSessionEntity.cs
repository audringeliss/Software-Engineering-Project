namespace GuessWho.Server.Database;

public sealed class GameSessionEntity
{
    public string RoomCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? ProposedCategory { get; set; }
    public string? ProposedCategoryByRole { get; set; }
    public string BoardJson { get; set; } = "[]";
    public string? TargetCardId { get; set; }
    public string? CreatorTargetCardId { get; set; }
    public string? JoinerTargetCardId { get; set; }
    public string CreatorFlippedCardIdsJson { get; set; } = "[]";
    public string JoinerFlippedCardIdsJson { get; set; } = "[]";
    public string CurrentTurnRole { get; set; } = "creator";
    public string? PendingQuestion { get; set; }
    public string? PendingQuestionAskedByRole { get; set; }
    public string? WinnerRole { get; set; }

    public GameRoomEntity Room { get; set; } = null!;
    public ICollection<QuestionHistoryEntity> QuestionHistory { get; set; } = new List<QuestionHistoryEntity>();
}
