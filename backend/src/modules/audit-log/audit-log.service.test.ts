import test from 'node:test';
import assert from 'node:assert/strict';
import { toAuditLogEntryDto } from './audit-log.service';
import type { AuditLogWithActor } from './audit-log.types';

function entry(overrides: Partial<AuditLogWithActor> = {}): AuditLogWithActor {
  return {
    id: 'log-1',
    actorId: 'user-1',
    action: 'LOGIN',
    targetId: null,
    metadata: null,
    createdAt: new Date('2026-08-14T08:00:00.000Z'),
    user: {
      id: 'user-1',
      name: 'Maria Santos',
      email: 'admin@presyoserbisyo.gov.ph',
      password: 'hashed',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    ...overrides,
  } as AuditLogWithActor;
}

test('toAuditLogEntryDto flattens the actor relation onto the entry', () => {
  const dto = toAuditLogEntryDto(entry());

  assert.equal(dto.id, 'log-1');
  assert.equal(dto.actorId, 'user-1');
  assert.equal(dto.actorName, 'Maria Santos');
  assert.equal(dto.actorEmail, 'admin@presyoserbisyo.gov.ph');
  assert.equal(dto.actorRole, 'ADMIN');
  assert.equal(dto.action, 'LOGIN');
  assert.equal(dto.targetId, null);
});

test('toAuditLogEntryDto preserves targetId and metadata when present', () => {
  const dto = toAuditLogEntryDto(
    entry({
      action: 'PRICE_RECORD_DELETE',
      targetId: 'record-42',
      metadata: { commodity: 'Rice', store: 'Virac Public Market' },
    }),
  );

  assert.equal(dto.action, 'PRICE_RECORD_DELETE');
  assert.equal(dto.targetId, 'record-42');
  assert.deepEqual(dto.metadata, { commodity: 'Rice', store: 'Virac Public Market' });
});
