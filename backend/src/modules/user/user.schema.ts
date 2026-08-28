import { z } from 'zod';
import { isPasswordComplex, PASSWORD_POLICY_MESSAGE } from '../../shared/utils/password-policy';
import { paginationQuerySchema } from '../../shared/schema/pagination.schema';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const stringToBoolean = (value: unknown) => {
  if (value === '' || value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(isPasswordComplex, PASSWORD_POLICY_MESSAGE);

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: passwordField,
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  role: z.enum(["ADMIN", "OFFICER"]),
  isActive: z.boolean().optional(),
});

export const createUserSchema = userSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

const updateUserBaseSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: passwordField.optional(),
  confirmPassword: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "OFFICER"]).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = updateUserBaseSchema.refine(
  (data) => !data.password || data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    confirmNewPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  role: z.preprocess(emptyToUndefined, z.enum(['ADMIN', 'OFFICER']).optional()),
  isActive: z.preprocess(stringToBoolean, z.boolean().optional()),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
