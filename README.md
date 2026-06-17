# Escala Hospital — Sistema de Gestão de Escala

Sistema web **multi-tenant** para gerenciar a escala mensal de **técnicos de enfermagem** e **enfermeiros**, digitalizando o controle atualmente feito em planilhas `.ods` / `.xlsx`. Cada **empresa** (hospital ou unidade) possui seus próprios setores, funcionários, competências e escalas — com isolamento total de dados entre organizações.

O seed de desenvolvimento inclui uma **empresa demo** com dados de exemplo.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Empresas (multi-tenant)** | Ambientes isolados por organização; troca de empresa no menu lateral; criação de novas empresas; gestão de membros e papéis (`admin` / `membro`) |
| **Dashboard** | Visão geral do mês: cobertura por setor (técnicos e enfermeiros), funcionários sem setor, competências pendentes, status especiais ativos, resumo por categoria e gráfico de banco de horas |
| **Escala de técnicos** | Grade interativa por setor/competência, com feriados de Salvador, troca de turnos, ocorrências (plantão extra e falta), observações, exportação Excel, resumo de carga horária e simulação do próximo mês |
| **Escala de enfermeiros** | Mesma grade interativa, com padrão rotacional próprio (`MT → SN → / → F`) e competências separadas por setor |
| **Banco de horas** | Saldo de carga horária por funcionário e competência (horas contratadas vs. trabalhadas), com visão mensal e acumulado geral; sincronizado automaticamente ao editar a escala |
| **Funcionários** | Cadastro, edição e inativação; perfil individual com histórico de status especiais e calendário do mês; gestão de férias, licença gestacional e INSS por período |
| **Importação** | Dois fluxos separados: **equipe** (cadastro de funcionários) e **escala** (turnos mensais), com templates `.xlsx` e preview antes de confirmar |
| **Setores** | Criação e edição de setores diretamente no dashboard |

Cada tipo de escala segue seu padrão rotacional, com grupos de início e suporte a âncora de início por funcionário em qualquer dia do mês:

| Tipo | Padrão | Grupos |
|------|--------|--------|
| Técnicos | MT → F → SN → / → F | 5 |
| Enfermeiros | MT → SN → / → F | 4 |

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js 20, Fastify 4, Drizzle ORM, PostgreSQL 16, Zod |
| Frontend | React 18, Vite, Material UI 9, Tailwind CSS, TanStack Query |
| Shared | Tipos e regras de negócio compartilhados (`@escala/shared`) |
| Infra | Docker Compose |

## Estrutura do monorepo

```
escala-hospital/
├── packages/
│   ├── shared/      # Tipos, padrões de escala, feriados de Salvador, carga horária
│   ├── backend/     # API Fastify + migrations Drizzle
│   └── frontend/    # React + Vite
├── docker-compose.yml
└── package.json
```

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm 9+

## Setup rápido (Docker)

```bash
# 1. Clonar e instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Subir todos os serviços (banco, migrations e apps)
docker-compose up --build
```

O backend executa migrations automaticamente na subida. Para popular dados de exemplo:

```bash
docker-compose exec backend npm run db:seed -w @escala/backend
```

### URLs

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/docs |
| Health check | http://localhost:3001/health |
| PostgreSQL | localhost:5433 |

## Desenvolvimento local (sem Docker para app)

```bash
# Terminal 1 — banco
docker-compose up -d db

# Terminal 2 — backend
npm run db:migrate
npm run db:seed   # opcional
npm run dev:backend

# Terminal 3 — frontend
npm run dev:frontend
```

Ou, em um único comando (com o banco já rodando):

```bash
npm run dev
```

### Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | Conexão PostgreSQL | `postgres://postgres:postgres@localhost:5433/escala_hospital` |
| `PORT` | Porta da API | `3001` |
| `VITE_API_URL` | URL da API no frontend | `http://localhost:3001` |
| `JWT_SECRET` | Segredo para assinar tokens JWT | *(obrigatório)* |
| `JWT_ACCESS_EXPIRES_IN` | Validade do access token (cookie) | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Validade do refresh token (cookie) | `7d` |
| `CORS_ORIGINS` | Origens permitidas (vírgula; obrigatório com cookies) | `http://localhost:5173` |
| `ADMIN_EMAIL` | E-mail do admin inicial (`db:seed`) | `admin@hospital.local` |
| `ADMIN_PASSWORD` | Senha do admin inicial (`db:seed`) | `admin123` |

## Multi-tenant (empresas)

