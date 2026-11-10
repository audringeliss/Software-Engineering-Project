namespace GuessWho.Server.Models;

public sealed record RoomMembershipResponse(string RoomCode, string PlayerId, string Role);

public sealed record RoomCardResponse(
    string Id,
    string Name,
    string Category,
    string ImageUrl,
    IReadOnlyList<string> Attributes,
    bool IsFlipped);

public sealed record RoomQuestionHistoryResponse(string Question, string Answer, string AskedByRole);

public sealed record RoomStateResponse(
    string RoomCode,
    string Role,
    string CreatorName,
    string? JoinerName,
    string Status,
    string? Category,
    string? ProposedCategory,
    string? ProposedCategoryByRole,
    bool HasSelectedTarget,
    bool BothTargetsSelected,
    string CurrentTurnRole,
    IReadOnlyList<RoomCardResponse> Board,
    string? PendingQuestion,
    string? PendingQuestionAskedByRole,
    IReadOnlyList<RoomQuestionHistoryResponse> QuestionHistory);