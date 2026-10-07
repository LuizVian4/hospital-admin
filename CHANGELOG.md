# Changelog

Mudanças perceptíveis para quem usa o Escala Hospital.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

### Adicionado

- Cada nova conta criada em `/cadastro` avisa um canal do Discord, quando `DISCORD_WEBHOOK_URL` está configurada.

### Alterado

- O cadastro pede o nome da empresa e o telefone, e já entra nela como administrador. Quem fica sem empresa recebe uma empresa inicial e segue para o sistema, em vez da tela pedindo vínculo a um administrador.
- A mensagem de nova conta no Discord inclui o telefone informado no cadastro.
- O cabeçalho das telas internas ficou no fundo claro, com o título e as ações lado a lado.
- Funcionários, banco de horas, membros da empresa e competência sem dados mostram um estado vazio com ícone e orientação.
- Contrato, papel, carga horária e situação do banco de horas usam selos de fundo suave.
- A cobertura da escala e a quantidade de saldos pendentes no dashboard animam ao abrir a tela.
