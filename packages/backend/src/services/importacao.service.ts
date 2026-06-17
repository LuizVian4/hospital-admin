import * as XLSX from 'xlsx';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { competencias, escalaInicios, funcionarios, setores, statusEspeciais } from '../db/schema';
import { DIA_INICIO_ESCALA, getPadraoEscala, isEnfermeiro, resolverIndiceNoPadrao, type TipoEscala } from '@escala/shared';
import {
  normalizeTurno,
  normalizeContrato,
  normalizeCargaHoraria,
  parseDate,
  getDiasNoMes,
} from '../utils/helpers';
import type { Turno, ImportPreview, ImportPreviewSetor } from '@escala/shared';
import { limitesMes, normalizarStatusEspecial } from '@escala/shared';
import { findOrCreateCompetencia } from './escala.service';

export type { ImportPreview, ImportPreviewSetor };

interface ParsedFuncionario {
  matricula: string;
  nome: string;
  coren?: string;
  categoria: string;
  tipoContrato: string;
  dataAdmissao?: string;
  cargaHoraria: '180H' | '144H';
  turnos: Record<number, Turno | null>;
  ordem: number;
  /** Setor informado na coluna SETOR da planilha EQUIPE */
  setorNome?: string;
}

interface ParsedStatusEspecial {
  nome: string;
  matricula?: string;
  status: string;
}

type ImportFormat = 'escala' | 'equipe';

interface ParsedSetor {
  nome: string;
  format: ImportFormat;
  empresa?: string;
  gerente?: string;
  mes?: number;
  ano?: number;
  funcionarios: ParsedFuncionario[];
  statusEspeciais: ParsedStatusEspecial[];
  observacoes?: string;
  erros: string[];
}

const STATUS_KEYWORDS = ['FÉRIAS', 'FERIAS', 'LICENÇA INSS', 'LICENCA INSS', 'LICENÇA GESTACIONAL', 'LICENCA GESTACIONAL'];

function cellStr(row: unknown[], col: number): string {
  const val = row[col];
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function isMatricula(val: string): boolean {
  return /^\d{4,}$/.test(val);
}

function normalizeMatricula(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(Math.trunc(value));
  return String(value).trim();
}

function normalizeSetorNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[º°]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEquipeFormat(rows: unknown[][]): boolean {
  return findEquipeHeader(rows) != null;
}

function findEquipeHeader(rows: unknown[][]): { headerIdx: number; setorCol: number } | null {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const header = rows[i] as unknown[];
    const col0 = cellStr(header, 0).toUpperCase();
    if (col0 !== 'MAT' && col0 !== 'MATRÍCULA' && col0 !== 'MATRICULA') continue;

    for (let j = 0; j < header.length; j++) {
      if (cellStr(header, j).toUpperCase() === 'SETOR') {
        return { headerIdx: i, setorCol: j };
      }
    }
  }
  return null;
}

function parseCoren(row: unknown[], matricula: string): string | undefined {
  const raw = normalizeMatricula(row[2]) || cellStr(row, 2);
  if (!raw || raw === matricula) return undefined;
  return raw;
}

function extractHeaderInfo(rows: unknown[][]): {
  empresa?: string;
  gerente?: string;
  setor?: string;
  mes?: number;
  ano?: number;
} {
  const info: ReturnType<typeof extractHeaderInfo> = {};

  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i] as unknown[];
    for (let j = 0; j < row.length; j++) {
      const cell = cellStr(row, j).toUpperCase();
      const next = cellStr(row, j + 1);

      if (cell.includes('EMPRESA') && next) info.empresa = next;
      if (cell.includes('GERENTE') && next) info.gerente = next;
      if (cell === 'SETOR' && next) info.setor = next;
      if (cell.includes('COMPET') || cell.includes('MÊS') || cell.includes('MES')) {
        const compMatch = next.match(/(\d{1,2})[\/\-](\d{4})/);
        if (compMatch) {
          info.mes = parseInt(compMatch[1], 10);
          info.ano = parseInt(compMatch[2], 10);
        }
      }
    }
  }

  return info;
}

/** Colunas fixas antes dos dias: MAT, NOME, COREN, CAT, CTRT, ADM, CH */
const DIA_START_COL_DEFAULT = 7;

