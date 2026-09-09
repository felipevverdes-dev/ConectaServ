using Microsoft.EntityFrameworkCore;
using ConectaServ.Models;

namespace ConectaServ.Data;

public class AppDbContext : DbContext
{
    public DbSet<Atendimento> Atendimentos { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Atendimento>()
            .HasIndex(a => new { a.Data, a.Horario })
            .IsUnique();
    }
}
