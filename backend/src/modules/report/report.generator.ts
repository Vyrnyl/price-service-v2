import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { CreateReportInput, ReportFormat, ReportTypeEnum } from './report.schema';
import {
  buildReportSummary,
  buildComplianceReport,
  buildTrendReport,
  groupRowsByCommodity,
  resolveSrpAt,
  type ComplianceReport,
  type CommodityTrend,
  type ReportRow,
  type ReportSummary,
  type SrpLookupEntry,
  type StoreComplianceRow,
  type TrendPoint,
} from './report.summary';
import { resolveReportRecordScope } from './report.scope';
import type { AuthUser } from '../../shared/types/express';

export type ReportGeneratorPayload = CreateReportInput;

type ReportRecord = Prisma.PriceRecordGetPayload<{
  include: { commodity: true; store: true; user: true };
}>;

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

function formatSignedAmount(value: number | null) {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${numberFormatter.format(Math.abs(value))}`;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(1)}%`;
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

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function statusColor(status: string) {
  if (status === 'OVERPRICE') return COLORS.overprice;
  if (status === 'UNDERPRICE') return COLORS.underprice;
  if (status === 'COMPLIANT') return COLORS.compliant;
  return COLORS.bodyText;
}

function varianceColor(value: number | null) {
  if (value == null) return COLORS.bodyText;
  if (value > 0) return COLORS.overprice;
  if (value < 0) return COLORS.underprice;
  return COLORS.compliant;
}

function buildReportRows(records: ReportRecord[], srps: SrpLookupEntry[]): ReportRow[] {
  return records.map((record) => {
    const price = Number(record.price);
    const srp = resolveSrpAt(srps, record.commodityId, record.dateAndTime);

    return {
      date: formatDate(record.dateAndTime),
      time: formatTime(record.dateAndTime),
      dateAndTime: record.dateAndTime,
      storeId: record.storeId,
      store: record.store?.name ?? 'Unknown store',
      location: record.store?.location ?? 'Unknown location',
      commodityId: record.commodityId,
      commodity: record.commodity?.name ?? 'Unknown commodity',
      category: record.commodity?.category ?? 'Uncategorised',
      price,
      srp,
      // Rounded so the cell holds 0.77 rather than 0.7700000000000031 — the
      // number format would hide it, but the underlying value is what a
      // recipient sums and charts.
      variance: srp == null ? null : Math.round((price - srp) * 100) / 100,
      status: record.status,
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

interface PdfColumn<T> {
  label: string;
  width: number;
  align: 'left' | 'right' | 'center';
  value: (row: T) => string;
  color?: (row: T) => string;
  bold?: boolean;
}

const PAGE_MARGIN = 40;
// The printable width of A4 at a 40pt margin. Every column set below sums to
// this so the header band, summary panel, and every table share one right edge.
const CONTENT_WIDTH = 515;
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 22;
const GROUP_BAND_HEIGHT = 18;

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

function ensureSpace(
  doc: PDFKit.PDFDocument,
  y: number,
  needed: number,
  bottomLimit: number,
): number {
  if (y + needed > bottomLimit) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

function drawColumnsHeader<T>(doc: PDFKit.PDFDocument, columns: PdfColumn<T>[], y: number): number {
  doc.save();
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, HEADER_HEIGHT).fill(COLORS.brand);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.headerText);

  let x = PAGE_MARGIN;
  for (const column of columns) {
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

function drawColumnsRow<T>(
  doc: PDFKit.PDFDocument,
  columns: PdfColumn<T>[],
  row: T,
  y: number,
  zebra: boolean,
) {
  if (zebra) {
    doc.save();
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT).fill(COLORS.zebra);
    doc.restore();
  }

  let x = PAGE_MARGIN;
  for (const column of columns) {
    doc
      .font(column.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8)
      .fillColor(column.color ? column.color(row) : COLORS.bodyText);

    doc.text(fitText(doc, column.value(row), column.width - 12), x + 6, y + 5, {
      width: column.width - 12,
      align: column.align,
      lineBreak: false,
    });

    x += column.width;
  }

  doc.save();
  doc
    .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, y + ROW_HEIGHT)
    .strokeColor(COLORS.rule)
    .lineWidth(0.4)
    .stroke();
  doc.restore();

  doc.fillColor(COLORS.bodyText);
}

/** Paginated table: redraws the header band on every new page it spills onto. */
function drawTable<T>(
  doc: PDFKit.PDFDocument,
  columns: PdfColumn<T>[],
  rows: T[],
  y: number,
  bottomLimit: number,
): number {
  if (rows.length === 0) {
    return y;
  }

  let cursorY = drawColumnsHeader(doc, columns, y);

  rows.forEach((row, index) => {
    if (cursorY + ROW_HEIGHT > bottomLimit) {
      doc.addPage();
      cursorY = drawColumnsHeader(doc, columns, PAGE_MARGIN);
    }

    drawColumnsRow(doc, columns, row, cursorY, index % 2 === 1);
    cursorY += ROW_HEIGHT;
  });

  return cursorY;
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
  subtitle?: string,
): number {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.brandDark);
  doc.text(title, PAGE_MARGIN, y, { width: CONTENT_WIDTH, lineBreak: false });
  let nextY = y + 15;

  if (subtitle) {
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.mutedText);
    doc.text(subtitle, PAGE_MARGIN, nextY, { width: CONTENT_WIDTH, lineBreak: false });
    nextY += 12;
  }

  doc.fillColor(COLORS.bodyText);
  return nextY + 6;
}

function drawGroupBand(doc: PDFKit.PDFDocument, label: string, y: number): number {
  doc.save();
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, GROUP_BAND_HEIGHT).fill(COLORS.brandDark);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.headerText);
  doc.text(label, PAGE_MARGIN + 6, y + 5, {
    width: CONTENT_WIDTH - 12,
    lineBreak: false,
    ellipsis: true,
  });
  doc.fillColor(COLORS.bodyText);

  return y + GROUP_BAND_HEIGHT + 2;
}

