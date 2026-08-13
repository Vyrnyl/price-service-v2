import type { StoreFormData, Store } from "../types/stores.types";
import { apiFetch } from "@/shared/services/api";
import type { CommodityOption, PriceRecord } from "@/features/price-record/types/price-record.types";

export interface BackendPriceRecord {
  id: string;
  dateAndTime?: string | null;
  createdAt?: string | null;
  price: number | string;
  srp?: number | string | null;
  status?: string;
  user?: {
    name?: string | null;
  };
  store?: {
    id?: string;
    name?: string | null;
    location?: string | null;
  };
  commodity?: {
    id?: string;
    name?: string | null;
    category?: string | null;
  };
}

const formatNumber = (value: number | string) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "₱0.00";
  }
  return `₱${numericValue.toFixed(2)}`;
};

function getLatestSrpPrice(commodity?: CommodityOption) {
  if (!commodity?.srps?.length) {
    return null;
  }

  const sorted = [...commodity.srps].sort((left, right) => {
    const leftTime = new Date(left.effectiveDate).getTime();
    const rightTime = new Date(right.effectiveDate).getTime();
    return rightTime - leftTime;
  });

  const latestSrp = Number(sorted[0]?.price);
  return Number.isFinite(latestSrp) ? latestSrp : null;
}

function getStatusLabel(status: string | undefined, price: number, srpPrice: number | null) {
  if (Number.isFinite(price) && srpPrice != null) {
    if (price > srpPrice) {
      return "Above SRP";
    }

    if (price < srpPrice) {
      return "Below SRP";
    }

    return "Compliant";
  }

  switch (status) {
    case "Above SRP":
    case "OVERPRICE":
      return "Above SRP";
    case "Below SRP":
    case "UNDERPRICE":
      return "Below SRP";
    case "Compliant":
    case "COMPLIANT":
      return "Compliant";
    default:
      return "Unknown";
  }
}

export function mapBackendPriceRecord(record: BackendPriceRecord, commodities: CommodityOption[] = []): PriceRecord {
  const dateObject = new Date(record.dateAndTime ?? record.createdAt ?? "");
  const date = dateObject.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = dateObject.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const officerName = record.user?.name ?? "Officer";
  const officerInitials = officerName
    .split(" ")
    .map((part) => part[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const commodity = commodities.find((item) => item.id === record.commodity?.id);
  const latestSrpPrice = getLatestSrpPrice(commodity);
  const numericPrice = Number(record.price);
  const statusLabel = getStatusLabel(record.status, numericPrice, latestSrpPrice);

  const statusValue =
    record.status === "COMPLIANT" || record.status === "OVERPRICE" || record.status === "UNDERPRICE"
      ? record.status
      : undefined;

  return {
    id: record.id,
    storeId: record.store?.id ?? "",
    commodityId: record.commodity?.id ?? "",
    date,
    time,
    dateAndTime: record.dateAndTime ?? undefined,
    store: record.store?.name ?? "Unknown store",
    location: record.store?.location ?? "",
    commodity: record.commodity?.name ?? "Unknown commodity",
    commodityDetails: record.commodity?.category ?? "",
    price: formatNumber(record.price),
    status: statusLabel,
    statusValue,
    srp: latestSrpPrice != null ? formatNumber(latestSrpPrice) : record.srp ? formatNumber(record.srp) : undefined,
    officerInitials,
    officerName,
  };
}

export async function fetchStores() {
  return apiFetch<{ status: string; data: Store[] }>("/api/stores");
}

export async function fetchStorePriceRecords() {
  return apiFetch<{ status: string; data: BackendPriceRecord[] }>('/api/price-records');
}

export async function fetchCommodities() {
  return apiFetch<{ status: string; data: CommodityOption[] }>('/api/commodities');
}

export async function saveStore(formData: StoreFormData, storeId?: string) {
  const payload = {
    name: formData.name.trim(),
    location: formData.location.trim(),
    lastVisited: formData.lastVisited ? new Date(formData.lastVisited).toISOString() : null,
  };

  return apiFetch<{ status: string; data: Store }>(
    storeId ? `/api/stores/${storeId}` : "/api/stores",
    {
      method: storeId ? "PUT" : "POST",
      body: payload,
    },
  );
}
