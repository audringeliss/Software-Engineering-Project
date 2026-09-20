namespace GuessWho.Server.Models;

public struct BoardPosition
{
    public int Row { get; set; }
    public int Column { get; set; }

    public BoardPosition(int row, int column)
    {
        Row = row;
        Column = column;
    }
}