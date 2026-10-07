# Backend — boas práticas

Fastify 4, Drizzle e Zod. A API sobe em `src/server.ts`. Plugins de cookie, CORS, JWT e contexto de empresa ficam em `src/plugins/`.

## Camadas

| Pasta | Responsabilidade |
|-------|------------------|
| `src/routes/` | HTTP: schema Zod, status, chamar serviço |
| `src/services/` | Regra que cruza tabelas ou é reutilizada |
| `src/db/schema.ts` | Modelo. Única definição de tabela |
| `src/utils/` | Função pura ou filtro reutilizável (`scopeEmpresa`) |
| `src/plugins/` | Auth, empresa, CORS, Swagger |

Rota fina: valida, resolve `empresaId`, delega. Cálculo de escala, banco de horas e importação não ficam inline num handler de 200 linhas — vão para `services/` ou para `@escala/shared` se o frontend também precisar do mesmo resultado.

## Contrato

- Body e query passam por Zod na rota. Não confie no tipo do Fastify sem parse.
- Erro para o client: `{ error: string }` e, quando o frontend precisa ramificar, `code` (ex.: `EMPRESA_REQUIRED`). Status coerente: 400 validação, 401 sessão, 403 sem acesso, 404 inexistente no escopo, 409 conflito.
- Tipo compartilhado com o frontend sai de `@escala/shared`. Se o payload mudou, atualize o tipo e o método em `packages/frontend/src/api/client.ts` na mesma mudança.
- Swagger está em `/docs`. Anotação OpenAPI nas rotas ainda não é gerada; o contrato que o app usa é o shared + o client.

## Empresa

```ts
const empresaId = requireEmpresaId(request);
```

- Toda query operacional inclui `empresaId`. Prefira `scopeEmpresa` ou `eq(tabela.empresaId, empresaId)` junto com o id do recurso.
- Antes de atualizar ou apagar por id, confirme que o registro é da empresa (`assertFuncionarioEmpresa`, `assertSetorEmpresa` e equivalentes).
- Lista sem filtro de empresa é vazamento. Insert operacional grava `empresaId` do request, nunca um id solto do body.
- Rotas públicas de auth e `GET/POST /api/empresas` não exigem empresa. O restante passa pelo hook em `src/plugins/empresa.ts`.

## Schema e migration

- Nome de tabela e coluna em snake_case no banco; campo Drizzle em camelCase (`empresaId` → `empresa_id`).
- Unique de negócio é por empresa (`unique(empresaId, matricula)`), não global, salvo identidade de usuário (`users.email`).
- `npm run db:generate -w @escala/backend` gera o SQL. Leia o arquivo antes de commitar. Não reescreva migration já aplicada em ambiente compartilhado.

## Auth

- Senha só como hash (`bcrypt`). Token de refresh persistido como hash.
- Não logue senha, JWT, cookie, `DATABASE_URL` ou `DISCORD_WEBHOOK_URL`.
- Rate limit permanece em login e cadastro.
- `POST /api/auth/register` cria o usuário e a empresa inicial (papel `admin`) na mesma transação, e chama `notifyAccountCreated` depois do commit. Sem webhook válido o cadastro segue; o seed não notifica.
- Quem não tem empresa ativa ganha uma em `garantirEmpresaInicial` (lista de empresas, contexto da API e remoção do último vínculo).
