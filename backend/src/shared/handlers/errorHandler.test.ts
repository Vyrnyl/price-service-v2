import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import AppError from '../utils/AppError';

function mockResponse() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

const req = {} as Request;
const next = (() => {}) as NextFunction;

function knownRequestError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('mock prisma error', {
    code,
    clientVersion: '7.8.0',
    meta,
  });
}

function driverAdapterError(pgCode: string) {
  const err = new Error('mock driver adapter error');
  err.name = 'DriverAdapterError';
  (err as unknown as { cause: { code: string } }).cause = { code: pgCode };
  return err;
}

test('AppError passes through its own status and message', () => {
  const res = mockResponse();
  errorHandler(new AppError('Invalid email or password', 401), req, res, next);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { success: false, message: 'Invalid email or password' });
});

test('ZodError maps to 400 with validation issues', () => {
  const res = mockResponse();
  const result = z.object({ name: z.string() }).safeParse({});
  errorHandler(result.error, req, res, next);

  assert.equal(res.statusCode, 400);
  assert.equal((res.body as { message: string }).message, 'Validation failed');
});

test('P2002 (unique constraint) maps to 409 naming the field', () => {
  const res = mockResponse();
  errorHandler(knownRequestError('P2002', { target: ['email'] }), req, res, next);

  assert.equal(res.statusCode, 409);
  assert.equal((res.body as { message: string }).message, 'email already exists');
});

test('P2025 (record not found) maps to 404', () => {
  const res = mockResponse();
  errorHandler(knownRequestError('P2025'), req, res, next);

  assert.equal(res.statusCode, 404);
});

test('P2003 (foreign key constraint failed) maps to 409, not 500', () => {
  const res = mockResponse();
  errorHandler(knownRequestError('P2003'), req, res, next);

  assert.equal(res.statusCode, 409);
  assert.match((res.body as { message: string }).message, /reference/i);
});

test('a raw DriverAdapterError for a RESTRICT violation (23001) maps to 409, not 500 — B-53', () => {
  const res = mockResponse();
  errorHandler(driverAdapterError('23001'), req, res, next);

  assert.equal(res.statusCode, 409);
  assert.match((res.body as { message: string }).message, /reference/i);
});

test('a raw DriverAdapterError for a plain foreign key violation (23503) maps to 409', () => {
  const res = mockResponse();
  errorHandler(driverAdapterError('23503'), req, res, next);

  assert.equal(res.statusCode, 409);
});

test('a DriverAdapterError with an unrelated Postgres code still falls through to 500', () => {
  const res = mockResponse();
  errorHandler(driverAdapterError('08003'), req, res, next);

  assert.equal(res.statusCode, 500);
});

test('an unrecognized error falls back to a generic 500', () => {
  const res = mockResponse();
  errorHandler(new Error('boom'), req, res, next);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { success: false, message: 'Internal Server Error' });
});
