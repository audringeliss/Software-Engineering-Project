using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace GuessWho.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly CardDataLoader _dataLoader;

    public CardsController(CardDataLoader dataLoader)
    {
        _dataLoader = dataLoader;
    }

    // 1. Get available categories
    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        var categories = new[]
        {
            new { id = "people", name = "People", icon = "👤" },
            new { id = "animals", name = "Animals", icon = "🐾" }
        };

        return Ok(categories);
    }

    // 2. Get cards by category (e.g., /api/cards/people or /api/cards/animals)
    [HttpGet("{categoryId}")]
    public async Task<ActionResult<List<Card>>> GetCards(string categoryId)
    {
        var cards = await _dataLoader.GetCategoryCardsAsync(categoryId);

        if (cards == null || !cards.Any())
        {
            return NotFound($"Category '{categoryId}' was not found or contains no cards.");
        }

        return Ok(cards);
    }

    // 3. Process game engine answer for a specific category
    [HttpPost("{categoryId}/process-answer")]
    public async Task<ActionResult<List<Card>>> ProcessAnswer(
        string categoryId, 
        [FromBody] QuestionRequest request, 
        [FromQuery] bool hasAttribute)
    {
        var cards = await _dataLoader.GetCategoryCardsAsync(categoryId);

        if (cards == null || !cards.Any())
        {
            return NotFound($"Category '{categoryId}' was not found.");
        }

        var engine = new GameEngine(cards);
        engine.ProcessAnswer(request.TargetAttribute, hasAttribute);

        var remainingCards = engine.GetFilteredCards(includeFlipped: true);
        return Ok(remainingCards);
    }
}