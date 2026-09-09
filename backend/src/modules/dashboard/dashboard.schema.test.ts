import test from 'node:test';
import assert from 'node:assert/strict';
import { storeViolationsQuerySchema } from './dashboard.schema';

/**
 * These pin the boundary that made the Store Compliance date filter silently
 * drop its final day: a date-only `endDate` coerces to midnight, so every record
 * logged during that day fell outside the range. On the live dataset that hid
 * 374 of 403 records behind an end date the user had explicitly selected.
 */

test('a date-only endDate covers the whole day, not just its first instant', () => {
  const { endDate } = storeViolationsQuerySchema.parse({ endDate: '2026-09-02' });

  assert.equal(endDate?.toISOString(), '2026-09-02T23:59:59.999Z');
});

test('the endDate boundary is UTC, so a UTC+8 server does not cut the day short', () => {
  const { endDate } = storeViolationsQuerySchema.parse({ endDate: '2026-09-02' });

  // A local-time boundary on a UTC+8 host would land at 15:59:59Z and exclude
  // everything logged later that day.
  assert.equal(endDate?.getUTCHours(), 23);
  assert.equal(endDate?.getUTCDate(), 2);
});

test('an explicit endDate timestamp is left exactly as the caller gave it', () => {
  const { endDate } = storeViolationsQuerySchema.parse({ endDate: '2026-09-02T10:30:00Z' });

  assert.equal(endDate?.toISOString(), '2026-09-02T10:30:00.000Z');
});

test('startDate stays at the start of its day so the range is inclusive at both ends', () => {
  const { startDate } = storeViolationsQuerySchema.parse({ startDate: '2026-06-01' });

  assert.equal(startDate?.toISOString(), '2026-06-01T00:00:00.000Z');
});

test('omitted and empty range values are both treated as no filter', () => {
  // Zod drops absent optionals rather than setting them to undefined; either way
  // the repository sees no bound and falls back to its default window.
  const omitted = storeViolationsQuerySchema.parse({});
  assert.equal(omitted.startDate, undefined);
  assert.equal(omitted.endDate, undefined);

  const blank = storeViolationsQuerySchema.parse({ startDate: '', endDate: '' });
  assert.equal(blank.startDate, undefined);
  assert.equal(blank.endDate, undefined);
});

test('an unparseable date is rejected rather than silently ignored', () => {
  assert.throws(() => storeViolationsQuerySchema.parse({ endDate: 'not-a-date' }));
});
