import test from 'node:test';
import assert from 'node:assert/strict';
import { toAdminUserDto, toUserProfileDto } from './user.types';
import type { User } from '@prisma/client';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Maria Santos',
    email: 'admin@presyoserbisyo.gov.ph',
    password: 'hashed-secret',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as User;
}

test('toUserProfileDto maps id/name/email/role', () => {
  const dto = toUserProfileDto(user());

  assert.equal(dto.id, 'user-1');
  assert.equal(dto.name, 'Maria Santos');
  assert.equal(dto.email, 'admin@presyoserbisyo.gov.ph');
  assert.equal(dto.role, 'ADMIN');
});

test('toUserProfileDto never includes the password hash', () => {
  const dto = toUserProfileDto(user());

  assert.equal('password' in dto, false);
});

test('toUserProfileDto reflects the OFFICER role', () => {
  const dto = toUserProfileDto(user({ role: 'OFFICER', name: 'Field Officer' }));

  assert.equal(dto.role, 'OFFICER');
  assert.equal(dto.name, 'Field Officer');
});

test('toAdminUserDto never includes the password hash', () => {
  const dto = toAdminUserDto(user());

  assert.equal('password' in dto, false);
});

test('toAdminUserDto includes isActive/createdAt/updatedAt for the admin table', () => {
  const dto = toAdminUserDto(user({ isActive: false }));

  assert.equal(dto.isActive, false);
  assert.deepEqual(dto.createdAt, new Date('2026-01-01T00:00:00.000Z'));
  assert.deepEqual(dto.updatedAt, new Date('2026-01-01T00:00:00.000Z'));
});
