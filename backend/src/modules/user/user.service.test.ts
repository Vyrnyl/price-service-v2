import test from 'node:test';
import assert from 'node:assert/strict';
import { userService } from './user.service';
import { userRepository, type CreateUserInput } from './user.repository';
import { passwordUtils } from '../../shared/utils/password.utils';
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

test('createUser rejects a duplicate email before hashing anything', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => baseUser);
  const hashMock = t.mock.method(passwordUtils, 'hashPassword', async () => 'should-not-be-called');

  await assert.rejects(
    () =>
      userService.createUser({
        name: 'New Officer',
        email: baseUser.email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'OFFICER',
      }),
    (error: unknown) => isAppError(error, 409, 'Email already exists'),
  );
  assert.equal(hashMock.mock.calls.length, 0);
});

test('createUser hashes the password and strips confirmPassword before persisting', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => null);
  t.mock.method(passwordUtils, 'hashPassword', async () => 'hashed-value');
  const createMock = t.mock.method(userRepository, 'create', async (data: CreateUserInput) => ({
    ...baseUser,
    ...data,
  }));

  const result = await userService.createUser({
    name: 'New Officer',
    email: 'new@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'OFFICER',
  });

  const persisted = createMock.mock.calls[0]!.arguments[0];
  assert.equal(persisted.password, 'hashed-value');
  assert.equal('confirmPassword' in persisted, false);
  assert.equal('password' in result, false);
});

test('updateUser rejects reassigning an email already taken by a different user', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => ({ ...baseUser, id: 'someone-else' }));

  await assert.rejects(
    () => userService.updateUser(baseUser.id, { email: 'taken@example.com' }),
    (error: unknown) => isAppError(error, 409, 'Email already exists'),
  );
});

test('updateUser allows a user to keep their own current email', async (t) => {
  t.mock.method(userRepository, 'findByEmail', async () => baseUser);
  const updateMock = t.mock.method(userRepository, 'update', async () => baseUser);

  await userService.updateUser(baseUser.id, { email: baseUser.email });

  assert.equal(updateMock.mock.calls.length, 1);
});

test('changePassword rejects when the current password is wrong', async (t) => {
  t.mock.method(userRepository, 'findById', async () => baseUser);
  t.mock.method(passwordUtils, 'comparePassword', async () => false);
  const updateMock = t.mock.method(userRepository, 'update', async () => baseUser);

  await assert.rejects(
    () =>
      userService.changePassword(baseUser.id, {
        currentPassword: 'wrong',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      }),
    (error: unknown) => isAppError(error, 401, 'Current password is incorrect'),
  );
  assert.equal(updateMock.mock.calls.length, 0);
});

test('changePassword hashes and persists the new password on success', async (t) => {
  t.mock.method(userRepository, 'findById', async () => baseUser);
  t.mock.method(passwordUtils, 'comparePassword', async () => true);
  t.mock.method(passwordUtils, 'hashPassword', async () => 'new-hashed-value');
  const updateMock = t.mock.method(userRepository, 'update', async () => baseUser);

  await userService.changePassword(baseUser.id, {
    currentPassword: 'correct',
    newPassword: 'NewPassword123!',
    confirmNewPassword: 'NewPassword123!',
  });

  assert.equal(updateMock.mock.calls.length, 1);
  assert.equal(updateMock.mock.calls[0]!.arguments[1]!.password, 'new-hashed-value');
});
