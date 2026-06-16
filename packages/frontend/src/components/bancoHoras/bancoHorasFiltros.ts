import type { StatusBancoHoras } from '@escala/shared';

export type FiltroSituacaoBancoHoras = 'todos' | 'pendentes' | 'devendo' | 'excedeu';
export type OrdenacaoBancoHoras = 'nome' | 'setor';
export type DirecaoOrdenacaoBancoHoras = 'asc' | 'desc';

export interface BancoHorasLinhaBase {
  funcionarioNome: string;
  funcionarioMatricula: string;
  funcionarioCategoria: string;
  setorNome: string | null;
  status: StatusBancoHoras;
}

export interface FiltrosBancoHoras {
  busca: string;
  setor: string;
  situacao: FiltroSituacaoBancoHoras;
  ordenacao: OrdenacaoBancoHoras;
  direcaoOrdenacao: DirecaoOrdenacaoBancoHoras;
}

export const FILTROS_BANCO_HORAS_INICIAIS: FiltrosBancoHoras = {
  busca: '',
  setor: 'todos',
  situacao: 'todos',
  ordenacao: 'nome',
  direcaoOrdenacao: 'asc',
};

function filtrarBusca(texto: string, ...campos: (string | null | undefined)[]): boolean {
  const q = texto.trim().toLowerCase();
  if (!q) return true;
  return campos.some((c) => c?.toLowerCase().includes(q));
}

function passaSituacao(status: StatusBancoHoras, situacao: FiltroSituacaoBancoHoras): boolean {
  if (situacao === 'todos') return true;
  if (situacao === 'pendentes') return status === 'devendo' || status === 'excedeu';
  if (situacao === 'devendo') return status === 'devendo';
  return status === 'excedeu';
}

export function extrairSetores(dados: { setorNome: string | null }[]): string[] {
  const setores = new Set<string>();
  for (const row of dados) {
    if (row.setorNome) setores.add(row.setorNome);
  }
  return [...setores].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

export function filtrarEOrdenarBancoHoras<T extends BancoHorasLinhaBase>(
  dados: T[],
  filtros: FiltrosBancoHoras
): T[] {
  const filtrados = dados.filter(
    (row) =>
      filtrarBusca(
        filtros.busca,
        row.funcionarioNome,
        row.funcionarioMatricula,
        row.setorNome,
        row.funcionarioCategoria
      ) &&
      (filtros.setor === 'todos' || row.setorNome === filtros.setor) &&
      passaSituacao(row.status, filtros.situacao)
  );

  return [...filtrados].sort((a, b) => {
    const fator = filtros.direcaoOrdenacao === 'desc' ? -1 : 1;

    if (filtros.ordenacao === 'setor') {
      const setorA = a.setorNome ?? '';
      const setorB = b.setorNome ?? '';
      const setorCmp = setorA.localeCompare(setorB, 'pt-BR', { sensitivity: 'base' });
      if (setorCmp !== 0) return setorCmp * fator;
    }

    return (
      a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR', { sensitivity: 'base' }) * fator
    );
  });
}

export function resumirBancoHoras<T extends BancoHorasLinhaBase>(dados: T[]) {
  const devendo = dados.filter((r) => r.status === 'devendo').length;
  const excedeu = dados.filter((r) => r.status === 'excedeu').length;
  const atingiu = dados.filter((r) => r.status === 'atingiu').length;
  return { devendo, excedeu, atingiu, total: dados.length };
}
