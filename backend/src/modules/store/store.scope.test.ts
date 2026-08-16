import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStoreScope } from './store.scope';

test('officers only see their own stores', () => {
  const scope = resolveStoreScope({
    userId: 'officer-123',
    role: 'OFFICER',
    email: 'officer@example.com',
  });

  assert.deepEqual(scope, { userId: 'officer-123' });
});

test('admins get an unscoped query for all stores', () => {
  const scope = resolveStoreScope({
    userId: 'admin-123',
    role: 'ADMIN',
    email: 'admin@example.com',
  });

  assert.deepEqual(scope, {});
});

test('unauthenticated requests resolve to no scope at all (no DB call)', () => {
  const scope = resolveStoreScope(undefined);

  assert.equal(scope, null);
});