O sistema isola todos os dados operacionais (setores, funcionários, competências, escalas, banco de horas) por **empresa**. Um usuário pode pertencer a várias empresas, com papel distinto em cada uma.

| Papel | Permissões |
|-------|------------|
| **admin** | Acesso completo aos dados da empresa; gestão de membros em `/admin/empresa`; edição do nome e status da empresa |
| **membro** | Acesso aos módulos operacionais (dashboard, escalas, funcionários etc.) |

### Fluxo no frontend

1. Após o login, o usuário seleciona a empresa ativa (ou é selecionada automaticamente se houver apenas uma).
2. O seletor de empresa fica no menu lateral e persiste a escolha em `localStorage`.
3. Todas as requisições à API incluem o header `X-Empresa-Id` com o ID da empresa ativa.

### Contexto na API

Rotas autenticadas (exceto `GET/POST /api/empresas`) exigem contexto de empresa via header `X-Empresa-Id` ou cookie `empresa_id`. Se o usuário tiver acesso a uma única empresa, o backend resolve automaticamente. Usuários sem vínculo recebem `403`; usuários com múltiplas empresas e sem seleção recebem `400` com código `EMPRESA_REQUIRED`.

## Autenticação

A API usa **JWT em cookies httpOnly** (`access_token` + `refresh_token`).

**Rotas públicas:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `POST /api/auth/logout`.

**Rotas autenticadas (sem contexto de empresa):** `GET /api/auth/me`, `PUT /api/auth/me`, `PUT /api/auth/senha`, `DELETE /api/auth/me`.

Demais rotas `/api/*` exigem sessão válida e contexto de empresa (quando aplicável).

- Access token curto (padrão **15 min**); refresh automático no frontend
- Login e cadastro com **rate limit** (5 tentativas / 15 min por IP)
- Cadastro self-service em `/cadastro` (novo usuário ainda precisa ser vinculado a uma empresa por um admin)
- Alteração de perfil e senha em `/perfil`
- Gestão de membros da empresa em `/admin/empresa` (somente admins da empresa ativa)

Após `db:seed`, use `ADMIN_EMAIL` / `ADMIN_PASSWORD` (padrão: `admin@hospital.local` / `admin123`). **Altere a senha e o `JWT_SECRET` em produção.**

## Páginas da aplicação

| Rota | Página |
|------|--------|
| `/` | Landing page |
| `/login` | Login |
| `/cadastro` | Cadastro de nova conta |
| `/dashboard` | Dashboard com indicadores, banco de horas e gestão de setores |
| `/setores/:setorId/escala/:mes/:ano` | Grade de escala de técnicos |
| `/setores/:setorId/escala-enfermeiros/:mes/:ano` | Grade de escala de enfermeiros |
| `/funcionarios` | Listagem e cadastro de funcionários |
| `/funcionarios/:id` | Perfil do funcionário (dados, status e calendário do mês) |
| `/banco-horas` | Saldo de carga horária por competência ou acumulado geral |
| `/importacao` | Importação de equipe e de escala |
| `/perfil` | Perfil do usuário logado (nome, e-mail, senha, exclusão de conta) |
| `/admin/empresa` | Administração da empresa ativa (dados, membros e papéis) |

## Importação de planilhas

Acesse http://localhost:5173/importacao. Há dois fluxos independentes:

### Equipe (cadastro)

1. Baixe o template em **Importação de equipe**
2. Preencha as colunas: MAT, NOME, COREN, CAT, CTRT, ADM, CH e SETOR
3. Envie o `.xlsx`, revise o preview e confirme

### Escala (turnos mensais)

1. Baixe o template em **Importação de escala** (ou use a planilha legada `.ods`)
2. Uma aba por setor, com cabeçalho (EMPRESA, GERENTE, SETOR, COMPETÊNCIA) e colunas de dias 1–31
3. Envie `.xlsx` ou `.ods`, revise o preview e confirme

O parser de escala:

- Processa cada aba como um setor/andar
- Faz upsert de funcionários por matrícula (única por empresa)
- Importa status especiais com intervalo de datas
- Substitui a escala do mês se já existir
- Converte datas serializadas do Excel automaticamente

## Banco de horas

O banco de horas compara a **carga contratada** de cada funcionário (ex.: 180H) com as **horas efetivamente trabalhadas** no mês, considerando turnos da escala, status especiais e ocorrências (plantão extra conta como horas; falta não).

