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

    public string? ProposedCategory { get; set; }
    public string? ProposedCategoryByRole { get; set; }

    // Legacy single target (can keep or replace; updated controller uses the dual ones below)
    public string? TargetCardId { get; set; }

    // Dual-player secret target tracking
    public string? CreatorTargetCardId { get; set; }
    public string? JoinerTargetCardId { get; set; }

    // Turn tracking and Q&A routing
    public string CurrentTurnRole { get; set; } = "creator";
    public string? PendingQuestion { get; set; }
    public string? PendingQuestionAskedByRole { get; set; }

    public List<RoomQuestionHistoryResponse> QuestionHistory { get; } = new();
}