function findDiaStartCol(rows: unknown[][], funcHeaderIdx: number): number {
  const headerRow = rows[funcHeaderIdx] as unknown[];

  for (let j = 0; j < headerRow.length - 2; j++) {
    if (
      cellStr(headerRow, j) === '1' &&
      cellStr(headerRow, j + 1) === '2' &&
      cellStr(headerRow, j + 2) === '3'
    ) {
      return j;
    }
  }

  for (let j = DIA_START_COL_DEFAULT; j < headerRow.length; j++) {
    if (cellStr(headerRow, j) === '1') return j;
  }

  return DIA_START_COL_DEFAULT;
}

function countDiasNoHeader(headerRow: unknown[], diaStartCol: number): number {
  let count = 0;
  for (let j = diaStartCol; j < headerRow.length; j++) {
    const raw = cellStr(headerRow, j);
    if (!raw) break;
    const dayNum = parseInt(raw.split('\n')[0], 10);
    if (!Number.isFinite(dayNum) || dayNum !== count + 1) break;
    count++;
  }
  return count > 0 ? count : 31;
}

function findFuncionarioHeaderIndex(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const col0 = cellStr(rows[i] as unknown[], 0).toUpperCase();
    const col1 = cellStr(rows[i] as unknown[], 1).toUpperCase();
    if (
      (col0 === 'MAT' || col0 === 'MATRÍCULA' || col0 === 'MATRICULA') &&
      col1.includes('NOME')
    ) {
      return i;
    }
  }
  return -1;
}

function isStatusEspecialRow(row: unknown[]): boolean {
  for (let j = 0; j < row.length; j++) {
    const cell = cellStr(row, j).toUpperCase();
    if (STATUS_KEYWORDS.some((k) => cell.includes(k))) return true;
  }
  return false;
}

function getStatusFromRow(row: unknown[]): string {
  for (let j = 0; j < row.length; j++) {
    const cell = cellStr(row, j).toUpperCase();
    if (cell.includes('GESTACIONAL')) return 'LICENÇA GESTACIONAL';
    if (cell.includes('INSS')) return 'LICENÇA INSS';
    if (cell.includes('FÉRIAS') || cell.includes('FERIAS')) return 'FÉRIAS';
  }
  return 'FÉRIAS';
}

function parseEquipeSheet(rows: unknown[][]): ParsedSetor[] {
  const headerInfo = findEquipeHeader(rows);
  if (!headerInfo) {
    return [
      {
        nome: 'EQUIPE',
        format: 'equipe',
        funcionarios: [],
        statusEspeciais: [],
        erros: ['Cabeçalho EQUIPE (MAT + SETOR) não encontrado'],
      },
    ];
  }

  const { headerIdx, setorCol } = headerInfo;
  const erros: string[] = [];
  const bySetor = new Map<string, ParsedFuncionario[]>();
  const globalMatriculas = new Set<string>();
  let ordem = 0;
  const dataStartRow = headerIdx + 1;

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const matricula = normalizeMatricula(row[0]);
    if (!matricula) continue;
    if (!isMatricula(matricula)) continue;

    const nome = cellStr(row, 1).replace(/\s+/g, ' ').trim();
    const setorNome = cellStr(row, setorCol);
    if (!nome) {
      erros.push(`Linha ${i + 1}: matrícula ${matricula} sem nome`);
      continue;
    }
    if (!setorNome) {
      erros.push(`Matrícula ${matricula}: setor ausente na coluna SETOR`);
      continue;
    }

    if (globalMatriculas.has(matricula)) {
      erros.push(`Matrícula ${matricula} duplicada no arquivo`);
      continue;
    }
    globalMatriculas.add(matricula);

    const dataAdm = parseDate(row[5]);
    if (row[5] && !dataAdm) {
      erros.push(`Matrícula ${matricula}: data de admissão inválida (${row[5]})`);
    }

    const func: ParsedFuncionario = {
      matricula,
      nome,
      coren: parseCoren(row, matricula),
      categoria: cellStr(row, 3) || 'TÉC. DE ENFERMAGEM',
      tipoContrato: normalizeContrato(row[4]),
      dataAdmissao: dataAdm,
      cargaHoraria: normalizeCargaHoraria(row[6]),
      turnos: {},
      ordem: ordem++,
      setorNome,
    };

    if (!bySetor.has(setorNome)) bySetor.set(setorNome, []);
    bySetor.get(setorNome)!.push(func);
  }

  if (bySetor.size === 0) {
    return [
      {
        nome: 'EQUIPE',
        format: 'equipe',
        funcionarios: [],
        statusEspeciais: [],
        erros: erros.length > 0 ? erros : ['Nenhum funcionário encontrado na planilha EQUIPE'],
      },
    ];
  }

  return [...bySetor.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    .map(([nome, funcionarios], idx) => ({
      nome,
      format: 'equipe' as const,
      funcionarios,
      statusEspeciais: [],
      erros: idx === 0 ? [...erros] : [],
    }));
}

