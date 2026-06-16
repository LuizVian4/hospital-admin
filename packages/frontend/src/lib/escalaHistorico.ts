import type { EscalaOcorrencia, EscalaTroca, GradeEscalaResponse, TipoOcorrenciaEscala } from '@escala/shared';

export type TipoMovimentacaoEscala = TipoOcorrenciaEscala | 'TROCA';

export interface MovimentacaoEscala {
  id: string;
  dia: number;
  tipo: TipoMovimentacaoEscala;
  funcionarioNome: string;
  descricao: string;
  sortKey: number;
}

function montarMapaNomes(escala: GradeEscalaResponse): Map<number, string> {
  const nomes = new Map<number, string>();
  for (const grupo of escala.grupos) {
    for (const func of grupo.funcionarios) {
      nomes.set(func.id, func.nome);
    }
  }
  return nomes;
}

function deduplicarTrocas(trocas: EscalaTroca[]): EscalaTroca[] {
  const vistos = new Set<string>();
  const resultado: EscalaTroca[] = [];

  for (const troca of trocas) {
    const chave = `${Math.min(troca.funcionarioId, troca.funcionarioTrocaId)}-${Math.max(
      troca.funcionarioId,
      troca.funcionarioTrocaId
    )}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    resultado.push(troca);
  }

  return resultado;
}

export function montarHistoricoMovimentacoes(escala: GradeEscalaResponse): MovimentacaoEscala[] {
  const nomes = montarMapaNomes(escala);
  const nome = (id: number) => nomes.get(id) ?? `Funcionário #${id}`;
  const itens: MovimentacaoEscala[] = [];

  for (const ocorrencia of escala.ocorrencias ?? []) {
    const vinculo = ocorrencia.funcionarioVinculo?.nome;
    let descricao = ocorrencia.turno ? `Turno ${ocorrencia.turno}` : '—';

    if (ocorrencia.tipo === 'FALTA' && vinculo) {
      descricao += ` — coberto por ${vinculo}`;
    }
    if (ocorrencia.tipo === 'PLANTAO_EXTRA' && vinculo) {
      descricao += ` — falta de ${vinculo}`;
    }
    if (ocorrencia.observacao?.trim()) {
      descricao += ` · ${ocorrencia.observacao.trim()}`;
    }

    itens.push({
      id: `ocorrencia-${ocorrencia.id}`,
      dia: ocorrencia.dia,
      tipo: ocorrencia.tipo,
      funcionarioNome: nome(ocorrencia.funcionarioId),
      descricao,
      sortKey: ocorrencia.id,
    });
  }

  const trocas = deduplicarTrocas(escala.trocas ?? []);
  for (const troca of trocas) {
    const parceiro = (escala.trocas ?? []).find(
      (p) =>
        p.funcionarioId === troca.funcionarioTrocaId &&
        p.funcionarioTrocaId === troca.funcionarioId
    );
    const diaParceiro = parceiro?.dia ?? troca.dia;

    itens.push({
      id: `troca-${troca.id}`,
      dia: troca.dia,
      tipo: 'TROCA',
      funcionarioNome: nome(troca.funcionarioId),
      descricao: `Troca com ${nome(troca.funcionarioTrocaId)} (dia ${diaParceiro}): ${troca.turnoAnterior} → ${troca.turnoNovo}`,
      sortKey: troca.id,
    });
  }

  itens.sort((a, b) => a.dia - b.dia || a.sortKey - b.sortKey);
  return itens;
}

export function labelTipoMovimentacao(tipo: TipoMovimentacaoEscala): string {
  if (tipo === 'FALTA') return 'Falta';
  if (tipo === 'PLANTAO_EXTRA') return 'Plantão extra';
  return 'Troca';
}
