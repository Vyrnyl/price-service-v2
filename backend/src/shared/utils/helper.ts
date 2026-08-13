import type { ZodType } from "zod";
import AppError from "./AppError";

export const parseOrThrow = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(result.error.message, 400);
  }
  return result.data;
};
