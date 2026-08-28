import { Request, Response, NextFunction } from "express";
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import AppError from "../utils/AppError";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target.join(', ')
      : 'field';

    return res.status(409).json({
      success: false,
      message: `${target} already exists`,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete or update this record because other records still reference it.',
    });
  }

  // Prisma 7's driver-adapter layer (@prisma/adapter-pg) does not translate every
  // raw Postgres error into a PrismaClientKnownRequestError — a RESTRICT foreign
  // key violation (SQLSTATE 23001, or 23503 for a plain FK violation) surfaces as
  // an untranslated DriverAdapterError instead of P2003. Detected by duck type
  // rather than importing @prisma/driver-adapter-utils, which is only a
  // transitive dependency (via @prisma/adapter-pg), not one this app declares.
  if (err instanceof Error && err.name === 'DriverAdapterError') {
    const pgCode = (err as unknown as { cause?: { code?: string } }).cause?.code;

    if (pgCode === '23001' || pgCode === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete or update this record because other records still reference it.',
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};