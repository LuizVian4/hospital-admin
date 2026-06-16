import type { FuncionarioComTurnos, GrupoEscala, GrupoTurno } from '@escala/shared';
import { getPadraoEscala, statusCobreMesInteiro } from '@escala/shared';

export function listarFuncionarios(grupos: GrupoTurno[]): FuncionarioComTurnos[] {
  const map = new Map<number, FuncionarioComTurnos>();
  for (const grupo of grupos) {
    for (const func of grupo.funcionarios) {
      map.set(func.id, func);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );
}

export function organizarPorGrupoEscala(
  funcionarios: FuncionarioComTurnos[],
  gruposEscala: GrupoEscala[],
  totalDias: number
) {
  const comPadrao: FuncionarioComTurnos[] = [];
  const semPadrao: FuncionarioComTurnos[] = [];
  const porGrupo = new Map<number, FuncionarioComTurnos[]>(
    gruposEscala.map((g) => [g.indicePadrao, []])
  );
  const semAtribuicao: FuncionarioComTurnos[] = [];
  const indisponivel: FuncionarioComTurnos[] = [];

  for (const func of funcionarios) {
    if (!getPadraoEscala(func.categoria)) {
      semPadrao.push(func);
      continue;
    }

    comPadrao.push(func);

    if (statusCobreMesInteiro(func.statusPorDia, totalDias)) {
      indisponivel.push(func);
      continue;
    }

    const indice = func.escalaInicio?.indicePadrao;
    if (indice != null && porGrupo.has(indice)) {
      porGrupo.get(indice)!.push(func);
    } else {
      semAtribuicao.push(func);
    }
  }

  const sortNome = (a: FuncionarioComTurnos, b: FuncionarioComTurnos) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });

  for (const lista of porGrupo.values()) lista.sort(sortNome);
  semAtribuicao.sort(sortNome);
  indisponivel.sort(sortNome);
  semPadrao.sort(sortNome);

  return { porGrupo, semAtribuicao, indisponivel, semPadrao, comPadrao };
}
