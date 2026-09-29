## **Guess Who?**
is a multiplayer web game where players try to guess a hidden person or object by asking questions and receiving True/False (T/F) answers.

The application solves the problem of making a traditional guessing game easily accessible online (for everyone). Instead of needing a physical game and being in the same location, players will be able to play together through a web browser.

The main goals of this project are:

- Provide a simple and intuitive online guessing game.
- Allow two (or more) players to play the same game remotely.
- Give players different categories to choose from.
- Make the game easy to understand through a clear UI.
- Provide player accounts and statistics

## Team information

- **Team leader** - Audringa Daškevičiūtė
- **Team members**:

  Audringa Daškevičiūtė (audringeliss),

  Girius Frankonis (giriusfrank),

  Laura Kanapienytė (laurakanap)
  
- **Company name** - ***LAG Inc.***
- **Product name** - ***Guess Who?***

## Feature Roadmap

The development of the application is divided into three main versions:

1. Alpha
2. Beta
3. Final

Each version builds upon the functionality of the previous version.

### **Alpha version**

**Backend**:

- Basic Guess Who? game logic.
- Question submission.
- True/False answer system.
- Person/object selection.
- More than one category: People, Animals, etc.

**UI**:

- Text fields.
- Buttons (T/F).
- Question submission field.
- Game card flipping.
- Basic game information.
- Easy to understand user interface and usage.

The Alpha version should demonstrate that the fundamental question -> answer game mechanic works through a web interface and that the idea of this project can actually become a real product.

### **Beta version**

Everything that Alpha version has plus:

**Backend**:

- Two-player game sessions.
- Connection between two players (servers, like ***Kahoot!***).
- Turn management.
- Shared game state.
- Separate data collection per game session.
- Player accounts.
- Validation for player account.
- Relational database.

**UI**:

- Game start section.
- Category selection.
- Current player indicator.
- Result screen.
- Sign in and log in application.
- Validation for player account and for different input fields.
- Better web interface visual design.

The Beta version should allow two players to complete a full Guess Who? game using different categories and an improved user interface.

### **Final version**

Everything that Beta version has plus:

**Backend**:

- More categories.
- More people and objects.
- Timed Q&A.
- Larger selection of possible targets (18-27 per category).
- Multiple simultaneous game sessions with the same opponent.
- Individual player statistics.
- 3+ players in a single game matches.
- Disconnection handling.

**UI**:

- Improved main menu.
- Improved category selection.
- Improved person/object (target) selection.
- Improved Q&A interface.
- Game progress information (question count, number of open cards on opponents front and etc.).
- Responsive design.
- Easy to understand statistics.

The Final version should provide a complete multiplayer Guess Who? web application with multiple categories, server-based multiplayer, comprehensive UI, complete game functionality player accounts and statistics.

### Possible "Guess Who?" categories 
Categories will be chosen from the following list:

| Nr.    | Category                             | Examples                                          |
|--------|--------------------------------------|---------------------------------------------------|
| 1      | Animals                              | Cat, Dog, Cow, Turtle, Fish                       |
| 2      | Apps & Artificial Inteligence tools  | Facebook, Threads, ChatGPT, Claude                |
| 3      | Cartoon Network                      | Ben Ten, Steven Universe, Buttercup               |
| 4      | Celebrities                          | Dua Lipa, Keanu Reeves, Tom Holland               |
| 5      | Childen's Animation Characters       | Spongebob Squarepants, Hello Kitty, Mickey Mouse  |
| 6      | Countries                            | Lithuania, Sweden, Italy, Brazil                  |
| 7      | Disney                               | Buzz, Stich, McQueen, Cruella de Vil              |
| 8      | Games (characters)                   | Minecraft, Stardew Valley, Counter Strike, GTA    |
| 9      | MARVEL x DC                          | Spider-man, Thor, Batman, Wonder Woman            |
| 10     | Mythical creatures                   | Dragon, Cyclops, Goblin, Unicorn                   |
| 11     | People                               | Jeniffer, Alex, Jack, Abigail                     |
| 12     | Pokémon                              | Pikachu, Eevee, Jigglypuff, Bulbasaur             |
|        | *still thinking of different categories so that there is more variety |                  |

## Technology stack

**Backend**:

- ASP.NET Core - the main server-side framework responsible for the application logic and API.
- C# - the main programming language used for the backend.
- SignalR - built for ASP.NET Core and handles real-time, two-way WebSocket communication.

**Frontend**:

- React - used to build the user interface and interactive game components.
- TypeScript / JavaScript - used for React development.
- HTML & CSS - used for the structure and styling of the application.

## End-to-end user scenario

The player opens the Guess Who? website and creates or logs into their account. They select New Game, choose a category (for example, People or Objects), and invite another player to join. Both players select a person or object that the other player will have to guess. The first player asks a question about the opponent's hidden target. The question should have a True/False answer. The opponent receives the question and selects True or False. The answer is then shown to the asking player who can now close those options that they think are not going to be their opponents chosen target. Players continue asking and answering questions until one player is confident about the hidden target. The player selects their final guess from the available people or objects. The system checks the guess and displays whether the player won or lost. The game result is saved to the player's account and statistics.