import ExcelJS from 'exceljs';
import { eq } from 'drizzle-orm';
import type { FuncionarioComTurnos, GradeEscalaResponse } from '@escala/shared';
import { GRUPOS_ESCALA, getPadraoEscala } from '@escala/shared';
import { db } from '../db';
import { competencias } from '../db/schema';
import { getGradeEscala } from './escala.service';

const DIA_START_COL = 8; // 1-based: col H = day 1
const MAX_DIAS = 30;
const TOTAL_COLS = 7 + MAX_DIAS;

const COLORS = {
  headerBg: 'FF1E3A8A',
  headerFont: 'FFFFFFFF',
  metaLabelBg: 'FFEFF6FF',
  metaLabelFont: 'FF1E40AF',
  metaValueBg: 'FFFFFFFF',
  border: 'FFCBD5E1',
  weekendHeaderBg: 'FF94A3B8',
  weekdayHeaderBg: 'FF3B82F6',
  groupBg: 'FFEEF2FF',
  groupFont: 'FF3730A3',
  zebra: 'FFF8FAFC',
  statusLabelBg: 'FFFEF3C7',
  statusFont: 'FF92400E',
  obsLabelBg: 'FFFFFBEB',
  trocaFill: 'FFEDE9FE',
  trocaFont: 'FF5B21B6',
  projectedFont: 'FF64748B',
};

const TURNO_STYLES: Record<string, { fill: string; font: string }> = {
  MT: { fill: 'FFDBEAFE', font: 'FF1E3A8A' },
  M: { fill: 'FFDCFCE7', font: 'FF14532D' },
  T: { fill: 'FFFEF9C3', font: 'FF713F12' },
  SN: { fill: 'FFF3E8FF', font: 'FF581C87' },
  HC: { fill: 'FFE2E8F0', font: 'FF1E293B' },
  F: { fill: 'FFF3F4F6', font: 'FF374151' },
  FF: { fill: 'FFFFEDD5', font: 'FF7C2D12' },
  '/': { fill: 'FFFFFFFF', font: 'FF334155' },
  INSS: { fill: 'FFFEE2E2', font: 'FF7F1D1D' },
  LG: { fill: 'FFFCE7F3', font: 'FF9D174D' },
};

type RowKind = 'meta' | 'spacer' | 'header' | 'group' | 'employee' | 'status' | 'obs';

interface SheetRow {
  kind: RowKind;
  values: (string | number)[];
  funcionario?: FuncionarioComTurnos;
}

function formatDateBr(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function getTurnoCell(
  func: FuncionarioComTurnos,
  dia: number
): { value: string; projetado: boolean; troca: boolean } {
  const saved = func.turnos[dia];
  const projected = func.turnosProjetados?.[dia];
  const turno = saved ?? projected ?? null;
  return {
    value: turno ?? '',
    projetado: saved == null && projected != null,
    troca: Boolean(func.observacoesDia?.[dia]),
  };
}

function listarFuncionarios(grupos: GradeEscalaResponse['grupos']): FuncionarioComTurnos[] {
  const map = new Map<number, FuncionarioComTurnos>();
  for (const grupo of grupos) {
    for (const func of grupo.funcionarios) {
      map.set(func.id, func);
    }
  }
  return [...map.values()];
}

function organizarPorGrupoEscala(funcionarios: FuncionarioComTurnos[]) {
  const porGrupo = new Map<number, FuncionarioComTurnos[]>(
    GRUPOS_ESCALA.map((g) => [g.indicePadrao, []])
  );
  const semAtribuicao: FuncionarioComTurnos[] = [];
  const semPadrao: FuncionarioComTurnos[] = [];

  for (const func of funcionarios) {
    if (!getPadraoEscala(func.categoria)) {
      semPadrao.push(func);
      continue;
    }

    const indice = func.escalaInicio?.indicePadrao;
    if (indice != null && porGrupo.has(indice)) {
      porGrupo.get(indice)!.push(func);
    } else {
      semAtribuicao.push(func);
    }
  }

  const sortNome = (a: FuncionarioComTurnos, b: FuncionarioComTurnos) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });

  for (const lista of porGrupo.values()) lista.sort(sortNome);
  semAtribuicao.sort(sortNome);
  semPadrao.sort(sortNome);

  return { porGrupo, semAtribuicao, semPadrao };
}

function emptyRow(): string[] {
  return new Array(TOTAL_COLS).fill('');
}

function groupHeaderRow(label: string): string[] {
  const row = emptyRow();
  row[0] = label;
  return row;
}

function funcionarioValues(func: FuncionarioComTurnos, dias: number[]): (string | number)[] {
  const row: (string | number)[] = [
    func.matricula,
    func.nome,
    func.coren ?? '',
    func.categoria,
    func.tipoContrato,
    formatDateBr(func.dataAdmissao),
    func.cargaHoraria,
  ];

  for (let d = 1; d <= MAX_DIAS; d++) {
    row.push(dias.includes(d) ? getTurnoCell(func, d).value : '');
  }

  return row;
}

