import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD,
  getManilaDateString,
  getMaxSrpEffectiveDateString,
  isSrpEffectiveDateWithinWindow,
} from './srp-effective-date';

// Fixed reference instant so every test is independent of when it actually runs.
// 2026-06-15T10:00:00Z is 2026-06-15T18:00:00+08:00 in Asia/Manila -- safely
// mid-day in both zones, no date-boundary ambiguity in the reference itself.
const REFERENCE = new Date('2026-06-15T10:00:00.000Z');

test('getManilaDateString reads the Asia/Manila calendar day, not UTC', () => {
  // 2026-06-15T23:00:00Z is already 2026-06-16 in Manila (UTC+8) -- a case
  // where naively using the server's UTC date would be wrong.
  const lateUtc = new Date('2026-06-15T23:00:00.000Z');
  assert.equal(getManilaDateString(lateUtc), '2026-06-16');
});

test('getMaxSrpEffectiveDateString is exactly N days ahead of the Manila today', () => {
  assert.equal(getMaxSrpEffectiveDateString(REFERENCE), '2026-06-22');
  assert.equal(SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD, 7);
});

test('isSrpEffectiveDateWithinWindow allows today', () => {
  assert.equal(isSrpEffectiveDateWithinWindow(new Date('2026-06-15T02:00:00.000Z'), REFERENCE), true);
});

test('isSrpEffectiveDateWithinWindow allows the exact boundary (today + 7 days)', () => {
  assert.equal(isSrpEffectiveDateWithinWindow(new Date('2026-06-22T02:00:00.000Z'), REFERENCE), true);
});

test('isSrpEffectiveDateWithinWindow rejects one day past the boundary', () => {
  assert.equal(isSrpEffectiveDateWithinWindow(new Date('2026-06-23T02:00:00.000Z'), REFERENCE), false);
});

test('isSrpEffectiveDateWithinWindow allows a far-past date (backdated correction)', () => {
  assert.equal(isSrpEffectiveDateWithinWindow(new Date('2020-01-01T00:00:00.000Z'), REFERENCE), true);
});