function drawSummaryPanel(
  doc: PDFKit.PDFDocument,
  summary: ReportSummary,
  y: number,
): number {
  const panelHeight = 74;

  doc.save();
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, panelHeight, 4).fill(COLORS.zebra);
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
  const cellWidth = CONTENT_WIDTH / perRow;

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
    width: CONTENT_WIDTH,
    align: 'right',
    lineBreak: false,
  });
  doc.font('Helvetica').fontSize(8);
  doc.text(payload.period, PAGE_MARGIN, 37, {
    width: CONTENT_WIDTH,
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
    const x = PAGE_MARGIN + column * (CONTENT_WIDTH / 2);
    const lineY = y + row * 13;

    doc.font('Helvetica-Bold').fillColor(COLORS.mutedText);
    doc.text(`${label}:`, x, lineY, { width: 70, lineBreak: false });
    doc.font('Helvetica').fillColor(COLORS.bodyText);
    doc.text(value, x + 72, lineY, {
      width: CONTENT_WIDTH / 2 - 82,
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
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, footerY - 8)
      .strokeColor(COLORS.rule)
      .lineWidth(0.5)
      .stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(7).fillColor(COLORS.mutedText);
    doc.text(
      'PresyoSerbisyo · DTI Catanduanes · Official price monitoring record',
      PAGE_MARGIN,
      footerY,
      { width: CONTENT_WIDTH, align: 'left', lineBreak: false },
    );
    doc.text(`Page ${index + 1} of ${range.count}`, PAGE_MARGIN, footerY, {
      width: CONTENT_WIDTH,
      align: 'right',
      lineBreak: false,
    });
  }
}

/* -- MONTHLY: full listing grouped by commodity, with per-commodity subtotals -- */

// 55 + 40 + 140 + 80 + 80 + 60 + 60 = 515
const MONTHLY_ROW_COLUMNS: PdfColumn<ReportRow>[] = [
  { label: 'Date', width: 55, align: 'left', value: (r) => r.date },
  { label: 'Time', width: 40, align: 'left', value: (r) => r.time },
  { label: 'Store', width: 140, align: 'left', value: (r) => r.store },
  { label: 'Price (PHP)', width: 80, align: 'right', value: (r) => formatAmount(r.price) },
  { label: 'SRP (PHP)', width: 80, align: 'right', value: (r) => formatAmount(r.srp) },
  {
    label: 'Variance',
    width: 60,
    align: 'right',
    value: (r) => formatSignedAmount(r.variance),
    color: (r) => varianceColor(r.variance),
  },
  {
    label: 'Status',
    width: 60,
    align: 'left',
    value: (r) => statusLabel(r.status),
    color: (r) => statusColor(r.status),
    bold: true,
  },
];

function drawMonthlyBody(
  doc: PDFKit.PDFDocument,
  rows: ReportRow[],
  y: number,
  bottomLimit: number,
): number {
  const groups = groupRowsByCommodity(rows);
  let cursorY = y;

  groups.forEach((group) => {
    cursorY = ensureSpace(doc, cursorY, GROUP_BAND_HEIGHT + HEADER_HEIGHT + ROW_HEIGHT + 24, bottomLimit);
    cursorY = drawGroupBand(doc, `${group.commodity}  ·  ${group.category}`, cursorY);
    cursorY = drawTable(doc, MONTHLY_ROW_COLUMNS, group.rows, cursorY, bottomLimit);

    cursorY = ensureSpace(doc, cursorY, 22, bottomLimit);
    const s = group.subtotal;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.mutedText);
    doc.text(
      `Subtotal — ${s.count} record${s.count === 1 ? '' : 's'} · avg ${formatAmount(s.averagePrice)} · ` +
        `${s.compliantCount} compliant · ${s.overpriceCount} above SRP · ${s.underpriceCount} below SRP`,
      PAGE_MARGIN,
      cursorY,
      { width: CONTENT_WIDTH, lineBreak: false },
    );
    doc.fillColor(COLORS.bodyText);
    cursorY += 22;
  });

  return cursorY;
}

