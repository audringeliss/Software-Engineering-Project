using GuessWho.Server.Models;

namespace GuessWho.Server.Extensions;

public static class CardExtensions
{
    public static bool HasAttribute(this Card card, string attributeName)
    {
        if (card == null || string.IsNullOrWhiteSpace(attributeName))
            return false;

        return card.Attributes.Any(a => a.Equals(attributeName, StringComparison.OrdinalIgnoreCase));
    }
}