import ExcelJS from 'exceljs';
import { PADRAO_ENFERMEIRO, PADRAO_TEC_ENFERMAGEM } from '@escala/shared';
import { getDiasNoMes } from '../utils/helpers';

const FONT = 'Arial';

const COLORS = {
  brandDark: 'FF1A2B4C',
  brandMint: 'FF00E5A3',
  brandLight: 'FFF4F6F9',
  headerGray: 'FF4A5568',
  white: 'FFFFFFFF',
  black: 'FF000000',
  muted: 'FF64748B',
  zebra: 'FFF8FAFC',
  refBg: 'FFE8FBF4',
  turnoMt: 'FFDBEAFE',
  turnoSn: 'FFF3E8FF',
  turnoF: 'FFF3F4F6',
  turnoPlantao: 'FFFFFFFF',
};

function hairBorder(color = COLORS.black): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'hair', color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

function thinBorder(color = COLORS.black): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: 'thin', color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
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
  if (opts.fill) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
  }
  cell.font = {
    name: FONT,
    bold: opts.bold,
    italic: opts.italic,
    size: opts.size ?? 11,
    color: { argb: opts.color ?? COLORS.black },
  };
  cell.alignment = {
    horizontal: opts.h ?? 'left',
    vertical: opts.v ?? 'middle',
    wrapText: opts.wrap ?? false,
  };
  if (opts.border) cell.border = opts.border;
}

function styleLabelValueRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  label: string,
  value: string,
  valueCols = 2
) {
  const row = sheet.getRow(rowNum);
  row.height = 22;

  const labelCell = row.getCell(1);
  labelCell.value = label;
  styleCell(labelCell, {
    fill: COLORS.brandDark,
    bold: true,
    size: 10,
    color: COLORS.white,
    h: 'center',
    border: thinBorder(),
  });

  if (valueCols > 1) {
    sheet.mergeCells(rowNum, 2, rowNum, valueCols);
  }
  const valueCell = row.getCell(2);
  valueCell.value = value;
  styleCell(valueCell, {
    fill: COLORS.white,
    size: 10,
    border: thinBorder(),
  });
}

function turnoFill(turno: string): string {
  switch (turno) {
    case 'MT':
      return COLORS.turnoMt;
    case 'SN':
      return COLORS.turnoSn;
    case 'F':
      return COLORS.turnoF;
    default:
      return COLORS.white;
  }
}

async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildEquipeTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Escala360';
  const sheet = workbook.addWorksheet('EQUIPE', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  sheet.mergeCells(1, 1, 1, 8);
  const titleCell = sheet.getRow(1).getCell(1);
  titleCell.value = 'Escala360 — Importação de Equipe';
  styleCell(titleCell, {
    fill: COLORS.brandDark,
    bold: true,
    size: 14,
    color: COLORS.white,
    h: 'center',
  });
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, 8);
  const subtitleCell = sheet.getRow(2).getCell(1);
  subtitleCell.value =
    'Preencha uma linha por funcionário. Substitua os exemplos abaixo pelos dados reais da sua equipe.';
  styleCell(subtitleCell, {
    fill: COLORS.brandLight,
    italic: true,
    size: 10,
    color: COLORS.muted,
    h: 'center',
    wrap: true,
  });
  sheet.getRow(2).height = 24;

  const headers = ['MAT', 'NOME', 'COREN', 'CAT', 'CTRT', 'ADM', 'CH', 'SETOR'];
  const examples = [
    ['1170278', 'MARIA SILVA SANTOS', '1897232', 'TÉCNICO DE ENFERMAGEM', 'EFETIVO', '2020-03-15', '180H', '5º ANDAR'],
    ['1185001', 'JOÃO PEREIRA LIMA', '', 'ENFERMEIRO', 'EFETIVO', '2022-06-01', '180H', '5º ANDAR'],
    ['1190002', 'ANA COSTA OLIVEIRA', '5551234', 'TÉCNICO DE ENFERMAGEM', 'PROVISÓRIO', '2024-01-10', '144H', '6º ANDAR'],
  ];

  const headerRowNum = 4;
  const headerRow = sheet.getRow(headerRowNum);
  headerRow.height = 22;
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    styleCell(cell, {
      fill: COLORS.headerGray,
      bold: true,
      size: 10,
      color: COLORS.white,
      h: 'center',
      border: thinBorder(COLORS.brandDark),
    });
  });

  examples.forEach((example, rowOffset) => {
    const rowNum = headerRowNum + 1 + rowOffset;
    const row = sheet.getRow(rowNum);
    row.height = 20;
    const fill = rowOffset % 2 === 0 ? COLORS.white : COLORS.zebra;

    example.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      styleCell(cell, {
        fill,
        size: 10,
        border: hairBorder(),
      });
      if (colIndex === 5 && value) {
        cell.numFmt = 'dd/mm/yyyy';
        const [y, m, d] = String(value).split('-').map(Number);
        if (y && m && d) cell.value = new Date(y, m - 1, d);
      }
    });
  });

  sheet.mergeCells(8, 1, 8, 8);
  const hintCell = sheet.getRow(8).getCell(1);
  hintCell.value = 'CAT aceita: TÉCNICO DE ENFERMAGEM ou ENFERMEIRO · CH: 180H ou 144H';
  styleCell(hintCell, {
    fill: COLORS.refBg,
    italic: true,
    size: 9,
    color: COLORS.muted,
    h: 'center',
  });
  sheet.getRow(8).height = 20;

  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 34;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 24;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 8;
  sheet.getColumn(8).width = 14;

  return workbookToBuffer(workbook);
}

