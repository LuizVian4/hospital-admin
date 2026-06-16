import type { Funcionario } from '@escala/shared';

export function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface CampoPendente {
  campo: string;
  mensagem: string;
}

export function getCamposPendentes(f: Funcionario): CampoPendente[] {
  const pendentes: CampoPendente[] = [];
  if (!f.coren?.trim()) {
    pendentes.push({ campo: 'coren', mensagem: 'COREN não cadastrado' });
  }
  if (!f.dataAdmissao?.trim()) {
    pendentes.push({ campo: 'dataAdmissao', mensagem: 'Data de admissão não informada' });
  }
  if (f.setorId == null) {
    pendentes.push({ campo: 'setorId', mensagem: 'Setor não atribuído' });
  }
  return pendentes;
}
