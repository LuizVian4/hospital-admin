import type {
  Funcionario,
  FuncionariosListResponse,
  FuncionariosAgrupamentosResponse,
  GradeEscalaResponse,
  Setor,
  TipoEscala,
  Turno,
  EscalaDiaUpdate,
  TrocaEscalaRequest,
  StatusEspecialItem,
  StatusEspecialRequest,
  EscalaOcorrencia,
  EscalaOcorrenciaRequest,
  ImportPreview,
  BancoHorasComDetalhes,
  BancoHorasAgregado,
  AuthResponse,
  User,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
  EmpresaComPapel,
  Empresa,
  EmpresaDetalhes,
  UsuarioEmpresa,
  UsuarioEmpresaCandidato,
  UpdateEmpresaRequest,
  VincularUsuarioEmpresaRequest,
  UpdateVinculoUsuarioRequest,
  PapelEmpresa,
} from '@escala/shared';

export interface Competencia {
  id: number;
  mes: number;
  ano: number;
  setorId: number | null;
  tipo: TipoEscala;
  observacoes?: string | null;
}

export interface DashboardData {
  setores: Setor[];
  totalFuncionarios: number;
  funcionariosPorSetor: { setorId: number; setor: string; total: number }[];
  semEscalaDefinida: Funcionario[];
  mes: number;
  ano: number;
  totalTecnicos: number;
  comEscalaDefinida: number;
  coberturaEscalaPercent: number;
  totalEnfermeiros: number;
  comEscalaDefinidaEnfermeiros: number;
  coberturaEscalaEnfermeirosPercent: number;
  funcionariosSemSetor: number;
  setoresComCompetencia: number;
  setoresSemCompetencia: { setorId: number; setor: string; tipo: TipoEscala }[];
  funcionariosPorCategoria: { categoria: string; total: number }[];
  funcionariosPorContrato: { tipo: string; total: number }[];
  resumoEscalaSetores: {
    setorId: number;
    setor: string;
    totalFuncionarios: number;
    totalTecnicos: number;
    totalEnfermeiros: number;
    totalOutros: number;
    tecnicosComEscala: number;
    enfermeirosComEscala: number;
    tecnicosSemEscala: number;
    enfermeirosSemEscala: number;
    coberturaTecnicosPercent: number;
    coberturaEnfermeirosPercent: number;
    temCompetenciaTecnico: boolean;
    temCompetenciaEnfermeiro: boolean;
    pendencias: number;
  }[];
  statusEspeciaisNoMes: { status: string; total: number }[];
  totalStatusEspeciaisNoMes: number;
  bancoHorasPendentes: BancoHorasComDetalhes[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

const EMPRESA_OPTIONAL_PATHS = new Set(['/api/empresas']);

let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;
let getEmpresaId: (() => string | null) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function setEmpresaIdProvider(provider: () => string | null) {
  getEmpresaId = provider;
}

function isPublicAuthPath(path: string): boolean {
  return PUBLIC_AUTH_PATHS.has(path.split('?')[0]);
}

function needsEmpresaHeader(path: string): boolean {
  const normalized = path.split('?')[0];
  return (
    normalized.startsWith('/api/') &&
    !isPublicAuthPath(path) &&
    !EMPRESA_OPTIONAL_PATHS.has(normalized)
  );
}

function buildHeaders(path: string, options?: RequestInit): HeadersInit {
  const isFormData = options?.body instanceof FormData;
  const empresaId = needsEmpresaHeader(path) ? getEmpresaId?.() : null;

  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(empresaId ? { 'X-Empresa-Id': empresaId } : {}),
    ...options?.headers,
  };
}

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function fetchApi(path: string, options?: RequestInit): Promise<Response> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: buildHeaders(path, options),
    });

  const res = await doFetch();

  if (res.status === 401 && !isPublicAuthPath(path)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return doFetch();
    }
    onUnauthorized?.();
  }

  return res;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetchApi(path, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/api/auth/me'),

  listEmpresas: () => request<EmpresaComPapel[]>('/api/empresas'),

  createEmpresa: (data: { nome: string; slug: string }) =>
    request<Empresa>('/api/empresas', { method: 'POST', body: JSON.stringify(data) }),

  getEmpresaAtual: () => request<EmpresaDetalhes>('/api/empresas/atual'),

  updateEmpresaAtual: (data: UpdateEmpresaRequest) =>
    request<EmpresaDetalhes>('/api/empresas/atual', { method: 'PUT', body: JSON.stringify(data) }),

  listUsuariosEmpresa: () => request<UsuarioEmpresa[]>('/api/empresas/atual/usuarios'),

  listUsuariosCandidatosEmpresa: () =>
    request<UsuarioEmpresaCandidato[]>('/api/empresas/atual/usuarios/candidatos'),

  vincularUsuarioEmpresa: (data: VincularUsuarioEmpresaRequest) =>
    request<{ success: boolean }>('/api/empresas/atual/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVinculoUsuarioEmpresa: (userId: number, data: UpdateVinculoUsuarioRequest) =>
    request<{ success: boolean }>(`/api/empresas/atual/usuarios/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  removerVinculoUsuarioEmpresa: (userId: number) =>
    request<{ success: boolean }>(`/api/empresas/atual/usuarios/${userId}`, { method: 'DELETE' }),

  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  changePassword: (data: ChangePasswordRequest) =>
    request<{ success: boolean }>('/api/auth/senha', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateProfile: (data: UpdateProfileRequest) =>
    request<User>('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  deleteAccount: (data: DeleteAccountRequest) =>
    request<{ success: boolean }>('/api/auth/me', { method: 'DELETE', body: JSON.stringify(data) }),

  getSetores: () => request<Setor[]>('/api/setores'),

  getSetoresEscala: () => request<Setor[]>('/api/setores?comTecnicos=true'),

  getSetoresEnfermeiros: () => request<Setor[]>('/api/setores?comEnfermeiros=true'),

  getSetoresPorEscala: (tipo: TipoEscala) =>
    request<Setor[]>(
      tipo === 'enfermeiro' ? '/api/setores?comEnfermeiros=true' : '/api/setores?comTecnicos=true'
    ),

  createSetor: (data: Partial<Setor>) =>
    request<Setor>('/api/setores', { method: 'POST', body: JSON.stringify(data) }),

  updateSetor: (id: number, data: Partial<Setor>) =>
    request<Setor>(`/api/setores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getFuncionarios: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<FuncionariosListResponse>(`/api/funcionarios${qs}`);
  },

  getFuncionariosAgrupamentos: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<FuncionariosAgrupamentosResponse>(`/api/funcionarios/agrupamentos${qs}`);
  },

  getFuncionario: (id: number) => request<Funcionario>(`/api/funcionarios/${id}`),

  createFuncionario: (data: Partial<Funcionario>) =>
    request<Funcionario>('/api/funcionarios', { method: 'POST', body: JSON.stringify(data) }),

  updateFuncionario: (id: number, data: Partial<Funcionario>) =>
    request<Funcionario>(`/api/funcionarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteFuncionario: (id: number) =>
    request<{ success: boolean }>(`/api/funcionarios/${id}`, { method: 'DELETE' }),

  getStatusEspeciaisFuncionario: (funcionarioId: number) =>
    request<StatusEspecialItem[]>(`/api/funcionarios/${funcionarioId}/status-especiais`),

  createStatusEspecial: (data: StatusEspecialRequest) =>
    request<StatusEspecialItem>('/api/status-especiais', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteStatusEspecial: (id: number) =>
    request<{ success: boolean }>(`/api/status-especiais/${id}`, { method: 'DELETE' }),

  salvarOcorrenciaEscala: (data: EscalaOcorrenciaRequest) =>
    request<{ ocorrencia: EscalaOcorrencia; grade: GradeEscalaResponse }>('/api/escala-ocorrencias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removerOcorrenciaEscala: (id: number) =>
    request<{ success: boolean; grade?: GradeEscalaResponse }>(`/api/escala-ocorrencias/${id}`, {
      method: 'DELETE',
    }),

  removerTrocaCelula: (competenciaId: number, funcionarioId: number, dia: number) =>
    request<{ success: boolean; grade?: GradeEscalaResponse }>(
      `/api/competencias/${competenciaId}/troca/${funcionarioId}/${dia}`,
      { method: 'DELETE' }
    ),

  createCompetencia: async (setorId: number, mes: number, ano: number, tipo: TipoEscala = 'tecnico') => {
    const res = await fetchApi(`/api/setores/${setorId}/competencias`, {
      method: 'POST',
      body: JSON.stringify({ mes, ano, tipo }),
    });
    if (res.status === 409) {
      const data = await res.json();
      return { id: data.competenciaId as number };
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ id: number }>;
  },

  getCompetencia: async (setorId: number, mes: number, ano: number, tipo: TipoEscala = 'tecnico') => {
    const res = await fetchApi(
      `/api/setores/${setorId}/competencias?mes=${mes}&ano=${ano}&tipo=${tipo}`
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Erro ao buscar competência');
    return res.json() as Promise<Competencia>;
  },

  listCompetenciasSetor: (setorId: number, tipo?: TipoEscala) =>
    request<Competencia[]>(
      `/api/setores/${setorId}/competencias${tipo ? `?tipo=${tipo}` : ''}`
    ),

  getEscala: (competenciaId: number, tipo: TipoEscala = 'tecnico') =>
    request<GradeEscalaResponse>(
      `/api/competencias/${competenciaId}/escala${tipo === 'enfermeiro' ? '?tipo=enfermeiro' : ''}`
    ),

  downloadEscalaExcel: async (competenciaId: number, tipo: TipoEscala = 'tecnico') => {
    const qs = tipo === 'enfermeiro' ? '?tipo=enfermeiro' : '';
    const res = await fetchApi(`/api/competencias/${competenciaId}/escala/export${qs}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    const filename = match?.[1] ?? `escala_${competenciaId}_${tipo}.xlsx`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  downloadEscalaMesCompletoExcel: async (mes: number, ano: number, tipo: TipoEscala = 'tecnico') => {
    const qs = tipo === 'enfermeiro' ? '?tipo=enfermeiro' : '';
    const res = await fetchApi(`/api/escala/export/${mes}/${ano}${qs}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    const filename = match?.[1] ?? `escala_completa_${String(mes).padStart(2, '0')}_${ano}_${tipo}.xlsx`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  updateEscalaDias: (competenciaId: number, items: EscalaDiaUpdate[]) =>
    request<{ success: boolean; updated: number; grade?: GradeEscalaResponse | null }>(
      '/api/escala-dias',
      {
        method: 'PUT',
        body: JSON.stringify({ competenciaId, items }),
      }
    ),

  zerarEscalaFuncionario: (competenciaId: number, funcionarioId: number) =>
    request<{ success: boolean; grade?: GradeEscalaResponse }>(
      `/api/competencias/${competenciaId}/escala/${funcionarioId}`,
      { method: 'DELETE' }
    ),

  trocarEscalaDia: (competenciaId: number, data: TrocaEscalaRequest, tipo: TipoEscala = 'tecnico') =>
    request<{ success: boolean; grade: GradeEscalaResponse }>(
      `/api/competencias/${competenciaId}/troca${tipo === 'enfermeiro' ? '?tipo=enfermeiro' : ''}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  updateObservacoes: (competenciaId: number, observacoes: string) =>
    request(`/api/competencias/${competenciaId}/observacoes`, {
      method: 'PUT',
      body: JSON.stringify({ observacoes }),
    }),

  simularProximoMes: (competenciaId: number, tipo: TipoEscala = 'tecnico') =>
    request<{
      competenciaId: number;
      mes: number;
      ano: number;
      processados: number;
      ignorados: number;
      grade?: GradeEscalaResponse;
    }>(
      `/api/competencias/${competenciaId}/simular-proximo-mes${tipo === 'enfermeiro' ? '?tipo=enfermeiro' : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    ),

  importOds: async (
    file: File,
    confirmar = false,
    tipo: 'equipe' | 'escala',
    mes?: number,
    ano?: number
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams();
    params.set('tipo', tipo);
    if (confirmar) params.set('confirmar', 'true');
    if (mes) params.set('mes', String(mes));
    if (ano) params.set('ano', String(ano));

    const res = await fetchApi(`/api/importacao/ods?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json() as Promise<ImportPreview & { persisted?: boolean }>;
  },

  downloadImportTemplate: async (tipo: 'equipe' | 'escala') => {
    const res = await fetchApi(`/api/importacao/template/${tipo}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tipo === 'equipe' ? 'template_equipe.xlsx' : 'template_escala.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  getDashboard: () => request<DashboardData>('/api/dashboard'),

  getBancoHoras: (mes: number, ano: number, pendentes?: boolean) => {
    const params = new URLSearchParams({
      mes: String(mes),
      ano: String(ano),
      ...(pendentes ? { pendentes: 'true' } : {}),
    });
    return request<BancoHorasComDetalhes[]>(`/api/banco-horas?${params}`);
  },

  getBancoHorasGeral: (pendentes?: boolean) => {
    const params = new URLSearchParams({
      geral: 'true',
      ...(pendentes ? { pendentes: 'true' } : {}),
    });
    return request<BancoHorasAgregado[]>(`/api/banco-horas?${params}`);
  },
};
