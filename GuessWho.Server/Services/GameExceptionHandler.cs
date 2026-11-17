using GuessWho.Server.Exceptions;
using Microsoft.AspNetCore.Diagnostics;

namespace GuessWho.Server.Services;

public sealed class GameExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GameExceptionHandler> _logger;

    public GameExceptionHandler(ILogger<GameExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not GameRuleException gameException)
        {
            return false;
        }

        _logger.LogWarning(
            gameException,
            "Handled game rule exception [{ErrorCode}] on {Path}: {Message}",
            gameException.ErrorCode,
            httpContext.Request.Path,
            gameException.Message);

        httpContext.Response.StatusCode = gameException.StatusCode;

        await httpContext.Response.WriteAsJsonAsync(new
        {
            error = gameException.ErrorCode,
            message = gameException.Message,
            statusCode = gameException.StatusCode,
            timestamp = DateTime.UtcNow
        }, cancellationToken);

        return true;
    }
}