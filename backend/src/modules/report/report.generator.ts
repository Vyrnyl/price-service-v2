import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { CreateReportInput, ReportFormat, ReportTypeEnum } from './report.schema';
import {
  buildReportSummary,
  resolveSrpAt,
  type ReportSummary,
  type SrpLookupEntry,
} from './report.summary';
import { resolveReportRecordScope } from './report.scope';
import type { AuthUser } from '../../shared/types/express';

export type ReportGeneratorPayload = CreateReportInput;

type ReportRecord = Prisma.PriceRecordGetPayload<{
  include: { commodity: true; store: true; user: true };
}>;

/** One flattened, display-ready row. Both renderers consume this, never the ORM shape. */
interface ReportRow {
  date: string;
  time: string;
  store: string;
  location: string;
  commodity: string;
  category: string;
  price: number;
  srp: number | null;
  variance: number | null;
  status: string;
  officer: string;
}

const REPORT_TYPE_LABELS: Record<ReportTypeEnum, string> = {
  MONTHLY: 'Monthly Price Monitoring Report',
  SRP_COMPLIANCE: 'SRP Compliance Report',
  TREND: 'Price Trend Report',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLIANT: 'Compliant',
  OVERPRICE: 'Above SRP',
  UNDERPRICE: 'Below SRP',
};

const TIME_ZONE = 'Asia/Manila';

// Material 3 primary/status colours, matching the app's own tokens so a printed
// report and the screen it came from read as one system.
const COLORS = {
  brand: '#00695C',
  brandDark: '#004D40',
  headerText: '#FFFFFF',
  bodyText: '#1F2933',
  mutedText: '#5F6B7A',
  rule: '#D8DEE6',
  zebra: '#F4F7F9',
  compliant: '#1B7F4B',
  overprice: '#B3261E',
  underprice: '#8A6100',
};

function parsePeriod(period: string) {
  const [start, end] = period.split(' to ').map((value) => value.trim());
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid report period format. Use YYYY-MM-DD to YYYY-MM-DD.');
  }

  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
}

function mapCommodityGroupFilter(group?: string): Prisma.PriceRecordWhereInput | undefined {
  if (!group || group === 'ALL') {
    return undefined;
  }

  return {
    commodity: {
      is: {
        category: {
          equals: group,
          mode: 'insensitive',
        },
      },
    },
  } as Prisma.PriceRecordWhereInput;
}

function mapStoreFilter(storeId?: string): Prisma.PriceRecordWhereInput | undefined {
  if (!storeId) {
    return undefined;
  }

  return { storeId } as Prisma.PriceRecordWhereInput;
}

async function loadReportRecords(
  period: string,
  commodityGroup?: string,
  storeId?: string,
  authUser?: AuthUser,
) {
  const { startDate, endDate } = parsePeriod(period);

  return prisma.priceRecord.findMany({
    where: {
      dateAndTime: {
        gte: startDate,
        lte: endDate,
      },
      ...mapCommodityGroupFilter(commodityGroup),
      ...mapStoreFilter(storeId),
      ...resolveReportRecordScope(authUser),
    },
    include: {
      commodity: true,
      store: true,
      user: true,
    },
    orderBy: { dateAndTime: 'asc' },
  });
}

/**
 * `PriceRecord` stores no SRP of its own, so the comparison column has to come
 * from the `SRP` table — the entry in effect for that commodity on the date the
 * price was recorded. Loaded once for the commodities in range rather than
 * per-row, then resolved in memory.
 */
async function loadSrpLookup(commodityIds: string[]): Promise<SrpLookupEntry[]> {
  if (commodityIds.length === 0) {
    return [];
  }

  const srps = await prisma.sRP.findMany({
    where: { commodityId: { in: commodityIds } },
    select: { commodityId: true, price: true, effectiveDate: true },
    orderBy: { effectiveDate: 'desc' },
  });

  return srps.map((srp) => ({
    commodityId: srp.commodityId,
    price: Number(srp.price),
    effectiveDate: srp.effectiveDate,
  }));
}

function buildReportFilename(type: ReportTypeEnum, format: ReportFormat) {
  const ext = format === 'PDF' ? 'pdf' : 'xlsx';
  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', '_')
    .replace(/:/g, '');

  return `presyoserbisyo_${type.toLowerCase()}_${stamp}.${ext}`;
}