function buildSheetRows(grade: GradeEscalaResponse, empresa?: string, gerente?: string): SheetRow[] {
  const { competencia, dias, observacoes, statusEspeciais } = grade;
  const mesAno = `${String(competencia.mes).padStart(2, '0')}/${competencia.ano}`;

  const rows: SheetRow[] = [
    { kind: 'meta', values: ['EMPRESA', empresa ?? ''] },
    { kind: 'meta', values: ['GERENTE', gerente ?? ''] },
    { kind: 'meta', values: ['SETOR', competencia.setor] },
    { kind: 'meta', values: ['COMPETÊNCIA', mesAno] },
    { kind: 'spacer', values: emptyRow() },
    {
      kind: 'header',
      values: (() => {
        const header: (string | number)[] = ['MAT', 'NOME', 'COREN', 'CAT', 'CTRT', 'ADM', 'CH'];
        for (let d = 1; d <= MAX_DIAS; d++) {
          const idx = d - 1;
          const dow = grade.diasSemana[idx] ?? '';
          header.push(dow ? `${d}\n${dow}` : String(d));
        }
        return header;
      })(),
    },
  ];

  const funcionarios = listarFuncionarios(grade.grupos);
  const { porGrupo, semAtribuicao, semPadrao } = organizarPorGrupoEscala(funcionarios);

  const pushEmployees = (lista: FuncionarioComTurnos[]) => {
    for (const func of lista) {
      rows.push({
        kind: 'employee',
        values: funcionarioValues(func, dias),
        funcionario: func,
      });
    }
  };

  for (const grupo of GRUPOS_ESCALA) {
    const lista = porGrupo.get(grupo.indicePadrao) ?? [];
    if (lista.length === 0) continue;
    rows.push({
      kind: 'group',
      values: groupHeaderRow(`${grupo.label} — ${grupo.descricao}`),
    });
    pushEmployees(lista);
  }

  if (semAtribuicao.length > 0) {
    rows.push({ kind: 'group', values: groupHeaderRow('Sem atribuição de grupo') });
    pushEmployees(semAtribuicao);
  }

  if (semPadrao.length > 0) {
    rows.push({ kind: 'group', values: groupHeaderRow('Outras categorias') });
    pushEmployees(semPadrao);
  }

  if (statusEspeciais.length > 0) {
    rows.push({ kind: 'spacer', values: emptyRow() });
    for (const se of statusEspeciais) {
      const row = emptyRow();
      row[0] = se.funcionario.matricula;
      row[1] = se.funcionario.nome;
      row[2] = se.funcionario.coren ?? '';
      row[3] = se.status;
      rows.push({ kind: 'status', values: row });
    }
  }

  if (observacoes) {
    rows.push({ kind: 'spacer', values: emptyRow() });
    rows.push({ kind: 'obs', values: ['OBSERVAÇÕES', observacoes] });
  }

  return rows;
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb: COLORS.border } };
  return { top: side, left: side, bottom: side, right: side };
}

function styleMetaRow(row: ExcelJS.Row) {
  const label = row.getCell(1);
  const value = row.getCell(2);

  label.font = { bold: true, size: 10, color: { argb: COLORS.metaLabelFont } };
  label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.metaLabelBg } };
  label.alignment = { vertical: 'middle', horizontal: 'left' };
  label.border = thinBorder();

  value.font = { size: 10 };
  value.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.metaValueBg } };
  value.alignment = { vertical: 'middle', horizontal: 'left' };
  value.border = thinBorder();

  row.height = 20;
}

function styleHeaderRow(row: ExcelJS.Row, diasSemana: string[]) {
  row.height = 32;

  for (let col = 1; col <= TOTAL_COLS; col++) {
    const cell = row.getCell(col);
    const isDayCol = col >= DIA_START_COL;
    const dayIdx = col - DIA_START_COL;
    const isWeekend =
      isDayCol && (diasSemana[dayIdx] === 'SAB' || diasSemana[dayIdx] === 'DOM');

    cell.font = {
      bold: true,
      size: isDayCol ? 9 : 10,
      color: { argb: COLORS.headerFont },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isWeekend ? COLORS.weekendHeaderBg : COLORS.weekdayHeaderBg },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: isDayCol,
    };
    cell.border = thinBorder();
  }
}

function styleGroupRow(row: ExcelJS.Row, sheet: ExcelJS.Worksheet, rowNumber: number) {
  sheet.mergeCells(rowNumber, 1, rowNumber, TOTAL_COLS);
  const cell = row.getCell(1);
  cell.font = { bold: true, size: 10, color: { argb: COLORS.groupFont } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.groupBg } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  cell.border = thinBorder();
  row.height = 22;
}

