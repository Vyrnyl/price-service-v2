import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPriceRecordSchema,
  listPriceRecordsQuerySchema,
  updatePriceRecordSchema,
} from './price-record.schema';

const CATEGORY_ID = '3f1c2b7e-8a4d-4c1e-9b2a-5d6e7f8a9b0c';

test('price-record list accepts a categoryId filter', () => {
  const query = listPriceRecordsQuerySchema.parse({ categoryId: CATEGORY_ID });

  assert.equal(query.categoryId, CATEGORY_ID);
});

test('an empty categoryId means all categories', () => {
  const query = listPriceRecordsQuerySchema.parse({ categoryId: '' });

  assert.equal(query.categoryId, undefined);
});

test('a malformed categoryId is rejected before it reaches the database', () => {
  assert.throws(() => listPriceRecordsQuerySchema.parse({ categoryId: 'not-a-uuid' }));
});

// Date range (2026-11-14): dateAndTime is the start, periodEnd the end.
const BASE_RECORD = {
  commodityId: CATEGORY_ID,
  storeId: CATEGORY_ID,
  price: 13,
  dateAndTime: '2026-01-05T00:00:00.000Z',
};

test('a price record may carry a date range end', () => {
  const record = createPriceRecordSchema.parse({ ...BASE_RECORD, periodEnd: '2026-02-20T00:00:00.000Z' });

  assert.equal(record.periodEnd?.toISOString(), '2026-02-20T00:00:00.000Z');
});

test('a record without a range end is a single date and time', () => {
  assert.equal(createPriceRecordSchema.parse(BASE_RECORD).periodEnd, undefined);
});

test('a range end before the start is rejected', () => {
  assert.throws(() => createPriceRecordSchema.parse({ ...BASE_RECORD, periodEnd: '2026-01-04T00:00:00.000Z' }));
  assert.throws(() =>
    updatePriceRecordSchema.parse({ dateAndTime: BASE_RECORD.dateAndTime, periodEnd: '2026-01-04T00:00:00.000Z' }),
  );
});

test('a one-day range (end equals start) is allowed', () => {
  assert.doesNotThrow(() => createPriceRecordSchema.parse({ ...BASE_RECORD, periodEnd: BASE_RECORD.dateAndTime }));
});

test('null or "" clears the range end instead of becoming 1970', () => {
  assert.equal(updatePriceRecordSchema.parse({ periodEnd: null }).periodEnd, null);
  assert.equal(updatePriceRecordSchema.parse({ periodEnd: '' }).periodEnd, null);
});

test('a malformed range end is rejected', () => {
  assert.throws(() => updatePriceRecordSchema.parse({ periodEnd: 'not-a-date' }));
});