function parseSetorSheet(sheetName: string, rows: unknown[][]): ParsedSetor {
  const erros: string[] = [];
  const header = extractHeaderInfo(rows);

  const setorNome = header.setor || sheetName.replace(/_/g, ' ').trim();
  const funcionarios: ParsedFuncionario[] = [];
  const statusEspeciaisList: ParsedStatusEspecial[] = [];
  let observacoes: string | undefined;
  let ordem = 0;

  const funcHeaderIdx = findFuncionarioHeaderIndex(rows);
  if (funcHeaderIdx === -1) {
    erros.push(`Aba "${sheetName}": cabeçalho de funcionários não encontrado`);
    return {
      nome: setorNome,
      format: 'escala',
      ...header,
      funcionarios,
      statusEspeciais: statusEspeciaisList,
      erros,
    };
  }

  const diaStartCol = findDiaStartCol(rows, funcHeaderIdx);
  const totalDias =
    header.mes && header.ano ? getDiasNoMes(header.mes, header.ano) : countDiasNoHeader(rows[funcHeaderIdx], diaStartCol);

  for (let i = funcHeaderIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const col0 = cellStr(row, 0);
    const col1 = cellStr(row, 1);

    if (!col0 && !col1) continue;

    const upper0 = col0.toUpperCase();
    if (upper0.startsWith('OBSERVA')) {
      observacoes = col1 || cellStr(row, 2) || undefined;
      break;
    }

    if (isStatusEspecialRow(row)) {
      const status = getStatusFromRow(row);
      const nome = col1 || col0;
      const mat = isMatricula(col0) ? col0 : undefined;
      if (nome && !STATUS_KEYWORDS.some((k) => nome.toUpperCase().includes(k))) {
        statusEspeciaisList.push({ nome, matricula: mat, status });
      } else if (col1) {
        statusEspeciaisList.push({ nome: col1, matricula: isMatricula(col0) ? col0 : undefined, status });
      }
      continue;
    }

    if (!isMatricula(col0)) {
      if (col1 && isMatricula(cellStr(row, 2))) {
        // sometimes mat is in col 2
      } else {
        continue;
      }
    }

    const matricula = isMatricula(col0) ? col0 : normalizeMatricula(row[2]);
    if (!isMatricula(matricula)) continue;

    const nome = col1.replace(/\s+/g, ' ').trim();
    if (!nome) {
      erros.push(`Matrícula ${matricula}: nome ausente`);
      continue;
    }

    const turnos: Record<number, Turno | null> = {};
    for (let d = 1; d <= totalDias; d++) {
      const col = diaStartCol + d - 1;
      turnos[d] = normalizeTurno(row[col]);
    }

    const dataAdm = parseDate(row[5]);
    if (row[5] && !dataAdm) {
      erros.push(`Matrícula ${matricula}: data de admissão inválida (${row[5]})`);
    }

    funcionarios.push({
      matricula,
      nome,
      coren: parseCoren(row, matricula),
      categoria: cellStr(row, 3) || 'TÉC. DE ENFERMAGEM',
      tipoContrato: normalizeContrato(row[4]),
      dataAdmissao: dataAdm,
      cargaHoraria: normalizeCargaHoraria(row[6]),
      turnos,
      ordem: ordem++,
    });
  }

  // Fix COREN: if col2 is numeric matricula-like, coren might be in different position
  for (const f of funcionarios) {
    if (f.coren === f.matricula) {
      f.coren = undefined;
    }
  }

  return {
    nome: setorNome,
    format: 'escala',
    empresa: header.empresa,
    gerente: header.gerente,
    mes: header.mes,
    ano: header.ano,
    funcionarios,
    statusEspeciais: statusEspeciaisList,
    observacoes,
    erros,
  };
}

