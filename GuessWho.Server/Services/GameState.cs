using GuessWho.Server.Models;

namespace GuessWho.Server.Services;

public class GameState
{
    public List<Card> Board { get; set; } = new();
    public Card? TargetCard { get; set; }
    public string? PendingQuestion { get; set; }
    public string? PendingAttribute { get; set; }
}