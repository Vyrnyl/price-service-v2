import { apiFetch } from "./api";

export type UserRole = "officer" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  const normalized = role?.trim().toLowerCase();

  if (normalized === "admin" || normalized === "officer") {
    return normalized;
  }

  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const data = await apiFetch<{ id: string; name: string; email: string; role: string }>(
      "/api/users/me",
    );
    const role = normalizeUserRole(data.role);
    if (!role) return null;

    return { id: data.id, name: data.name, email: data.email, role };
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
