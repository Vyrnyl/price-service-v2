import { apiFetch } from "../../../../shared/services/api";
import type { PaginatedResponse } from "../../../../shared/types/pagination";
import type { AddUserForm, User, UserRole } from "../types/users.types";
import type { UpdateUserFormSchema } from "../schemas/users.schema";

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function getUsers(params: GetUsersParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));

  const queryString = query.toString();
  return apiFetch<PaginatedResponse<User>>(queryString ? `/api/users?${queryString}` : "/api/users", {
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
