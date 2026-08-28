import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDashboardScope } from './dashboard.scope';

test('officers only see analytics for their own price records', () => {
  const scope = resolveDashboardScope({
    userId: 'officer-123',
    role: 'OFFICER',
    email: 'officer@example.com',
  });

  assert.deepEqual(scope, { userId: 'officer-123' });
});

test('admins see analytics across all price records', () => {
  const scope = resolveDashboardScope({
    userId: 'admin-123',
    role: 'ADMIN',
    email: 'admin@example.com',
  });

  assert.equal(scope, undefined);
});

test('unauthenticated requests resolve to no scope', () => {
  const scope = resolveDashboardScope(undefined);

  assert.equal(scope, undefined);
});
