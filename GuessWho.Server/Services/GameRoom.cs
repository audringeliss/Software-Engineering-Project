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
    
    // Category proposal states
    public string? ProposedCategory { get; set; }
    public string? ProposedCategoryByRole { get; set; }

    public List<Card> Board { get; set; } = new();
    
    public string? TargetCardId { get; set; }
    public string? CreatorTargetCardId { get; set; }
    public string? JoinerTargetCardId { get; set; }

    public string CurrentTurnRole { get; set; } = "creator";
    public string? PendingQuestion { get; set; }
    public string? PendingQuestionAskedByRole { get; set; }

    public List<RoomQuestionHistoryResponse> QuestionHistory { get; } = new();
}