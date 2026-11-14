import test from 'node:test';
import assert from 'node:assert/strict';
import AppError from '../../shared/utils/AppError';
import { resolvePriceStatus } from './price-record.repository';

const day = new Date('2026-11-14T00:00:00.000Z');

test('a price is judged against the SRP in force', () => {
  assert.equal(resolvePriceStatus(13, 12, day, true), 'OVERPRICE');
  assert.equal(resolvePriceStatus(11, 12, day, true), 'UNDERPRICE');
  assert.equal(resolvePriceStatus(12, 12, day, true), 'COMPLIANT');
});

test('a commodity with no SRP in force is refused when an SRP is required', () => {
  assert.throws(
    () => resolvePriceStatus(13, null, day, true),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message === 'No SRP in force on Nov 14, 2026 yet. Add the SRP on Commodities first.',
  );
});

test('the date in the message is the Manila calendar day', () => {
  // 16:00 UTC on Nov 13 is midnight Nov 14 in Manila (datetime mode).
  assert.throws(
    () => resolvePriceStatus(13, null, new Date('2026-11-13T16:00:00.000Z'), true),
    /Nov 14, 2026/,
  );
});

test('without the requirement, no SRP still saves as COMPLIANT', () => {
  assert.equal(resolvePriceStatus(13, null, day, false), 'COMPLIANT');
});
