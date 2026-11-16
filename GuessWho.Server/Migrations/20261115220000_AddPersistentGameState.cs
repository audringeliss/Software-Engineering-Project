using System;
using GuessWho.Server.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuessWho.Server.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261115220000_AddPersistentGameState")]
public partial class AddPersistentGameState : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "GameRooms",
            columns: table => new
            {
                Code = table.Column<string>(type: "TEXT", maxLength: 6, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_GameRooms", room => room.Code));

        migrationBuilder.CreateTable(
            name: "GameSessions",
            columns: table => new
            {
                RoomCode = table.Column<string>(type: "TEXT", nullable: false),
                Status = table.Column<string>(type: "TEXT", nullable: false),
                Category = table.Column<string>(type: "TEXT", nullable: true),
                ProposedCategory = table.Column<string>(type: "TEXT", nullable: true),
                ProposedCategoryByRole = table.Column<string>(type: "TEXT", nullable: true),
                BoardJson = table.Column<string>(type: "TEXT", nullable: false),
                TargetCardId = table.Column<string>(type: "TEXT", nullable: true),
                CreatorTargetCardId = table.Column<string>(type: "TEXT", nullable: true),
                JoinerTargetCardId = table.Column<string>(type: "TEXT", nullable: true),
                CreatorFlippedCardIdsJson = table.Column<string>(type: "TEXT", nullable: false),
                JoinerFlippedCardIdsJson = table.Column<string>(type: "TEXT", nullable: false),
                CurrentTurnRole = table.Column<string>(type: "TEXT", nullable: false),
                PendingQuestion = table.Column<string>(type: "TEXT", nullable: true),
                PendingQuestionAskedByRole = table.Column<string>(type: "TEXT", nullable: true),
                WinnerRole = table.Column<string>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_GameSessions", session => session.RoomCode);
                table.ForeignKey(
                    name: "FK_GameSessions_GameRooms_RoomCode",
                    column: session => session.RoomCode,
                    principalTable: "GameRooms",
                    principalColumn: "Code",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "RoomPlayers",
            columns: table => new
            {
                PlayerId = table.Column<string>(type: "TEXT", nullable: false),
                RoomCode = table.Column<string>(type: "TEXT", nullable: false),
                Role = table.Column<string>(type: "TEXT", nullable: false),
                Name = table.Column<string>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RoomPlayers", player => player.PlayerId);
                table.ForeignKey(
                    name: "FK_RoomPlayers_GameRooms_RoomCode",
                    column: player => player.RoomCode,
                    principalTable: "GameRooms",
                    principalColumn: "Code",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "QuestionHistories",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                RoomCode = table.Column<string>(type: "TEXT", nullable: false),
                Sequence = table.Column<int>(type: "INTEGER", nullable: false),
                Question = table.Column<string>(type: "TEXT", nullable: false),
                Answer = table.Column<string>(type: "TEXT", nullable: false),
                AskedByRole = table.Column<string>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_QuestionHistories", history => history.Id);
                table.ForeignKey(
                    name: "FK_QuestionHistories_GameSessions_RoomCode",
                    column: history => history.RoomCode,
                    principalTable: "GameSessions",
                    principalColumn: "RoomCode",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_QuestionHistories_RoomCode_Sequence",
            table: "QuestionHistories",
            columns: new[] { "RoomCode", "Sequence" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RoomPlayers_RoomCode_Role",
            table: "RoomPlayers",
            columns: new[] { "RoomCode", "Role" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "QuestionHistories");
        migrationBuilder.DropTable(name: "RoomPlayers");
        migrationBuilder.DropTable(name: "GameSessions");
        migrationBuilder.DropTable(name: "GameRooms");
    }

    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        AppDbContextModelSnapshot.ConfigureModel(modelBuilder);
    }
}