/* -- SRP_COMPLIANCE: store compliance rates, then violations only -- */

// 160 + 70 + 70 + 70 + 70 + 75 = 515
const STORE_COMPLIANCE_COLUMNS: PdfColumn<StoreComplianceRow>[] = [
  { label: 'Store', width: 160, align: 'left', value: (r) => r.store },
  { label: 'Records', width: 70, align: 'right', value: (r) => String(r.totalRecords) },
  {
    label: 'Compliant',
    width: 70,
    align: 'right',
    value: (r) => String(r.compliantCount),
    color: () => COLORS.compliant,
  },
  {
    label: 'Above SRP',
    width: 70,
    align: 'right',
    value: (r) => String(r.overpriceCount),
    color: () => COLORS.overprice,
  },
  {
    label: 'Below SRP',
    width: 70,
    align: 'right',
    value: (r) => String(r.underpriceCount),
    color: () => COLORS.underprice,
  },
  {
    label: 'Compliance',
    width: 75,
    align: 'right',
    value: (r) => `${r.complianceRate.toFixed(1)}%`,
    bold: true,
  },
];

// 55 + 110 + 100 + 75 + 75 + 100 = 515
const VIOLATION_COLUMNS: PdfColumn<ReportRow>[] = [
  { label: 'Date', width: 55, align: 'left', value: (r) => r.date },
  { label: 'Store', width: 110, align: 'left', value: (r) => r.store },
  { label: 'Commodity', width: 100, align: 'left', value: (r) => r.commodity },
  { label: 'Price (PHP)', width: 75, align: 'right', value: (r) => formatAmount(r.price) },
  { label: 'SRP (PHP)', width: 75, align: 'right', value: (r) => formatAmount(r.srp) },
  {
    label: 'Over by (PHP)',
    width: 100,
    align: 'right',
    value: (r) => formatSignedAmount(r.variance),
    color: () => COLORS.overprice,
    bold: true,
  },
];

