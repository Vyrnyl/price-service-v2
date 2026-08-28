"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MdLockOutline, MdOutlineMailOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { normalizeUserRole } from "@/shared/services/auth";
import { useLogin } from "../hooks/use-login";
import { type LoginInput } from "../auth.schema";

const getRedirectPath = (role: string | undefined) => {
  const normalizedRole = normalizeUserRole(role);

  if (normalizedRole === "admin") return "/admin";
  if (normalizedRole === "officer") return "/officer";
  return "/";
};

// Seeded accounts from backend/prisma/seed.ts — dev/testing convenience only.
const DEMO_ACCOUNTS: Array<{ label: string; email: string; password: string }> = [
  { label: "Fill Admin", email: "admin@presyoserbisyo.gov.ph", password: "Password123!" },
  { label: "Fill Officer", email: "officer@presyoserbisyo.gov.ph", password: "Password123!" },
];

const isDemoFillEnabled = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginInput>({ email: "", password: "" });
  const { login, isLoading, error, fieldErrors } = useLogin();
  const router = useRouter();


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await login(formData);

    if (result) {
      const redirectPath = getRedirectPath(result.data.role);
      router.replace(redirectPath);
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-container-margin-mobile py-12 md:px-container-margin-desktop">
      <div className="w-full max-w-120 rounded-xl border border-outline-variant bg-surface-container-lowest p-8 data-card-shadow">
        <div className="text-center mb-8">
          <h1 className="font-sans text-h1-mobile font-bold text-on-surface md:text-h1-desktop">
            Welcome Back
          </h1>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Sign in to access the Monitoring & SRP Portal
          </p>
        </div>

        {isDemoFillEnabled ? (
          <div className="mb-6 rounded-xl border border-dashed border-outline-variant bg-surface p-4">
            <p className="text-body-xs font-medium uppercase tracking-wide text-on-surface-variant">
              Testing only — demo accounts
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => setFormData({ email: account.email, password: account.password })}
                  className="rounded-full border border-outline-variant px-4 py-1.5 text-label-caps font-medium text-on-surface-variant transition hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <MdOutlineMailOutline />
              </span>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@agency.gov.ph"
                className="w-full rounded-xl border border-outline bg-surface px-4 pl-12 py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {fieldErrors.email ? <p className="text-error text-body-xs mt-1">{fieldErrors.email}</p> : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-body-sm font-medium text-on-surface" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <MdLockOutline />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-outline bg-surface px-4 pl-12 py-3 pr-12 text-body-sm text-on-surface placeholder:text-on-surface-variant outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span>
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </span>
              </button>
            </div>
            {fieldErrors.password ? <p className="text-error text-body-xs mt-1">{fieldErrors.password}</p> : null}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-primary px-6 py-3 text-body-sm font-semibold text-on-primary transition hover:bg-primary-focus disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </div>

          {error ? <p className="text-error text-body-sm text-center">{error}</p> : null}
        </form>

        <p className="mt-8 text-center text-body-sm text-on-surface-variant">
          Access to this portal is restricted to authorized personnel of DTI Catanduanes.
          Unauthorized access attempts are logged and may be subject to investigation.
        </p>
      </div>
    </main>
  );
}
