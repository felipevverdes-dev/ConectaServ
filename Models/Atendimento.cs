using System.ComponentModel.DataAnnotations;

namespace ConectaServ.Models;

public class Atendimento
{
    public const int TamanhoMaximoCliente = 100;
    public const int TamanhoMaximoServico = 100;

    public int Id { get; set; }

    [Required]
    [MaxLength(TamanhoMaximoCliente)]
    public string Cliente { get; set; } = string.Empty;

    [Required]
    [MaxLength(TamanhoMaximoServico)]
    public string Servico { get; set; } = string.Empty;

    [Required]
    public DateOnly Data { get; set; }

    [Required]
    public TimeOnly Horario { get; set; }

    public string Status { get; set; } = "Agendado";
}
