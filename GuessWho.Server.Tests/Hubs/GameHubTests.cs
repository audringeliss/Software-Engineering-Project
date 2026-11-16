using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace GuessWho.Server.Tests.Hubs;

public sealed class GameHubTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public GameHubTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GameHub_CanConnectAndDisconnectCleanly()
    {
        var server = _factory.Server;
        var hubUrl = new Uri(server.BaseAddress, "/gamehub"); // Adjust if your MapHub route in Program.cs differs

        await using var connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.HttpMessageHandlerFactory = _ => server.CreateHandler();
            })
            .Build();

        await connection.StartAsync();
        Assert.Equal(HubConnectionState.Connected, connection.State);

        await connection.StopAsync();
        Assert.Equal(HubConnectionState.Disconnected, connection.State);
    }
}