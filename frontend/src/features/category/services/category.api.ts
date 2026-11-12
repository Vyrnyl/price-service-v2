import { apiFetch } from "@/shared/services/api";

export interface CategoryItem {
  id: string;
  name: string;
  /** Icon chosen on the Category form; null/absent = matched from the name. */
  iconKey?: string | null;
  commodityCount: number;
  createdAt: string;
}

export interface CategoryListResponse {
  status: string;
  data: CategoryItem[];
}

export interface CategoryDetailResponse {
  status: string;
  data: CategoryItem;
}

export async function getCategories() {
  const response = await apiFetch<CategoryListResponse>("/api/categories", {
    method: "GET",
    credentials: "include",
  });

  return response.data;
}

/** `iconKey` "" = Automatic (the backend stores null and the icon is matched from the name). */
export type CategoryPayload = { name: string; iconKey: string };

export async function createCategory(payload: CategoryPayload) {
  const response = await apiFetch<CategoryDetailResponse>("/api/categories", {
    method: "POST",
    body: payload,
    credentials: "include",
  });

  return response.data;
}

export async function updateCategory(id: string, payload: CategoryPayload) {
  const response = await apiFetch<CategoryDetailResponse>(`/api/categories/${id}`, {
    method: "PUT",
    body: payload,
    credentials: "include",
  });

  return response.data;
}

export async function deleteCategory(id: string) {
  await apiFetch<void>(`/api/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}
