import test from 'node:test';
import assert from 'node:assert/strict';
import { listCommoditiesQuerySchema } from './commodity.schema';

const CATEGORY_ID = '3f1c2b7e-8a4d-4c1e-9b2a-5d6e7f8a9b0c';

test('list query accepts a categoryId filter', () => {
  const query = listCommoditiesQuerySchema.parse({ categoryId: CATEGORY_ID });

  assert.equal(query.categoryId, CATEGORY_ID);
});

test('an empty categoryId means "all categories", not a validation error', () => {
  const query = listCommoditiesQuerySchema.parse({ categoryId: '' });

  assert.equal(query.categoryId, undefined);
});

test('a malformed categoryId is rejected before it reaches the database', () => {
  assert.throws(() => listCommoditiesQuerySchema.parse({ categoryId: 'not-a-uuid' }));
});
