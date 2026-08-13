import { apiFetch } from "./api";

export type UserRole = "officer" | "admin";

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  const normalized = role?.trim().toLowerCase();

  if (normalized === "admin" || normalized === "officer") {
    return normalized;
  }

  return null;
}

export async function getRoleFromServer(): Promise<UserRole | null> {
  try {
    const res = await fetch("/api/auth/role", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return normalizeUserRole(data?.role);
  } catch {
    return null;
  }
}

export async function logoutFromServer(): Promise<void> {
  await apiFetch<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
