namespace GuessWho.Server.Exceptions;

public class GameRuleException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }

    public GameRuleException(string message, int statusCode = StatusCodes.Status400BadRequest, string errorCode = "GAME_RULE_VIOLATION")
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public sealed class RoomNotFoundException : GameRuleException
{
    public RoomNotFoundException(string roomCode)
        : base($"Room '{roomCode}' was not found.", StatusCodes.Status404NotFound, "ROOM_NOT_FOUND")
    {
    }
}

public sealed class RoomFullException : GameRuleException
{
    public RoomFullException(string roomCode)
        : base($"Room '{roomCode}' is already full.", StatusCodes.Status400BadRequest, "ROOM_FULL")
    {
    }
}