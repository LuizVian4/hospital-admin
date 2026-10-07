# Shared — boas práticas

`@escala/shared` é o contrato entre frontend e backend. Os dois importam daqui. Se a conta de turno, carga ou padrão divergir entre os lados, o bug aparece na escala.

## O que entra

- Tipos de API e de domínio (`Funcionario`, `GradeEscalaResponse`, requests de ocorrência, banco de horas, empresa).
- Regra pura: padrão rotacional, projeção de turno, horas por sigla, status especial, feriado, plantão extra.

## O que não entra

- Drizzle, Fastify, React, `fetch`, `process.env`.
- Query, formato de planilha, texto de toast.

Função daqui recebe dados e devolve dados. Sem banco e sem relógio implícito quando o dia puder ser argumento.

## Ao mudar uma regra

1. Altere o módulo em `src/` e exporte em `src/index.ts`.
2. Confira os dois consumidores: serviço no backend e tela ou lib no frontend.
3. Se o JSON da API mudou, atualize o tipo e `packages/frontend/src/api/client.ts` juntos.

Não copie `HORAS_POR_TURNO`, grupos de escala ou a lista de feriados para outro pacote "por conveniência".
