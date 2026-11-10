using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace GuessWho.Server.Controllers;

[ApiController]
[Route("api/rooms")]
public sealed class RoomsController : ControllerBase
{
    private readonly GameRoomStore _rooms;
    private readonly CardDataLoader _dataLoader;

    public RoomsController(GameRoomStore rooms, CardDataLoader dataLoader)
    {
        _rooms = rooms;
        _dataLoader = dataLoader;
    }

    [HttpPost]
    [ProducesResponseType<RoomMembershipResponse>(StatusCodes.Status201Created)]
    public IActionResult CreateRoom([FromBody] CreateRoomRequest request)
    {
        var room = _rooms.Create(request.PlayerName);
        var response = new RoomMembershipResponse(room.Code, room.CreatorId, "creator");
        return CreatedAtAction(
            nameof(GetState),
            new { roomCode = room.Code, playerId = room.CreatorId },
            response);
    }

    [HttpPost("{roomCode}/join")]
    [ProducesResponseType<RoomMembershipResponse>(StatusCodes.Status200OK)]
    public IActionResult JoinRoom(string roomCode, [FromBody] JoinRoomRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        if (room.CreatorName.Equals(request.PlayerName.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return Conflict("The room creator cannot join as the second player.");
        }

        var playerId = _rooms.Join(room, request.PlayerName);
        if (playerId is null)
        {
            return Conflict("This room already has two players.");
        }

        return Ok(new RoomMembershipResponse(room.Code, playerId, "joiner"));
    }

    [HttpGet("{roomCode}/state")]
    [ProducesResponseType<RoomStateResponse>(StatusCodes.Status200OK)]
    public IActionResult GetState(string roomCode, [FromQuery] string playerId)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, playerId);
            if (role is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/category")]
    public async Task<IActionResult> ProposeOrSelectCategory(
        string roomCode,
        [FromBody] SelectCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var room = _rooms.Find(roomCode);
        if (room is null) return NotFound("Room not found.");

        string role;
        lock (room)
        {
            var r = GameRoomStore.GetRole(room, request.PlayerId);
            if (r is null) return StatusCode(StatusCodes.Status403Forbidden);
            role = r;
        }

        var board = await _dataLoader.GetCategoryCardsAsync(request.Category, cancellationToken);
        if (board.Count == 0) return NotFound("Category has no cards.");

        lock (room)
        {
            room.Category = request.Category;
            room.Board = board;
            room.Status = "SelectingTargets"; // Move both players to target selection screen
            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/select-target")]
    public async Task<IActionResult> SelectTarget(
        string roomCode,
        [FromBody] SelectTargetRequest request,
        CancellationToken cancellationToken)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        string role;
        lock (room)
        {
            var r = GameRoomStore.GetRole(room, request.PlayerId);
            if (r is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden);
            }
            role = r;
        }

        if (string.IsNullOrWhiteSpace(request.Category) ||
            Path.GetFileName(request.Category) != request.Category ||
            string.IsNullOrWhiteSpace(request.TargetId))
        {
            return BadRequest("A valid category and target card are required.");
        }

        var board = await _dataLoader.GetCategoryCardsAsync(request.Category, cancellationToken);
        if (board.Count == 0)
        {
            return NotFound($"Category '{request.Category}' has no cards.");
        }

        var target = board.FirstOrDefault(card => card.Id == request.TargetId);
        if (target is null)
        {
            return BadRequest("The selected target does not belong to this category.");
        }

        lock (room)
        {
            if (room.Board is null || room.Board.Count == 0)
            {
                room.Category = request.Category;
                room.Board = board;
            }

            if (role == "creator")
            {
                room.CreatorTargetCardId = target.Id;
            }
            else
            {
                room.JoinerTargetCardId = target.Id;
            }

            // If both players have now selected their secret target cards, begin playing!
            if (!string.IsNullOrEmpty(room.CreatorTargetCardId) && !string.IsNullOrEmpty(room.JoinerTargetCardId))
            {
                room.Status = "Playing";
                room.CurrentTurnRole = "creator"; // Creator goes first
            }
            else
            {
                room.Status = "SelectingTargets";
            }

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/questions")]
    public IActionResult AskQuestion(string roomCode, [FromBody] AskRoomQuestionRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            if (room.Status != "Playing")
            {
                return Conflict("The game has not started.");
            }

            if (room.CurrentTurnRole != role)
            {
                return Conflict("It is not your turn to ask a question.");
            }

            if (room.PendingQuestion is not null)
            {
                return Conflict("Wait for the opponent to answer the pending question.");
            }

            room.PendingQuestion = request.QuestionText.Trim();
            room.PendingQuestionAskedByRole = role;

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/answers")]
    public IActionResult AnswerQuestion(string roomCode, [FromBody] AnswerRoomQuestionRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            if (room.Status != "Playing" || room.PendingQuestion is null)
            {
                return Conflict("There is no question to answer.");
            }

            if (room.PendingQuestionAskedByRole == role)
            {
                return Conflict("You cannot answer your own question.");
            }

            var question = room.PendingQuestion;
            room.QuestionHistory.Add(new RoomQuestionHistoryResponse(
                question,
                request.IsTrue ? "True" : "False",
                room.PendingQuestionAskedByRole!));

            room.PendingQuestion = null;
            room.PendingQuestionAskedByRole = null;

            // Switch the turn to the other player after an answer is given
            room.CurrentTurnRole = room.CurrentTurnRole == "creator" ? "joiner" : "creator";

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/cards/flip")]
    public IActionResult FlipCard(string roomCode, [FromBody] FlipRoomCardRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            if (room.Status != "Playing" && room.Status != "SelectingTargets")
            {
                return Conflict("The game session is inactive.");
            }

            var card = room.Board.FirstOrDefault(candidate => candidate.Id == request.CardId);
            if (card is null)
            {
                return NotFound("Card not found in this room.");
            }

            card.IsFlipped = !card.IsFlipped;
            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/reset")]
    public IActionResult ResetGame(string roomCode, [FromQuery] string playerId)
    {
        var room = _rooms.Find(roomCode);
        if (room is null)
        {
            return NotFound("Room not found.");
        }

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, playerId);
            if (role is null)
            {
                return StatusCode(StatusCodes.Status403Forbidden);
            }

            foreach (var card in room.Board)
            {
                card.IsFlipped = false;
            }

            room.CreatorTargetCardId = null;
            room.JoinerTargetCardId = null;
            room.PendingQuestion = null;
            room.PendingQuestionAskedByRole = null;
            room.QuestionHistory.Clear();
            room.Status = "SelectingTargets";
            room.CurrentTurnRole = "creator";

            return Ok(ToResponse(room, role));
        }
    }

    private static RoomStateResponse ToResponse(GameRoom room, string role)
    {
        var board = room.Board
            .Select(card => new RoomCardResponse(
                card.Id,
                card.Name,
                card.Category,
                card.ImageUrl,
                card.Attributes,
                card.IsFlipped))
            .ToList();

        bool hasSelectedTarget = role == "creator"
            ? !string.IsNullOrEmpty(room.CreatorTargetCardId)
            : !string.IsNullOrEmpty(room.JoinerTargetCardId);

        bool bothTargetsSelected = !string.IsNullOrEmpty(room.CreatorTargetCardId) && !string.IsNullOrEmpty(room.JoinerTargetCardId);

        return new RoomStateResponse(
            room.Code,
            role,
            room.CreatorName,
            room.JoinerName,
            room.Status,
            room.Category,
            hasSelectedTarget,
            bothTargetsSelected,
            room.CurrentTurnRole ?? "creator",
            board,
            room.PendingQuestion,
            room.PendingQuestionAskedByRole,
            room.QuestionHistory.ToList());
    }
}