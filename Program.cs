using ConectaServ.Data;
using ConectaServ.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=conectaserv.db";
var sqliteConnectionString = new SqliteConnectionStringBuilder(connectionString);

if (!Path.IsPathRooted(sqliteConnectionString.DataSource)
    && sqliteConnectionString.DataSource != ":memory:")
{
    sqliteConnectionString.DataSource = Path.GetFullPath(
        sqliteConnectionString.DataSource,
        builder.Environment.ContentRootPath);
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(sqliteConnectionString.ConnectionString));

builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/atendimentos", async (AppDbContext db) =>
{
    var atendimentos = await db.Atendimentos
        .AsNoTracking()
        .OrderBy(a => a.Data)
        .ThenBy(a => a.Horario)
        .ToListAsync();
    return Results.Ok(atendimentos);
});

app.MapPost("/api/atendimentos", async (NovoAtendimentoRequest request, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Cliente)
        || string.IsNullOrWhiteSpace(request.Servico)
        || request.Data is null
        || request.Horario is null)
    {
        return Results.BadRequest(new
        {
            mensagem = "Cliente, Serviço, Data e Horário são obrigatórios."
        });
    }

    var cliente = request.Cliente.Trim();
    var servico = request.Servico.Trim();

    if (cliente.Length > Atendimento.TamanhoMaximoCliente
        || servico.Length > Atendimento.TamanhoMaximoServico)
    {
        return Results.BadRequest(new
        {
            mensagem = "Cliente e Serviço devem ter no máximo 100 caracteres."
        });
    }

    if (request.Horario.Value.Ticks % TimeSpan.TicksPerMinute != 0)
    {
        return Results.BadRequest(new
        {
            mensagem = "Horário deve ser informado em intervalos de um minuto."
        });
    }

    var conflito = await db.Atendimentos
        .AnyAsync(a => a.Data == request.Data.Value && a.Horario == request.Horario.Value);

    if (conflito)
    {
        return Results.Conflict(new
        {
            mensagem = "Já existe um atendimento agendado para este horário."
        });
    }

    var atendimento = new Atendimento
    {
        Cliente = cliente,
        Servico = servico,
        Data = request.Data.Value,
        Horario = request.Horario.Value,
        Status = "Agendado"
    };

    db.Atendimentos.Add(atendimento);

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException exception)
        when (exception.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 })
    {
        return Results.Conflict(new
        {
            mensagem = "Já existe um atendimento agendado para este horário."
        });
    }

    return Results.Created($"/api/atendimentos/{atendimento.Id}", atendimento);
});

app.MapDelete("/api/atendimentos/{id}", async (int id, AppDbContext db) =>
{
    var atendimento = await db.Atendimentos.FindAsync(id);
    if (atendimento == null) return Results.NotFound();

    db.Atendimentos.Remove(atendimento);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();
