using Microsoft.AspNetCore.Mvc;

namespace GuessWho.Server.Services;

/// <summary>
/// Generic room command executor that centralizes room lookup, player role authorization,
/// atomic state persistence, and HTTP response projection.
/// </summary>
public sealed class RoomActionExecutor<TRoom> where TRoom : class
{
    private readonly GameRoomStore _roomStore;

    public RoomActionExecutor(GameRoomStore roomStore)
    {
        _roomStore = roomStore;
    }

    /// <summary>
    /// Generic method that authorizes a player, executes a state mutation returning TResult,
    /// persists the room atomically, and maps null outcomes to an HTTP error result.
    /// </summary>
    public IActionResult ExecuteForPlayer<TResult>(
        string roomCode,
        string playerId,
        Func<TRoom, string, TResult?> mutation,
        string errorMessage = "Room not found or unauthorized.",
        bool returnBadRequestOnNull = false)
    {
        var result = _roomStore.ExecuteAtomic(roomCode, baseRoom =>
        {
            if (baseRoom is not TRoom typedRoom)
            {
                return default;
            }

            var role = GameRoomStore.GetRole(baseRoom, playerId);
            if (role is null)
            {
                return default;
            }

            return mutation(typedRoom, role);
        });

        if (result is null)
        {
            return returnBadRequestOnNull
                ? new BadRequestObjectResult(errorMessage)
                : new NotFoundObjectResult(errorMessage);
        }

        return new OkObjectResult(result);
    }
}