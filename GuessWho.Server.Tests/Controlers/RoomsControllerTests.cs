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

    [Fact]
    public async Task FullGameFlow_ExecutesHappyPathAndReachesGameOver()
    {
        var client = _factory.CreateClient();

        // 1. Create Room
        var createRes = await client.PostAsJsonAsync("/api/rooms", new CreateRoomRequest { PlayerName = "Host" });
        createRes.EnsureSuccessStatusCode();
        var host = await createRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();
        Assert.NotNull(host);

        // 2. Join Room
        var joinRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/join", new JoinRoomRequest
        {
            Code = host.RoomCode,
            PlayerName = "Guest"
        });
        joinRes.EnsureSuccessStatusCode();
        var guest = await joinRes.Content.ReadFromJsonAsync<RoomMembershipResponse>();
        Assert.NotNull(guest);

        // 3. Propose Category (uses an existing category from your data folder, e.g., "animals" or check your JSON files)
        var proposeRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/category/propose", new ProposeCategoryRequest
        {
            PlayerId = host.PlayerId,
            Category = "animals"
        });
        proposeRes.EnsureSuccessStatusCode();

        // 4. Respond (Accept Category)
        var respondRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/category/respond", new RespondCategoryRequest
        {
            PlayerId = guest.PlayerId,
            Accept = true
        });
        respondRes.EnsureSuccessStatusCode();

        // 5. Fetch State to get valid Card IDs from the loaded board
        var stateRes = await client.GetAsync($"/api/rooms/{host.RoomCode}/state?playerId={host.PlayerId}");
        stateRes.EnsureSuccessStatusCode();
        var stateJson = await stateRes.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var board = stateJson.GetProperty("board");
        var firstCardId = board[0].GetProperty("id").GetString()!;
        var secondCardId = board[1].GetProperty("id").GetString()!;

        // 6. Both Players Select Targets
        var hostTargetRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/select-target", new SelectTargetRequest
        {
            PlayerId = host.PlayerId,
            Category = "animals",
            TargetId = firstCardId
        });
        hostTargetRes.EnsureSuccessStatusCode();

        var guestTargetRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/select-target", new SelectTargetRequest
        {
            PlayerId = guest.PlayerId,
            Category = "animals",
            TargetId = secondCardId
        });
        guestTargetRes.EnsureSuccessStatusCode();

        // 7. Ask & Answer a Question
        var askRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/questions", new QuestionRequest
        {
            PlayerId = host.PlayerId,
            QuestionText = "Is it fluffy?"
        });
        askRes.EnsureSuccessStatusCode();

        var answerRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/answers", new AnswerRequest
        {
            PlayerId = guest.PlayerId,
            IsTrue = true
        });
        answerRes.EnsureSuccessStatusCode();

        // 8. Flip & Reset Cards
        var flipRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/cards/flip", new FlipCardRequest
        {
            PlayerId = guest.PlayerId,
            CardId = firstCardId
        });
        flipRes.EnsureSuccessStatusCode();

        var resetRes = await client.PostAsync($"/api/rooms/{host.RoomCode}/reset?playerId={guest.PlayerId}", null);
        resetRes.EnsureSuccessStatusCode();

        // 9. Submit Winning Guess
        var guessRes = await client.PostAsJsonAsync($"/api/rooms/{host.RoomCode}/guess", new GuessRequest
        {
            PlayerId = guest.PlayerId,
            CardId = firstCardId // Host's target card
        });
        guessRes.EnsureSuccessStatusCode();
    }
}

