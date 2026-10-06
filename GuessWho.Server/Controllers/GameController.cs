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
    private readonly IWebHostEnvironment _env;

    public GameController(GameState gameState, CardDataLoader dataLoader, IWebHostEnvironment env)
    {
        _gameState = gameState;
        _dataLoader = dataLoader;
        _env = env;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartGame([FromQuery] string category, [FromQuery] string targetId)
    {
        string filePath = Path.Combine(_env.ContentRootPath, "Data", "cards.json");
        var allCards = await _dataLoader.LoadCardsFromFileAsync(filePath);

        _gameState.Board = allCards
            .Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
            .ToList();

        _gameState.TargetCard = _gameState.Board.FirstOrDefault(c => c.Id == targetId);
        _gameState.PendingQuestion = null;
        _gameState.PendingAttribute = null;

        return Ok(new
        {
            Message = "Game started",
            Target = _gameState.TargetCard?.Name,
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