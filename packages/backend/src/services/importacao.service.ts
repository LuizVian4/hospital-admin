import * as XLSX from 'xlsx';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { competencias, escalaDias, funcionarios, setores, statusEspeciais } from '../db/schema';
import {
  normalizeTurno,
  normalizeContrato,
  normalizeCargaHoraria,
  parseDate,
} from '../utils/helpers';
import type { Turno } from '@escala/shared';
import { limitesMes, normalizarStatusEspecial } from '@escala/shared';

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
}

interface ParsedStatusEspecial {
  nome: string;
  matricula?: string;
  status: string;
}

interface ParsedSetor {
  nome: string;
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
    return { nome: setorNome, ...header, funcionarios, statusEspeciais: statusEspeciaisList, erros };
  }

  const diaStartCol = findDiaStartCol(rows, funcHeaderIdx);

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

    const matricula = isMatricula(col0) ? col0 : cellStr(row, 2);
    if (!isMatricula(matricula)) continue;

    const nome = col1;
    if (!nome) {
      erros.push(`Matrícula ${matricula}: nome ausente`);
      continue;
    }

    const turnos: Record<number, Turno | null> = {};
    for (let d = 1; d <= 30; d++) {
      const col = diaStartCol + d - 1;
      turnos[d] = normalizeTurno(row[col]);
    }

    const dataAdm = parseDate(row[5]);
    if (row[5] && !dataAdm) {
      erros.push(`Matrícula ${matricula}: data de admissão inválida (${row[5]})`);
    }

    const corenVal = cellStr(row, 2);
    const coren = corenVal && corenVal !== matricula && !isMatricula(corenVal) ? corenVal : 
                  (cellStr(row, 2) && !isMatricula(cellStr(row, 2)) ? cellStr(row, 2) : undefined);

    funcionarios.push({
      matricula,
      nome,
      coren: coren || undefined,
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
  const result: ParsedSetor[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    if (!rows.length) continue;
    result.push(parseSetorSheet(sheetName, rows as unknown[][]));
  }

  return result;
}

let lastPreview: ParsedSetor[] | null = null;

export function setLastPreview(data: ParsedSetor[]) {
  lastPreview = data;
}

export function getLastPreview(): ParsedSetor[] | null {
  return lastPreview;
}

export async function buildPreview(buffer: Buffer): Promise<ImportPreview> {
  const parsed = parseOdsBuffer(buffer);
  setLastPreview(parsed);

  const preview: ImportPreview = {
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
        where: eq(funcionarios.matricula, f.matricula),
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
  defaultMes?: number,
  defaultAno?: number
): Promise<ImportPreview> {
  const preview = await buildPreviewFromParsed(parsed);

  for (const setorData of parsed) {
    let setor = await db.query.setores.findFirst({
      where: eq(setores.nome, setorData.nome),
    });

    if (!setor) {
      [setor] = await db
        .insert(setores)
        .values({
          nome: setorData.nome,
          empresa: setorData.empresa,
          gerente: setorData.gerente,
        })
        .returning();
    } else {
      await db
        .update(setores)
        .set({
          empresa: setorData.empresa ?? setor.empresa,
          gerente: setorData.gerente ?? setor.gerente,
        })
        .where(eq(setores.id, setor.id));
    }

    const mes = setorData.mes ?? defaultMes ?? new Date().getMonth() + 1;
    const ano = setorData.ano ?? defaultAno ?? new Date().getFullYear();

    let competencia = await db.query.competencias.findFirst({
      where: and(
        eq(competencias.mes, mes),
        eq(competencias.ano, ano),
        eq(competencias.setorId, setor.id)
      ),
    });

    if (competencia) {
      await db.delete(escalaDias).where(eq(escalaDias.competenciaId, competencia.id));
      await db.delete(statusEspeciais).where(eq(statusEspeciais.competenciaId, competencia.id));
      if (setorData.observacoes !== undefined) {
        await db
          .update(competencias)
          .set({ observacoes: setorData.observacoes })
          .where(eq(competencias.id, competencia.id));
      }
    } else {
      [competencia] = await db
        .insert(competencias)
        .values({
          mes,
          ano,
          setorId: setor.id,
          observacoes: setorData.observacoes,
        })
        .returning();
    }

    for (const f of setorData.funcionarios) {
      let func = await db.query.funcionarios.findFirst({
        where: eq(funcionarios.matricula, f.matricula),
      });

      if (func) {
        [func] = await db
          .update(funcionarios)
          .set({
            nome: f.nome,
            coren: f.coren,
            categoria: f.categoria,
            tipoContrato: f.tipoContrato,
            dataAdmissao: f.dataAdmissao,
            cargaHoraria: f.cargaHoraria,
            setorId: setor.id,
            ordemEscala: f.ordem,
            updatedAt: new Date(),
          })
          .where(eq(funcionarios.id, func.id))
          .returning();
      } else {
        [func] = await db
          .insert(funcionarios)
          .values({
            matricula: f.matricula,
            nome: f.nome,
            coren: f.coren,
            categoria: f.categoria,
            tipoContrato: f.tipoContrato,
            dataAdmissao: f.dataAdmissao,
            cargaHoraria: f.cargaHoraria,
            setorId: setor.id,
            ordemEscala: f.ordem,
          })
          .returning();
      }

      const escalaValues = Object.entries(f.turnos)
        .filter(([, turno]) => turno !== null)
        .map(([dia, turno]) => ({
          competenciaId: competencia!.id,
          funcionarioId: func!.id,
          tipoRegistro: 'turno' as const,
          dia: parseInt(dia, 10),
          turno,
          ativo: true,
        }));

      if (escalaValues.length > 0) {
        await db.insert(escalaDias).values(escalaValues);
      }
    }

    for (const se of setorData.statusEspeciais) {
      let func = se.matricula
        ? await db.query.funcionarios.findFirst({ where: eq(funcionarios.matricula, se.matricula) })
        : await db.query.funcionarios.findFirst({
            where: and(eq(funcionarios.nome, se.nome), eq(funcionarios.setorId, setor.id)),
          });

      if (!func) {
        const matricula = se.matricula || `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        [func] = await db
          .insert(funcionarios)
          .values({
            matricula,
            nome: se.nome,
            categoria: 'TÉC. DE ENFERMAGEM',
            tipoContrato: 'EFETIVO',
            setorId: setor.id,
          })
          .returning();
      }

      await db.insert(statusEspeciais).values({
        competenciaId: competencia!.id,
        funcionarioId: func.id,
        status: normalizarStatusEspecial(se.status),
        dataInicio: limitesMes(competencia!.mes, competencia!.ano).inicio,
        dataFim: limitesMes(competencia!.mes, competencia!.ano).fim,
      });
    }
  }

  return preview;
}

async function buildPreviewFromParsed(parsed: ParsedSetor[]): Promise<ImportPreview> {
  const preview: ImportPreview = {
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
        where: eq(funcionarios.matricula, f.matricula),
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

export async function confirmImport(defaultMes?: number, defaultAno?: number): Promise<ImportPreview | null> {
  if (!lastPreview) return null;
  return persistImport(lastPreview, defaultMes, defaultAno);
}
