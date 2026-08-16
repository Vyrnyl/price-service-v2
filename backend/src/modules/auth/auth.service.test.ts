import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from './auth.service';
import { userRepository } from '../user';
import { auditLogService } from '../audit-log';
import { env } from '../../config/env';
import AppError from '../../shared/utils/AppError';

const baseUser = {
  id: 'user-1',
  name: 'DTI Officer',
  email: 'officer@example.com',
  password: 'hashed-password',
  role: 'OFFICER' as const,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function isAppError(error: unknown, statusCode: number, message: string): boolean {
  return error instanceof AppError && error.statusCode === statusCode && error.message === message;
}

test('rejects a login for an email that does not exist', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => null);

  await assert.rejects(
    () => authService.login({ email: 'nobody@example.com', password: 'whatever' }),
    (error: unknown) => isAppError(error, 401, 'Invalid email or password'),
  );
});

test('rejects a login with the wrong password', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => baseUser);
  t.mock.method(bcrypt, 'compare', async () => false);

  await assert.rejects(
    () => authService.login({ email: baseUser.email, password: 'wrong-password' }),
    (error: unknown) => isAppError(error, 401, 'Invalid email or password'),
  );
});

test('rejects a login for an inactive account', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => ({ ...baseUser, isActive: false }));
  t.mock.method(bcrypt, 'compare', async () => true);

  await assert.rejects(
    () => authService.login({ email: baseUser.email, password: 'correct-password' }),
    (error: unknown) => isAppError(error, 403, 'Account is inactive'),
  );
});

test('rejects a login for a role outside the allow-list', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => ({ ...baseUser, role: 'PUBLIC' as unknown as 'OFFICER' }));
  t.mock.method(bcrypt, 'compare', async () => true);

  await assert.rejects(
    () => authService.login({ email: baseUser.email, password: 'correct-password' }),
    (error: unknown) => isAppError(error, 401, 'Invalid email or password'),
  );
});

test('logs a successful login, records an audit entry, and stamps lastLoginAt', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => baseUser);
  t.mock.method(bcrypt, 'compare', async () => true);
  const recordMock = t.mock.method(auditLogService, 'record', async () => undefined);
  const updateMock = t.mock.method(userRepository, 'update', async () => baseUser);

  const result = await authService.login({ email: baseUser.email, password: 'correct-password' });

  assert.equal(result.user.id, baseUser.id);
  assert.equal(result.user.email, baseUser.email);
  assert.equal(result.user.role, baseUser.role);
  assert.equal('password' in result.user, false);

  const decoded = jwt.verify(result.accessToken, env.JWT_SECRET) as { userId: string; role: string };
  assert.equal(decoded.userId, baseUser.id);
  assert.equal(decoded.role, baseUser.role);

  assert.equal(recordMock.mock.calls.length, 1);
  assert.deepEqual(recordMock.mock.calls[0]!.arguments[0], { actorId: baseUser.id, action: 'LOGIN' });

  assert.equal(updateMock.mock.calls.length, 1);
  assert.equal(updateMock.mock.calls[0]!.arguments[0], baseUser.id);
  assert.ok(updateMock.mock.calls[0]!.arguments[1]!.lastLoginAt instanceof Date);
});
