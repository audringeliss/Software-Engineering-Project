using GuessWho.Server.Extensions;
using GuessWho.Server.Models;
using GuessWho.Server.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace GuessWho.Server.Tests.Services;

public sealed class CardDataLoaderTests
{
    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "GuessWho.Server";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "GuessWho.Server"));
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    [Fact]
    public async Task GetCategoryCardsAsync_ValidCategory_ReturnsPopulatedCards()
    {
        var loader = new CardDataLoader(new TestWebHostEnvironment());
        var cards = await loader.GetCategoryCardsAsync("animals");

        Assert.NotNull(cards);
        Assert.NotEmpty(cards);
        Assert.All(cards, card =>
        {
            Assert.False(string.IsNullOrWhiteSpace(card.Id));
            Assert.False(string.IsNullOrWhiteSpace(card.Name));
        });
    }

    [Fact]
    public async Task GetCategoryCardsAsync_UnknownCategory_ReturnsEmptyOrHandlesGracefully()
    {
        var loader = new CardDataLoader(new TestWebHostEnvironment());
        var cards = await loader.GetCategoryCardsAsync("non_existent_category_xyz");

        Assert.Empty(cards);
    }

    [Fact]
    public void CardExtensions_AttributeMatching_EvaluatesCorrectly()
    {
        var card = new Card
        {
            Id = "lion",
            Name = "Lion",
            Category = "animals",
            Attributes = new List<string> { "mane", "fur", "carnivore" }
        };

        Assert.True(card.HasAttribute("MANE"));
        Assert.False(card.HasAttribute("wings"));
    }
}