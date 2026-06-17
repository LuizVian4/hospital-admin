import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { and, eq } from 'drizzle-orm';
import type { FuncionarioComTurnos, GradeEscalaResponse, GrupoEscala, StatusEspecial, TipoEscala } from '@escala/shared';
import {
  getGruposPorTipoEscala,
  getPadraoEscala,
  mapFeriadosPorDia,
} from '@escala/shared';
import { db } from '../db';
import { competencias } from '../db/schema';
import { getGradeEscala, listSetoresPorTipoEscala } from './escala.service';

const DIA_START_COL = 8;
const FIXED_COLS = 7;
const FONT = 'Arial';

const MESES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const LEGEND = [
  { sigla1: 'SIGLAS', desc1: 'DESCRIÇÃO', sigla2: 'SIGLAS', desc2: 'DESCRIÇÃO' },
  { sigla1: 'MT', desc1: 'MANHÃ / TARDE', sigla2: 'SN', desc2: 'NOTURNO' },
  { sigla1: 'M', desc1: 'MANHÃ', sigla2: 'F', desc2: 'FOLGA' },
  { sigla1: 'T', desc1: 'TARDE', sigla2: 'FF', desc2: 'FÉRIAS' },
  { sigla1: 'HC', desc1: 'HORÁRIO COMERCIAL', sigla2: 'CH', desc2: 'CARGA HORÁRIA' },
  { sigla1: 'ADM', desc1: ' DATA DA ADMISSÃO', sigla2: 'MAT', desc2: 'MATRÍCULA' },
];

const STATUS_ORDEM: StatusEspecial[] = ['FÉRIAS', 'LICENÇA INSS', 'LICENÇA GESTACIONAL'];

const COLORS = {
  maroon: 'FF800000',
  escalaGray: 'FF666666',
  headerGray: 'FF808080',
  groupGray: 'FF999999',
  weekendFill: 'FFCCCCCC',
  white: 'FFFFFFFF',
  black: 'FF000000',
};

function totalCols(maxDias: number): number {
  return FIXED_COLS + maxDias;
}

function maxDiasNaGrade(grade: GradeEscalaResponse): number {
  return grade.dias.length > 0 ? grade.dias.length : grade.diasSemana.length;
}

function hairBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'hair', color: { argb: COLORS.black } };
  return { top: side, left: side, bottom: side, right: side };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb: COLORS.black } };
  return { top: side, left: side, bottom: side, right: side };
}

function solidFill(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function styleCell(
  cell: ExcelJS.Cell,
  opts: {
    fill?: string;
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    h?: ExcelJS.Alignment['horizontal'];
    v?: ExcelJS.Alignment['vertical'];
    wrap?: boolean;
    border?: Partial<ExcelJS.Borders>;
  }
) {
  if (opts.fill) solidFill(cell, opts.fill);
  cell.font = {
    name: FONT,
    bold: opts.bold,
    italic: opts.italic,
    size: opts.size ?? 11,
    color: { argb: opts.color ?? COLORS.black },
  };
  cell.alignment = {
    horizontal: opts.h ?? 'center',
    vertical: opts.v ?? 'middle',
    wrapText: opts.wrap ?? false,
  };
  if (opts.border) cell.border = opts.border;
}

function parseDateBr(iso?: string): Date | string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d);
}