export async function buildEscalaTemplateBuffer(): Promise<Buffer> {
  const mes = 6;
  const ano = 2026;
  const totalDias = getDiasNoMes(mes, ano);
  const diaHeaders = Array.from({ length: totalDias }, (_, i) => String(i + 1));
  const turnosExemplo = ['MT', 'F', 'SN', '/', 'F', 'MT', 'SN'];
  const padraoTecnico = PADRAO_TEC_ENFERMAGEM.join(' → ');
  const padraoEnfermeiro = PADRAO_ENFERMEIRO.join(' → ');
  const legendaSiglas =
    'MT = Manhã/Tarde  ·  SN = Noturno  ·  F = Folga  ·  / = Plantão  ·  FF = Férias  ·  LG = Lic. gestacional  ·  INSS = Lic. INSS';
  const totalCols = 7 + totalDias;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Escala360';
  const sheet = workbook.addWorksheet('5_ANDAR');

  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getRow(1).getCell(1);
  titleCell.value = 'Escala360 — Importação de Escala Mensal';
  styleCell(titleCell, {
    fill: COLORS.brandDark,
    bold: true,
    size: 14,
    color: COLORS.white,
    h: 'center',
  });
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, totalCols);
  const subtitleCell = sheet.getRow(2).getCell(1);
  subtitleCell.value =
    'Uma aba por setor. Informe os turnos de cada dia (1–31) e substitua os exemplos pelos dados reais.';
  styleCell(subtitleCell, {
    fill: COLORS.brandLight,
    italic: true,
    size: 10,
    color: COLORS.muted,
    h: 'center',
    wrap: true,
  });
  sheet.getRow(2).height = 24;

  styleLabelValueRow(sheet, 4, 'EMPRESA', 'Empresa Demo', Math.min(10, totalCols));
  styleLabelValueRow(sheet, 5, 'GERENTE', 'Nome do Gerente', Math.min(10, totalCols));
  styleLabelValueRow(sheet, 6, 'SETOR', '5º ANDAR', Math.min(10, totalCols));
  styleLabelValueRow(sheet, 7, 'COMPETÊNCIA', `${mes}/${ano}`, Math.min(10, totalCols));

  const headerRowNum = 9;
  const fixedHeaders = ['MAT', 'NOME', 'COREN', 'CAT', 'CTRT', 'ADM', 'CH'];
  const headerRow = sheet.getRow(headerRowNum);
  headerRow.height = 22;

  fixedHeaders.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    styleCell(cell, {
      fill: COLORS.headerGray,
      bold: true,
      size: 9,
      color: COLORS.white,
      h: 'center',
      border: thinBorder(COLORS.brandDark),
    });
  });

  diaHeaders.forEach((dia, index) => {
    const cell = headerRow.getCell(8 + index);
    cell.value = dia;
    styleCell(cell, {
      fill: COLORS.brandDark,
      bold: true,
      size: 9,
      color: COLORS.white,
      h: 'center',
      border: thinBorder(),
    });
  });

  const examples = [
    {
      matricula: '1170278',
      nome: 'MARIA SILVA SANTOS',
      coren: '1897232',
      categoria: 'TÉCNICO DE ENFERMAGEM',
      contrato: 'EFETIVO',
      adm: '2020-03-15',
      ch: '180H',
      offset: 0,
    },
    {
      matricula: '1185001',
      nome: 'JOÃO PEREIRA LIMA',
      coren: '',
      categoria: 'ENFERMEIRO',
      contrato: 'EFETIVO',
      adm: '2022-06-01',
      ch: '180H',
      offset: 2,
    },
  ];

  examples.forEach((example, rowOffset) => {
    const rowNum = headerRowNum + 1 + rowOffset;
    const row = sheet.getRow(rowNum);
    row.height = 20;
    const baseFill = rowOffset % 2 === 0 ? COLORS.white : COLORS.zebra;

    const fixedValues = [
      example.matricula,
      example.nome,
      example.coren,
      example.categoria,
      example.contrato,
      example.adm,
      example.ch,
    ];

    fixedValues.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      styleCell(cell, {
        fill: baseFill,
        size: 9,
        border: hairBorder(),
      });
      if (colIndex === 5 && value) {
        cell.numFmt = 'dd/mm/yyyy';
        const [y, m, d] = String(value).split('-').map(Number);
        if (y && m && d) cell.value = new Date(y, m - 1, d);
      }
    });

    for (let d = 0; d < totalDias; d++) {
      const turno = turnosExemplo[(d + example.offset) % turnosExemplo.length];
      const cell = row.getCell(8 + d);
      cell.value = turno;
      styleCell(cell, {
        fill: turnoFill(turno),
        bold: true,
        size: 9,
        h: 'center',
        border: hairBorder(),
      });
    }
  });

  const obsRowNum = headerRowNum + examples.length + 2;
  styleLabelValueRow(sheet, obsRowNum, 'OBSERVAÇÕES', 'Anotações gerais da competência (opcional)', totalCols);

  const refRows: Array<[string, string]> = [
    ['PADRÃO — TÉCNICO DE ENFERMAGEM', padraoTecnico],
    ['PADRÃO — ENFERMEIRO', padraoEnfermeiro],
    ['SIGLAS DE TURNO', legendaSiglas],
  ];

  refRows.forEach(([label, value], index) => {
    const rowNum = obsRowNum + 1 + index;
    const row = sheet.getRow(rowNum);
    row.height = index === refRows.length - 1 ? 28 : 22;

    const labelCell = row.getCell(1);
    labelCell.value = label;
    styleCell(labelCell, {
      fill: COLORS.brandMint,
      bold: true,
      size: 9,
      color: COLORS.brandDark,
      h: 'center',
      border: thinBorder(),
    });

    sheet.mergeCells(rowNum, 2, rowNum, totalCols);
    const valueCell = row.getCell(2);
    valueCell.value = value;
    styleCell(valueCell, {
      fill: COLORS.refBg,
      size: 9,
      color: COLORS.brandDark,
      wrap: true,
      border: thinBorder(),
    });
  });

  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 10;
  sheet.getColumn(4).width = 22;
  sheet.getColumn(5).width = 11;
  sheet.getColumn(6).width = 11;
  sheet.getColumn(7).width = 7;
  for (let d = 1; d <= totalDias; d++) {
    sheet.getColumn(7 + d).width = 4.5;
  }

  sheet.views = [{ state: 'frozen', ySplit: headerRowNum, xSplit: 2 }];

  return workbookToBuffer(workbook);
}