export function parseOdsBuffer(buffer: Buffer): ParsedSetor[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: false, raw: true });

  const equipeResults: ParsedSetor[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
    if (!rows.length || !isEquipeFormat(rows)) continue;
    equipeResults.push(...parseEquipeSheet(rows));
  }

  if (equipeResults.length > 0) {
    return mergeEquipeSetores(equipeResults);
  }

  const result: ParsedSetor[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    if (!rows.length) continue;
    result.push(parseSetorSheet(sheetName, rows as unknown[][]));
  }

  return result;
}

function mergeEquipeSetores(parsed: ParsedSetor[]): ParsedSetor[] {
  const merged = new Map<string, ParsedSetor>();

  for (const setor of parsed) {
    const existing = merged.get(setor.nome);
    if (!existing) {
      merged.set(setor.nome, { ...setor, funcionarios: [...setor.funcionarios] });
      continue;
    }
    existing.funcionarios.push(...setor.funcionarios);
    existing.erros.push(...setor.erros);
  }

  return [...merged.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );
}

async function findSetorByNome(nome: string, empresaId: string) {
  const exact = await db.query.setores.findFirst({
    where: and(eq(setores.nome, nome), eq(setores.empresaId, empresaId)),
  });
  if (exact) return exact;

  const normalized = normalizeSetorNome(nome);
  const allSetores = await db.select().from(setores).where(eq(setores.empresaId, empresaId));
  return allSetores.find((s) => normalizeSetorNome(s.nome) === normalized) ?? null;
}

async function findOrCreateSetor(
  nome: string,
  empresaId: string,
  opts?: { empresa?: string; gerente?: string }
) {
  const existing = await findSetorByNome(nome, empresaId);
  if (existing) {
    if (opts?.empresa || opts?.gerente) {
      await db
        .update(setores)
        .set({
          empresa: opts.empresa ?? existing.empresa,
          gerente: opts.gerente ?? existing.gerente,
        })
        .where(eq(setores.id, existing.id));
    }
    return existing;
  }

  const [created] = await db
    .insert(setores)
    .values({
      empresaId,
      nome,
      empresa: opts?.empresa,
      gerente: opts?.gerente,
    })
    .returning();

  return created;
}

