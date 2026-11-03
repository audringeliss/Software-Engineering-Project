using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace GuessWho.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly GameState _gameState;
    private readonly CardDataLoader _dataLoader;

    public GameController(GameState gameState, CardDataLoader dataLoader)
    {
        _gameState = gameState;
        _dataLoader = dataLoader;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartGame([FromQuery] string category, [FromQuery] string targetId)
    {
        if (string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest("Category and target card are required.");
        }

        _gameState.Board = await _dataLoader.GetCategoryCardsAsync(category);
        if (_gameState.Board.Count == 0)
        {
            return NotFound($"Category '{category}' has no cards.");
        }

        _gameState.TargetCard = _gameState.Board.FirstOrDefault(c => c.Id == targetId);
        if (_gameState.TargetCard == null)
        {
            return BadRequest("The selected target does not belong to this category.");
        }

        _gameState.PendingQuestion = null;
        _gameState.PendingAttribute = null;

        return Ok(new
        {
            Message = "Game started",
            BoardSize = _gameState.Board.Count
        });
    }

    [HttpPost("ask")]
    public IActionResult AskQuestion([FromBody] QuestionRequest request)
    {
        if (_gameState.Board.Count == 0) return BadRequest("Game has not been started.");

        _gameState.PendingQuestion = request.QuestionText;
        _gameState.PendingAttribute = request.TargetAttribute;

        return Ok(new { Message = "Question submitted", Question = request.QuestionText });
    }

    [HttpPost("answer")]
    public IActionResult AnswerQuestion([FromQuery] bool isTrue)
    {
        if (_gameState.Board.Count == 0) return BadRequest("Game has not been started.");
        if (string.IsNullOrEmpty(_gameState.PendingAttribute)) return BadRequest("No pending question.");

        var engine = new GameEngine(_gameState.Board);
        engine.ProcessAnswer(_gameState.PendingAttribute, isTrue);

        _gameState.PendingQuestion = null;
        _gameState.PendingAttribute = null;

        var remainingCards = engine.GetFilteredCards(includeFlipped: true);
        return Ok(remainingCards);
    }

    [HttpGet("state")]
    public IActionResult GetGameState()
    {
        return Ok(new
        {
            Board = _gameState.Board,
            TargetSelected = _gameState.TargetCard != null,
            PendingQuestion = _gameState.PendingQuestion
        });
    }
}