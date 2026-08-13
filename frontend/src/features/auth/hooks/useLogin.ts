"use client";

import { useCallback, useState } from "react";
import { z } from "zod";
import { apiFetch, ApiError } from "../../../shared/services/api";
import { loginSchema, type LoginInput } from "../auth.schema";

export type LoginFieldErrors = Partial<Record<keyof LoginInput, string>>;

type LoginResponse = {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  message: string;
};

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    setFieldErrors({});

    try {
      const validated = loginSchema.parse(input);
      setIsLoading(true);

      const result = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: validated,
        credentials: "include",
      });
      console.log("Login result:", result);
      return result;
    } catch (caught) {
      if (caught instanceof z.ZodError) {
        const nextErrors: LoginFieldErrors = {};
        caught.issues.forEach((issue) => {
          const key = issue.path?.[0];
          if (typeof key === "string") {
            nextErrors[key as keyof LoginInput] = issue.message;
          }
        });
        setFieldErrors(nextErrors);
        return null;
      }

      if (caught instanceof ApiError) {
        setError(caught.message);
        return null;
      }

      setError("Unable to sign in. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    isLoading,
    error,
    fieldErrors,
  };
}