| Status | Significado |
|--------|-------------|
| `atingiu` | Saldo zerado — carga cumprida |
| `devendo` | Horas abaixo do contratado |
| `excedeu` | Horas acima do contratado |

Os saldos são recalculados automaticamente ao editar a escala, registrar ocorrências ou alterar status especiais. No dashboard, funcionários com saldo pendente aparecem no gráfico resumido; a página **Banco de horas** oferece tabela completa por competência ou visão acumulada geral.

## Ocorrências na escala

Além do turno base, cada célula pode registrar:

| Tipo | Descrição |
|------|-----------|
| **Plantão extra** | Turno adicional MT ou SN; em dias com MT/SN na escala, o extra deve ser o turno complementar |
| **Falta** | Ausência no dia; não conta horas trabalhadas |

Plantões extras podem ser vinculados a outro funcionário (ex.: cobertura de colega).

## API principal

### Empresas

```
GET    /api/empresas
POST   /api/empresas
GET    /api/empresas/atual
PUT    /api/empresas/atual
GET    /api/empresas/atual/usuarios
GET    /api/empresas/atual/usuarios/candidatos
POST   /api/empresas/atual/usuarios
PUT    /api/empresas/atual/usuarios/:userId
DELETE /api/empresas/atual/usuarios/:userId
```

### Autenticação

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/me
PUT    /api/auth/senha
DELETE /api/auth/me
```

### Operação (escopo da empresa ativa)

```
GET    /api/dashboard
GET    /api/setores?comTecnicos=&comEnfermeiros=
POST   /api/setores
PUT    /api/setores/:id
GET    /api/setores/:id/funcionarios
GET    /api/setores/:id/competencias?mes=&ano=&tipo=
POST   /api/setores/:id/competencias

GET    /api/competencias/:id/escala?tipo=
GET    /api/competencias/:id/escala/export?tipo=
PUT    /api/competencias/:id/observacoes
POST   /api/competencias/:id/simular-proximo-mes?tipo=
POST   /api/competencias/:id/troca?tipo=
DELETE /api/competencias/:id/escala/:funcionarioId?tipo=
PUT    /api/escala-dias
POST   /api/escala-ocorrencias
DELETE /api/escala-ocorrencias/:id

GET    /api/banco-horas?mes=&ano=&pendentes=&geral=
GET    /api/competencias/:id/banco-horas

GET    /api/funcionarios?setor=&nome=&contrato=&ativo=
GET    /api/funcionarios/:id
POST   /api/funcionarios
PUT    /api/funcionarios/:id
DELETE /api/funcionarios/:id
GET    /api/funcionarios/:id/status-especiais

GET    /api/status-especiais/:competencia_id
POST   /api/status-especiais
DELETE /api/status-especiais/:id

GET    /api/importacao/template/:tipo          # equipe | escala
POST   /api/importacao/ods?confirmar=&mes=&ano=&tipo=
GET    /api/importacao/preview

GET    /api/relatorios/folgas-mes?mes=&ano=&setorId=
GET    /api/relatorios/carga-horaria?mes=&ano=
```

Rotas de operação exigem o header `X-Empresa-Id` quando o usuário tem acesso a mais de uma empresa.

Documentação interativa em http://localhost:3001/docs

## Scripts úteis

```bash
npm run dev              # backend + frontend em paralelo
npm run dev:backend      # apenas API
npm run dev:frontend     # apenas frontend
npm run build            # build de shared, backend e frontend
npm run db:migrate       # aplicar migrations
npm run db:seed          # popular banco com dados de exemplo
```

## Dados de exemplo (seed)

O seed cria:

- Empresa **Demo** com o admin vinculado como `admin`
- Setor **5 ANDAR** com 5 funcionários
- Competência **Junho/2026** com grade de turnos completa

Acesse: http://localhost:5173/setores/1/escala/6/2026

## Siglas de turno

| Sigla | Descrição |
|-------|-----------|
| MT | Manhã / Tarde (~12h) |
| M | Manhã (~6h) |
| T | Tarde (~6h) |
| SN | Noturno (~12h) |
| HC | Horário Comercial (~8h) |
| F | Folga |
| FF | Férias |
| LG | Licença gestacional |
| / | Plantão (descanso) |
| INSS | Licença INSS |

## Status especiais

Status com período de vigência que sobrescrevem a escala nos dias afetados:

- **FÉRIAS** → exibido como `FF`
- **LICENÇA GESTACIONAL** → exibido como `LG`
- **LICENÇA INSS** → exibido como `INSS`

## Licença

Plataforma SaaS multi-tenant — Escala360
