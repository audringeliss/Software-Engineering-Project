namespace GuessWho.Server.Models;

public class Card : IEquatable<Card>, IComparable<Card>
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public List<string> Attributes { get; set; } = new();
    public bool IsFlipped { get; set; }
    public BoardPosition Position { get; set; }

    public Card() { }

    public Card(string id, string name, string category, List<string> attributes, BoardPosition position)
    {
        Id = id;
        Name = name;
        Category = category;
        Attributes = attributes;
        Position = position;
        IsFlipped = false;
    }

    public bool Equals(Card? other)
    {
        if (other is null) return false;
        return Id == other.Id;
    }

    public override bool Equals(object? obj) => Equals(obj as Card);

    public override int GetHashCode() => Id.GetHashCode();

    public int CompareTo(Card? other)
    {
        if (other is null) return 1;
        return string.Compare(Name, other.Name, StringComparison.OrdinalIgnoreCase);
    }
}