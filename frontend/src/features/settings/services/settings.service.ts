import { apiFetch } from "@/shared/services/api";
import type { PasswordFormValues, ProfileFormValues, UserProfile } from "../types/settings.types";

export async function fetchCurrentUser(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me");
}

export async function updateCurrentUser(payload: ProfileFormValues): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me", {
    method: "PUT",
    body: payload,
  });
}

export async function changeCurrentUserPassword(payload: PasswordFormValues): Promise<void> {
  await apiFetch<void>("/api/users/me/password", {
    method: "PUT",
    body: payload,
  });
}
