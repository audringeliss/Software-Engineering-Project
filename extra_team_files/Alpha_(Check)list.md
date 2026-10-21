## | 1 | Interactive UI, end-to-end scenario
**Where in the code (file + line):**

***Frontend***: src/App.jsx (Category selection effects and API fetch handlers for /api/game/start, /api/game/ask, /api/game/answer)
- Lines 39–70 (where selecting a category fetches cards and registers the session target on the backend)
- Lines 88–109 (handleSendQuestion posting questions to the server).
- Lines 111–136 (handleAnswerQuestion submitting true/false responses and updating the board grid).

***Backend***: Controllers/GameController.cs (Endpoints handling state changes and returning filtered board data)
- Start Endpoint: Lines 20–43 ([HttpPost("start")])
- Ask Endpoint: Lines 45–53 ([HttpPost("ask")])
- Answer Endpoint: Lines 55–69 ([HttpPost("answer")])

**How to explain it:**

The user selects a category from the React UI (src/App.jsx), which triggers an API call to initialize a game session on the C# backend (GameController.cs). When the user asks a question and submits a True/False answer, the frontend posts to the server, which filters the cards via the game engine and returns the updated state to dynamically render the game board.

## | 2 | 4 own types: class, struct, record, enum (one immutable)
**Where in the code (file + line):**

- ***class***: Controllers/GameController.cs (ASP.NET Core API controller class)

- ***struct***: A custom value type used for coordinate or filter pairs (e.g., in Services/ or Models/)

* ***record***: Models/Card.cs (Data model for cards, which is immutable by default)

- ***enum***: Category or trait enumeration (e.g., card attributes)

**How to explain it:**

Our architecture utilizes all four core C# type categories: a class for our web controller logic, a struct for lightweight value modeling, an enum for categorical options, and a record for our Card data model. Records are immutable by default, ensuring thread-safe, read-only state representation for our game cards.

## | 3 | Properties (class and struct)
**Where in the code (file + line):**

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

## | 4 | Named and optional arguments 
**Where in the code (file + line):** 

Services/GameEngine.cs or helper methods (Methods designed with default parameters like public void ResetBoard(bool clearHistory = true))

GuessWho.Server/Services/GameEngine.cs (Lines 14–18)

GetFilteredCards method uses optional arguments:

``` C#
public List<Card> GetFilteredCards(
    string? category = null,
    bool includeFlipped = false,
    int maxResults = 24)
```

**How to explain it:**

We implement optional parameters in our service layer methods (such as default flags for resetting states). When calling these methods elsewhere in the codebase, we utilize named arguments to explicitly pass parameters, improving code readability and clarity.

The GetFilteredCards method utilizes optional parameters (string? category = null, bool includeFlipped = false, int maxResults = 24), which allows the method to be called with default values or custom named parameters.

## | 5 | Extension method
**Where in the code (file + line):** 

GuessWho.Server/Extensions/CardExtensions.cs (Lines 7–13)

```C#
public static bool HasAttribute(this Card card, string attributeName)
    {
        if (card == null || string.IsNullOrWhiteSpace(attributeName))
            return false;

        return card.Attributes.Any(a => a.Equals(attributeName, StringComparison.OrdinalIgnoreCase));
    }
```

**How to explain it:**

The HasAttribute static method extends the Card model using the this keyword, enabling attribute checks directly on any Card instance.

## | 6 | Collection iteration 
**Where in the code (file + line):** 

Controllers/GameController.cs and Services/GameEngine.cs (Iterating over card collections during filtering operations) lines 25-27

**How to explain it:**

We iterate through our card collections using both standard loop constructs and LINQ query expressions. This ensures we can efficiently evaluate every active card on the board against the user's questions.

## | 7 | Stream reading with `using` 
**Where in the code (file + line):** 

Services/CardDataLoader.cs (File stream initialization reading cards.json) lines 17-18 and 35-36

**How to explain it:**

When loading our initial card dataset from cards.json, we utilize a using statement (or declaration). This ensures that the file stream is safely disposed and memory leaks are prevented as soon as the file reading finishes.

## | 8 | LINQ to Objects 
**Where in the code (file + line):**

Controllers/GameController.cs (Lines filtering board data: _gameState.Board.Where(c => c.Category.Equals(...))) lines 28-34

**How to explain it:**

We heavily utilize LINQ to Objects in our GameController and GameEngine. Using methods like .Where(), .FirstOrDefault(), and lambda expressions allows us to query our in-memory card collections cleanly and efficiently without manual loops.

## | 9 | Standard .NET interface 
**Where in the code (file + line):**

Services/GameState.cs or service classes implementing standard interfaces like IDisposable or IEquatable<Card>

**How to explain it:**

Our backend architecture implements standard .NET interfaces to enforce expected contracts, maintain loose coupling between services, and ensure seamless integration with ASP.NET Core's built-in dependency injection container.

## | 10 | PRs: 3 authored + 3 reviewed per member 
**Where in the code (file + line):**

GitHub Repository → Pull Requests tab

PRs:
- https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+author%3Aaudringeliss
- https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+author%3Agiriusfrank
- https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+author%3Alaurakanap

reviews:
- https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+reviewed-by%3A%40audringeliss
- https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+reviewed-by%3A%40giriusfrank
- https://github.com/audringeliss/Software-Engineering-Project/pulls?q=is%3Apr+state%3Aclosed+reviewed-by%3A%40laurakanap

**How to explain it:**

Every team member met the collaboration requirement by authoring at least 3 pull requests and thoroughly reviewing 3 pull requests from peers, ensuring code quality and shared ownership before merging into the main branch.

## | 11 | Uniform coding style 
**Where in the code (file + line):**

Entire repository (GuessWho.Server/ and guesswho.client/)

**How to explain it:**

We maintained a uniform coding style across both C# and JavaScript/React. In C#, we follow standard PascalCase for classes and methods and camelCase for local variables. In React, we adhere to consistent functional component patterns, clean folder structuring, and unified CSS styling.
