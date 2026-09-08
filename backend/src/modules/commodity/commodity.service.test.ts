import test from 'node:test';
import assert from 'node:assert/strict';
import { commodityService } from './commodity.service';
import { commodityRepository } from './commodity.repository';
import AppError from '../../shared/utils/AppError';

function isAppError(error: unknown, statusCode: number): boolean {
  return error instanceof AppError && error.statusCode === statusCode;
}

test('createCommodity rejects a case-insensitive duplicate name before writing anything', async (t) => {
  t.mock.method(commodityRepository, 'findByNameCaseInsensitive', async () => ({
    id: 'existing-1',
    name: 'Rice',
  }));
  const createMock = t.mock.method(commodityRepository, 'create', async () => {
    throw new Error('should not be called');
  });

  await assert.rejects(
    () =>
      commodityService.createCommodity({
        name: 'RICE',
        status: 'Active',
        categoryId: 'cat-1',
      }),
    (error: unknown) => isAppError(error, 409),
  );
  assert.equal(createMock.mock.calls.length, 0);
});

test('createCommodity proceeds when the name is available', async (t) => {
  t.mock.method(commodityRepository, 'findByNameCaseInsensitive', async () => null);
  const createMock = t.mock.method(commodityRepository, 'create', async (data: unknown) => ({
    id: 'new-1',
    ...(data as object),
  }));

  await commodityService.createCommodity({
    name: 'New Commodity',
    status: 'Active',
    categoryId: 'cat-1',
  });

  assert.equal(createMock.mock.calls.length, 1);
});

test('updateCommodity rejects renaming into a name another commodity already has', async (t) => {
  t.mock.method(commodityRepository, 'findByNameCaseInsensitive', async () => ({
    id: 'other-commodity',
    name: 'Rice',
  }));
  const updateMock = t.mock.method(commodityRepository, 'update', async () => {
    throw new Error('should not be called');
  });

  await assert.rejects(
    () => commodityService.updateCommodity('this-commodity', { name: 'rice' }),
    (error: unknown) => isAppError(error, 409),
  );
  assert.equal(updateMock.mock.calls.length, 0);
});

test('updateCommodity allows keeping its own name unchanged (same id, same or re-cased name)', async (t) => {
  t.mock.method(commodityRepository, 'findByNameCaseInsensitive', async () => ({
    id: 'this-commodity',
    name: 'Rice',
  }));
  const updateMock = t.mock.method(commodityRepository, 'update', async () => ({
    id: 'this-commodity',
    name: 'RICE',
  }));

  await commodityService.updateCommodity('this-commodity', { name: 'RICE' });

  assert.equal(updateMock.mock.calls.length, 1);
});

test('updateCommodity skips the name check entirely when name is not part of the update', async (t) => {
  const findMock = t.mock.method(commodityRepository, 'findByNameCaseInsensitive', async () => null);
  const updateMock = t.mock.method(commodityRepository, 'update', async () => ({ id: 'this-commodity' }));

  await commodityService.updateCommodity('this-commodity', { status: 'Inactive' });

  assert.equal(findMock.mock.calls.length, 0);
  assert.equal(updateMock.mock.calls.length, 1);
});
