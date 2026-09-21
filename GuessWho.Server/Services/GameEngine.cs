using GuessWho.Server.Extensions;
using GuessWho.Server.Models;

namespace GuessWho.Server.Services;

public class GameEngine
{
    private readonly List<Card> _cards;

    public GameEngine(List<Card> cards)
    {
        _cards = cards;
    }

    public List<Card> GetFilteredCards(
        string? category = null,
        bool includeFlipped = false,
        int maxResults = 24)
    {
        var query = _cards.AsEnumerable();

        if (!includeFlipped)
        {
            query = query.Where(c => !c.IsFlipped);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(c => c.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return query.Take(maxResults).ToList();
    }

    public void ProcessAnswer(string attribute, bool hasAttribute)
    {
        var cardsToFlip = _cards
            .Where(c => !c.IsFlipped)
            .Where(c => c.HasAttribute(attribute) != hasAttribute) 
            .ToList();

        foreach (var card in cardsToFlip)
        {
            card.IsFlipped = true;
        }
    }

    public Card? GetRemainingTarget()
    {
        return _cards
            .Where(c => !c.IsFlipped)
            .SingleOrDefault();
    }
}