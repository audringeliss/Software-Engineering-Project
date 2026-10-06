using System.Text.Json;
using GuessWho.Server.Models;

namespace GuessWho.Server.Services;

public class CardDataLoader
{
    private readonly string _dataFolderPath;

    public CardDataLoader(IWebHostEnvironment env)
    {
        _dataFolderPath = Path.Combine(env.ContentRootPath, "Data");
    }

    public async Task<List<Card>> LoadCardsFromStreamAsync(Stream stream)
    {
        using var reader = new StreamReader(stream);
        string jsonContent = await reader.ReadToEndAsync();

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<List<Card>>(jsonContent, options) ?? new List<Card>();
    }

    public async Task<List<Card>> LoadCardsFromFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            return new List<Card>();
        }

        using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return await LoadCardsFromStreamAsync(fileStream);
    }

    // New helper method for dynamic categories
    public async Task<List<Card>> GetCategoryCardsAsync(string categoryId)
    {
        string filePath = Path.Combine(_dataFolderPath, $"{categoryId.ToLower()}.json");
        return await LoadCardsFromFileAsync(filePath);
    }
}