function drawComplianceBody(
  doc: PDFKit.PDFDocument,
  report: ComplianceReport,
  y: number,
  bottomLimit: number,
): number {
  let cursorY = ensureSpace(doc, y, 40, bottomLimit);
  cursorY = drawSectionTitle(
    doc,
    'Store Compliance Rates',
    cursorY,
    'Sorted worst compliance rate first.',
  );

  if (report.storeCompliance.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.mutedText);
    doc.text('No stores recorded prices in this period.', PAGE_MARGIN, cursorY, {
      width: CONTENT_WIDTH,
    });
    doc.fillColor(COLORS.bodyText);
    cursorY += 20;
  } else {
    cursorY = drawTable(doc, STORE_COMPLIANCE_COLUMNS, report.storeCompliance, cursorY, bottomLimit);
    cursorY += 18;
  }

  cursorY = ensureSpace(doc, cursorY, 40, bottomLimit);
  cursorY = drawSectionTitle(
    doc,
    `Violations — Above SRP (${report.violations.length})`,
    cursorY,
    'Largest overage first. Compliant and below-SRP records are counted above, not itemised here.',
  );

  if (report.violations.length === 0) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.compliant);
    doc.text(
      'No above-SRP records were found for this period and filter combination.',
      PAGE_MARGIN,
      cursorY,
      { width: CONTENT_WIDTH },
    );
    doc.fillColor(COLORS.bodyText);
    cursorY += 20;
  } else {
    cursorY = drawTable(doc, VIOLATION_COLUMNS, report.violations, cursorY, bottomLimit);
  }

  return cursorY;
}

/* -- TREND: weekly average per commodity, movement vs. period start -- */

function trendColumns(trend: CommodityTrend): PdfColumn<TrendPoint>[] {
  // 140 + 140 + 100 + 135 = 515
  return [
    { label: 'Week Starting', width: 140, align: 'left', value: (p) => formatDate(p.weekStart) },
    {
      label: 'Avg Price (PHP)',
      width: 140,
      align: 'right',
      value: (p) => formatAmount(p.averagePrice),
    },
    { label: 'Records', width: 100, align: 'right', value: (p) => String(p.recordCount) },
    {
      label: 'vs Period Start',
      width: 135,
      align: 'right',
      value: (p) =>
        trend.periodStartPrice == null || trend.periodStartPrice === 0
          ? '—'
          : formatSignedPercent(
              ((p.averagePrice - trend.periodStartPrice) / trend.periodStartPrice) * 100,
            ),
      color: (p) => {
        if (trend.periodStartPrice == null || trend.periodStartPrice === 0) return COLORS.bodyText;
        if (p.averagePrice > trend.periodStartPrice) return COLORS.overprice;
        if (p.averagePrice < trend.periodStartPrice) return COLORS.compliant;
        return COLORS.mutedText;
      },
      bold: true,
    },
  ];
}

function drawTrendBody(
  doc: PDFKit.PDFDocument,
  trends: CommodityTrend[],
  y: number,
  bottomLimit: number,
): number {
  let cursorY = y;

  trends.forEach((trend) => {
    cursorY = ensureSpace(
      doc,
      cursorY,
      GROUP_BAND_HEIGHT + HEADER_HEIGHT + ROW_HEIGHT + 24,
      bottomLimit,
    );
    cursorY = drawGroupBand(doc, `${trend.commodity}  ·  ${trend.category}`, cursorY);
    cursorY = drawTable(doc, trendColumns(trend), trend.points, cursorY, bottomLimit);

    cursorY = ensureSpace(doc, cursorY, 22, bottomLimit);
    const movementText =
      trend.movementPercent == null
        ? 'Movement vs period start: —'
        : `Movement vs period start: ${formatSignedPercent(trend.movementPercent)} ` +
          `(${formatAmount(trend.periodStartPrice)} -> ${formatAmount(trend.periodEndPrice)})`;

    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.mutedText);
    doc.text(movementText, PAGE_MARGIN, cursorY, { width: CONTENT_WIDTH, lineBreak: false });
    doc.fillColor(COLORS.bodyText);
    cursorY += 22;
  });

  return cursorY;
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
        { width: CONTENT_WIDTH, align: 'center' },
      );
      drawPageFooters(doc);
      doc.end();
      return;
    }

    if (payload.type === 'MONTHLY') {
      drawMonthlyBody(doc, rows, y, bottomLimit);
    } else if (payload.type === 'SRP_COMPLIANCE') {
      drawComplianceBody(doc, buildComplianceReport(rows), y, bottomLimit);
    } else {
      drawTrendBody(doc, buildTrendReport(rows), y, bottomLimit);
    }

    drawPageFooters(doc);
    doc.end();
  });
}

