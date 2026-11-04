using GuessWho.Server.Models;

namespace GuessWho.Server.Services;

public sealed class GameRoom
{
    public string Code { get; init; } = string.Empty;
    public string CreatorId { get; init; } = string.Empty;
    public string CreatorName { get; init; } = string.Empty;
    public string? JoinerId { get; set; }
    public string? JoinerName { get; set; }
    public string Status { get; set; } = "WaitingForPlayer";
    public string? Category { get; set; }
    public List<Card> Board { get; set; } = new();
    public string? TargetCardId { get; set; }
    public string? PendingQuestion { get; set; }
    public List<RoomQuestionHistoryResponse> QuestionHistory { get; } = new();
}
