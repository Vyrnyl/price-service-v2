import { apiFetch } from "../../../../shared/services/api";
import type { AddUserForm, User } from "../types/users.types";
import type { UpdateUserFormSchema } from "../schemas/users.schema";

export async function getUsers() {
  return apiFetch<User[]>("/api/users", {
    method: "GET",
    credentials: "include",
  });
}

export async function createUser(payload: AddUserForm) {
  return apiFetch<User>("/api/users", {
    method: "POST",
    body: payload,
    credentials: "include",
  });
}

export async function updateUser(userId: string, payload: UpdateUserFormSchema) {
  return apiFetch<User>(`/api/users/${userId}`, {
    method: "PUT",
    body: payload,
    credentials: "include",
  });
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  return apiFetch<User>(`/api/users/${userId}`, {
    method: "PUT",
    body: { isActive },
    credentials: "include",
  });
}
