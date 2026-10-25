using Microsoft.EntityFrameworkCore;
using GuessWho.Server.Models;

namespace GuessWho.Server.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
}