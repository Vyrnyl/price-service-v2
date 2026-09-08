import test from 'node:test';
import assert from 'node:assert/strict';
import { describeStoreFilter } from './report.generator';
import type { ReportRow } from './report.summary';

function row(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    date: '01 Jan 2026',
    time: '09:00',
    dateAndTime: new Date('2026-01-01T09:00:00Z'),
    storeId: 'store-1',
    store: 'Store 1',
    location: 'Virac',
    commodityId: 'commodity-rice',
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

test('describeStoreFilter reads "All stores" when no store filter was applied', () => {
  assert.equal(describeStoreFilter(undefined, []), 'All stores');
  assert.equal(describeStoreFilter([], []), 'All stores');
});

test('describeStoreFilter names the single store when exactly one is selected', () => {
  const rows = [row({ store: 'ACC Hypermart' }), row({ store: 'ACC Hypermart' })];
  assert.equal(describeStoreFilter(['store-1'], rows), 'ACC Hypermart');
});

test('describeStoreFilter lists up to 2 names and counts the rest for 3+ stores', () => {
  const rows = [
    row({ store: 'ACC Hypermart' }),
    row({ store: 'ARDCIMART' }),
    row({ store: 'VIRAC LUCKY SUPERMART' }),
  ];
  assert.equal(
    describeStoreFilter(['s1', 's2', 's3'], rows),
    '3 stores: ACC Hypermart, ARDCIMART +1 more',
  );
});

test('describeStoreFilter lists both names for exactly 2 stores, no "+more" suffix', () => {
  const rows = [row({ store: 'ACC Hypermart' }), row({ store: 'ARDCIMART' })];
  assert.equal(describeStoreFilter(['s1', 's2'], rows), '2 stores: ACC Hypermart, ARDCIMART');
});

test('describeStoreFilter falls back to a generic label when the filter matched stores with no records in range', () => {
  assert.equal(describeStoreFilter(['s1'], []), 'Selected store');
  assert.equal(describeStoreFilter(['s1', 's2'], []), '2 selected stores');
});

test('describeStoreFilter de-duplicates repeated store names across rows', () => {
  const rows = [
    row({ store: 'ACC Hypermart' }),
    row({ store: 'ACC Hypermart' }),
    row({ store: 'ACC Hypermart' }),
  ];
  assert.equal(describeStoreFilter(['store-1'], rows), 'ACC Hypermart');
});
