export type Turno = 'MT' | 'M' | 'T' | 'SN' | 'HC' | 'F' | 'FF' | '/' | 'INSS' | string;

export type TipoContrato = 'EFETIVO' | 'PROVISÓRIO' | 'PROVISORIO' | 'Temporário';

export type StatusEspecial = 'FÉRIAS' | 'LICENÇA INSS' | 'LICENÇA GESTACIONAL';

export type CargaHoraria = '180H' | '144H';

export interface Setor {
  id: number;
  nome: string;
  empresa?: string;
  gerente?: string;
}

export interface Funcionario {
  id: number;
  matricula: string;
  nome: string;
  coren?: string;
  categoria: string;
  tipoContrato: TipoContrato;
  dataAdmissao?: string;
  cargaHoraria: CargaHoraria;
  setorId: number | null;
  ativo: boolean;
}


export interface EscalaInicio {
  id?: number;
  mesInicio: number;
  anoInicio: number;
  turnoInicio: Turno;
  /** Posição no ciclo (0–4) para desambiguar turnos repetidos como F */
  indicePadrao?: number;
}

export interface EscalaDia {
  funcionarioId: number;
  dia: number;
  turno: Turno | null;
}

export interface EscalaDiaUpdate {
  funcionarioId: number;
  dia: number;
  turno: Turno | null;
  definirInicio?: boolean;
  indicePadrao?: number;
}

export interface TrocaEscalaRequest {
  funcionarioIdOrigem: number;
  diaOrigem: number;
  funcionarioIdDestino: number;
  diaDestino: number;
}

export interface EscalaTroca {
  id: number;
  competenciaId: number;
  funcionarioId: number;
  dia: number;
  turnoAnterior: Turno;
  turnoNovo: Turno;
  funcionarioTrocaId: number;
  createdAt?: string;
}

export interface GradeEscalaResponse {
  competencia: { id: number; mes: number; ano: number; setor: string };
  dias: number[];
  diasSemana: string[];
  grupos: GrupoTurno[];
  statusEspeciais: StatusEspecialItem[];
  trocas?: EscalaTroca[];
  observacoes?: string;
}

export interface GrupoTurno {
  funcionarios: FuncionarioComTurnos[];
}

export interface FuncionarioComTurnos extends Funcionario {
  turnos: Record<number, Turno | null>;
  /** Config ativa de início da escala nesta competência */
  escalaInicio?: EscalaInicio;
  /** Turnos projetados pelo padrão a partir de escalaInicio (dias sem valor salvo) */
  turnosProjetados?: Record<number, Turno>;
  /** Observações por dia (ex.: registro de troca) */
  observacoesDia?: Record<number, string>;
  /** Status especial ativo no dia (ex.: férias, licença) */
  statusPorDia?: Record<number, StatusEspecial>;
}

export interface StatusEspecialItem {
  id?: number;
  funcionario: Funcionario;
  status: StatusEspecial;
  dataInicio: string;
  dataFim: string;
  competenciaId?: number;
}

export interface StatusEspecialRequest {
  funcionarioId: number;
  status: StatusEspecial;
  dataInicio: string;
  dataFim: string;
  competenciaId?: number;
}

export const TURNOS_DISPONIVEIS: Turno[] = ['MT', 'M', 'T', 'SN', 'HC', 'F', 'FF', '/', 'INSS'];

export const HORAS_POR_TURNO: Record<string, number> = {
  MT: 12,
  M: 6,
  T: 6,
  SN: 12,
  HC: 8,
  F: 0,
  FF: 0,
  '/': 0,
  INSS: 0,
};

export interface ImportPreviewSetor {
  nome: string;
  empresa?: string;
  gerente?: string;
  mes?: number;
  ano?: number;
  funcionariosNovos: number;
  funcionariosAtualizados: number;
  celulasEscala: number;
  statusEspeciais: number;
  erros: string[];
}

export interface ImportPreview {
  setores: ImportPreviewSetor[];
  totalFuncionarios: number;
  totalCelulas: number;
  totalStatusEspeciais: number;
  erros: string[];
}
