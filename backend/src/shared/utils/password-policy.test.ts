import test from 'node:test';
import assert from 'node:assert/strict';
import { isPasswordComplex } from './password-policy';

test('rejects an all-lowercase password with no digit', () => {
  assert.equal(isPasswordComplex('password'), false);
});

test('rejects an all-digit password', () => {
  assert.equal(isPasswordComplex('12345678'), false);
});

test('rejects a password missing an uppercase letter', () => {
  assert.equal(isPasswordComplex('password123'), false);
});

test('accepts a password with lowercase, uppercase, and a digit', () => {
  assert.equal(isPasswordComplex('Password123'), true);
});
