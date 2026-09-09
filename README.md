# ConectaServ

O ConectaServ é uma Prova de Conceito (PoC) de agenda web para profissionais autônomos e pequenos prestadores de serviços. O objetivo é demonstrar o cadastro e a consulta de atendimentos, a validação dos dados, o bloqueio de dois agendamentos no mesmo horário e a persistência local.

## Tecnologias

- .NET 8 e C#;
- ASP.NET Core Minimal API;
- Entity Framework Core 8.0.30 com provider SQLite 8.0.30;
- SQLite;
- HTML5, CSS3 e JavaScript.

## Pré-requisitos

- SDK .NET 8 (`8.0.x`) instalado no computador;
- acesso ao NuGet na primeira execução de `dotnet restore`;
- navegador web atual.

## Executar

Abra um terminal na raiz do projeto e execute exatamente:

```powershell
dotnet restore
dotnet run --launch-profile http
```

Acesse [http://localhost:5259](http://localhost:5259). Para encerrar, pressione `Ctrl+C` no terminal.

Na primeira inicialização, a aplicação cria automaticamente `conectaserv.db` na raiz do projeto. O arquivo é mantido entre execuções e está ignorado pelo Git.

## Roteiro de validação

1. Abra a aplicação e confirme que a seção **Agenda** é exibida.
2. Tente enviar o formulário vazio. A interface deve informar que todos os campos obrigatórios precisam ser preenchidos.
3. Preencha cliente, serviço, data e horário e clique em **Agendar**. O atendimento deve aparecer na agenda.
4. Tente cadastrar outro atendimento com a mesma data e o mesmo horário. A aplicação deve recusar o cadastro e informar o conflito.
5. Encerre a aplicação com `Ctrl+C`, execute novamente `dotnet run --launch-profile http` e confirme que o primeiro atendimento continua na agenda.

Requisições de API reproduzíveis também estão em `tests/Validacao.http`.

Uma captura real da validação está em `docs/screenshots/01-agenda-validada.png`; ela usa somente dados fictícios.

## Limitações da PoC

A PoC não possui autenticação, múltiplos usuários, pagamentos, notificações, relatórios avançados ou edição de atendimentos. O banco é local e a regra de conflito considera somente a combinação exata de data e horário. A finalização foi testada no Windows 11 com SDK .NET 8.0.424 e navegador Microsoft Edge; outras plataformas não foram verificadas nesta entrega.

## Autor

Felipe Villa Verde Santos — Análise e Desenvolvimento de Sistemas — SENAC.
