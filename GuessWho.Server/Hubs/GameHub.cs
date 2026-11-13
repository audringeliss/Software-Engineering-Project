using Microsoft.AspNetCore.SignalR;
using GuessWho.Server.Models;
using GuessWho.Server.Services;

namespace GuessWho.Server.Hubs;

public class GameHub : Hub
{
    private readonly GameRoomStore _roomStore;

    public GameHub(GameRoomStore roomStore)
    {
        _roomStore = roomStore;
    }

    public async Task SubmitGuess(string roomCode, Card guessedCard)
    {
        var room = _roomStore.Find(roomCode);
        if (room == null) return;

        var currentPlayerRole = Context.ConnectionId == room.CreatorId ? "creator" : "joiner";
        var opponentTargetId = currentPlayerRole == "creator" ? room.JoinerTargetCardId : room.CreatorTargetCardId;

        // Check if the guessed card matches the opponent's secret target card ID
        bool isCorrect = guessedCard.Id.Equals(opponentTargetId, StringComparison.OrdinalIgnoreCase);

        if (isCorrect)
        {
            room.Status = "GameOver";
            room.WinnerRole = currentPlayerRole;

            await Clients.Group(roomCode).SendAsync("GameOver", new
            {
                WinnerRole = currentPlayerRole,
                WinningCard = guessedCard
            });
        }
        else
        {
            await Clients.Caller.SendAsync("GuessResult", new
            {
                Success = false,
                Message = "Incorrect guess!"
            });
        }
    }
}