function contentTypeForFormat(format: ReportFormat) {
  return format === 'PDF'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

const numberFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Amounts are rendered as bare numbers with the currency named in the column
 * header. PDFKit's built-in Helvetica is WinAnsi-encoded and has no glyph for
 * U+20B1 — it silently substitutes byte 0xB1, so a literal "₱" prints as "±".
 * The header carries the unit instead, which is also cleaner than repeating a
 * symbol on every row. Excel has no such limit and uses a real ₱ number format.
 */
function formatAmount(value: number | null) {
  return value == null ? '—' : numberFormatter.format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function formatTimestamp(value: Date) {
  return `${formatDate(value)} ${formatTime(value)} (PHT)`;
}

function buildReportRows(records: ReportRecord[], srps: SrpLookupEntry[]): ReportRow[] {
  return records.map((record) => {
    const price = Number(record.price);
    const srp = resolveSrpAt(srps, record.commodityId, record.dateAndTime);

    return {
      date: formatDate(record.dateAndTime),
      time: formatTime(record.dateAndTime),
      store: record.store?.name ?? 'Unknown store',
      location: record.store?.location ?? 'Unknown location',
      commodity: record.commodity?.name ?? 'Unknown commodity',
      category: record.commodity?.category ?? 'Uncategorised',
      price,
      srp,
      // Rounded so the cell holds 0.77 rather than 0.7700000000000031 — the
      // number format would hide it, but the underlying value is what a
      // recipient sums and charts.
      variance: srp == null ? null : Math.round((price - srp) * 100) / 100,
      status: STATUS_LABELS[record.status] ?? record.status,
      officer: record.user?.name ?? 'Unknown officer',
    };
  });
}

function describeFilters(payload: ReportGeneratorPayload, rows: ReportRow[]) {
  const storeName = payload.storeId
    ? rows[0]?.store ?? 'Selected store'
    : 'All stores';

  return {
    commodityGroup:
      !payload.commodityGroup || payload.commodityGroup === 'ALL'
        ? 'All categories'
        : payload.commodityGroup,
    store: storeName,
  };
}

/* ------------------------------------------------------------------ *
 * PDF
 * ------------------------------------------------------------------ */

interface PdfColumn {
  key: keyof ReportRow;
  label: string;
  width: number;
  align: 'left' | 'right' | 'center';
}

// Sums to 515pt — the printable width of A4 at a 40pt margin.
const PDF_COLUMNS: PdfColumn[] = [
  { key: 'date', label: 'Date', width: 62, align: 'left' },
  { key: 'store', label: 'Store', width: 104, align: 'left' },
  { key: 'commodity', label: 'Commodity', width: 92, align: 'left' },
  { key: 'category', label: 'Category', width: 66, align: 'left' },
  { key: 'price', label: 'Price (PHP)', width: 58, align: 'right' },
  { key: 'srp', label: 'SRP (PHP)', width: 58, align: 'right' },
  { key: 'status', label: 'Status', width: 75, align: 'left' },
];

const PAGE_MARGIN = 40;
const TABLE_WIDTH = PDF_COLUMNS.reduce((sum, column) => sum + column.width, 0);
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 22;

function statusColor(status: string) {
  if (status === 'Above SRP') return COLORS.overprice;
  if (status === 'Below SRP') return COLORS.underprice;
  if (status === 'Compliant') return COLORS.compliant;
  return COLORS.bodyText;
}

/**
 * PDFKit's `ellipsis: true` does not reliably suppress wrapping inside a fixed
 * row height — long commodity names ("Galunggong (Round Scad)") spilled a second
 * line into the row below. Measuring and truncating up front keeps every row
 * exactly one line tall.
 */
function fitText(doc: PDFKit.PDFDocument, text: string, width: number) {
  if (doc.widthOfString(text) <= width) {
    return text;
  }

  let truncated = text;
  while (truncated.length > 1 && doc.widthOfString(`${truncated}…`) > width) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated.trimEnd()}…`;
}

function cellText(row: ReportRow, column: PdfColumn) {
  const value = row[column.key];

  if (column.key === 'price') {
    return formatAmount(row.price);
  }

  if (column.key === 'srp') {
    return formatAmount(row.srp);
  }

  return value == null ? '—' : String(value);
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.save();
  doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, HEADER_HEIGHT).fill(COLORS.brand);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.headerText);

  let x = PAGE_MARGIN;
  for (const column of PDF_COLUMNS) {
    doc.text(column.label, x + 6, y + 7, {
      width: column.width - 12,
      align: column.align,
      lineBreak: false,
      ellipsis: true,
    });
    x += column.width;
  }

  doc.fillColor(COLORS.bodyText);
  return y + HEADER_HEIGHT;
}

function drawSummaryPanel(
  doc: PDFKit.PDFDocument,
  summary: ReportSummary,
  y: number,
): number {
  const panelHeight = 74;

  doc.save();
  doc.roundedRect(PAGE_MARGIN, y, TABLE_WIDTH, panelHeight, 4).fill(COLORS.zebra);
  doc.restore();

  const cells: Array<{ label: string; value: string; color?: string }> = [
    { label: 'Records', value: String(summary.totalRecords) },
    {
      label: 'Compliant',
      value:
        summary.complianceRate == null
          ? '—'
          : `${summary.compliantCount} (${summary.complianceRate.toFixed(1)}%)`,
      color: COLORS.compliant,
    },
    { label: 'Above SRP', value: String(summary.overpriceCount), color: COLORS.overprice },
    { label: 'Below SRP', value: String(summary.underpriceCount), color: COLORS.underprice },
    { label: 'Avg. price (PHP)', value: formatAmount(summary.averagePrice) },
    {
      label: 'Range (PHP)',
      value:
        summary.lowestPrice == null
          ? '—'
          : `${formatAmount(summary.lowestPrice)} – ${formatAmount(summary.highestPrice)}`,
    },
  ];

  const perRow = 3;
  const cellWidth = TABLE_WIDTH / perRow;

  cells.forEach((cell, index) => {
    const column = index % perRow;
    const row = Math.floor(index / perRow);
    const cellX = PAGE_MARGIN + column * cellWidth;
    const cellY = y + 12 + row * 32;

    doc.font('Helvetica').fontSize(7).fillColor(COLORS.mutedText);
    doc.text(cell.label.toUpperCase(), cellX + 12, cellY, {
      width: cellWidth - 24,
      lineBreak: false,
      ellipsis: true,
    });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(cell.color ?? COLORS.bodyText);
    doc.text(cell.value, cellX + 12, cellY + 10, {
      width: cellWidth - 24,
      lineBreak: false,
      ellipsis: true,
    });
  });

  doc.fillColor(COLORS.bodyText);
  return y + panelHeight + 18;
}

function drawDocumentHeader(
  doc: PDFKit.PDFDocument,
  payload: ReportGeneratorPayload,
  filters: { commodityGroup: string; store: string },
  generatedBy: string,
): number {
  doc.save();
  doc.rect(0, 0, doc.page.width, 74).fill(COLORS.brand);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(17).fillColor(COLORS.headerText);
  doc.text('PresyoSerbisyo', PAGE_MARGIN, 22, { lineBreak: false });

  doc.font('Helvetica').fontSize(9);
  doc.text(
    'Department of Trade and Industry — Catanduanes',
    PAGE_MARGIN,
    45,
    { lineBreak: false },
  );

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(REPORT_TYPE_LABELS[payload.type], PAGE_MARGIN, 22, {
    width: TABLE_WIDTH,
    align: 'right',
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(8);
  doc.text(payload.period, PAGE_MARGIN, 37, {
    width: TABLE_WIDTH,
    align: 'right',
    lineBreak: false,
  });

  doc.fillColor(COLORS.bodyText);

  let y = 92;
  const meta: Array<[string, string]> = [
    ['Period', payload.period],
    ['Category', filters.commodityGroup],
    ['Store', filters.store],
    ['Generated by', generatedBy],
    ['Generated on', formatTimestamp(new Date())],
  ];

  doc.fontSize(8);
  meta.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = PAGE_MARGIN + column * (TABLE_WIDTH / 2);
    const lineY = y + row * 13;

    doc.font('Helvetica-Bold').fillColor(COLORS.mutedText);
    doc.text(`${label}:`, x, lineY, { width: 70, lineBreak: false });
    doc.font('Helvetica').fillColor(COLORS.bodyText);
    doc.text(value, x + 72, lineY, {
      width: TABLE_WIDTH / 2 - 82,
      lineBreak: false,
      ellipsis: true,
    });
  });

  y += Math.ceil(meta.length / 2) * 13 + 14;
  return y;
}

function drawPageFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();

  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);

    const footerY = doc.page.height - 32;

    doc.save();
    doc
      .moveTo(PAGE_MARGIN, footerY - 8)
      .lineTo(PAGE_MARGIN + TABLE_WIDTH, footerY - 8)
      .strokeColor(COLORS.rule)
      .lineWidth(0.5)
      .stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(7).fillColor(COLORS.mutedText);
    doc.text(
      'PresyoSerbisyo · DTI Catanduanes · Official price monitoring record',
      PAGE_MARGIN,
      footerY,
      { width: TABLE_WIDTH, align: 'left', lineBreak: false },
    );
    doc.text(`Page ${index + 1} of ${range.count}`, PAGE_MARGIN, footerY, {
      width: TABLE_WIDTH,
      align: 'right',
      lineBreak: false,
    });
  }
}

async function generatePdf(
  payload: ReportGeneratorPayload,
  rows: ReportRow[],
  summary: ReportSummary,
  generatedBy: string,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: PAGE_MARGIN,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `${REPORT_TYPE_LABELS[payload.type]} — ${payload.period}`,
        Author: 'PresyoSerbisyo — DTI Catanduanes',
        Subject: 'Commodity price monitoring record',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const filters = describeFilters(payload, rows);
    const bottomLimit = doc.page.height - 48;

    let y = drawDocumentHeader(doc, payload, filters, generatedBy);
    y = drawSummaryPanel(doc, summary, y);

    if (rows.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.mutedText);
      doc.text(
        'No price records were found for this period and filter combination.',
        PAGE_MARGIN,
        y + 8,
        { width: TABLE_WIDTH, align: 'center' },
      );
      drawPageFooters(doc);
      doc.end();
      return;
    }

    y = drawTableHeader(doc, y);

    rows.forEach((row, index) => {
      if (y + ROW_HEIGHT > bottomLimit) {
        doc.addPage();
        y = drawTableHeader(doc, PAGE_MARGIN);
      }

      if (index % 2 === 1) {
        doc.save();
        doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, ROW_HEIGHT).fill(COLORS.zebra);
        doc.restore();
      }

      let x = PAGE_MARGIN;
      for (const column of PDF_COLUMNS) {
        const isStatus = column.key === 'status';

        doc
          .font(isStatus ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .fillColor(isStatus ? statusColor(row.status) : COLORS.bodyText);

        doc.text(fitText(doc, cellText(row, column), column.width - 12), x + 6, y + 5, {
          width: column.width - 12,
          align: column.align,
          lineBreak: false,
        });

        x += column.width;
      }

      doc.save();
      doc
        .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
        .lineTo(PAGE_MARGIN + TABLE_WIDTH, y + ROW_HEIGHT)
        .strokeColor(COLORS.rule)
        .lineWidth(0.4)
        .stroke();
      doc.restore();

      y += ROW_HEIGHT;
    });

    drawPageFooters(doc);
    doc.end();
  });
}

/* ------------------------------------------------------------------ *
 * Excel
 * ------------------------------------------------------------------ */

const PESO_FORMAT = '₱#,##0.00';
const SIGNED_PESO_FORMAT = '[Green]+₱#,##0.00;[Red]-₱#,##0.00;₱0.00';

function hex(color: string) {
  return `FF${color.replace('#', '').toUpperCase()}`;
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  payload: ReportGeneratorPayload,
  filters: { commodityGroup: string; store: string },
  summary: ReportSummary,
  generatedBy: string,
) {
  const sheet = workbook.addWorksheet('Summary', {
    properties: { defaultRowHeight: 18 },
  });

  sheet.columns = [
    { key: 'label', width: 26 },
    { key: 'value', width: 42 },
  ];

  sheet.mergeCells('A1:B1');
  const title = sheet.getCell('A1');
  title.value = 'PresyoSerbisyo';
  title.font = { size: 16, bold: true, color: { argb: hex(COLORS.headerText) } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(COLORS.brand) } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:B2');
  const subtitle = sheet.getCell('A2');
  subtitle.value = 'Department of Trade and Industry — Catanduanes';
  subtitle.font = { size: 10, color: { argb: hex(COLORS.headerText) } };
  subtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(COLORS.brandDark) } };
  subtitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(2).height = 20;

  const rows: Array<[string, string | number | null, string?]> = [
    ['', null],
    ['Report type', REPORT_TYPE_LABELS[payload.type]],
    ['Period', payload.period],
    ['Category', filters.commodityGroup],
    ['Store', filters.store],
    ['Generated by', generatedBy],
    ['Generated on', formatTimestamp(new Date())],
    ['', null],
    ['Total records', summary.totalRecords],
    ['Compliant', summary.compliantCount],
    ['Above SRP', summary.overpriceCount],
    ['Below SRP', summary.underpriceCount],
    [
      'Compliance rate',
      summary.complianceRate == null ? '—' : `${summary.complianceRate.toFixed(1)}%`,
    ],
    ['Commodities covered', summary.commodityCount],
    ['Stores covered', summary.storeCount],
    ['', null],
    ['Average price', summary.averagePrice, PESO_FORMAT],
    ['Lowest price', summary.lowestPrice, PESO_FORMAT],
    ['Highest price', summary.highestPrice, PESO_FORMAT],
  ];

  rows.forEach(([label, value, numFmt]) => {
    const row = sheet.addRow({ label, value: value ?? '' });

    row.getCell('label').font = { bold: true, color: { argb: hex(COLORS.mutedText) } };
    row.getCell('value').font = { color: { argb: hex(COLORS.bodyText) } };

    if (numFmt && typeof value === 'number') {
      row.getCell('value').numFmt = numFmt;
    }
  });

  return sheet;
}

function addRecordsSheet(workbook: ExcelJS.Workbook, rows: ReportRow[]) {
  const sheet = workbook.addWorksheet('Price Records', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 8 },
    { header: 'Store', key: 'store', width: 26 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Commodity', key: 'commodity', width: 22 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Price', key: 'price', width: 14 },
    { header: 'SRP', key: 'srp', width: 14 },
    { header: 'Variance', key: 'variance', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Officer', key: 'officer', width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: hex(COLORS.headerText) } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(COLORS.brand) } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });

  rows.forEach((row, index) => {
    const added = sheet.addRow({
      date: row.date,
      time: row.time,
      store: row.store,
      location: row.location,
      commodity: row.commodity,
      category: row.category,
      price: row.price,
      srp: row.srp,
      variance: row.variance,
      status: row.status,
      officer: row.officer,
    });

    // Amounts stay real numbers so the recipient can sort, sum, and chart them —
    // the previous generator wrote pre-formatted "₱123.45" strings, which Excel
    // treats as text.
    added.getCell('price').numFmt = PESO_FORMAT;
    added.getCell('srp').numFmt = PESO_FORMAT;
    added.getCell('variance').numFmt = SIGNED_PESO_FORMAT;

    if (row.srp == null) {
      added.getCell('srp').value = '—';
      added.getCell('variance').value = '—';
    }

    added.getCell('status').font = {
      bold: true,
      color: { argb: hex(statusColor(row.status)) },
    };

    if (index % 2 === 1) {
      added.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(COLORS.zebra) } };
      });
    }
  });

  if (rows.length > 0) {
    sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };
  }

  return sheet;
}

async function generateExcel(
  payload: ReportGeneratorPayload,
  rows: ReportRow[],
  summary: ReportSummary,
  generatedBy: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PresyoSerbisyo — DTI Catanduanes';
  workbook.created = new Date();

  const filters = describeFilters(payload, rows);
  addSummarySheet(workbook, payload, filters, summary, generatedBy);
  addRecordsSheet(workbook, rows);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/* ------------------------------------------------------------------ */

export async function generateReportFile(
  payload: ReportGeneratorPayload,
  generatedBy = 'PresyoSerbisyo',
  authUser?: AuthUser,
) {
  const filename = buildReportFilename(payload.type, payload.format);
  const records = await loadReportRecords(
    payload.period,
    payload.commodityGroup,
    payload.storeId,
    authUser,
  );

  const commodityIds = Array.from(new Set(records.map((record) => record.commodityId)));
  const srps = await loadSrpLookup(commodityIds);

  const rows = buildReportRows(records, srps);
  const summary = buildReportSummary(
    records.map((record) => ({
      commodityId: record.commodityId,
      storeId: record.storeId,
      price: Number(record.price),
      status: record.status,
    })),
  );

  const fileContent = payload.format === 'PDF'
    ? await generatePdf(payload, rows, summary, generatedBy)
    : await generateExcel(payload, rows, summary, generatedBy);

  return {
    filename,
    contentType: contentTypeForFormat(payload.format),
    fileContent,
  };
}
