namespace ConectaServ.Models;

public sealed class NovoAtendimentoRequest
{
    public string? Cliente { get; init; }

    public string? Servico { get; init; }

    public DateOnly? Data { get; init; }

    public TimeOnly? Horario { get; init; }
}
