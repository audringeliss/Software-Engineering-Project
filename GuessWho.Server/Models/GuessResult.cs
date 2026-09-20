namespace GuessWho.Server.Models;

public record GuessResult(
    bool IsCorrect,
    string TargetName,
    int RemainingAttempts
);