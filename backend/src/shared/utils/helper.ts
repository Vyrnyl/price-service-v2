import AppError from "./AppError";

export const parseOrThrow = (schema: any, data: any) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(result.error.message, 400);
  }
  return result.data;
};
