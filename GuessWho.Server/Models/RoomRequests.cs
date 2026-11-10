using System.ComponentModel.DataAnnotations;

namespace GuessWho.Server.Models;

public sealed record CreateRoomRequest
{
    [Required, StringLength(40, MinimumLength = 1)]
    public required string PlayerName { get; init; }
}

public sealed record JoinRoomRequest
{
    [Required, StringLength(40, MinimumLength = 1)]
    public required string PlayerName { get; init; }
}

public sealed record ProposeCategoryRequest
{
    [Required]
    public required string PlayerId { get; init; }

    [Required]
    public required string Category { get; init; }
}

public sealed record RespondCategoryRequest
{
    [Required]
    public required string PlayerId { get; init; }

    public required bool Accept { get; init; }
}

public sealed record SelectTargetRequest
{
    [Required]
    public required string PlayerId { get; init; }

    [Required]
    public required string Category { get; init; }

    [Required]
    public required string TargetId { get; init; }
}

public sealed record AskRoomQuestionRequest
{
    [Required]
    public required string PlayerId { get; init; }

    [Required, StringLength(200, MinimumLength = 1)]
    public required string QuestionText { get; init; }
}

public sealed record AnswerRoomQuestionRequest
{
    [Required]
    public required string PlayerId { get; init; }

    public required bool IsTrue { get; init; }
}

public sealed record FlipRoomCardRequest
{
    [Required]
    public required string PlayerId { get; init; }

    [Required]
    public required string CardId { get; init; }
}