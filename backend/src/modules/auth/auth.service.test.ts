import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from './auth.service';
import { authRepository } from './auth.repository';
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

function mockRefreshTokenIssuance(t: import('node:test').TestContext) {
  return t.mock.method(authRepository, 'createRefreshToken', async () => ({}) as never);
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

test('logs a successful login, records an audit entry, stamps lastLoginAt, and issues a refresh token', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => baseUser);
  t.mock.method(bcrypt, 'compare', async () => true);
  const recordMock = t.mock.method(auditLogService, 'record', async () => undefined);
  const updateMock = t.mock.method(userRepository, 'update', async () => baseUser);
  const createRefreshTokenMock = mockRefreshTokenIssuance(t);

  const result = await authService.login({ email: baseUser.email, password: 'correct-password' });

  assert.equal(result.user.id, baseUser.id);
  assert.equal(result.user.email, baseUser.email);
  assert.equal(result.user.role, baseUser.role);
  assert.equal('password' in result.user, false);

  const decoded = jwt.verify(result.accessToken, env.JWT_SECRET) as { userId: string; role: string };
  assert.equal(decoded.userId, baseUser.id);
  assert.equal(decoded.role, baseUser.role);

  assert.ok(typeof result.refreshToken === 'string' && result.refreshToken.length > 0);

  assert.equal(recordMock.mock.calls.length, 1);
  assert.deepEqual(recordMock.mock.calls[0]!.arguments[0], { actorId: baseUser.id, action: 'LOGIN' });

  assert.equal(updateMock.mock.calls.length, 1);
  assert.equal(updateMock.mock.calls[0]!.arguments[0], baseUser.id);
  assert.ok(updateMock.mock.calls[0]!.arguments[1]!.lastLoginAt instanceof Date);

  assert.equal(createRefreshTokenMock.mock.calls.length, 1);
  const issued = createRefreshTokenMock.mock.calls[0]!.arguments[0] as {
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
  };
  assert.equal(issued.userId, baseUser.id);
  assert.ok(issued.expiresAt.getTime() > Date.now());
});

test('refresh rejects an unknown token', async (t) => {
  t.mock.method(authRepository, 'findRefreshTokenByHash', async () => null);

  await assert.rejects(
    () => authService.refresh('unknown-token'),
    (error: unknown) => isAppError(error, 401, 'Invalid refresh token'),
  );
});

test('refresh rejects an expired token', async (t) => {
  t.mock.method(authRepository, 'findRefreshTokenByHash', async () => ({
    id: 'rt-1',
    userId: baseUser.id,
    familyId: 'family-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() - 1000),
    revokedAt: null,
    createdAt: new Date(),
  }));

  await assert.rejects(
    () => authService.refresh('expired-token'),
    (error: unknown) => isAppError(error, 401, 'Refresh token expired'),
  );
});

test('refresh detects reuse of an already-rotated token and revokes the whole family', async (t) => {
  t.mock.method(authRepository, 'findRefreshTokenByHash', async () => ({
    id: 'rt-1',
    userId: baseUser.id,
    familyId: 'family-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: new Date(),
    createdAt: new Date(),
  }));
  const revokeFamilyMock = t.mock.method(authRepository, 'revokeFamily', async () => ({ count: 1 }));

  await assert.rejects(
    () => authService.refresh('reused-token'),
    (error: unknown) => isAppError(error, 401, 'Invalid refresh token'),
  );

  assert.equal(revokeFamilyMock.mock.calls.length, 1);
  assert.equal(revokeFamilyMock.mock.calls[0]!.arguments[0], 'family-1');
});

test('refresh rotates a valid token: old token revoked, new token issued in the same family', async (t) => {
  const existing = {
    id: 'rt-1',
    userId: baseUser.id,
    familyId: 'family-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    createdAt: new Date(),
  };
  t.mock.method(authRepository, 'findRefreshTokenByHash', async () => existing);
  t.mock.method(userRepository, 'findById', async () => baseUser);
  const revokeTokenMock = t.mock.method(authRepository, 'revokeToken', async () => ({}) as never);
  const createRefreshTokenMock = mockRefreshTokenIssuance(t);

  const result = await authService.refresh('valid-token');

  assert.equal(revokeTokenMock.mock.calls.length, 1);
  assert.equal(revokeTokenMock.mock.calls[0]!.arguments[0], 'rt-1');

  assert.equal(createRefreshTokenMock.mock.calls.length, 1);
  const issued = createRefreshTokenMock.mock.calls[0]!.arguments[0] as { familyId: string };
  assert.equal(issued.familyId, 'family-1');

  assert.equal(result.user.id, baseUser.id);
  assert.ok(typeof result.refreshToken === 'string' && result.refreshToken.length > 0);
});

test('refresh rejects a token belonging to a deactivated user', async (t) => {
  t.mock.method(authRepository, 'findRefreshTokenByHash', async () => ({
    id: 'rt-1',
    userId: baseUser.id,
    familyId: 'family-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    createdAt: new Date(),
  }));
  t.mock.method(userRepository, 'findById', async () => ({ ...baseUser, isActive: false }));

  await assert.rejects(
    () => authService.refresh('valid-token'),
    (error: unknown) => isAppError(error, 401, 'Invalid refresh token'),
  );
});

test('logout revokes the token family when a refresh token is presented', async (t) => {
  t.mock.method(authRepository, 'findRefreshTokenByHash', async () => ({
    id: 'rt-1',
    userId: baseUser.id,
    familyId: 'family-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    createdAt: new Date(),
  }));
  const revokeFamilyMock = t.mock.method(authRepository, 'revokeFamily', async () => ({ count: 1 }));

  await authService.logout('some-token');

  assert.equal(revokeFamilyMock.mock.calls.length, 1);
  assert.equal(revokeFamilyMock.mock.calls[0]!.arguments[0], 'family-1');
});

test('logout is a no-op when no refresh token is presented', async (t) => {
  const findMock = t.mock.method(authRepository, 'findRefreshTokenByHash', async () => null);

  await authService.logout(undefined);

  assert.equal(findMock.mock.calls.length, 0);
});