async function upsertFuncionario(
  f: ParsedFuncionario,
  setorId: number,
  empresaId: string
): Promise<typeof funcionarios.$inferSelect> {
  const existing = await db.query.funcionarios.findFirst({
    where: and(eq(funcionarios.matricula, f.matricula), eq(funcionarios.empresaId, empresaId)),
  });

  if (existing) {
    const [updated] = await db
      .update(funcionarios)
      .set({
        nome: f.nome,
        coren: f.coren,
        categoria: f.categoria,
        tipoContrato: f.tipoContrato,
        dataAdmissao: f.dataAdmissao,
        cargaHoraria: f.cargaHoraria,
        setorId,
        ordemEscala: f.ordem,
        updatedAt: new Date(),
      })
      .where(eq(funcionarios.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(funcionarios)
    .values({
      empresaId,
      matricula: f.matricula,
      nome: f.nome,
      coren: f.coren,
      categoria: f.categoria,
      tipoContrato: f.tipoContrato,
      dataAdmissao: f.dataAdmissao,
      cargaHoraria: f.cargaHoraria,
      setorId,
      ordemEscala: f.ordem,
    })
    .returning();

  return created;
}

let lastPreview: { tipo: ImportFormat; parsed: ParsedSetor[] } | null = null;

export function setLastPreview(data: ParsedSetor[], tipo?: ImportFormat) {
  const format = tipo ?? data[0]?.format ?? 'escala';
  lastPreview = { tipo: format, parsed: data };
}

export function getLastPreview(): ParsedSetor[] | null {
  return lastPreview?.parsed ?? null;
}

function assertImportFormat(parsed: ParsedSetor[], expectedTipo: ImportFormat) {
  const format = parsed[0]?.format ?? 'escala';
  if (format !== expectedTipo) {
    throw new Error(
      expectedTipo === 'equipe'
        ? 'Este arquivo parece ser uma escala mensal. Use o card de importação de escala.'
        : 'Este arquivo parece ser uma planilha de equipe. Use o card de importação de equipe.'
    );
  }
}

export function buildEquipeTemplateBuffer(): Buffer {
  const rows: unknown[][] = [
    ['MAT', 'NOME', 'COREN', 'CAT', 'CTRT', 'ADM', 'CH', 'SETOR'],
    [
      '1170278',
      'MARIA SILVA SANTOS',
      '1897232',
      'TÉC. DE ENFERMAGEM',
      'EFETIVO',
      '2020-03-15',
      '180H',
      '5º ANDAR',
    ],
    [
      '1185001',
      'JOÃO PEREIRA LIMA',
      '',
      'ENFERMEIRO',
      'EFETIVO',
      '2022-06-01',
      '180H',
      '5º ANDAR',
    ],
    [
      '1190002',
      'ANA COSTA OLIVEIRA',
      '5551234',
      'TÉC. DE ENFERMAGEM',
      'PROVISÓRIO',
      '2024-01-10',
      '144H',
      '6º ANDAR',
    ],
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'EQUIPE');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export function buildEscalaTemplateBuffer(): Buffer {
  const mes = 6;
  const ano = 2026;
  const totalDias = getDiasNoMes(mes, ano);
  const diaHeaders = Array.from({ length: totalDias }, (_, i) => String(i + 1));
  const turnosExemplo = ['MT', 'F', 'SN', '/', 'F', 'MT', 'SN'];

  const rows: unknown[][] = [
    ['EMPRESA', 'Hospital Teresa de Lisieux'],
    ['GERENTE', 'Nome do Gerente'],
    ['SETOR', '5º ANDAR'],
    ['COMPETÊNCIA', `${mes}/${ano}`],
    [],
    ['MAT', 'NOME', 'COREN', 'CAT', 'CTRT', 'ADM', 'CH', ...diaHeaders],
    [
      '1170278',
      'MARIA SILVA SANTOS',
      '1897232',
      'TÉC. DE ENFERMAGEM',
      'EFETIVO',
      '2020-03-15',
      '180H',
      ...Array.from({ length: totalDias }, (_, i) => turnosExemplo[i % turnosExemplo.length]),
    ],
    [
      '1185001',
      'JOÃO PEREIRA LIMA',
      '',
      'ENFERMEIRO',
      'EFETIVO',
      '2022-06-01',
      '180H',
      ...Array.from({ length: totalDias }, (_, i) => turnosExemplo[(i + 2) % turnosExemplo.length]),
    ],
    [],
    ['OBSERVAÇÕES', 'Anotações gerais da competência (opcional)'],
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, '5_ANDAR');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export async function buildPreview(
  buffer: Buffer,
  empresaId: string,
  expectedTipo?: ImportFormat
): Promise<ImportPreview> {
  const parsed = parseOdsBuffer(buffer);
  if (parsed.length === 0) {
    throw new Error('Nenhum dado encontrado no arquivo');
  }

  const format = parsed[0]?.format ?? 'escala';
  if (expectedTipo) assertImportFormat(parsed, expectedTipo);
  setLastPreview(parsed, format);

  const preview: ImportPreview = {
    format,
    setores: [],
    totalFuncionarios: 0,
    totalCelulas: 0,
    totalStatusEspeciais: 0,
    erros: [],
  };

  for (const setor of parsed) {
    let novos = 0;
    let atualizados = 0;

    for (const f of setor.funcionarios) {
      const existing = await db.query.funcionarios.findFirst({
        where: and(eq(funcionarios.matricula, f.matricula), eq(funcionarios.empresaId, empresaId)),
      });
      if (existing) atualizados++;
      else novos++;
    }

    const celulas = setor.funcionarios.reduce(
      (acc, f) => acc + Object.values(f.turnos).filter((t) => t !== null).length,
      0
    );

    preview.setores.push({
      nome: setor.nome,
      empresa: setor.empresa,
      gerente: setor.gerente,
      mes: setor.mes,
      ano: setor.ano,
      funcionariosNovos: novos,
      funcionariosAtualizados: atualizados,
      celulasEscala: celulas,
      statusEspeciais: setor.statusEspeciais.length,
      erros: setor.erros,
    });

    preview.totalFuncionarios += setor.funcionarios.length;
    preview.totalCelulas += celulas;
    preview.totalStatusEspeciais += setor.statusEspeciais.length;
    preview.erros.push(...setor.erros);
  }

  return preview;
}

export async function persistImport(
  parsed: ParsedSetor[],
  empresaId: string,
  defaultMes?: number,
  defaultAno?: number
): Promise<ImportPreview> {
  const preview = await buildPreviewFromParsed(parsed, empresaId);

  for (const setorData of parsed) {
    const importaEscala = setorData.format === 'escala';

    if (!importaEscala) {
      for (const f of setorData.funcionarios) {
        const setorNome = f.setorNome ?? setorData.nome;
        const setor = await findOrCreateSetor(setorNome, empresaId, {
          empresa: setorData.empresa,
          gerente: setorData.gerente,
        });
        await upsertFuncionario(f, setor.id, empresaId);
      }
      continue;
    }

    const setor = await findOrCreateSetor(setorData.nome, empresaId, {
      empresa: setorData.empresa,
      gerente: setorData.gerente,
    });

    const mesImport = setorData.mes ?? defaultMes ?? new Date().getMonth() + 1;
    const anoImport = setorData.ano ?? defaultAno ?? new Date().getFullYear();

    const competenciasExistentes = await db.query.competencias.findMany({
      where: and(
        eq(competencias.mes, mesImport),
        eq(competencias.ano, anoImport),
        eq(competencias.setorId, setor.id)
      ),
    });

    for (const comp of competenciasExistentes) {
      await db.delete(escalaInicios).where(eq(escalaInicios.competenciaId, comp.id));
      await db.delete(statusEspeciais).where(eq(statusEspeciais.competenciaId, comp.id));
      if (setorData.observacoes !== undefined) {
        await db
          .update(competencias)
          .set({ observacoes: setorData.observacoes })
          .where(eq(competencias.id, comp.id));
      }
    }

    const compTecnico = await findOrCreateCompetencia(mesImport, anoImport, setor.id, 'tecnico', empresaId);
    const compEnfermeiro = await findOrCreateCompetencia(mesImport, anoImport, setor.id, 'enfermeiro', empresaId);

    if (setorData.observacoes !== undefined) {
      await db
        .update(competencias)
        .set({ observacoes: setorData.observacoes })
        .where(eq(competencias.id, compTecnico.id));
      await db
        .update(competencias)
        .set({ observacoes: setorData.observacoes })
        .where(eq(competencias.id, compEnfermeiro.id));
    }

    const competenciaPorTipo: Record<TipoEscala, typeof compTecnico> = {
      tecnico: compTecnico,
      enfermeiro: compEnfermeiro,
    };

    for (const f of setorData.funcionarios) {
      const func = await upsertFuncionario(f, setor.id, empresaId);

      const padrao = getPadraoEscala(func.categoria ?? '');
      const turnoInicio = f.turnos[DIA_INICIO_ESCALA];
      if (!padrao || !turnoInicio) continue;

      const tipo: TipoEscala = isEnfermeiro(func.categoria ?? '') ? 'enfermeiro' : 'tecnico';
      const competencia = competenciaPorTipo[tipo];
      const indicePadrao = resolverIndiceNoPadrao(
        padrao,
        DIA_INICIO_ESCALA,
        turnoInicio,
        f.turnos
      );
      await db.insert(escalaInicios).values({
        empresaId,
        competenciaId: competencia.id,
        funcionarioId: func.id,
        mesInicio: mesImport,
        anoInicio: anoImport,
        turnoInicio,
        indicePadrao,
      });
    }

    for (const se of setorData.statusEspeciais) {
      let func = se.matricula
        ? await db.query.funcionarios.findFirst({
            where: and(eq(funcionarios.matricula, se.matricula), eq(funcionarios.empresaId, empresaId)),
          })
        : await db.query.funcionarios.findFirst({
            where: and(
              eq(funcionarios.nome, se.nome),
              eq(funcionarios.setorId, setor.id),
              eq(funcionarios.empresaId, empresaId)
            ),
          });

      if (!func) {
        const matricula = se.matricula || `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        [func] = await db
          .insert(funcionarios)
          .values({
            empresaId,
            matricula,
            nome: se.nome,
            categoria: 'TÉC. DE ENFERMAGEM',
            tipoContrato: 'EFETIVO',
            setorId: setor.id,
          })
          .returning();
      }

      const tipoStatus: TipoEscala = isEnfermeiro(func.categoria ?? '') ? 'enfermeiro' : 'tecnico';
      const competenciaStatus = competenciaPorTipo[tipoStatus];

      await db.insert(statusEspeciais).values({
        empresaId,
        competenciaId: competenciaStatus.id,
        funcionarioId: func.id,
        status: normalizarStatusEspecial(se.status),
        dataInicio: limitesMes(competenciaStatus.mes, competenciaStatus.ano).inicio,
        dataFim: limitesMes(competenciaStatus.mes, competenciaStatus.ano).fim,
      });
    }
  }

  const competenciasSincronizadas = new Set<number>();
  for (const setorData of parsed) {
    if (setorData.format !== 'escala') continue;
    const setor = await db.query.setores.findFirst({
      where: and(eq(setores.nome, setorData.nome), eq(setores.empresaId, empresaId)),
    });
    if (!setor) continue;
    const mesImport = setorData.mes ?? defaultMes ?? new Date().getMonth() + 1;
    const anoImport = setorData.ano ?? defaultAno ?? new Date().getFullYear();
    const comps = await db.query.competencias.findMany({
      where: and(
        eq(competencias.mes, mesImport),
        eq(competencias.ano, anoImport),
        eq(competencias.setorId, setor.id)
      ),
    });
    for (const comp of comps) {
      competenciasSincronizadas.add(comp.id);
    }
  }

  if (competenciasSincronizadas.size > 0) {
    const { invalidateAndSyncBancoHorasCompetencia } = await import('./bancoHoras.service');
    for (const compId of competenciasSincronizadas) {
      await invalidateAndSyncBancoHorasCompetencia(compId);
    }
  }

  return preview;
}

async function buildPreviewFromParsed(parsed: ParsedSetor[], empresaId: string): Promise<ImportPreview> {
  const format = parsed[0]?.format ?? 'escala';
  const preview: ImportPreview = {
    format,
    setores: [],
    totalFuncionarios: 0,
    totalCelulas: 0,
    totalStatusEspeciais: 0,
    erros: [],
  };

  for (const setor of parsed) {
    let novos = 0;
    let atualizados = 0;

    for (const f of setor.funcionarios) {
      const existing = await db.query.funcionarios.findFirst({
        where: and(eq(funcionarios.matricula, f.matricula), eq(funcionarios.empresaId, empresaId)),
      });
      if (existing) atualizados++;
      else novos++;
    }

    const celulas = setor.funcionarios.reduce(
      (acc, f) => acc + Object.values(f.turnos).filter((t) => t !== null).length,
      0
    );

    preview.setores.push({
      nome: setor.nome,
      empresa: setor.empresa,
      gerente: setor.gerente,
      mes: setor.mes,
      ano: setor.ano,
      funcionariosNovos: novos,
      funcionariosAtualizados: atualizados,
      celulasEscala: celulas,
      statusEspeciais: setor.statusEspeciais.length,
      erros: setor.erros,
    });

    preview.totalFuncionarios += setor.funcionarios.length;
    preview.totalCelulas += celulas;
    preview.totalStatusEspeciais += setor.statusEspeciais.length;
    preview.erros.push(...setor.erros);
  }

  return preview;
}

export async function confirmImport(
  empresaId: string,
  defaultMes?: number,
  defaultAno?: number,
  expectedTipo?: ImportFormat
): Promise<ImportPreview | null> {
  if (!lastPreview) return null;
  if (expectedTipo && lastPreview.tipo !== expectedTipo) {
    throw new Error('O preview não corresponde ao tipo de importação selecionado. Gere o preview novamente.');
  }
  return persistImport(lastPreview.parsed, empresaId, defaultMes, defaultAno);
}
