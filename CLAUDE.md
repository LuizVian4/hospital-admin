# Escala Hospital — Instruções para Claude

Siga `AGENTS.md` na raiz e o `AGENTS.md` do pacote em que estiver trabalhando:

- Frontend: `packages/frontend/AGENTS.md`
- Backend: `packages/backend/AGENTS.md`
- Domínio compartilhado: `packages/shared/AGENTS.md`

Regras operacionais que valem em toda interação:

- Só prossiga com refactor ou comando que altere estado se a certeza sobre objetivo, impacto e caminho técnico for de pelo menos 95%. Abaixo disso, pergunte.
- Mudança perceptível para quem usa o produto entra em `CHANGELOG.md`, seção `## [Não lançado]`. Ajuste interno invisível não entra. Se a mesma interação refinou uma entrada, atualize o texto em vez de duplicar.
- Não troque o selo do hero em `packages/frontend/src/components/landing/LandingHero.tsx` sem aprovação explícita. Se a novidade merecer destaque, proponha o texto.
- Migration nova: `npm run db:generate -w @escala/backend`, revisar o SQL e `npm run db:migrate` com o Postgres local no ar.
- Dado operacional sempre no escopo da empresa ativa. Endpoint só em `packages/frontend/src/api/client.ts`. Caminho de escala reutiliza `packages/frontend/src/lib/routes.ts`.
