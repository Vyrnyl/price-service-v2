import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildComplianceReport,
  buildReportSummary,
  buildTrendReport,
  groupRowsByCommodity,
  resolveSrpAt,
  type ReportRow,
  type SrpLookupEntry,
  type SummarySource,
} from './report.summary';

const RICE = 'commodity-rice';
const SUGAR = 'commodity-sugar';

function srp(commodityId: string, price: number, effectiveDate: string): SrpLookupEntry {
  return { commodityId, price, effectiveDate: new Date(effectiveDate) };
}

function record(overrides: Partial<SummarySource> = {}): SummarySource {
  return {
    commodityId: RICE,
    storeId: 'store-1',
    price: 50,
    status: 'COMPLIANT',
    ...overrides,
  };
}

function row(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    date: '01 Jan 2026',
    time: '09:00',
    dateAndTime: new Date('2026-01-01T09:00:00Z'),
    storeId: 'store-1',
    store: 'Store 1',
    location: 'Virac',
    commodityId: RICE,
    commodity: 'Rice',
    category: 'Grains',
    price: 50,
    srp: 48,
    variance: 2,
    status: 'COMPLIANT',
    officer: 'Officer A',
    ...overrides,
  };
}

test('resolveSrpAt picks the most recent SRP effective on or before the record date', () => {
  const srps = [
    srp(RICE, 45, '2026-01-01'),
    srp(RICE, 50, '2026-03-01'),
    srp(RICE, 55, '2026-06-01'),
  ];

  assert.equal(resolveSrpAt(srps, RICE, new Date('2026-04-15')), 50);
});

test('resolveSrpAt includes an SRP effective exactly at the record moment', () => {
  const srps = [srp(RICE, 45, '2026-01-01'), srp(RICE, 50, '2026-03-01')];

  assert.equal(resolveSrpAt(srps, RICE, new Date('2026-03-01')), 50);
});

test('resolveSrpAt ignores SRPs that take effect after the record date', () => {
  const srps = [srp(RICE, 45, '2026-01-01'), srp(RICE, 99, '2026-12-01')];

  assert.equal(resolveSrpAt(srps, RICE, new Date('2026-06-01')), 45);
});

test('resolveSrpAt never crosses commodities', () => {
  const srps = [srp(SUGAR, 80, '2026-01-01')];

  assert.equal(resolveSrpAt(srps, RICE, new Date('2026-06-01')), null);
});

test('resolveSrpAt returns null when no SRP was in effect yet', () => {
  const srps = [srp(RICE, 45, '2026-05-01')];

  assert.equal(resolveSrpAt(srps, RICE, new Date('2026-01-01')), null);
});

test('buildReportSummary returns an empty shape for no records', () => {
  const summary = buildReportSummary([]);

  assert.equal(summary.totalRecords, 0);
  assert.equal(summary.complianceRate, null);
  assert.equal(summary.averagePrice, null);
  assert.equal(summary.lowestPrice, null);
  assert.equal(summary.highestPrice, null);
  assert.equal(summary.commodityCount, 0);
  assert.equal(summary.storeCount, 0);
});

test('buildReportSummary counts each status branch and computes the compliance rate', () => {
  const summary = buildReportSummary([
    record({ status: 'COMPLIANT' }),
    record({ status: 'COMPLIANT' }),
    record({ status: 'OVERPRICE' }),
    record({ status: 'UNDERPRICE' }),
  ]);

  assert.equal(summary.totalRecords, 4);
  assert.equal(summary.compliantCount, 2);
  assert.equal(summary.overpriceCount, 1);
  assert.equal(summary.underpriceCount, 1);
  assert.equal(summary.complianceRate, 50);
});

test('buildReportSummary averages prices and tracks the range', () => {
  const summary = buildReportSummary([
    record({ price: 10 }),
    record({ price: 20 }),
    record({ price: 60 }),
  ]);

  assert.equal(summary.averagePrice, 30);
  assert.equal(summary.lowestPrice, 10);
  assert.equal(summary.highestPrice, 60);
});

test('buildReportSummary counts distinct commodities and stores, ignoring null stores', () => {
  const summary = buildReportSummary([
    record({ commodityId: RICE, storeId: 'store-1' }),
    record({ commodityId: RICE, storeId: 'store-1' }),
    record({ commodityId: SUGAR, storeId: 'store-2' }),
    record({ commodityId: SUGAR, storeId: null }),
  ]);

  assert.equal(summary.commodityCount, 2);
  assert.equal(summary.storeCount, 2);
});

/* -- groupRowsByCommodity (MONTHLY) -- */

test('groupRowsByCommodity splits rows into one group per commodity, sorted by name', () => {
  const groups = groupRowsByCommodity([
    row({ commodityId: SUGAR, commodity: 'Sugar' }),
    row({ commodityId: RICE, commodity: 'Rice' }),
    row({ commodityId: RICE, commodity: 'Rice' }),
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].commodity, 'Rice');
  assert.equal(groups[0].rows.length, 2);
  assert.equal(groups[1].commodity, 'Sugar');
  assert.equal(groups[1].rows.length, 1);
});