/* ------------------------------------------------------------------ *
 * Excel
 * ------------------------------------------------------------------ */

const PESO_FORMAT = '₱#,##0.00';
const SIGNED_PESO_FORMAT = '[Green]+₱#,##0.00;[Red]-₱#,##0.00;₱0.00';
const SIGNED_PERCENT_FORMAT = '[Red]+0.0%;[Green]-0.0%;0.0%';

function hex(color: string) {
  return `FF${color.replace('#', '').toUpperCase()}`;
}

function styleHeaderRow(row: ExcelJS.Row, fillColor = COLORS.brand) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: hex(COLORS.headerText) } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(fillColor) } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
}

function zebraStripe(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(COLORS.zebra) } };
  });
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

/* -- MONTHLY: one sheet, grouped by commodity with a bold subtotal row -- */

function addMonthlyRecordsSheet(workbook: ExcelJS.Workbook, rows: ReportRow[]) {
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

  styleHeaderRow(sheet.getRow(1));

  const groups = groupRowsByCommodity(rows);

  groups.forEach((group) => {
    group.rows.forEach((row, index) => {
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
        status: statusLabel(row.status),
        officer: row.officer,
      });

      // Amounts stay real numbers so the recipient can sort, sum, and chart them.
      added.getCell('price').numFmt = PESO_FORMAT;
      added.getCell('srp').numFmt = PESO_FORMAT;
      added.getCell('variance').numFmt = SIGNED_PESO_FORMAT;

      if (row.srp == null) {
        added.getCell('srp').value = '—';
        added.getCell('variance').value = '—';
      }

      added.getCell('status').font = { bold: true, color: { argb: hex(statusColor(row.status)) } };

      if (index % 2 === 1) {
        zebraStripe(added);
      }
    });

    const s = group.subtotal;
    const subtotalRow = sheet.addRow({
      date: '',
      time: '',
      store: '',
      location: '',
      commodity: `Subtotal — ${group.commodity}`,
      category: '',
      price: s.averagePrice,
      srp: '',
      variance: '',
      status: `${s.compliantCount} compliant · ${s.overpriceCount} above · ${s.underpriceCount} below`,
      officer: `${s.count} record${s.count === 1 ? '' : 's'}`,
    });
    subtotalRow.getCell('price').numFmt = PESO_FORMAT;
    subtotalRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: hex(COLORS.brandDark) } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(COLORS.zebra) } };
    });
  });

  if (rows.length > 0) {
    sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };
  }

  return sheet;
}

/* -- SRP_COMPLIANCE: a store-compliance sheet and a violations-only sheet -- */

