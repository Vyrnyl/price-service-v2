import { apiFetch } from "../../../shared/services/api";

export interface SrpItem {
  id: string;
  commodityId: string;
  price: string;
  effectiveDate: string;
  createdAt: string;
  commodity?: {
    id: string;
    name: string;
    category: string;
    status: string;
  };
}

export interface SrpApiResponse {
  status: string;
  data: SrpItem[];
}

export interface SrpCreatePayload {
  commodityId: string;
  price: number;
  effectiveDate: string;
}

export interface SrpCreateResponse {
  status: string;
  data: SrpItem;
}

export async function getSrps() {
  const response = await apiFetch<SrpApiResponse>("/api/srps", {
    method: "GET",
    credentials: "include",
  });

  return response.data;
}

export async function createSrp(payload: SrpCreatePayload) {
  const response = await apiFetch<SrpCreateResponse>("/api/srps", {
    method: "POST",
    body: payload,
    credentials: "include",
  });

  return response.data;
}
