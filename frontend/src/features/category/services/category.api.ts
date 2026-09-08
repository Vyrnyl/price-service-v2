import { apiFetch } from "@/shared/services/api";

export interface CategoryItem {
  id: string;
  name: string;
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

export async function createCategory(name: string) {
  const response = await apiFetch<CategoryDetailResponse>("/api/categories", {
    method: "POST",
    body: { name },
    credentials: "include",
  });

  return response.data;
}

export async function updateCategory(id: string, name: string) {
  const response = await apiFetch<CategoryDetailResponse>(`/api/categories/${id}`, {
    method: "PUT",
    body: { name },
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
