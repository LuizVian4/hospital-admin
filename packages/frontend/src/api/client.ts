import type {
  Funcionario,
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
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
    return request<Funcionario[]>(`/api/funcionarios${qs}`);
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
    request<EscalaOcorrencia>('/api/escala-ocorrencias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removerOcorrenciaEscala: (id: number) =>
    request<{ success: boolean }>(`/api/escala-ocorrencias/${id}`, { method: 'DELETE' }),

  removerTrocaCelula: (competenciaId: number, funcionarioId: number, dia: number) =>
    request<{ success: boolean }>(
      `/api/competencias/${competenciaId}/troca/${funcionarioId}/${dia}`,
      { method: 'DELETE' }
    ),

  createCompetencia: async (setorId: number, mes: number, ano: number, tipo: TipoEscala = 'tecnico') => {
    const res = await fetch(`${API_URL}/api/setores/${setorId}/competencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(
      `${API_URL}/api/setores/${setorId}/competencias?mes=${mes}&ano=${ano}&tipo=${tipo}`
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
    const res = await fetch(`${API_URL}/api/competencias/${competenciaId}/escala/export${qs}`);
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
    const res = await fetch(`${API_URL}/api/escala/export/${mes}/${ano}${qs}`);
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
    request<{ success: boolean }>('/api/escala-dias', {
      method: 'PUT',
      body: JSON.stringify({ competenciaId, items }),
    }),

  zerarEscalaFuncionario: (competenciaId: number, funcionarioId: number) =>
    request<{ success: boolean }>(`/api/competencias/${competenciaId}/escala/${funcionarioId}`, {
      method: 'DELETE',
    }),

  trocarEscalaDia: (competenciaId: number, data: TrocaEscalaRequest, tipo: TipoEscala = 'tecnico') =>
    request<{ success: boolean }>(
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

    const res = await fetch(`${API_URL}/api/importacao/ods?${params}`, {
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
    const res = await fetch(`${API_URL}/api/importacao/template/${tipo}`);
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
