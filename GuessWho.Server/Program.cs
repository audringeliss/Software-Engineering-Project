using GuessWho.Server.Services;
using Microsoft.EntityFrameworkCore;
using GuessWho.Server.Database;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<CardDataLoader>();
builder.Services.AddSingleton<GameState>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<GameState>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=guesswho.db"));

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

app.Run();