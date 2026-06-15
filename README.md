# Escala Hospital — Sistema de Gestão de Escala de Técnicos de Enfermagem

Sistema web para gerenciar a escala mensal de técnicos de enfermagem do **Hospital Teresa de Lisieux**, digitalizando o controle atualmente feito em planilhas `.ods`.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral do mês: cobertura de escala, funcionários sem início definido, setores sem competência, status especiais ativos e resumo por setor |
| **Escala do mês** | Grade interativa por setor/competência, com feriados de Salvador, troca de turnos, observações da competência, exportação Excel e simulação do próximo mês |
| **Funcionários** | Cadastro, edição e inativação de funcionários; gestão de status especiais (férias, licença gestacional, INSS) por período |
| **Importação ODS** | Upload de planilha legada com preview antes de confirmar; upsert de setores, funcionários e escalas |
| **Setores** | Criação e edição de setores diretamente no dashboard |

A escala segue o padrão rotacional **MT → F → SN → / → F**, com cinco grupos de início e suporte a âncora de início por funcionário em qualquer dia do mês.

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
│   ├── shared/      # Tipos, padrões de escala, feriados de Salvador
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

## Páginas da aplicação

| Rota | Página |
|------|--------|
| `/` | Dashboard com indicadores e gestão de setores |
| `/setores/:setorId/escala/:mes/:ano` | Grade de escala do setor/competência |
| `/funcionarios` | Cadastro e status especiais |
| `/importacao` | Importação de planilha `.ods` |

## Importação de planilha ODS

1. Acesse http://localhost:5173/importacao
2. Arraste o arquivo da escala (ex.: `ESCALA_TECNICOS_JUNHO_2026.ods`)
3. Revise o preview (setores, funcionários, status especiais e erros)
4. Clique em **Confirmar Importação**

O parser:

- Processa cada aba como um setor/andar
- Faz upsert de funcionários por matrícula
- Importa status especiais com intervalo de datas
- Substitui a escala do mês se já existir
- Converte datas serializadas do Excel automaticamente

## API principal

```
GET    /api/dashboard
GET    /api/setores
POST   /api/setores
PUT    /api/setores/:id
GET    /api/setores/:id/funcionarios
GET    /api/setores/:id/competencias?mes=&ano=
POST   /api/setores/:id/competencias

GET    /api/competencias/:id/escala
GET    /api/competencias/:id/escala/export
PUT    /api/competencias/:id/observacoes
POST   /api/competencias/:id/simular-proximo-mes
POST   /api/competencias/:id/troca
DELETE /api/competencias/:id/escala/:funcionarioId
PUT    /api/escala-dias
PUT    /api/escala-dias/:id

GET    /api/funcionarios?setor=&nome=&contrato=&ativo=
POST   /api/funcionarios
PUT    /api/funcionarios/:id
DELETE /api/funcionarios/:id
GET    /api/funcionarios/:id/status-especiais

GET    /api/status-especiais/:competencia_id
POST   /api/status-especiais
DELETE /api/status-especiais/:id

POST   /api/importacao/ods?confirmar=true&mes=&ano=
GET    /api/importacao/preview

GET    /api/relatorios/folgas-mes?mes=&ano=&setorId=
GET    /api/relatorios/carga-horaria?mes=&ano=
```

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

Uso interno — Hospital Teresa de Lisieux
