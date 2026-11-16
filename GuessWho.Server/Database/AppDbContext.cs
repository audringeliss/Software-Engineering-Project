using Microsoft.EntityFrameworkCore;
using GuessWho.Server.Models;

namespace GuessWho.Server.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<GameRoomEntity> GameRooms => Set<GameRoomEntity>();
    public DbSet<RoomPlayerEntity> RoomPlayers => Set<RoomPlayerEntity>();
    public DbSet<GameSessionEntity> GameSessions => Set<GameSessionEntity>();
    public DbSet<QuestionHistoryEntity> QuestionHistories => Set<QuestionHistoryEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameRoomEntity>(entity =>
        {
            entity.HasKey(room => room.Code);
            entity.Property(room => room.Code).HasMaxLength(6);
            entity.HasMany(room => room.Players)
                .WithOne(player => player.Room)
                .HasForeignKey(player => player.RoomCode)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(room => room.GameSession)
                .WithOne(session => session.Room)
                .HasForeignKey<GameSessionEntity>(session => session.RoomCode)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RoomPlayerEntity>(entity =>
        {
            entity.HasKey(player => player.PlayerId);
            entity.HasIndex(player => new { player.RoomCode, player.Role }).IsUnique();
        });

        modelBuilder.Entity<GameSessionEntity>(entity =>
        {
            entity.HasKey(session => session.RoomCode);
            entity.Property(session => session.BoardJson).IsRequired();
            entity.Property(session => session.CreatorFlippedCardIdsJson).IsRequired();
            entity.Property(session => session.JoinerFlippedCardIdsJson).IsRequired();
            entity.HasMany(session => session.QuestionHistory)
                .WithOne(history => history.GameSession)
                .HasForeignKey(history => history.RoomCode)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionHistoryEntity>(entity =>
        {
            entity.HasKey(history => history.Id);
            entity.HasIndex(history => new { history.RoomCode, history.Sequence }).IsUnique();
        });

        base.OnModelCreating(modelBuilder);
    }
}