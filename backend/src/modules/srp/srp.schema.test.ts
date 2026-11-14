import test from 'node:test';
import assert from 'node:assert/strict';
import { createSrpSchema, updateSrpSchema } from './srp.schema';

// SRP date range (2026-11-14): effectiveDate is the start, effectiveEndDate a label-only end.
const BASE_SRP = {
  commodityId: '3f1c2b7e-8a4d-4c1e-9b2a-5d6e7f8a9b0c',
  price: 12,
  effectiveDate: '2025-01-01',
};

test('an SRP may carry a date range end', () => {
  const srp = createSrpSchema.parse({ ...BASE_SRP, effectiveEndDate: '2025-12-31' });

  assert.equal(srp.effectiveEndDate?.toISOString(), '2025-12-31T00:00:00.000Z');
});

test('an SRP without an end date keeps a single effective date', () => {
  assert.equal(createSrpSchema.parse(BASE_SRP).effectiveEndDate, undefined);
});

test('an end date is not held to the 7-day effective-date window', () => {
  assert.doesNotThrow(() => createSrpSchema.parse({ ...BASE_SRP, effectiveEndDate: '2099-12-31' }));
});

test('an SRP end date before its effective date is rejected', () => {
  assert.throws(() => createSrpSchema.parse({ ...BASE_SRP, effectiveEndDate: '2024-12-31' }));
  assert.throws(() => updateSrpSchema.parse({ effectiveDate: '2025-01-01', effectiveEndDate: '2024-12-31' }));
});

test('a one-day SRP range (end equals start) is allowed', () => {
  assert.doesNotThrow(() => createSrpSchema.parse({ ...BASE_SRP, effectiveEndDate: BASE_SRP.effectiveDate }));
});

test('null or "" clears the SRP end date instead of becoming 1970', () => {
  assert.equal(updateSrpSchema.parse({ effectiveEndDate: null }).effectiveEndDate, null);
  assert.equal(updateSrpSchema.parse({ effectiveEndDate: '' }).effectiveEndDate, null);
});
