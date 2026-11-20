using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using GuessWho.Server.Models;
using GuessWho.Server.Services;
using GuessWho.Server.Exceptions;

namespace GuessWho.Server.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly GameRoomStore _roomStore;
    private readonly CardDataLoader _cardLoader;
    private readonly RoomActionExecutor<GameRoom> _executor;

    public RoomsController(
        GameRoomStore roomStore,
        CardDataLoader cardLoader,
        RoomActionExecutor<GameRoom> executor)
    {
        _roomStore = roomStore;
        _cardLoader = cardLoader;
        _executor = executor;
    }

    [HttpPost]
    public IActionResult CreateRoom([FromBody] CreateRoomRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlayerName))
        {
            return BadRequest("Player name is required.");
        }

        var room = _roomStore.Create(request.PlayerName);
        var role = GameRoomStore.GetRole(room, room.CreatorId);

        return Ok(new RoomMembershipResponse(room.Code, room.CreatorId, role ?? string.Empty));
    }

    [HttpPost("join")]
    [HttpPost("{code}/join")]
    public IActionResult JoinRoom(string? code, [FromBody] JoinRoomRequest request)
    {
        string targetCode = !string.IsNullOrWhiteSpace(code)
            ? code
            : (!string.IsNullOrWhiteSpace(request.Code) ? request.Code : request.RoomCode);

        if (string.IsNullOrWhiteSpace(targetCode))
        {
            throw new RoomNotFoundException(string.Empty);
        }

        // 1. Verify the room exists first to throw RoomNotFoundException (404) if missing
        _ = _roomStore.Find(targetCode)
            ?? throw new RoomNotFoundException(targetCode);

        string? joinerId = null;

        // 2. Execute atomically so the join state is persisted to SQLite via EF Core
        var room = _roomStore.ExecuteAtomic(targetCode, baseRoom =>
        {
            if (baseRoom == null) return null;
            joinerId = _roomStore.Join(baseRoom, request.PlayerName);
            if (joinerId == null) return null;
            return baseRoom;
        });

        // 3. If joinerId is null, the room was full -> throw RoomFullException (400)
        if (room == null || joinerId == null)
        {
            throw new RoomFullException(targetCode);
        }

        var role = GameRoomStore.GetRole(room, joinerId);
        return Ok(new RoomMembershipResponse(targetCode, joinerId, role ?? string.Empty));
    }

    [HttpGet("{code}/state")]
    public IActionResult GetRoomState(string code, [FromQuery] string playerId)
    {
        var room = _roomStore.Find(code);
        if (room == null)
        {
            return NotFound("Room not found.");
        }

        var role = GameRoomStore.GetRole(room, playerId);
        if (role == null)
        {
            return Unauthorized("Invalid player.");
        }

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/category/propose")]
    public IActionResult ProposeCategory(string code, [FromBody] ProposeCategoryRequest request) =>
        _executor.ExecuteForPlayer<object>(code, request.PlayerId, (room, role) =>
        {
            room.ProposedCategory = request.Category;
            room.ProposedCategoryByRole = role;
            room.Status = "CategoryProposed";

            return BuildRoomStateResponse(room, role);
        });

    [HttpPost("{code}/category/respond")]
    public async Task<IActionResult> RespondCategory(string code, [FromBody] RespondCategoryRequest request)
    {
        List<Card>? categoryCards = null;
        if (request.Accept)
        {
            var tempRoom = _roomStore.Find(code);
            if (tempRoom?.ProposedCategory != null)
            {
                var rawCards = await _cardLoader.GetCategoryCardsAsync(tempRoom.ProposedCategory);
                categoryCards = rawCards.Select(c => new Card
                {
                    Id = c.Id,
                    Name = c.Name,
                    Category = c.Category,
                    ImageUrl = c.ImageUrl,
                    Attributes = c.Attributes
                }).ToList();
            }
        }

        return _executor.ExecuteForPlayer<object>(code, request.PlayerId, (room, role) =>
        {
            if (request.Accept && room.ProposedCategory != null && categoryCards != null)
            {
                room.Category = room.ProposedCategory;
                room.Status = "SelectingTarget";
                room.Board = categoryCards;
            }
            else
            {
                room.ProposedCategory = null;
                room.ProposedCategoryByRole = null;
                room.Status = "WaitingForCategory";
            }

            return BuildRoomStateResponse(room, role);
        });
    }

    [HttpPost("{code}/select-target")]
    public IActionResult SelectTarget(string code, [FromBody] SelectTargetRequest request) =>
        _executor.ExecuteForPlayer<object>(code, request.PlayerId, (room, role) =>
        {
            if (role == "creator")
            {
                room.CreatorTargetCardId = request.TargetId;
            }
            else
            {
                room.JoinerTargetCardId = request.TargetId;
            }

            if (!string.IsNullOrEmpty(room.CreatorTargetCardId) && !string.IsNullOrEmpty(room.JoinerTargetCardId))
            {
                room.Status = "Playing";
                room.CurrentTurnRole = "creator";
            }

            return BuildRoomStateResponse(room, role);
        });

    [HttpPost("{code}/questions")]
    public IActionResult SubmitQuestion(string code, [FromBody] QuestionRequest request) =>
        _executor.ExecuteForPlayer<object>(code, request.PlayerId, (room, role) =>
        {
            room.PendingQuestion = request.QuestionText;
            room.PendingQuestionAskedByRole = role;
            room.LastWrongGuessId = null;
            room.LastWrongGuessByRole = null;
            room.LastWrongGuessCardId = null;
            room.LastWrongGuessCardName = null;
            room.LastWrongGuessCardImageUrl = null;

            return BuildRoomStateResponse(room, role);
        });

    [HttpPost("{code}/answers")]
    public IActionResult SubmitAnswer(string code, [FromBody] AnswerRequest request) =>
        _executor.ExecuteForPlayer<object>(code, request.PlayerId, (room, role) =>
        {
            room.QuestionHistory.Add(new RoomQuestionHistoryResponse(
                room.PendingQuestion ?? string.Empty,
                request.IsTrue ? "True" : "False",
                room.PendingQuestionAskedByRole ?? string.Empty
            ));

            room.PendingQuestion = null;
            room.PendingQuestionAskedByRole = null;
            room.CurrentTurnRole = room.CurrentTurnRole == "creator" ? "joiner" : "creator";

            return BuildRoomStateResponse(room, role);
        });

    [HttpPost("{code}/guess")]
    public IActionResult SubmitGuess(string code, [FromBody] GuessRequest request) =>
        _executor.ExecuteForPlayer<object>(
            code,
            request.PlayerId,
            (room, role) =>
            {
                if (room.Status != "Playing")
                {
                    return null;
                }

                if (!string.Equals(room.CurrentTurnRole, role, StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (!string.IsNullOrEmpty(room.PendingQuestion))
                {
                    return null;
                }

                string? opponentTargetId = role == "creator" ? room.JoinerTargetCardId : room.CreatorTargetCardId;
                bool isCorrect = !string.IsNullOrWhiteSpace(request.CardId) &&
                                 request.CardId.Equals(opponentTargetId, StringComparison.OrdinalIgnoreCase);

                if (isCorrect)
                {
                    room.Status = "GameOver";
                    room.WinnerRole = role;
                    room.LastWrongGuessId = null;
                    room.LastWrongGuessByRole = null;
                    room.LastWrongGuessCardId = null;
                    room.LastWrongGuessCardName = null;
                    room.LastWrongGuessCardImageUrl = null;
                }
                else
                {
                    // Switch turn to opponent so they can ask a question or make a guess
                    room.CurrentTurnRole = role == "creator" ? "joiner" : "creator";
                }

                return BuildRoomStateResponse(room, role);
            },
            errorMessage: "You can only make a guess on your own turn during active play with no pending question.",
            returnBadRequestOnNull: true);

    [HttpPost("{code}/cards/flip")]
    public IActionResult FlipCard(string code, [FromBody] FlipCardRequest request) =>
        _executor.ExecuteForPlayer<object>(code, request.PlayerId, (room, role) =>
        {
            if (role == "creator")
            {
                if (room.CreatorFlippedCardIds.Contains(request.CardId))
                    room.CreatorFlippedCardIds.Remove(request.CardId);
                else
                    room.CreatorFlippedCardIds.Add(request.CardId);
            }
            else
            {
                if (room.JoinerFlippedCardIds.Contains(request.CardId))
                    room.JoinerFlippedCardIds.Remove(request.CardId);
                else
                    room.JoinerFlippedCardIds.Add(request.CardId);
            }

            return BuildRoomStateResponse(room, role);
        });

    [HttpPost("{code}/reset")]
    public IActionResult ResetBoard(string code, [FromQuery] string playerId) =>
        _executor.ExecuteForPlayer<object>(code, playerId, (room, role) =>
        {
            if (role == "creator") room.CreatorFlippedCardIds.Clear();
            else room.JoinerFlippedCardIds.Clear();

            return BuildRoomStateResponse(room, role);
        });

    private static object BuildRoomStateResponse(GameRoom room, string role)
    {
        var flippedSet = role == "creator" ? room.CreatorFlippedCardIds : room.JoinerFlippedCardIds;
        var opponentFlippedSet = role == "creator" ? room.JoinerFlippedCardIds : room.CreatorFlippedCardIds;
        var boardWithFlipState = room.Board.Select(c => new
        {
            c.Id,
            c.Name,
            c.Category,
            c.ImageUrl,
            c.Attributes,
            IsFlipped = flippedSet.Contains(c.Id)
        }).ToList();

        string? myTargetId = role == "creator" ? room.CreatorTargetCardId : room.JoinerTargetCardId;
        string? opponentTargetId = role == "creator" ? room.JoinerTargetCardId : room.CreatorTargetCardId;
        var myTargetCard = !string.IsNullOrWhiteSpace(myTargetId)
            ? room.Board.FirstOrDefault(c => string.Equals(c.Id, myTargetId, StringComparison.OrdinalIgnoreCase))
            : null;
        var opponentTargetCard = room.Status == "GameOver" && !string.IsNullOrWhiteSpace(opponentTargetId)
            ? room.Board.FirstOrDefault(c => string.Equals(c.Id, opponentTargetId, StringComparison.OrdinalIgnoreCase))
            : null;
        var opponentGuessTargetCard = room.Status == "GameOver"
            ? myTargetCard
            : null;
        string? winnerName = room.WinnerRole == "creator"
            ? room.CreatorName
            : (room.WinnerRole == "joiner" ? room.JoinerName : null);

        return new
        {
            room.Code,
            room.Status,
            room.Category,
            room.ProposedCategory,
            room.ProposedCategoryByRole,
            room.CurrentTurnRole,
            room.PendingQuestion,
            room.PendingQuestionAskedByRole,
            room.WinnerRole,
            WinnerName = winnerName,
            CreatorName = room.CreatorName,
            JoinerName = room.JoinerName,
            Role = role,
            HasSelectedTarget = myTargetId != null,
            BothTargetsSelected = room.CreatorTargetCardId != null && room.JoinerTargetCardId != null,
            MyTargetCard = myTargetCard,
            OpponentTargetCard = opponentTargetCard,
            OpponentGuessTargetCard = opponentGuessTargetCard,
            room.LastWrongGuessId,
            room.LastWrongGuessByRole,
            room.LastWrongGuessCardId,
            room.LastWrongGuessCardName,
            room.LastWrongGuessCardImageUrl,
            Board = boardWithFlipState,
            TotalCardsCount = room.Board.Count,
            CreatorOpenCardsCount = room.Board.Count - room.CreatorFlippedCardIds.Count,
            JoinerOpenCardsCount = room.Board.Count - room.JoinerFlippedCardIds.Count,
            OpponentFlippedCardIds = opponentFlippedSet,
            room.QuestionHistory
        };
    }
}

public class CreateRoomRequest
{
    [JsonPropertyName("playerName")]
    public string PlayerName { get; set; } = string.Empty;
}

public class JoinRoomRequest
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("roomCode")]
    public string RoomCode
    {
        get => Code;
        set => Code = value;
    }

    [JsonPropertyName("playerName")]
    public string PlayerName { get; set; } = string.Empty;
}

public class ProposeCategoryRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;
}

public class RespondCategoryRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("accept")]
    public bool Accept { get; set; }
}

public class SelectTargetRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("targetId")]
    public string TargetId { get; set; } = string.Empty;
}

public class QuestionRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("questionText")]
    public string QuestionText { get; set; } = string.Empty;
}

public class AnswerRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("isTrue")]
    public bool IsTrue { get; set; }
}

public class GuessRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("cardId")]
    public string CardId { get; set; } = string.Empty;
}

public class FlipCardRequest
{
    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("cardId")]
    public string CardId { get; set; } = string.Empty;
}

public class RoomMembershipResponse
{
    public RoomMembershipResponse() { }

    public RoomMembershipResponse(string roomCode, string playerId, string role)
    {
        RoomCode = roomCode;
        PlayerId = playerId;
        Role = role;
    }

    [JsonPropertyName("roomCode")]
    public string RoomCode { get; set; } = string.Empty;

    [JsonPropertyName("playerId")]
    public string PlayerId { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
}