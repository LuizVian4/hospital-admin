import type { TipoEscala } from '@escala/shared';

const ESCALA_SEGMENT: Record<TipoEscala, string> = {
  tecnico: 'escala',
  enfermeiro: 'escala-enfermeiros',
};

export const appRoutes = {
  landing: '/',
  login: '/login',
  cadastro: '/cadastro',
  dashboard: '/dashboard',
  funcionarios: '/funcionarios',
  bancoHoras: '/banco-horas',
  importacao: '/importacao',
  perfil: '/perfil',
  adminEmpresa: '/admin/empresa',
} as const;

export function funcionarioPath(id: number | string): string {
  return `${appRoutes.funcionarios}/${id}`;
}

export function escalaPath(
  setorId: number | string,
  tipo: TipoEscala,
  mes: number | string,
  ano: number | string
): string {
  return `/setores/${setorId}/${ESCALA_SEGMENT[tipo]}/${mes}/${ano}`;
}

export function isEscalaPath(path: string, tipo: TipoEscala): boolean {
  const segment = `/${ESCALA_SEGMENT[tipo]}/`;
  if (tipo === 'enfermeiro') return path.includes(segment);
  return path.includes(segment) && !path.includes(`/${ESCALA_SEGMENT.enfermeiro}/`);
}
