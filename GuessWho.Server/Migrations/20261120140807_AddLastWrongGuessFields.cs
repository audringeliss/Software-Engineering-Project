using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuessWho.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLastWrongGuessFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastWrongGuessByRole",
                table: "GameSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastWrongGuessCardId",
                table: "GameSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastWrongGuessCardImageUrl",
                table: "GameSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastWrongGuessCardName",
                table: "GameSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastWrongGuessId",
                table: "GameSessions",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastWrongGuessByRole",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "LastWrongGuessCardId",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "LastWrongGuessCardImageUrl",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "LastWrongGuessCardName",
                table: "GameSessions");

            migrationBuilder.DropColumn(
                name: "LastWrongGuessId",
                table: "GameSessions");
        }
    }
}
