import type { FuncionarioComTurnos, GrupoTurno } from '@escala/shared';
import { GRUPOS_ESCALA, getPadraoEscala } from '@escala/shared';

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

export function organizarPorGrupoEscala(funcionarios: FuncionarioComTurnos[]) {
  const comPadrao: FuncionarioComTurnos[] = [];
  const semPadrao: FuncionarioComTurnos[] = [];
  const porGrupo = new Map<number, FuncionarioComTurnos[]>(
    GRUPOS_ESCALA.map((g) => [g.indicePadrao, []])
  );
  const semAtribuicao: FuncionarioComTurnos[] = [];

  for (const func of funcionarios) {
    if (!getPadraoEscala(func.categoria)) {
      semPadrao.push(func);
      continue;
    }

    comPadrao.push(func);
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
  semPadrao.sort(sortNome);

  return { porGrupo, semAtribuicao, semPadrao, comPadrao };
}
