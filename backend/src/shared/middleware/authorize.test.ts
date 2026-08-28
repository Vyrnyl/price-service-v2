import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from './authorize';
import type { Request, Response, NextFunction } from 'express';

function mockReq(role?: 'ADMIN' | 'OFFICER'): Request {
  return {
    user: role ? { userId: 'u-1', email: 'u@example.com', role } : undefined,
  } as Request;
}

test('allows a user whose role is in the allow-list', () => {
  let called = false;
  const next: NextFunction = () => {
    called = true;
  };

  authorize('ADMIN', 'OFFICER')(mockReq('OFFICER'), {} as Response, next);

  assert.equal(called, true);
});

test('rejects a user whose role is not in the allow-list', () => {
  const next: NextFunction = () => {
    throw new Error('next should not be called');
  };

  assert.throws(
    () => authorize('ADMIN')(mockReq('OFFICER'), {} as Response, next),
    /Forbidden/,
  );
});

test('rejects an unauthenticated request', () => {
  const next: NextFunction = () => {
    throw new Error('next should not be called');
  };

  assert.throws(
    () => authorize('ADMIN', 'OFFICER')(mockReq(), {} as Response, next),
    /Forbidden/,
  );
});
