import { z } from "zod";

const baseUserSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["ADMIN", "OFFICER"] as const),
  isActive: z.boolean(),
});

export const createUserSchema = baseUserSchema
  .extend({
    password: z.string().trim().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().trim().min(8, "Confirm password must be at least 8 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const passwordSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }
    return value;
  },
  z.string().trim().min(8, "Password must be at least 8 characters").optional(),
);

const confirmPasswordSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }
    return value;
  },
  z.string().trim().min(8, "Confirm password must be at least 8 characters").optional(),
);

export const updateUserSchema = baseUserSchema
  .extend({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type CreateUserFormSchema = z.infer<typeof createUserSchema>;
export type UpdateUserFormSchema = z.infer<typeof updateUserSchema>;
