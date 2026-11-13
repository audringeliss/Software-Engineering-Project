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
        if (room is null) return NotFound("Room not found.");

        if (room.CreatorName.Equals(request.PlayerName.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return Conflict("The room creator cannot join as the second player.");
        }

        var playerId = _rooms.Join(room, request.PlayerName);
        if (playerId is null) return Conflict("This room already has two players.");

        return Ok(new RoomMembershipResponse(room.Code, playerId, "joiner"));
    }

    [HttpGet("{roomCode}/state")]
    [ProducesResponseType<RoomStateResponse>(StatusCodes.Status200OK)]
    public IActionResult GetState(string roomCode, [FromQuery] string playerId)
    {
        var room = _rooms.Find(roomCode);
        if (room is null) return NotFound("Room not found.");

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, playerId);
            if (role is null) return StatusCode(StatusCodes.Status403Forbidden);

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/category/propose")]
    public IActionResult ProposeCategory(string roomCode, [FromBody] ProposeCategoryRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null) return NotFound("Room not found.");

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null) return StatusCode(StatusCodes.Status403Forbidden);

            if (room.Status == "Playing") return Conflict("Game is already in progress.");

            room.ProposedCategory = request.Category;
            room.ProposedCategoryByRole = role;
            room.Status = "CategoryProposed";

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/category/respond")]
    public async Task<IActionResult> RespondCategory(
        string roomCode,
        [FromBody] RespondCategoryRequest request,
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

            if (room.ProposedCategoryByRole == role)
            {
                return Conflict("You cannot respond to your own category proposal.");
            }
        }

        if (!request.Accept)
        {
            lock (room)
            {
                room.ProposedCategory = null;
                room.ProposedCategoryByRole = null;
                room.Status = "WaitingForCategory";
                return Ok(ToResponse(room, role));
            }
        }

        var board = await _dataLoader.GetCategoryCardsAsync(room.ProposedCategory!, cancellationToken);
        if (board.Count == 0) return NotFound("Category has no cards.");

        lock (room)
        {
            room.Category = room.ProposedCategory;
            room.Board = board;
            room.ProposedCategory = null;
            room.ProposedCategoryByRole = null;
            room.CreatorFlippedCardIds.Clear();
            room.JoinerFlippedCardIds.Clear();
            room.Status = "SelectingTargets";

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
        if (room is null) return NotFound("Room not found.");

        string role;
        lock (room)
        {
            var r = GameRoomStore.GetRole(room, request.PlayerId);
            if (r is null) return StatusCode(StatusCodes.Status403Forbidden);
            role = r;
        }

        var board = await _dataLoader.GetCategoryCardsAsync(request.Category, cancellationToken);
        var target = board.FirstOrDefault(card => card.Id == request.TargetId);
        if (target is null) return BadRequest("Invalid target card selection.");

        lock (room)
        {
            if (role == "creator") room.CreatorTargetCardId = target.Id;
            else room.JoinerTargetCardId = target.Id;

            if (!string.IsNullOrEmpty(room.CreatorTargetCardId) && !string.IsNullOrEmpty(room.JoinerTargetCardId))
            {
                room.Status = "Playing";
                room.CurrentTurnRole = "creator";
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
        if (room is null) return NotFound("Room not found.");

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null) return StatusCode(StatusCodes.Status403Forbidden);
            if (room.Status != "Playing") return Conflict("Game is not active.");
            if (room.CurrentTurnRole != role) return Conflict("Not your turn to ask.");
            if (room.PendingQuestion is not null) return Conflict("Pending question active.");

            room.PendingQuestion = request.QuestionText.Trim();
            room.PendingQuestionAskedByRole = role;

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/answers")]
    public IActionResult AnswerQuestion(string roomCode, [FromBody] AnswerRoomQuestionRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null) return NotFound("Room not found.");

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null) return StatusCode(StatusCodes.Status403Forbidden);
            if (room.Status != "Playing" || room.PendingQuestion is null) return Conflict("No pending question.");
            if (room.PendingQuestionAskedByRole == role) return Conflict("Cannot answer your own question.");

            room.QuestionHistory.Add(new RoomQuestionHistoryResponse(
                room.PendingQuestion,
                request.IsTrue ? "True" : "False",
                room.PendingQuestionAskedByRole!));

            room.PendingQuestion = null;
            room.PendingQuestionAskedByRole = null;
            room.CurrentTurnRole = room.CurrentTurnRole == "creator" ? "joiner" : "creator";

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/cards/flip")]
    public IActionResult FlipCard(string roomCode, [FromBody] FlipRoomCardRequest request)
    {
        var room = _rooms.Find(roomCode);
        if (room is null) return NotFound("Room not found.");

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, request.PlayerId);
            if (role is null) return StatusCode(StatusCodes.Status403Forbidden);

            var card = room.Board.FirstOrDefault(c => c.Id == request.CardId);
            if (card is null) return NotFound("Card not found.");

            // Toggle flip strictly inside the calling player's independent set
            var flippedSet = role == "creator" ? room.CreatorFlippedCardIds : room.JoinerFlippedCardIds;
            if (!flippedSet.Add(card.Id))
            {
                flippedSet.Remove(card.Id);
            }

            return Ok(ToResponse(room, role));
        }
    }

    [HttpPost("{roomCode}/reset")]
    public IActionResult ResetGame(string roomCode, [FromQuery] string playerId)
    {
        var room = _rooms.Find(roomCode);
        if (room is null) return NotFound("Room not found.");

        lock (room)
        {
            var role = GameRoomStore.GetRole(room, playerId);
            if (role is null) return StatusCode(StatusCodes.Status403Forbidden);

            // Clear ONLY the calling player's flipped cards so they face up again
            if (role == "creator")
            {
                room.CreatorFlippedCardIds.Clear();
            }
            else
            {
                room.JoinerFlippedCardIds.Clear();
            }

            return Ok(ToResponse(room, role));
        }
    }

    private static RoomStateResponse ToResponse(GameRoom room, string role)
    {
        var myFlippedCards = role == "creator" ? room.CreatorFlippedCardIds : room.JoinerFlippedCardIds;

        var board = room.Board
            .Select(card => new RoomCardResponse(
                card.Id,
                card.Name,
                card.Category,
                card.ImageUrl,
                card.Attributes,
                myFlippedCards.Contains(card.Id)))
            .ToList();

        // Find the calling player's target card ID and object
        string? myTargetId = role == "creator" ? room.CreatorTargetCardId : room.JoinerTargetCardId;
        RoomCardResponse? myTargetCard = null;
        if (!string.IsNullOrEmpty(myTargetId))
        {
            var rawTarget = room.Board.FirstOrDefault(c => c.Id == myTargetId);
            if (rawTarget is not null)
            {
                myTargetCard = new RoomCardResponse(
                    rawTarget.Id,
                    rawTarget.Name,
                    rawTarget.Category,
                    rawTarget.ImageUrl,
                    rawTarget.Attributes,
                    false
                );
            }
        }

        int totalCards = room.Board.Count;
        int creatorOpenCards = totalCards - room.CreatorFlippedCardIds.Count;
        int joinerOpenCards = totalCards - room.JoinerFlippedCardIds.Count;

        bool hasSelectedTarget = role == "creator" ? !string.IsNullOrEmpty(room.CreatorTargetCardId) : !string.IsNullOrEmpty(room.JoinerTargetCardId);
        bool bothTargetsSelected = !string.IsNullOrEmpty(room.CreatorTargetCardId) && !string.IsNullOrEmpty(room.JoinerTargetCardId);

        return new RoomStateResponse(
            room.Code,
            role,
            room.CreatorName,
            room.JoinerName,
            room.Status,
            room.Category,
            room.ProposedCategory,
            room.ProposedCategoryByRole,
            hasSelectedTarget,
            bothTargetsSelected,
            room.CurrentTurnRole ?? "creator",
            board,
            room.PendingQuestion,
            room.PendingQuestionAskedByRole,
            room.QuestionHistory.ToList(),
            creatorOpenCards,
            joinerOpenCards,
            totalCards,
            myTargetCard
        );
    }
}