test('groupRowsByCommodity computes a correct subtotal per group', () => {
  const groups = groupRowsByCommodity([
    row({ commodityId: RICE, price: 40, status: 'COMPLIANT' }),
    row({ commodityId: RICE, price: 60, status: 'OVERPRICE' }),
    row({ commodityId: RICE, price: 30, status: 'UNDERPRICE' }),
  ]);

  assert.equal(groups[0].subtotal.count, 3);
  assert.equal(groups[0].subtotal.averagePrice, (40 + 60 + 30) / 3);
  assert.equal(groups[0].subtotal.compliantCount, 1);
  assert.equal(groups[0].subtotal.overpriceCount, 1);
  assert.equal(groups[0].subtotal.underpriceCount, 1);
});

/* -- buildComplianceReport (SRP_COMPLIANCE) -- */

test('buildComplianceReport ranks stores worst compliance rate first', () => {
  const report = buildComplianceReport([
    row({ storeId: 'store-good', store: 'Good Store', status: 'COMPLIANT' }),
    row({ storeId: 'store-good', store: 'Good Store', status: 'COMPLIANT' }),
    row({ storeId: 'store-bad', store: 'Bad Store', status: 'OVERPRICE' }),
    row({ storeId: 'store-bad', store: 'Bad Store', status: 'COMPLIANT' }),
  ]);

  assert.equal(report.storeCompliance[0].store, 'Bad Store');
  assert.equal(report.storeCompliance[0].complianceRate, 50);
  assert.equal(report.storeCompliance[1].store, 'Good Store');
  assert.equal(report.storeCompliance[1].complianceRate, 100);
});

test('buildComplianceReport lists only OVERPRICE rows as violations, worst variance first', () => {
  const report = buildComplianceReport([
    row({ status: 'COMPLIANT', variance: 0 }),
    row({ status: 'UNDERPRICE', variance: -5 }),
    row({ status: 'OVERPRICE', variance: 3, commodity: 'Small overage' }),
    row({ status: 'OVERPRICE', variance: 12, commodity: 'Big overage' }),
  ]);

  assert.equal(report.violations.length, 2);
  assert.equal(report.violations[0].commodity, 'Big overage');
  assert.equal(report.violations[1].commodity, 'Small overage');
});

test('buildComplianceReport counts compliant and below-SRP rows without itemizing them', () => {
  const report = buildComplianceReport([
    row({ status: 'COMPLIANT' }),
    row({ status: 'COMPLIANT' }),
    row({ status: 'UNDERPRICE' }),
    row({ status: 'OVERPRICE' }),
  ]);

  assert.equal(report.compliantCount, 2);
  assert.equal(report.underpriceCount, 1);
  assert.equal(report.violations.length, 1);
});

/* -- buildTrendReport (TREND) -- */

test('buildTrendReport buckets rows into weekly averages per commodity', () => {
  const trends = buildTrendReport([
    row({ dateAndTime: new Date('2026-01-05T00:00:00Z'), price: 40 }), // Monday
    row({ dateAndTime: new Date('2026-01-06T00:00:00Z'), price: 60 }), // same week
    row({ dateAndTime: new Date('2026-01-12T00:00:00Z'), price: 50 }), // next week
  ]);

  assert.equal(trends.length, 1);
  assert.equal(trends[0].points.length, 2);
  assert.equal(trends[0].points[0].averagePrice, 50);
  assert.equal(trends[0].points[0].recordCount, 2);
  assert.equal(trends[0].points[1].averagePrice, 50);
  assert.equal(trends[0].points[1].recordCount, 1);
});

test('buildTrendReport computes movement of the last week against the first', () => {
  const trends = buildTrendReport([
    row({ dateAndTime: new Date('2026-01-05T00:00:00Z'), price: 50 }),
    row({ dateAndTime: new Date('2026-01-19T00:00:00Z'), price: 55 }),
  ]);

  assert.equal(trends[0].periodStartPrice, 50);
  assert.equal(trends[0].periodEndPrice, 55);
  assert.equal(trends[0].movementPercent, 10);
});

test('buildTrendReport returns a flat, defined trend for a single week of data', () => {
  const trends = buildTrendReport([
    row({ dateAndTime: new Date('2026-01-05T00:00:00Z'), price: 50 }),
    row({ dateAndTime: new Date('2026-01-06T00:00:00Z'), price: 50 }),
  ]);

  assert.equal(trends[0].points.length, 1);
  assert.equal(trends[0].movementPercent, 0);
});

test('buildTrendReport sorts commodities alphabetically and never crosses them', () => {
  const trends = buildTrendReport([
    row({ commodityId: SUGAR, commodity: 'Sugar', dateAndTime: new Date('2026-01-05T00:00:00Z') }),
    row({ commodityId: RICE, commodity: 'Rice', dateAndTime: new Date('2026-01-05T00:00:00Z') }),
  ]);

  assert.equal(trends.length, 2);
  assert.equal(trends[0].commodity, 'Rice');
  assert.equal(trends[1].commodity, 'Sugar');
});
