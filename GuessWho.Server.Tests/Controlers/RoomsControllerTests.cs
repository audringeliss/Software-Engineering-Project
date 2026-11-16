using System.Net;
using System.Net.Http.Json;
using GuessWho.Server.Controllers;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GuessWho.Server.Tests.Controllers;

public sealed class RoomsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RoomsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateRoom_EndpointReturnsSuccessAndMembership()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest
        {
            PlayerName = "APIHost"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var membership = await response.Content.ReadFromJsonAsync<RoomMembershipResponse>();
        Assert.NotNull(membership);
        Assert.Equal(6, membership.RoomCode.Length);
        Assert.Equal("creator", membership.Role);
    }
}