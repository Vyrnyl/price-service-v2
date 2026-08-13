import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
  password: z.string().min(8).optional(),
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

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
