import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportSummary,
  resolveSrpAt,
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
