import { apiFetch } from "../../../shared/services/api";
import type { CommodityStatus } from "../commodity.schema";
import type { SrpItem } from "./srp.api";

export interface CommodityItem {
  id: string;
  name: string;
  status: CommodityStatus;
  category: string;
  srps?: SrpItem[];
}

export interface PublicCommodityPriceRecord {
  id: string;
  price: number | null;
  dateAndTime: string | null;
  status: string | null;
  srpPrice: number | null;
  storeName: string | null;
  storeLocation: string | null;
  complianceStatus: string;
}

export interface PublicCommodityItem {
  id: string;
  name: string;
  category: string;
  status: string;
  currentPrice: number | null;
  srpPrice: number | null;
  complianceStatus: string;
  lastUpdatedAt: string | null;
  storeName: string | null;
  storeLocation: string | null;
  priceRecords: PublicCommodityPriceRecord[];
}

export interface PublicForecastItem {
  id: string;
  commodityId: string;
  predictedPrice: number | null;
  confidence: number;
  forecastDate: string;
  createdAt: string;
}

export interface CommodityDetailsItem extends CommodityItem {
  srps?: SrpItem[];
}

export interface CommodityApiResponse {
  status: string;
  data: CommodityItem[];
}

export interface CommodityCreateResponse {
  status: string;
  data: CommodityItem;
}

export interface CreateCommodityPayload {
  name: string;
  category: string;
  status: CommodityStatus;
}

export interface CommodityUpdateResponse {
  status: string;
  data: CommodityItem;
}

export async function getCommodities() {
  const response = await apiFetch<CommodityApiResponse>("/api/commodities", {
    method: "GET",
    credentials: "include",
  });

  return response.data;
}

export async function getPublicCommodities() {
  const response = await apiFetch<{ status: string; data: PublicCommodityItem[] }>('/api/public/commodities', {
    method: 'GET',
    credentials: 'omit',
  });

  return response.data;
}

export async function getPublicForecastByCommodityId(commodityId: string) {
  const response = await apiFetch<{ status: string; data: PublicForecastItem[] }>(`/api/public/forecasts/${commodityId}`, {
    method: 'GET',
    credentials: 'omit',
  });

  return response.data;
}

export async function createCommodity(payload: CreateCommodityPayload) {
  const response = await apiFetch<CommodityCreateResponse>("/api/commodities", {
    method: "POST",
    body: payload,
    credentials: "include",
  });

  return response.data;
}

export async function updateCommodity(id: string, payload: Partial<CreateCommodityPayload>) {
  const response = await apiFetch<CommodityUpdateResponse>(`/api/commodities/${id}`, {
    method: "PUT",
    body: payload,
    credentials: "include",
  });

  return response.data;
}

export interface CommodityDetailResponse {
  status: string;
  data: CommodityDetailsItem;
}

export async function getCommodityById(id: string) {
  const response = await apiFetch<CommodityDetailResponse>(`/api/commodities/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return response.data;
}
