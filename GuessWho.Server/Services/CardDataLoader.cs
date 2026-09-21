using System.Text.Json;
using GuessWho.Server.Models;

namespace GuessWho.Server.Services;

public class CardDataLoader
{
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
}