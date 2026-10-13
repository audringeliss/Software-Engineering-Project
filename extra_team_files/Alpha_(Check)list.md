### 1. ***Interactive UI, end-to-end scenario***

**Frontend UI / Workflow**: guesswho.client/src/App.jsx (Handles category selection, card rendering, and Q&A interactions).

**Backend API Routing**: GuessWho.Server/Controllers/CardsController.cs (Lines 13–39 for GetCategories, and Lines 41–62 for GetCards).

**Explanation for Presentation**: The user selects a category from the React dropdown, which triggers a GET request to /api/cards/categories and /api/cards?category=.... The backend loads the corresponding JSON data file dynamically and streams it back to render the interactive game board.

### 2. ***4 own types: class, struct, record, enum (one immutable)***

**Where in the code**:
 - **Class**: GuessWho.Server/Models/Card.cs (or Player.cs)
 - **Struct**: GuessWho.Server/Models/BoardPosition.cs
 - **Record** (Immutable): GuessWho.Server/Models/GuessResult.cs
 - **Enum**: GuessWho.Server/Enums/AnswerType.cs (or GameStatus.cs)

 ```C#
    public class Card : IEquatable<Card>, IComparable<Card>
        {[...]}
    
    public class Player
        {[...]}

    public struct BoardPosition
        {[...]}

    public record GuessResult
        {[...]}

    public enum AnswerType
        {[...]}

    public enum GameStatus
        {[...]}
 ```

**Explanation for Presentation**: We implemented a custom domain model class (Card), a value-type coordinate structure (BoardPosition), an immutable data carrier record (GuessResult), and state enumeration (AnswerType).

### 3. ***Properties (class and struct)***

**Class Properties**: GuessWho.Server/Models/Card.cs (Lines 5–10)

``` C#
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public List<string> Attributes { get; set; } = new();
    public bool IsFlipped { get; set; }
    public BoardPosition Position { get; set; }
```

**Class Property Example**: Card.cs has properties like public string Name { get; set; } or public List<string> Attributes { get; set; }.

**Struct Properties**: GuessWho.Server/Models/BoardPosition.cs (Lines 5–6)

``` C#
    public int Row { get; set; }
    public int Column { get; set; }
```

**Struct Property Example**: BoardPosition.cs has properties like public int Row { get; set; } and public int Column { get; set; }.

### 4. ***Named and optional arguments***

**Where in the code**: GuessWho.Server/Services/GameEngine.cs (Lines 14–18)

GetFilteredCards method uses optional arguments:

``` C#
public List<Card> GetFilteredCards(
    string? category = null,
    bool includeFlipped = false,
    int maxResults = 24)
```

**Explanation for Presentation**: The GetFilteredCards method utilizes optional parameters (string? category = null, bool includeFlipped = false, int maxResults = 24), which allows the method to be called with default values or custom named parameters.

### 5. ***Extension method***

**Where in the code**: GuessWho.Server/Extensions/CardExtensions.cs (Lines 7–13)

```C#
public static bool HasAttribute(this Card card, string attributeName)
    {
        if (card == null || string.IsNullOrWhiteSpace(attributeName))
            return false;

        return card.Attributes.Any(a => a.Equals(attributeName, StringComparison.OrdinalIgnoreCase));
    }
```

**Explanation for Presentation**: The HasAttribute static method extends the Card model using the this keyword, enabling attribute checks directly on any Card instance.

### 6. ***Collection iteration***

**Where in the code**: GuessWho.Server/Services/GameEngine.cs (Lines 44–47, inside the ProcessAnswer method)

```C#
foreach (var card in cardsToFlip)
{
    card.IsFlipped = true;
}
```

**Explanation for Presentation**: The application iterates through collections of cards using a standard foreach loop to evaluate states and update flipped properties.

### 7. ***Stream reading with `using`***

**Where in the code**: GuessWho.Server/Services/CardDataLoader.cs (Lines 15 and 37)

```C#
public async Task<List<Card>> LoadCardsFromStreamAsync(Stream stream)
    {
        using var reader = new StreamReader(stream);
        string jsonContent = await reader.ReadToEndAsync();
        [...]
        return JsonSerializer.Deserialize<List<Card>>(jsonContent, options) ?? new List<Card>();
    }

    public async Task<List<Card>> LoadCardsFromFileAsync(string filePath)
    {
        [...]
        using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return await LoadCardsFromStreamAsync(fileStream);
    }
```

**Explanation for Presentation**: The data loader uses using var reader = new StreamReader(stream) and using var fileStream = new FileStream(...) to ensure safe, memory-leak-free stream reading when loading JSON card categories from disk.

### 8. ***LINQ to Objects***

**Where in the code**: GuessWho.Server/Services/GameEngine.cs (Lines 37–40 inside ProcessAnswer)

```C#
var cardsToFlip = _cards
    .Where(c => !c.IsFlipped)
    .Where(c => c.HasAttribute(attribute) != hasAttribute)
    .ToList();
```

**Explanation for Presentation**: The application uses LINQ extension methods (.Where(), .Select(), .Take(), etc.) to query, filter, and transform in-memory collections of Card objects without writing manual loops.

### 9. ***Standard .NET interface***

**Where in the code**: GuessWho.Server/Models/Card.cs (Line 3)

```C#
public class Card : IEquatable<Card>, IComparable<Card>
```

**Explanation for Presentation**: The Card model implements standard .NET interfaces (IEquatable<Card> for equality comparison and IComparable<Card> for sorting/ordering by name) to provide robust comparison and sorting behavior.

### 10. ***PRs: 3 authored + 3 reviewed per member***

GitHub repository -> Pull Requests tab (Filtered by Author & Reviewer)

**PRs authored by Audringa**: https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+author%3Aaudringeliss

**PRs reviewed by Audringa**: https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+reviewed-by%3A%40me

**PRs authored by Girius**: https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+author%3Agiriusfrank

**PRs reviewed by Girius**: https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+reviewed-by%3A%40giriusfrank

**PRs authored by Laura**: https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+author%3Alaurakanap

**PRs reviewed by Laura**: https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+reviewed-by%3A%40laurakanap

### 11. ***Uniform coding style***

Consistent application of standard C# naming conventions (PascalCase/camelCase) across services and models.