function getTurnoValue(func: FuncionarioComTurnos, dia: number): string {
  const saved = func.turnos[dia];
  const projected = func.turnosProjetados?.[dia];
  return saved ?? projected ?? '';
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

function organizarPorGrupoEscala(funcionarios: FuncionarioComTurnos[], gruposEscala: GrupoEscala[]) {
  const porGrupo = new Map<number, FuncionarioComTurnos[]>(
    gruposEscala.map((g) => [g.indicePadrao, []])
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

function isColunaCinza(
  dia: number,
  diasSemana: string[],
  feriadosPorDia: Record<number, string>
): boolean {
  const dow = diasSemana[dia - 1];
  return dow === 'SAB' || dow === 'DOM' || Boolean(feriadosPorDia[dia]);
}

function slugifySetor(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function buildEscalaExportFilename(
  setor: string,
  mes: number,
  ano: number,
  tipoEscala: TipoEscala,
  ext: 'pdf' | 'xlsx'
): string {
  return `escala_${slugifySetor(setor)}_${String(mes).padStart(2, '0')}_${ano}_${tipoEscala}.${ext}`;
}

function buildEscalaMesCompletoFilename(mes: number, ano: number, tipoEscala: TipoEscala): string {
  return `escala_completa_${String(mes).padStart(2, '0')}_${ano}_${tipoEscala}.xlsx`;
}

function sanitizeSheetName(nome: string): string {
  return nome.replace(/[\\/*?:[\]]/g, '').slice(0, 31);
}

function uniqueSheetName(base: string, used: Set<string>): string {
  let name = sanitizeSheetName(base) || 'Escala';
  if (!used.has(name)) {
    used.add(name);
    return name;
  }

  for (let i = 2; i < 100; i++) {
    const suffix = ` (${i})`;
    const candidate = `${sanitizeSheetName(base).slice(0, 31 - suffix.length)}${suffix}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  const fallback = `Escala ${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

function applyColumnWidths(sheet: ExcelJS.Worksheet, maxDias: number) {
  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 47;
  sheet.getColumn(3).width = 10.75;
  sheet.getColumn(4).width = 27.63;
  sheet.getColumn(5).width = 13.25;
  sheet.getColumn(6).width = 12.5;
  sheet.getColumn(7).width = 7.63;
  for (let d = 1; d <= maxDias; d++) {
    sheet.getColumn(DIA_START_COL + d - 1).width = 6.13;
  }
}

function buildLegendBlock(sheet: ExcelJS.Worksheet) {
  sheet.mergeCells(1, 1, 7, 2);

  for (let i = 0; i < LEGEND.length; i++) {
    const rowNum = i + 1;
    const row = sheet.getRow(rowNum);
    row.height = 23.25;
    const item = LEGEND[i];

    const isTitle = i === 0;
    const cells = [
      { col: 3, val: item.sigla1 },
      { col: 4, val: item.desc1 },
      { col: 5, val: item.sigla2 },
      { col: 6, val: item.desc2 },
    ];

    for (const { col, val } of cells) {
      const cell = row.getCell(col);
      cell.value = val;
      styleCell(cell, {
        fill: isTitle ? COLORS.maroon : COLORS.white,
        bold: true,
        size: 12,
        color: isTitle ? COLORS.white : COLORS.black,
        border: hairBorder(),
      });
    }
  }

  const row7 = sheet.getRow(7);
  row7.getCell(1).border = {
    left: { style: 'hair', color: { argb: COLORS.black } },
    bottom: { style: 'hair', color: { argb: COLORS.black } },
  };
  row7.getCell(2).border = {
    bottom: { style: 'hair', color: { argb: COLORS.black } },
  };
}

function buildMetaBlock(
  sheet: ExcelJS.Worksheet,
  opts: { empresa?: string; gerente?: string; setor: string; mes: number; ano: number },
  cols: number
) {
  const mesNome = MESES[opts.mes - 1] ?? String(opts.mes);
  const metaValueEnd = Math.min(cols, 30);

  sheet.mergeCells(3, 7, 3, 9);
  sheet.mergeCells(3, 10, 3, 15);
  sheet.mergeCells(3, 17, 3, 20);
  sheet.mergeCells(3, 21, 3, metaValueEnd);

  sheet.mergeCells(5, 7, 6, 11);
  sheet.mergeCells(5, 12, 5, 15);
  sheet.mergeCells(6, 12, 6, 15);
  sheet.mergeCells(5, 17, 6, 20);
  sheet.mergeCells(5, 21, 6, metaValueEnd);

  const metaFields: Array<{
    row: number;
    labelCol: number;
    valueCol: number;
    label: string;
    value: string;
    valueSize?: number;
  }> = [
    { row: 3, labelCol: 7, valueCol: 10, label: 'EMPRESA', value: opts.empresa ?? '', valueSize: 10 },
    { row: 3, labelCol: 17, valueCol: 21, label: 'GERENTE', value: opts.gerente ?? '' },
    { row: 5, labelCol: 7, valueCol: 12, label: 'COMPETÊNCIA', value: mesNome },
    { row: 5, labelCol: 17, valueCol: 21, label: 'SETOR', value: opts.setor },
  ];

  for (const field of metaFields) {
    const labelCell = sheet.getRow(field.row).getCell(field.labelCol);
    labelCell.value = field.label;
    styleCell(labelCell, {
      fill: COLORS.maroon,
      bold: true,
      size: 12,
      color: COLORS.white,
      border: hairBorder(),
    });

    const valueCell = sheet.getRow(field.row).getCell(field.valueCol);
    valueCell.value = field.value;
    styleCell(valueCell, {
      fill: COLORS.white,
      bold: true,
      size: field.valueSize ?? 12,
      border: hairBorder(),
    });
  }

  const yearCell = sheet.getRow(6).getCell(12);
  yearCell.value = String(opts.ano);
  styleCell(yearCell, {
    fill: COLORS.white,
    bold: true,
    size: 12,
    border: hairBorder(),
  });
}

function buildEscalaHeaderRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  maxDias: number,
  cols: number
) {
  sheet.mergeCells(rowNum, 1, rowNum, FIXED_COLS);
  const escalaCell = sheet.getRow(rowNum).getCell(1);
  escalaCell.value = 'ESCALA     ';
  styleCell(escalaCell, {
    fill: COLORS.escalaGray,
    bold: true,
    size: 12,
    color: COLORS.white,
    border: hairBorder(),
  });

  const row = sheet.getRow(rowNum);
  row.height = 14.25;

  for (let d = 1; d <= maxDias; d++) {
    const cell = row.getCell(DIA_START_COL + d - 1);
    cell.value = d;
    styleCell(cell, {
      fill: COLORS.maroon,
      bold: true,
      size: 12,
      color: COLORS.white,
      border: hairBorder(),
    });
  }

  for (let c = FIXED_COLS + 1; c <= cols; c++) {
    if (c >= DIA_START_COL + maxDias) {
      const cell = row.getCell(c);
      styleCell(cell, { border: hairBorder() });
    }
  }
}

function buildColumnHeaderRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  diasSemana: string[],
  maxDias: number
) {
  const row = sheet.getRow(rowNum);
  row.height = 18.75;

  const fixedHeaders = [
    'MAT',
    'NOME COMPLETO',
    'COREN',
    'CATEGORIA PROFISSIONAL',
    'CONTRATO',
    'ADM',
    'CH',
  ];

  for (let col = 1; col <= FIXED_COLS; col++) {
    const cell = row.getCell(col);
    cell.value = fixedHeaders[col - 1];
    styleCell(cell, {
      fill: COLORS.headerGray,
      bold: true,
      size: 10,
      border: col >= 6 ? hairBorder() : undefined,
    });
  }

  for (let d = 1; d <= maxDias; d++) {
    const cell = row.getCell(DIA_START_COL + d - 1);
    cell.value = diasSemana[d - 1] ?? '';
    styleCell(cell, {
      fill: COLORS.headerGray,
      bold: true,
      size: 10,
      border: thinBorder(),
    });
  }
}

function writeEmployeeRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  func: FuncionarioComTurnos,
  dias: number[],
  maxDias: number,
  diasSemana: string[],
  feriadosPorDia: Record<number, string>
) {
  const row = sheet.getRow(rowNum);
  row.height = 18;

  const fixedValues: (string | number | Date)[] = [
    func.matricula,
    func.nome,
    func.coren ?? '',
    func.categoria,
    func.tipoContrato,
    parseDateBr(func.dataAdmissao),
    func.cargaHoraria,
  ];

  for (let col = 1; col <= FIXED_COLS; col++) {
    const cell = row.getCell(col);
    cell.value = fixedValues[col - 1];
    styleCell(cell, {
      bold: true,
      size: 11,
      border: col <= 6 ? hairBorder() : undefined,
    });
  }

  for (let d = 1; d <= maxDias; d++) {
    const cell = row.getCell(DIA_START_COL + d - 1);
    if (!dias.includes(d)) {
      styleCell(cell, { border: hairBorder() });
      continue;
    }

    const turno = getTurnoValue(func, d);
    cell.value = turno;
    const cinza = isColunaCinza(d, diasSemana, feriadosPorDia);
    styleCell(cell, {
      fill: cinza ? COLORS.weekendFill : COLORS.white,
      bold: true,
      size: 11,
      border: hairBorder(),
    });
  }
}

function writeGroupSeparator(sheet: ExcelJS.Worksheet, rowNum: number, cols: number) {
  sheet.mergeCells(rowNum, 1, rowNum, cols);
  const cell = sheet.getRow(rowNum).getCell(1);
  cell.value = '';
  styleCell(cell, { fill: COLORS.groupGray, size: 11 });
  sheet.getRow(rowNum).height = 18;
}

function writeStatusSection(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  status: StatusEspecial,
  items: GradeEscalaResponse['statusEspeciais'],
  cols: number
): number {
  let rowNum = startRow;
  const fixedHeaders = [
    'MAT',
    'NOME COMPLETO',
    'COREN',
    'CATEGORIA PROFISSIONAL',
    'CONTRATO',
    'ADM',
    'CH',
  ];

  sheet.mergeCells(rowNum, DIA_START_COL, rowNum, cols);
  const headerRow = sheet.getRow(rowNum);
  headerRow.height = 18;
  for (let col = 1; col <= FIXED_COLS; col++) {
    const cell = headerRow.getCell(col);
    cell.value = fixedHeaders[col - 1];
    styleCell(cell, { fill: COLORS.weekendFill, bold: true, size: 10, border: hairBorder() });
  }
  solidFill(headerRow.getCell(DIA_START_COL), COLORS.headerGray);
  rowNum++;

  const statusFill = status === 'FÉRIAS' ? COLORS.white : COLORS.weekendFill;

  for (const item of items) {
    sheet.mergeCells(rowNum, DIA_START_COL, rowNum, cols);
    const row = sheet.getRow(rowNum);
    row.height = 18;
    const f = item.funcionario;

    const fixedValues: (string | number | Date)[] = [
      f.matricula,
      f.nome,
      f.coren ?? '',
      f.categoria,
      f.tipoContrato,
      parseDateBr(f.dataAdmissao),
      f.cargaHoraria,
    ];

    for (let col = 1; col <= FIXED_COLS; col++) {
      const cell = row.getCell(col);
      cell.value = fixedValues[col - 1];
      styleCell(cell, { bold: true, size: 11, border: hairBorder() });
    }

    const statusCell = row.getCell(DIA_START_COL);
    statusCell.value = status;
    styleCell(statusCell, { fill: statusFill, bold: true, size: 11, border: hairBorder() });
    rowNum++;
  }

  return rowNum;
}

function writeObservacoes(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  observacoes: string,
  cols: number
): number {
  sheet.mergeCells(rowNum, 1, rowNum, FIXED_COLS);
  sheet.mergeCells(rowNum, DIA_START_COL, rowNum + 2, cols);

  const labelCell = sheet.getRow(rowNum).getCell(1);
  labelCell.value = 'OBSERVAÇÕES';
  styleCell(labelCell, {
    fill: COLORS.maroon,
    bold: true,
    size: 11,
    color: COLORS.white,
    h: 'center',
  });

  for (let offset = 0; offset < 3; offset++) {
    sheet.getRow(rowNum + offset).height = 18;
    if (offset > 0) {
      sheet.mergeCells(rowNum + offset, 1, rowNum + offset, FIXED_COLS);
    }
  }

  const valueCell = sheet.getRow(rowNum).getCell(DIA_START_COL);
  valueCell.value = observacoes;
  styleCell(valueCell, {
    bold: true,
    size: 11,
    h: 'left',
    v: 'top',
    wrap: true,
  });

  return rowNum + 3;
}

function getLogoBuffer(): Buffer | null {
  const candidates = [
    path.join(__dirname, '../assets/escala-logo.png'),
    path.join(__dirname, '../../src/assets/escala-logo.png'),
    path.join(process.cwd(), 'src/assets/escala-logo.png'),
    path.join(process.cwd(), 'packages/backend/src/assets/escala-logo.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate);
  }
  return null;
}

function addLogo(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet) {
  const logo = getLogoBuffer();
  if (!logo) return;
  const imageId = workbook.addImage({
    buffer: logo as unknown as ExcelJS.Buffer,
    extension: 'png',
  });
  sheet.addImage(imageId, {
    tl: { col: 0.08, row: 0.12 },
    ext: { width: 235, height: 78 },
  });
}

function addEscalaSheet(
  workbook: ExcelJS.Workbook,
  grade: GradeEscalaResponse,
  gruposEscala: GrupoEscala[],
  empresa?: string,
  gerente?: string,
  sheetName?: string
) {
  const maxDias = maxDiasNaGrade(grade);
  const cols = totalCols(maxDias);
  const feriadosPorDia = mapFeriadosPorDia(grade.competencia.mes, grade.competencia.ano);

  const sheet = workbook.addWorksheet(sheetName || 'Escala', {
    views: [{ state: 'frozen', xSplit: FIXED_COLS, ySplit: 9, showGridLines: true }],
  });

  buildLegendBlock(sheet);
  buildMetaBlock(sheet, {
    empresa,
    gerente,
    setor: grade.competencia.setor,
    mes: grade.competencia.mes,
    ano: grade.competencia.ano,
  }, cols);

  buildEscalaHeaderRow(sheet, 8, maxDias, cols);
  buildColumnHeaderRow(sheet, 9, grade.diasSemana, maxDias);
  addLogo(workbook, sheet);

  let rowNum = 10;
  const statusFuncIds = new Set(grade.statusEspeciais.map((se) => se.funcionario.id));
  const funcionarios = listarFuncionarios(grade.grupos).filter((f) => !statusFuncIds.has(f.id));
  const { porGrupo, semAtribuicao, semPadrao } = organizarPorGrupoEscala(funcionarios, gruposEscala);

  const writeGroup = (lista: FuncionarioComTurnos[]) => {
    for (const func of lista) {
      writeEmployeeRow(
        sheet,
        rowNum,
        func,
        grade.dias,
        maxDias,
        grade.diasSemana,
        feriadosPorDia
      );
      rowNum++;
    }
  };

  let firstGroup = true;
  for (const grupo of gruposEscala) {
    const lista = porGrupo.get(grupo.indicePadrao) ?? [];
    if (lista.length === 0) continue;
    if (!firstGroup) {
      writeGroupSeparator(sheet, rowNum, cols);
      rowNum++;
    }
    writeGroup(lista);
    firstGroup = false;
  }

  if (semAtribuicao.length > 0) {
    if (!firstGroup) {
      writeGroupSeparator(sheet, rowNum, cols);
      rowNum++;
    }
    writeGroup(semAtribuicao);
    firstGroup = false;
  }

  if (semPadrao.length > 0) {
    if (!firstGroup) {
      writeGroupSeparator(sheet, rowNum, cols);
      rowNum++;
    }
    writeGroup(semPadrao);
  }

  if (grade.statusEspeciais.length > 0) {
    rowNum++;
    const porStatus = new Map<StatusEspecial, GradeEscalaResponse['statusEspeciais']>();
    for (const status of STATUS_ORDEM) porStatus.set(status, []);
    for (const item of grade.statusEspeciais) {
      const lista = porStatus.get(item.status);
      if (lista) lista.push(item);
    }

    for (const status of STATUS_ORDEM) {
      const lista = porStatus.get(status) ?? [];
      if (lista.length === 0) continue;
      rowNum = writeStatusSection(sheet, rowNum, status, lista, cols);
    }
  }

  if (grade.observacoes) {
    writeObservacoes(sheet, rowNum, grade.observacoes, cols);
  }

  applyColumnWidths(sheet, maxDias);

  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: false,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: {
      left: 0.69,
      right: 0.37,
      top: 0.59,
      bottom: 0.12,
      header: 0,
      footer: 0,
    },
    showGridLines: false,
  };
}

async function buildWorkbook(
  grade: GradeEscalaResponse,
  gruposEscala: GrupoEscala[],
  empresa?: string,
  gerente?: string,
  sheetName?: string
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Escala Hospital';
  workbook.created = new Date();
  addEscalaSheet(workbook, grade, gruposEscala, empresa, gerente, sheetName);
  return workbook;
}

export async function exportEscalaExcel(
  competenciaId: number,
  tipoEscala: TipoEscala = 'tecnico'
): Promise<{ buffer: Buffer; filename: string } | null> {
  const grade = await getGradeEscala(competenciaId, tipoEscala);
  if (!grade) return null;

  const gruposEscala = getGruposPorTipoEscala(tipoEscala);

  const comp = await db.query.competencias.findFirst({
    where: eq(competencias.id, competenciaId),
    with: { setor: true },
  });

  const sheetName = (comp?.setor?.nome ?? grade.competencia.setor)
    .replace(/[\\/*?:[\]]/g, '')
    .slice(0, 31);

  const workbook = await buildWorkbook(
    grade,
    gruposEscala,
    comp?.setor?.empresa ?? undefined,
    comp?.setor?.gerente ?? undefined,
    sheetName || 'Escala'
  );

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = buildEscalaExportFilename(
    grade.competencia.setor,
    grade.competencia.mes,
    grade.competencia.ano,
    tipoEscala,
    'xlsx'
  );

  return { buffer, filename };
}

export async function exportEscalaMesCompletoExcel(
  empresaId: string,
  mes: number,
  ano: number,
  tipoEscala: TipoEscala = 'tecnico'
): Promise<{ buffer: Buffer; filename: string } | null> {
  const setores = await listSetoresPorTipoEscala(tipoEscala, empresaId);
  const gruposEscala = getGruposPorTipoEscala(tipoEscala);

  const comps = await db.query.competencias.findMany({
    where: and(
      eq(competencias.mes, mes),
      eq(competencias.ano, ano),
      eq(competencias.tipo, tipoEscala),
      eq(competencias.empresaId, empresaId)
    ),
    with: { setor: true },
  });
  const compBySetorId = new Map(comps.map((c) => [c.setorId, c]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Escala Hospital';
  workbook.created = new Date();
  const usedSheetNames = new Set<string>();
  let sheetsAdded = 0;

  for (const setor of setores) {
    const comp = compBySetorId.get(setor.id);
    if (!comp) continue;

    const grade = await getGradeEscala(comp.id, tipoEscala);
    if (!grade) continue;

    addEscalaSheet(
      workbook,
      grade,
      gruposEscala,
      setor.empresa ?? undefined,
      setor.gerente ?? undefined,
      uniqueSheetName(setor.nome, usedSheetNames)
    );
    sheetsAdded++;
  }

  if (sheetsAdded === 0) return null;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = buildEscalaMesCompletoFilename(mes, ano, tipoEscala);

  return { buffer, filename };
}
