import type { FuncionarioComTurnos, GrupoEscala } from '@escala/shared';

export type GradeEscalaRow =
  | { kind: 'spacer' }
  | { kind: 'group'; grupo: GrupoEscala }
  | { kind: 'turno'; funcionario: FuncionarioComTurnos; arrastavel: boolean; comGrupo: boolean; somenteLeitura: boolean }
  | { kind: 'section'; section: 'indisponivel' | 'semAtribuicao' | 'semPadrao' }
  | { kind: 'indisponivel'; funcionario: FuncionarioComTurnos }
  | { kind: 'semGrupo'; funcionario: FuncionarioComTurnos };

export function buildGradeEscalaRows(input: {
  gruposEscala: GrupoEscala[];
  porGrupo: Map<number, FuncionarioComTurnos[]>;
  indisponivel: FuncionarioComTurnos[];
  semAtribuicao: FuncionarioComTurnos[];
  semPadrao: FuncionarioComTurnos[];
}): GradeEscalaRow[] {
  const { gruposEscala, porGrupo, indisponivel, semAtribuicao, semPadrao } = input;
  const rows: GradeEscalaRow[] = [];

  for (const [gi, grupo] of gruposEscala.entries()) {
    if (gi > 0) rows.push({ kind: 'spacer' });
    rows.push({ kind: 'group', grupo });
    const membros = porGrupo.get(grupo.indicePadrao) ?? [];
    for (const funcionario of membros) {
      rows.push({
        kind: 'turno',
        funcionario,
        arrastavel: true,
        comGrupo: true,
        somenteLeitura: false,
      });
    }
  }

  if (indisponivel.length > 0) {
    rows.push({ kind: 'spacer' });
    rows.push({ kind: 'section', section: 'indisponivel' });
    for (const funcionario of indisponivel) {
      rows.push({ kind: 'indisponivel', funcionario });
    }
  }

  if (semAtribuicao.length > 0) {
    rows.push({ kind: 'spacer' });
    rows.push({ kind: 'section', section: 'semAtribuicao' });
    for (const funcionario of semAtribuicao) {
      rows.push({ kind: 'semGrupo', funcionario });
    }
  }

  if (semPadrao.length > 0) {
    rows.push({ kind: 'spacer' });
    rows.push({ kind: 'section', section: 'semPadrao' });
    for (const funcionario of semPadrao) {
      rows.push({
        kind: 'turno',
        funcionario,
        arrastavel: false,
        comGrupo: false,
        somenteLeitura: true,
      });
    }
  }

  return rows;
}
