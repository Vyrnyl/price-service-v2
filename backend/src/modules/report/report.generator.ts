import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { CreateReportInput, ReportFormat, ReportTypeEnum } from './report.schema';

export type ReportGeneratorPayload = CreateReportInput;

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

async function loadReportRecords(period: string, commodityGroup?: string, storeId?: string) {
  const { startDate, endDate } = parsePeriod(period);

  return prisma.priceRecord.findMany({
    where: {
      dateAndTime: {
        gte: startDate,
        lte: endDate,
      },
      ...mapCommodityGroupFilter(commodityGroup),
      ...mapStoreFilter(storeId),
    },
    include: {
      commodity: true,
      store: true,
      user: true,
    },
    orderBy: { dateAndTime: 'asc' },
  });
}

function buildReportFilename(type: ReportTypeEnum, format: ReportFormat) {
  const normalizedType = type.toLowerCase();
  const ext = format === 'PDF' ? 'pdf' : 'xlsx';
  const timestamp = Date.now();
  return `${normalizedType}_${timestamp}.${ext}`;
}

function contentTypeForFormat(format: ReportFormat) {
  return format === 'PDF'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

function formatPrice(value: number) {
  return `₱${Number(value).toFixed(2)}`;
}

function buildRecordRows(records: Array<any>) {
  return records.map((record) => ({
    date: record.dateAndTime.toISOString().slice(0, 10),
    time: record.dateAndTime.toISOString().slice(11, 16),
    store: record.store?.name ?? 'Unknown store',
    location: record.store?.location ?? 'Unknown location',
    commodity: record.commodity?.name ?? 'Unknown commodity',
    category: record.commodity?.category ?? 'Unknown category',
    price: formatPrice(Number(record.price)),
    srp: record.srp ? formatPrice(Number(record.srp)) : 'N/A',
    status: record.status,
    officer: record.user?.name ?? 'Officer',
  }));
}

async function generatePdf(payload: ReportGeneratorPayload, records: Array<any>): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('PresyoSerbisyo Report', {
      align: 'center',
    });

    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Report type: ${payload.type}`);
    doc.text(`Period: ${payload.period}`);
    doc.text(`Commodity group: ${payload.commodityGroup ?? 'All commodities'}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total records: ${records.length}`);
    doc.moveDown();

    const columnHeaders = ['Date', 'Time', 'Store', 'Commodity', 'Price', 'SRP', 'Status'];
    doc.font('Helvetica-Bold').fontSize(10).text(columnHeaders.join('  |  '));
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9);

    records.forEach((record) => {
      const row = [
        record.dateAndTime.toISOString().slice(0, 10),
        record.dateAndTime.toISOString().slice(11, 16),
        record.store?.name ?? 'Unknown store',
        record.commodity?.name ?? 'Unknown commodity',
        formatPrice(Number(record.price)),
        record.srp ? formatPrice(Number(record.srp)) : 'N/A',
        record.status,
      ].join('  |  ');
      doc.text(row, { width: 520 });
    });

    doc.end();
  });
}

async function generateExcel(records: Array<any>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Time', key: 'time', width: 8 },
    { header: 'Store', key: 'store', width: 25 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Commodity', key: 'commodity', width: 22 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'SRP', key: 'srp', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Officer', key: 'officer', width: 18 },
  ];

  worksheet.addRows(buildRecordRows(records));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateReportFile(payload: ReportGeneratorPayload) {
  const filename = buildReportFilename(payload.type, payload.format);
  const records = await loadReportRecords(payload.period, payload.commodityGroup, payload.storeId);

  const fileContent = payload.format === 'PDF'
    ? await generatePdf(payload, records)
    : await generateExcel(records);

  return {
    filename,
    contentType: contentTypeForFormat(payload.format),
    fileContent,
  };
}
