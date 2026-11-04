namespace GuessWho.Server.Models;

/// <summary>Credentials and role assigned when entering a room.</summary>
public sealed record RoomMembershipResponse(string RoomCode, string PlayerId, string Role);

/// <summary>A card displayed on the shared room board.</summary>
public sealed record RoomCardResponse(
    string Id,
    string Name,
    string Category,
    string ImageUrl,
    IReadOnlyList<string> Attributes,
    bool IsFlipped);

/// <summary>A question and answer already completed in the room.</summary>
public sealed record RoomQuestionHistoryResponse(string Question, string Answer);

/// <summary>Current public game state visible to either room member.</summary>
public sealed record RoomStateResponse(
    string RoomCode,
    string Role,
    string CreatorName,
    string? JoinerName,
    string Status,
    string? Category,
    IReadOnlyList<RoomCardResponse> Board,
    string? PendingQuestion,
    IReadOnlyList<RoomQuestionHistoryResponse> QuestionHistory);
