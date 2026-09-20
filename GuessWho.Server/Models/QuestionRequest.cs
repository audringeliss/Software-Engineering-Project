namespace GuessWho.Server.Models;

public record QuestionRequest(
    string QuestionText,
    string TargetAttribute,
    DateTime AskedAt
);