function styleTurnoCell(
  cell: ExcelJS.Cell,
  turno: string,
  opts: { projetado: boolean; troca: boolean }
) {
  const style = TURNO_STYLES[turno] ?? { fill: 'FFFFFFFF', font: 'FF0F172A' };

  if (opts.troca) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.trocaFill } };
    cell.font = {
      bold: true,
      size: 9,
      color: { argb: COLORS.trocaFont },
      italic: opts.projetado,
    };
  } else if (turno) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
    cell.font = {
      bold: true,
      size: 9,
      color: { argb: style.font },
      italic: opts.projetado,
    };
  } else {
    cell.font = { size: 9, color: { argb: COLORS.projectedFont }, italic: opts.projetado };
  }

  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = thinBorder();
}

function styleEmployeeRow(
  row: ExcelJS.Row,
  func: FuncionarioComTurnos,
  dias: number[],
  zebra: boolean
) {
  row.height = 18;

  for (let col = 1; col <= 7; col++) {
    const cell = row.getCell(col);
    cell.font = { size: col === 2 ? 10 : 9, bold: col === 1 };
    cell.alignment = {
      vertical: 'middle',
      horizontal: col <= 1 ? 'center' : 'left',
      indent: col === 2 ? 0 : undefined,
    };
    if (zebra) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } };
    }
    cell.border = thinBorder();
  }

  for (let d = 1; d <= MAX_DIAS; d++) {
    const col = DIA_START_COL + d - 1;
    const cell = row.getCell(col);
    if (!dias.includes(d)) {
      cell.border = thinBorder();
      continue;
    }
    const { value, projetado, troca } = getTurnoCell(func, d);
    cell.value = value;
    styleTurnoCell(cell, value, { projetado, troca });
  }
}

function styleStatusRow(row: ExcelJS.Row) {
  row.height = 18;
  for (let col = 1; col <= 4; col++) {
    const cell = row.getCell(col);
    cell.font = { size: 9, bold: col === 4, color: col === 4 ? { argb: COLORS.statusFont } : undefined };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.statusLabelBg } };
    cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left' };
    cell.border = thinBorder();
  }
}

function styleObsRow(row: ExcelJS.Row, sheet: ExcelJS.Worksheet, rowNumber: number) {
  sheet.mergeCells(rowNumber, 2, rowNumber, TOTAL_COLS);
  const label = row.getCell(1);
  const value = row.getCell(2);

  label.font = { bold: true, size: 10, color: { argb: COLORS.statusFont } };
  label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.obsLabelBg } };
  label.alignment = { vertical: 'top', horizontal: 'left' };
  label.border = thinBorder();

  value.font = { size: 10 };
  value.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.obsLabelBg } };
  value.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  value.border = thinBorder();

  row.height = Math.max(36, Math.ceil(String(value.value ?? '').length / 80) * 14);
}

function slugifySetor(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function applyColumnWidths(sheet: ExcelJS.Worksheet) {
  sheet.getColumn(1).width = 11;
  sheet.getColumn(2).width = 34;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 8;
  for (let d = 1; d <= MAX_DIAS; d++) {
    sheet.getColumn(DIA_START_COL + d - 1).width = 5.5;
  }
}

async function buildWorkbook(
  grade: GradeEscalaResponse,
  empresa?: string,
  gerente?: string,
  sheetName?: string
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Escala Hospital';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName || 'Escala', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, showGridLines: true }],
  });

  const rows = buildSheetRows(grade, empresa, gerente);
  let employeeIndex = 0;

  rows.forEach((sheetRow, idx) => {
    const rowNumber = idx + 1;
    const row = sheet.addRow(sheetRow.values);

    switch (sheetRow.kind) {
      case 'meta':
        styleMetaRow(row);
        break;
      case 'header':
        styleHeaderRow(row, grade.diasSemana);
        break;
      case 'group':
        styleGroupRow(row, sheet, rowNumber);
        break;
      case 'employee':
        if (sheetRow.funcionario) {
          styleEmployeeRow(row, sheetRow.funcionario, grade.dias, employeeIndex % 2 === 1);
          employeeIndex++;
        }
        break;
      case 'status':
        styleStatusRow(row);
        break;
      case 'obs':
        styleObsRow(row, sheet, rowNumber);
        break;
      default:
        break;
    }
  });

  applyColumnWidths(sheet);

  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };

  return workbook;
}

export async function exportEscalaExcel(
  competenciaId: number
): Promise<{ buffer: Buffer; filename: string } | null> {
  const grade = await getGradeEscala(competenciaId);
  if (!grade) return null;

  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
    with: { setor: true },
  });

  const sheetName = (comp?.setor?.nome ?? grade.competencia.setor)
    .replace(/[\\/*?:[\]]/g, '')
    .slice(0, 31);

  const workbook = await buildWorkbook(
    grade,
    comp?.setor?.empresa ?? undefined,
    comp?.setor?.gerente ?? undefined,
    sheetName || 'Escala'
  );

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `escala-${slugifySetor(grade.competencia.setor)}-${String(grade.competencia.mes).padStart(2, '0')}-${grade.competencia.ano}.xlsx`;

  return { buffer, filename };
}
