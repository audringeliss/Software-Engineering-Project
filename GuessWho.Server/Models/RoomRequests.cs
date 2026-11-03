using System.ComponentModel.DataAnnotations;

namespace GuessWho.Server.Models;

/// <summary>Request to create a two-player game room.</summary>
public sealed record CreateRoomRequest
{
    /// <summary>Name of the player creating the room.</summary>
    [Required, StringLength(40, MinimumLength = 1)]
    public required string PlayerName { get; init; }
}

/// <summary>Request to join an existing game room.</summary>
public sealed record JoinRoomRequest
{
    /// <summary>Name of the player joining the room.</summary>
    [Required, StringLength(40, MinimumLength = 1)]
    public required string PlayerName { get; init; }
}

/// <summary>Request to start a room game with a selected secret card.</summary>
public sealed record StartRoomRequest
{
    /// <summary>Identifier issued to the room creator.</summary>
    [Required]
    public required string PlayerId { get; init; }

    /// <summary>Category deck for the game.</summary>
    [Required]
    public required string Category { get; init; }

    /// <summary>Identifier of the secret card selected by the creator.</summary>
    [Required]
    public required string TargetId { get; init; }
}

/// <summary>Request to ask a yes-or-no question in a room.</summary>
public sealed record AskRoomQuestionRequest
{
    /// <summary>Identifier issued to the player who joined the room.</summary>
    [Required]
    public required string PlayerId { get; init; }

    /// <summary>Question to send to the room creator.</summary>
    [Required, StringLength(200, MinimumLength = 1)]
    public required string QuestionText { get; init; }
}

/// <summary>Request to answer the room's pending question.</summary>
public sealed record AnswerRoomQuestionRequest
{
    /// <summary>Identifier issued to the room creator.</summary>
    [Required]
    public required string PlayerId { get; init; }

    /// <summary>Whether the answer to the pending question is yes.</summary>
    public required bool IsTrue { get; init; }
}

/// <summary>Request to flip a card on the guesser's board.</summary>
public sealed record FlipRoomCardRequest
{
    /// <summary>Identifier issued to the player who joined the room.</summary>
    [Required]
    public required string PlayerId { get; init; }

    /// <summary>Identifier of the card to flip.</summary>
    [Required]
    public required string CardId { get; init; }
}
