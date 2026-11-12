import test from 'node:test';
import assert from 'node:assert/strict';
import { createCategorySchema } from './category.schema';

test('a category can store one of the known icon keys', () => {
  const parsed = createCategorySchema.parse({ name: 'Bread - Loaf', iconKey: 'bread' });

  assert.equal(parsed.iconKey, 'bread');
});

test('an empty icon key means Automatic and is stored as null', () => {
  const parsed = createCategorySchema.parse({ name: 'Bread - Loaf', iconKey: '' });

  assert.equal(parsed.iconKey, null);
});

test('omitting the icon key leaves it undefined, so an update does not touch it', () => {
  const parsed = createCategorySchema.parse({ name: 'Bread - Loaf' });

  assert.equal(parsed.iconKey, undefined);
});

test('an unknown icon key is rejected', () => {
  assert.throws(() => createCategorySchema.parse({ name: 'Bread - Loaf', iconKey: 'rocket' }));
});
