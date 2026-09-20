using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace GuessWho.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly CardDataLoader _dataLoader;
    private readonly IWebHostEnvironment _env;

    public CardsController(CardDataLoader dataLoader, IWebHostEnvironment env)
    {
        _dataLoader = dataLoader;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<List<Card>>> GetCards()
    {
        string filePath = Path.Combine(_env.ContentRootPath, "Data", "cards.json");
        var cards = await _dataLoader.LoadCardsFromFileAsync(filePath);
        return Ok(cards);
    }

    [HttpPost("process-answer")]
    public async Task<ActionResult<List<Card>>> ProcessAnswer([FromBody] QuestionRequest request, [FromQuery] bool hasAttribute)
    {
        string filePath = Path.Combine(_env.ContentRootPath, "Data", "cards.json");
        var cards = await _dataLoader.LoadCardsFromFileAsync(filePath);

        var engine = new GameEngine(cards);
        
        engine.ProcessAnswer(request.TargetAttribute, hasAttribute);

        var remainingCards = engine.GetFilteredCards(includeFlipped: true);

        return Ok(remainingCards);
    }
}