function addComplianceSheets(workbook: ExcelJS.Workbook, report: ComplianceReport) {
  const storeSheet = workbook.addWorksheet('Store Compliance');
  storeSheet.columns = [
    { header: 'Store', key: 'store', width: 26 },
    { header: 'Records', key: 'totalRecords', width: 12 },
    { header: 'Compliant', key: 'compliantCount', width: 12 },
    { header: 'Above SRP', key: 'overpriceCount', width: 12 },
    { header: 'Below SRP', key: 'underpriceCount', width: 12 },
    { header: 'Compliance Rate', key: 'complianceRate', width: 16 },
  ];
  styleHeaderRow(storeSheet.getRow(1));

  report.storeCompliance.forEach((store, index) => {
    const added = storeSheet.addRow({
      store: store.store,
      totalRecords: store.totalRecords,
      compliantCount: store.compliantCount,
      overpriceCount: store.overpriceCount,
      underpriceCount: store.underpriceCount,
      complianceRate: store.complianceRate / 100,
    });
    added.getCell('complianceRate').numFmt = '0.0%';
    added.getCell('complianceRate').font = { bold: true };

    if (index % 2 === 1) {
      zebraStripe(added);
    }
  });

  if (report.storeCompliance.length > 0) {
    storeSheet.autoFilter = { from: 'A1', to: { row: 1, column: storeSheet.columnCount } };
  }

  const violationSheet = workbook.addWorksheet('Violations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  violationSheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Store', key: 'store', width: 26 },
    { header: 'Commodity', key: 'commodity', width: 22 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Price', key: 'price', width: 14 },
    { header: 'SRP', key: 'srp', width: 14 },
    { header: 'Variance', key: 'variance', width: 14 },
    { header: 'Officer', key: 'officer', width: 20 },
  ];
  styleHeaderRow(violationSheet.getRow(1), COLORS.overprice);

  report.violations.forEach((row, index) => {
    const added = violationSheet.addRow({
      date: row.date,
      store: row.store,
      commodity: row.commodity,
      category: row.category,
      price: row.price,
      srp: row.srp,
      variance: row.variance,
      officer: row.officer,
    });
    added.getCell('price').numFmt = PESO_FORMAT;
    added.getCell('srp').numFmt = PESO_FORMAT;
    added.getCell('variance').numFmt = SIGNED_PESO_FORMAT;
    added.getCell('variance').font = { bold: true, color: { argb: hex(COLORS.overprice) } };

    if (index % 2 === 1) {
      zebraStripe(added);
    }
  });

  if (report.violations.length > 0) {
    violationSheet.autoFilter = { from: 'A1', to: { row: 1, column: violationSheet.columnCount } };
  }

  return { storeSheet, violationSheet };
}

/* -- TREND: one flat weekly-average sheet, no raw record dump -- */

function addTrendSheet(workbook: ExcelJS.Workbook, trends: CommodityTrend[]) {
  const sheet = workbook.addWorksheet('Weekly Trend', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Commodity', key: 'commodity', width: 22 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Week Starting', key: 'weekStart', width: 16 },
    { header: 'Avg Price', key: 'averagePrice', width: 14 },
    { header: 'Records', key: 'recordCount', width: 10 },
    { header: 'vs Period Start', key: 'movement', width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  let zebraIndex = 0;

  trends.forEach((trend) => {
    trend.points.forEach((point) => {
      const movement =
        trend.periodStartPrice == null || trend.periodStartPrice === 0
          ? null
          : (point.averagePrice - trend.periodStartPrice) / trend.periodStartPrice;

      const added = sheet.addRow({
        commodity: trend.commodity,
        category: trend.category,
        weekStart: formatDate(point.weekStart),
        averagePrice: point.averagePrice,
        recordCount: point.recordCount,
        movement: movement ?? '—',
      });
      added.getCell('averagePrice').numFmt = PESO_FORMAT;

      if (movement != null) {
        added.getCell('movement').numFmt = SIGNED_PERCENT_FORMAT;
      }

      if (zebraIndex % 2 === 1) {
        zebraStripe(added);
      }
      zebraIndex += 1;
    });
  });

  if (trends.length > 0) {
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

  if (payload.type === 'MONTHLY') {
    addMonthlyRecordsSheet(workbook, rows);
  } else if (payload.type === 'SRP_COMPLIANCE') {
    addComplianceSheets(workbook, buildComplianceReport(rows));
  } else {
    addTrendSheet(workbook, buildTrendReport(rows));
  }

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
  const summary = buildReportSummary(rows);

  const fileContent = payload.format === 'PDF'
    ? await generatePdf(payload, rows, summary, generatedBy)
    : await generateExcel(payload, rows, summary, generatedBy);

  const filters = describeFilters(payload, rows);
  const filterLabel = payload.storeId
    ? filters.store
    : payload.commodityGroup && payload.commodityGroup !== 'ALL'
      ? filters.commodityGroup
      : null;

  return {
    filename,
    contentType: contentTypeForFormat(payload.format),
    fileContent,
    filterLabel,
  };
}
