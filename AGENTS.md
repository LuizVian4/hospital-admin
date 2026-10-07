# Escala Hospital — Instruções para agentes

## Confiança antes de executar

Antes de refatorar, editar arquivos ou rodar comandos que alterem estado, prossiga só com pelo menos 95% de certeza sobre o objetivo, o impacto e o caminho técnico. Abaixo disso, pergunte ao usuário e faça o mínimo de suposições.

## Changelog

Ao finalizar cada interação, avalie se a mudança merece registro no `CHANGELOG.md`.

Registre quando a alteração afetar comportamento, fluxo de uso, telas, permissões, contratos, dados, integrações ou uma correção perceptível para quem usa o produto. Não registre ajuste interno invisível: cor de um botão, shadow, refactor sem mudança de uso, reorganização de arquivos ou documentação interna.

O changelog é um resumo para quem usa o produto. Use a seção `## [Não lançado]` e a categoria `Adicionado`, `Alterado`, `Corrigido` ou `Removido`.

Se uma entrada da mesma interação for refinada ou desfeita depois, atualize o texto existente. Não duplique.

## Destaque da landing

O selo do hero fica em `packages/frontend/src/components/landing/LandingHero.tsx` (`AnimatedGradientText`). O texto atual é `✨ Plataforma de gestão de escalas hospitalares`.

Ao finalizar, avalie se a mudança é uma novidade de produto mais relevante para quem chega na landing do que o selo atual. Se for, proponha o texto novo no resumo ou numa pergunta objetiva. Não altere o selo sem aprovação explícita. Não proponha troca por refactor, correção invisível ou ajuste sem apelo de aquisição.

## Instruções por pacote

- Frontend: `packages/frontend/AGENTS.md`
- Backend: `packages/backend/AGENTS.md`
- Domínio compartilhado: `packages/shared/AGENTS.md`

Regras curtas que o editor aplica ao editar arquivos ficam em `.cursor/rules/`.

## Stack deste repositório

Não importe convenções de outros projetos (Next.js, Orval, Go, sqlc, Zustand). Este monorepo é:

| Pacote | Papel |
|--------|--------|
| `packages/frontend` | React 18, Vite, React Router, TanStack Query, MUI no app, Tailwind na landing |
| `packages/backend` | Fastify 4, Drizzle, Zod, PostgreSQL |
| `packages/shared` | Tipos e regras de escala usados pelos dois lados (`@escala/shared`) |

## Rotas do frontend

- Páginas novas entram em `packages/frontend/src/App.tsx`.
- Itens de menu entram em `packages/frontend/src/components/Layout.tsx`.
- Não espalhe caminhos de escala (`/setores/:id/escala/...`) como strings soltas. Reutilize os helpers de `packages/frontend/src/lib/routes.ts`.
- Endpoints HTTP ficam só em `packages/frontend/src/api/client.ts`. Componente e página não chamam `fetch`.

## Migrations

Depois de alterar `packages/backend/src/db/schema.ts`, gere e revise o SQL:

```bash
npm run db:generate -w @escala/backend
```

O arquivo gerado em `packages/backend/src/db/migrations/` é commitado. Não edite migration já aplicada em produção para "consertar" uma feature nova: crie outra, ou, se a anterior ainda não saiu do ambiente local, consolide num único arquivo coerente e reaplique no banco local.

Para confirmar que aplica:

```bash
npm run db:migrate
```

Se o Postgres local não estiver no ar, informe isso no resumo. Se estiver no ar e a migration falhar, corrija antes de encerrar. Em dúvida sobre refactor grande de schema, pergunte antes.

Dados operacionais (setores, funcionários, competências, escalas, banco de horas) carregam `empresa_id`. Migration de backfill precisa preencher esse escopo e remover relações que violem a invariante nova.

## Multi-tenant

Toda leitura e escrita operacional filtra pela empresa do request (`requireEmpresaId` / `scopeEmpresa`). Não confie em id vindo do cliente sem `assert*Empresa`. Usuário, sessão e auth não são dados da empresa; o vínculo fica em `usuario_empresas`.

No frontend, a empresa ativa vai no header `X-Empresa-Id` pelo client. Não monte esse header na mão fora de `api/client.ts`.
