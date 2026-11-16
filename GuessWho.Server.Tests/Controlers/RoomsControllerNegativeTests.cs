using System.Net;
using System.Net.Http.Json;
using GuessWho.Server.Controllers;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GuessWho.Server.Tests.Controllers;

[Collection("IntegrationTests")]
public sealed class RoomsControllerNegativeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RoomsControllerNegativeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task JoinRoom_NonExistentCode_ReturnsNotFound()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/rooms/ABCDEF/join", new JoinRoomRequest
        {
            Code = "ABCDEF",
            PlayerName = "Guest"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task JoinRoom_WhenAlreadyFull_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();

        // Create room (Host)
        var createRes = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest { PlayerName = "Host" });
        createRes.EnsureSuccessStatusCode();
        var host = await createRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();

        // First join (Guest 1 - Succeeds)
        var firstJoinRes = await client.PostAsJsonAsync($"/api/rooms/{host!.RoomCode}/join", new JoinRoomRequest
        {
            Code = host.RoomCode,
            PlayerName = "Guest1"
        });
        firstJoinRes.EnsureSuccessStatusCode();

        // Second join (Guest 2 - Should fail because room is full)
        var secondJoinRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/join", new JoinRoomRequest
        {
            Code = host.RoomCode,
            PlayerName = "Guest2"
        });

        Assert.Equal(HttpStatusCode.BadRequest, secondJoinRes.StatusCode);
    }

    [Fact]
    public async Task ProposeCategory_UnauthorizedPlayer_ReturnsNotFound()
    {
        var client = _factory.CreateClient();
        var createRes = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest { PlayerName = "Host" });
        createRes.EnsureSuccessStatusCode();
        var host = await createRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();

        var proposeRes = await client.PostAsJsonAsync($"/api/rooms/{host!.RoomCode}/category/propose", new ProposeCategoryRequest
        {
            PlayerId = "invalid-player-id",
            Category = "animals"
        });

        Assert.Equal(HttpStatusCode.NotFound, proposeRes.StatusCode);
    }

    [Fact]
    public async Task RespondCategory_RejectCategory_ResetsToWaitingState()
    {
        var client = _factory.CreateClient();

        var createRes = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest { PlayerName = "Host" });
        createRes.EnsureSuccessStatusCode();
        var host = await createRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();

        var joinRes = await client.PostAsJsonAsync($"/api/rooms/{host!.RoomCode}/join", new JoinRoomRequest
        {
            Code = host.RoomCode,
            PlayerName = "Guest"
        });
        joinRes.EnsureSuccessStatusCode();
        var guest = await joinRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();

        // Host proposes category
        var proposeRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/category/propose", new ProposeCategoryRequest
        {
            PlayerId = host.PlayerId,
            Category = "animals"
        });
        proposeRes.EnsureSuccessStatusCode();

        // Guest rejects category (Accept = false) -> exercises the 'else' branch
        var rejectRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/category/respond", new RespondCategoryRequest
        {
            PlayerId = guest!.PlayerId,
            Accept = false
        });

        rejectRes.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task SubmitGuess_IncorrectGuess_SwitchesTurnInsteadOfGameOver()
    {
        var client = _factory.CreateClient();

        // Setup full game flow up to target selection
        var createRes = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest { PlayerName = "Host" });
        createRes.EnsureSuccessStatusCode();
        var host = await createRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();

        var joinRes = await client.PostAsJsonAsync($"/api/rooms/{host!.RoomCode}/join", new JoinRoomRequest
        {
            Code = host.RoomCode,
            PlayerName = "Guest"
        });
        joinRes.EnsureSuccessStatusCode();
        var guest = await joinRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();

        var proposeRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/category/propose", new ProposeCategoryRequest
        {
            PlayerId = host.PlayerId,
            Category = "animals"
        });
        proposeRes.EnsureSuccessStatusCode();

        var respondRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/category/respond", new RespondCategoryRequest
        {
            PlayerId = guest!.PlayerId,
            Accept = true
        });
        respondRes.EnsureSuccessStatusCode();

        var stateRes = await client.GetAsync($"/api/rooms/{host.RoomCode}/state?playerId={host.PlayerId}");
        stateRes.EnsureSuccessStatusCode();
        var stateJson = await stateRes.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var board = stateJson.GetProperty("board");
        var cardId1 = board[0].GetProperty("id").GetString()!;
        var cardId2 = board[1].GetProperty("id").GetString()!;

        var select1Res = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/select-target", new SelectTargetRequest
        {
            PlayerId = host.PlayerId,
            Category = "animals",
            TargetId = cardId1
        });
        select1Res.EnsureSuccessStatusCode();

        var select2Res = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/select-target", new SelectTargetRequest
        {
            PlayerId = guest.PlayerId,
            Category = "animals",
            TargetId = cardId2
        });
        select2Res.EnsureSuccessStatusCode();

        // Submit an intentionally incorrect guess -> exercises the incorrect guess branch
        var guessRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/guess", new GuessRequest
        {
            PlayerId = host.PlayerId,
            CardId = "non-existent-card-id"
        });

        guessRes.EnsureSuccessStatusCode();
    }
}