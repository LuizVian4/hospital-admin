# Escala Hospital — Sistema de Gestão de Escala de Técnicos de Enfermagem

Sistema web para gerenciar a escala mensal de técnicos de enfermagem do **Hospital Teresa de Lisieux**, digitalizando o controle atualmente feito em planilhas `.ods`.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js 20, Fastify 4, Drizzle ORM, PostgreSQL 16 |
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query |
| Infra | Docker Compose |

## Estrutura do Monorepo

```
escala-hospital/
├── packages/
│   ├── shared/      # Tipos TypeScript compartilhados
│   ├── backend/     # API Fastify
│   └── frontend/    # React + Vite
├── docker-compose.yml
└── package.json
```

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm 9+

## Setup Rápido

```bash
# 1. Clonar e instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Subir banco de dados
docker-compose up -d db

# 4. Aguardar o banco ficar pronto (~5s) e rodar migrations + seed
npm run db:migrate
npm run db:seed

# 5. Subir todos os serviços
docker-compose up
```

### URLs

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/docs |
| PostgreSQL | localhost:5433 |

## Desenvolvimento Local (sem Docker para app)

```bash
# Terminal 1 — banco
docker-compose up -d db

# Terminal 2 — backend
npm run db:migrate
npm run db:seed
npm run dev:backend

# Terminal 3 — frontend
npm run dev:frontend
```

## Importação de Planilha ODS

1. Acesse http://localhost:5173/importacao
2. Arraste o arquivo `ESCALA_TECNICOS_JUNHO_2026.ods`
3. Revise o preview (setores, funcionários, células)
4. Clique em **Confirmar Importação**

O parser:
- Processa cada aba como um setor/andar
- Faz upsert de funcionários por matrícula
- Substitui a escala do mês se já existir
- Converte datas serializadas do Excel automaticamente

## API Principal

```
GET    /api/setores
GET    /api/setores/:id/competencias?mes=&ano=
POST   /api/setores/:id/competencias
GET    /api/competencias/:id/escala
PUT    /api/escala-dias
POST   /api/importacao/ods?confirmar=true
GET    /api/relatorios/folgas-mes
GET    /api/relatorios/carga-horaria
```

Documentação completa em http://localhost:3001/docs

## Dados de Exemplo (Seed)

O seed cria:
- Setor **5 ANDAR** com 5 funcionários
- Competência **Junho/2026** com grade de turnos completa

Acesse: http://localhost:5173/setores/1/escala/6/2026

## Siglas de Turno

| Sigla | Descrição |
|-------|-----------|
| MT | Manhã / Tarde (~12h) |
| M | Manhã (~6h) |
| T | Tarde (~6h) |
| SN | Noturno (~12h) |
| HC | Horário Comercial (~8h) |
| F | Folga |
| FF | Férias |
| / | Plantão (descanso) |
| INSS | Licença INSS |

## Licença

Uso interno — Hospital Teresa de Lisieux
