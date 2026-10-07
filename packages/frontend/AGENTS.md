# Frontend — boas práticas

React 18 + Vite + React Router. App autenticado em MUI. Landing em Tailwind. Dados via TanStack Query e o client em `src/api/client.ts`.

## Onde cada coisa mora

| Pasta | Responsabilidade |
|-------|------------------|
| `src/pages/` | Uma rota, composição da tela |
| `src/components/` | UI. Subpastas por domínio (`GradeEscala/`, `landing/`) |
| `src/hooks/` | Query, mutation e regra da tela |
| `src/api/client.ts` | Único lugar que chama a API |
| `src/lib/` | Funções puras de apresentação e caminho |
| `src/contexts/` | Sessão (`AuthContext`) e empresa ativa (`EmpresaContext`) |
| `src/lib/routes.ts` | Caminhos de página, em especial a grade de escala |

## Fluxo de dados

`página ou componente → hook em src/hooks → api.* → request()`

- Não use `fetch` fora de `src/api/client.ts`.
- Tipo de request/response compartilhado vem de `@escala/shared`. Tipo só de UI pode ficar no arquivo que o usa.
- Query key inclui o que muda o resultado (`['funcionarios', filters]`, `['setores', 'escala', tipo]`). Mutation invalida as keys afetadas, inclusive telas vizinhas (escala altera banco de horas).
- `enabled` quando o id ainda não existe. `placeholderData: (previous) => previous` em lista que não deve piscar ao filtrar.

## Componente e hook

- `.tsx` renderiza. Estado de servidor, efeito e transformação de domínio ficam no hook `.ts`.
- Estado de um controle (dialog aberto, campo local) pode ficar no componente.
- Componente grande demais vira arquivo na pasta do domínio. Dialog, popover e skeleton não ficam como função interna de uma tela longa.
- Não crie store global. Sessão e empresa já têm context. O resto é cache do React Query ou `useState` local.

## Rotas

```ts
import { escalaPath } from '@/lib/routes';

escalaPath(setorId, 'tecnico', mes, ano);
// /setores/1/escala/6/2026
```

Rota nova: registre em `src/App.tsx` e, se aparecer no menu, em `src/components/Layout.tsx`. Path paramétrico reutiliza `src/lib/routes.ts`.

## UI

- Área logada: MUI (`Box`, `Dialog`, tipografia do tema). Não reestilize com classe Tailwind o que o tema MUI já resolve.
- Landing (`src/components/landing/`): Tailwind e os blocos em `magicui/`. Não puxe MUI para a landing.
- Texto de interface em português, no tom do produto (escala, competência, setor, banco de horas).
- Feedback de ação: `sonner` (`toast`). Erro de API já chega como `Error` com a mensagem do backend.

## O que não fazer

- Duplicar regra de turno, padrão rotacional, feriado ou carga horária. Isso mora em `@escala/shared`.
- Hardcodar `X-Empresa-Id`, token ou URL da API. O client já envia cookie, bearer e empresa.
- Editar `src/components/ui/` para um caso de uma tela. Componha em cima ou use MUI.
