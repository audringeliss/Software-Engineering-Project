namespace GuessWho.Server.Models;

public class Player
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int GamesWon { get; private set; }

    public Player(string id, string name)
    {
        Id = id;
        Name = name;
        GamesWon = 0;
    }

    public void IncrementWins()
    {
        GamesWon++;
    }
}