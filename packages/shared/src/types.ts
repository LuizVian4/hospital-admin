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

export interface FuncionariosResumo {
  total: number;
  ativos: number;
  inativos: number;
  semSetor: number;
  semCoren: number;
  provisorios: number;
  carga180: number;
  carga144: number;
  setoresAtivos: number;
  porCategoria: { categoria: string; total: number }[];
  corenPercent: number;
}

export interface FuncionariosListResponse {
  items: Funcionario[];
  total: number;
  page: number;
  pageSize: number;
  resumo: FuncionariosResumo;
}

export interface FuncionarioAgrupamentoResumo {
  id: number | null;
  nome: string;
  especial: boolean;
  total: number;
  totalTecnicos: number;
  totalEnfermeiros: number;
}

export interface FuncionariosAgrupamentosResponse {
  agrupamentos: FuncionarioAgrupamentoResumo[];
  resumo: FuncionariosResumo;
}

export interface EscalaMutationWithGrade {
  success: boolean;
  grade?: GradeEscalaResponse;
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

export type TipoOcorrenciaEscala = 'PLANTAO_EXTRA' | 'FALTA';

export const TIPOS_OCORRENCIA_ESCALA: TipoOcorrenciaEscala[] = ['PLANTAO_EXTRA', 'FALTA'];

export interface EscalaOcorrencia {
  id: number;
  competenciaId: number;
  funcionarioId: number;
  dia: number;
  tipo: TipoOcorrenciaEscala;
  turno?: Turno | null;
  funcionarioVinculoId?: number | null;
  funcionarioVinculo?: Pick<Funcionario, 'id' | 'nome' | 'matricula'>;
  observacao?: string | null;
  createdAt?: string;
}

export interface EscalaOcorrenciaRequest {
  competenciaId: number;
  funcionarioId: number;
  dia: number;
  tipo: TipoOcorrenciaEscala;
  turno?: Turno | null;
  funcionarioVinculoId?: number | null;
  observacao?: string | null;
  /** Turno da escala no dia — usado para validar plantão extra complementar */
  turnoBase?: Turno | null;
}

export interface GradeEscalaResponse {
  competencia: { id: number; mes: number; ano: number; setor: string };
  dias: number[];
  diasSemana: string[];
  grupos: GrupoTurno[];
  statusEspeciais: StatusEspecialItem[];
  ocorrencias?: EscalaOcorrencia[];
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
  /** Falta ou plantão extra registrado no dia */
  ocorrenciasPorDia?: Record<number, EscalaOcorrencia>;
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
  format: 'equipe' | 'escala';
  setores: ImportPreviewSetor[];
  totalFuncionarios: number;
  totalCelulas: number;
  totalStatusEspeciais: number;
  erros: string[];
}

export type StatusBancoHoras = 'atingiu' | 'devendo' | 'excedeu';

export interface BancoHoras {
  id: number;
  competenciaId: number;
  funcionarioId: number;
  cargaContratada: CargaHoraria;
  horasContratadas: number;
  horasTrabalhadas: number;
  turnosTrabalhados: number;
  saldoHoras: number;
  status: StatusBancoHoras;
  updatedAt: string;
}

export interface BancoHorasComDetalhes extends BancoHoras {
  funcionarioNome: string;
  funcionarioMatricula: string;
  funcionarioCategoria: string;
  setorId: number | null;
  setorNome: string | null;
  competenciaMes: number;
  competenciaAno: number;
  competenciaTipo: 'tecnico' | 'enfermeiro';
  bancoHorasDirty?: boolean;
  bancoHorasSyncedAt?: string | null;
}

export interface BancoHorasAgregado {
  funcionarioId: number;
  funcionarioNome: string;
  funcionarioMatricula: string;
  funcionarioCategoria: string;
  setorId: number | null;
  setorNome: string | null;
  horasContratadas: number;
  horasTrabalhadas: number;
  saldoHoras: number;
  status: StatusBancoHoras;
  competenciasContabilizadas: number;
}

export interface User {
  id: number;
  email: string;
  nome: string;
  ativo: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterRequest {
  email: string;
  nome: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  nome: string;
  password: string;
}

export interface UpdateUserRequest {
  nome?: string;
  ativo?: boolean;
}

export interface UpdateProfileRequest {
  nome?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  senhaAtual: string;
  senhaNova: string;
}

export interface DeleteAccountRequest {
  senha: string;
}

export interface ResetPasswordRequest {
  password: string;
}
