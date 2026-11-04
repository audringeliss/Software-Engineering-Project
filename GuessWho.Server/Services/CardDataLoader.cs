using System.Text.Json;
using System.Text.Json.Serialization;
using GuessWho.Server.Models;

namespace GuessWho.Server.Services;

public class CardDataLoader
{
    private readonly string _dataFolderPath;

    public CardDataLoader(IWebHostEnvironment env)
    {
        _dataFolderPath = Path.Combine(env.ContentRootPath, "Data");
    }

    public async Task<List<Card>> LoadCardsFromStreamAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        using var reader = new StreamReader(stream);
        string jsonContent = await reader.ReadToEndAsync(cancellationToken);

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new NumericStringConverter() }
        };

        return JsonSerializer.Deserialize<List<Card>>(jsonContent, options) ?? new List<Card>();
    }

    public async Task<List<Card>> LoadCardsFromFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        if (!File.Exists(filePath))
        {
            return new List<Card>();
        }

        using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return await LoadCardsFromStreamAsync(fileStream, cancellationToken);
    }

    // New helper method for dynamic categories
    public async Task<List<Card>> GetCategoryCardsAsync(string categoryId, CancellationToken cancellationToken = default)
    {
        string filePath = Path.Combine(_dataFolderPath, $"{categoryId.ToLower()}.json");
        return await LoadCardsFromFileAsync(filePath, cancellationToken);
    }

    private sealed class NumericStringConverter : JsonConverter<string>
    {
        public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.TokenType switch
            {
                JsonTokenType.String => reader.GetString() ?? string.Empty,
                JsonTokenType.Number => reader.GetInt64().ToString(),
                _ => throw new JsonException($"Unexpected token {reader.TokenType} when reading a string.")
            };
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }
}