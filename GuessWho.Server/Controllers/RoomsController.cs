using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using GuessWho.Server.Models;
using GuessWho.Server.Services;

namespace GuessWho.Server.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly GameRoomStore _roomStore;
    private readonly CardDataLoader _cardLoader;

    public RoomsController(GameRoomStore roomStore, CardDataLoader cardLoader)
    {
        _roomStore = roomStore;
        _cardLoader = cardLoader;
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
        string targetCode = !string.IsNullOrWhiteSpace(code) ? code : request.Code;
        if (string.IsNullOrWhiteSpace(targetCode))
        {
            targetCode = request.RoomCode;
        }

        var room = _roomStore.Find(targetCode);
        if (room == null)
        {
            return NotFound("Room not found.");
        }

        var joinerId = _roomStore.Join(room, request.PlayerName);
        if (joinerId == null)
        {
            return BadRequest("Room is already full.");
        }

        var role = GameRoomStore.GetRole(room, joinerId);
        return Ok(new RoomMembershipResponse(room.Code, joinerId, role ?? string.Empty));
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
    public IActionResult ProposeCategory(string code, [FromBody] ProposeCategoryRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

        room.ProposedCategory = request.Category;
        room.ProposedCategoryByRole = role;
        room.Status = "CategoryProposed";

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/category/respond")]
    public async Task<IActionResult> RespondCategory(string code, [FromBody] RespondCategoryRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

        if (request.Accept && room.ProposedCategory != null)
        {
            room.Category = room.ProposedCategory;
            room.Status = "SelectingTarget";

            var categoryCards = await _cardLoader.GetCategoryCardsAsync(room.Category);
            room.Board = categoryCards.Select(c => new Card
            {
                Id = c.Id,
                Name = c.Name,
                Category = c.Category,
                ImageUrl = c.ImageUrl,
                Attributes = c.Attributes
            }).ToList();
        }
        else
        {
            room.ProposedCategory = null;
            room.ProposedCategoryByRole = null;
            room.Status = "WaitingForCategory";
        }

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/select-target")]
    public IActionResult SelectTarget(string code, [FromBody] SelectTargetRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

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

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/questions")]
    public IActionResult SubmitQuestion(string code, [FromBody] QuestionRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

        room.PendingQuestion = request.QuestionText;
        room.PendingQuestionAskedByRole = role;

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/answers")]
    public IActionResult SubmitAnswer(string code, [FromBody] AnswerRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

        room.QuestionHistory.Add(new RoomQuestionHistoryResponse(
            room.PendingQuestion ?? string.Empty,
            request.IsTrue ? "True" : "False",
            room.PendingQuestionAskedByRole ?? string.Empty
        ));

        room.PendingQuestion = null;
        room.PendingQuestionAskedByRole = null;

        room.CurrentTurnRole = room.CurrentTurnRole == "creator" ? "joiner" : "creator";

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/guess")]
    public IActionResult SubmitGuess(string code, [FromBody] GuessRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

        if (room.Status == "GameOver")
        {
            return BadRequest("Game is already over.");
        }

        string? opponentTargetId = role == "creator" ? room.JoinerTargetCardId : room.CreatorTargetCardId;
        bool isCorrect = request.CardId.Equals(opponentTargetId, StringComparison.OrdinalIgnoreCase);

        if (isCorrect)
        {
            room.Status = "GameOver";
            room.WinnerRole = role;
        }
        else
        {
            room.CurrentTurnRole = role == "creator" ? "joiner" : "creator";
        }

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/cards/flip")]
    public IActionResult FlipCard(string code, [FromBody] FlipCardRequest request)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, request.PlayerId);
        if (role == null) return Unauthorized("Invalid player.");

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

        return Ok(BuildRoomStateResponse(room, role));
    }

    [HttpPost("{code}/reset")]
    public IActionResult ResetBoard(string code, [FromQuery] string playerId)
    {
        var room = _roomStore.Find(code);
        if (room == null) return NotFound("Room not found.");

        var role = GameRoomStore.GetRole(room, playerId);
        if (role == null) return Unauthorized("Invalid player.");

        if (role == "creator") room.CreatorFlippedCardIds.Clear();
        else room.JoinerFlippedCardIds.Clear();

        return Ok(BuildRoomStateResponse(room, role));
    }

    private static object BuildRoomStateResponse(GameRoom room, string role)
    {
        var flippedSet = role == "creator" ? room.CreatorFlippedCardIds : room.JoinerFlippedCardIds;
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
        var myTargetCard = room.Board.FirstOrDefault(c => c.Id == myTargetId);

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
            CreatorName = room.CreatorName,
            JoinerName = room.JoinerName,
            Role = role,
            HasSelectedTarget = myTargetId != null,
            BothTargetsSelected = room.CreatorTargetCardId != null && room.JoinerTargetCardId != null,
            MyTargetCard = myTargetCard,
            Board = boardWithFlipState,
            TotalCardsCount = room.Board.Count,
            CreatorOpenCardsCount = room.Board.Count - room.CreatorFlippedCardIds.Count,
            JoinerOpenCardsCount = room.Board.Count - room.JoinerFlippedCardIds.Count,
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