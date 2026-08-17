"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MdAdd } from "react-icons/md";
import { apiFetch } from "@/shared/services/api";
import type { PaginatedResponse } from "@/shared/types/pagination";
import { useToast } from "@/shared/components/Toast";
import PageShell from "@/shared/components/PageShell";
import Modal from "@/shared/components/Modal";
import Pagination from "@/shared/components/Pagination";
import PriceRecordForm from "../components/PriceRecordForm";
import PriceRecordFilters from "../components/PriceRecordFilters";
import PriceRecordsTable from "../components/PriceRecordsTable";
import type {
  CommodityOption,
  CreatePriceRecordPayload,
  PriceRecord,
  StoreOption,
} from "../types/price-record.types";

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 300;

function formatInputDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}

function createDefaultRecord(): CreatePriceRecordPayload {
  return {
    commodityId: "",
    storeId: "",
    price: 0,
    dateAndTime: new Date().toISOString().slice(0, 16),
  };
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

type BackendPriceRecord = {
  id: string;
  dateAndTime: string;
  price: number | string;
  srp?: number | string;
  status: "COMPLIANT" | "OVERPRICE" | "UNDERPRICE" | string;
  store?: {
    id?: string;
    name?: string;
    location?: string;
  };
  commodity?: {
    id?: string;
    name?: string;
    category?: string;
  };
  user?: {
    name?: string;
  };
};

function mapBackendPriceRecord(record: BackendPriceRecord, commodities: CommodityOption[] = []): PriceRecord {
  const dateObject = new Date(record.dateAndTime);
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
    .map((part: string) => part[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const commodity = commodities.find((item) => item.id === record.commodity?.id);
  const latestSrpPrice = getLatestSrpPrice(commodity);
  const numericPrice = Number(record.price);
  const statusLabel = getStatusLabel(record.status, numericPrice, latestSrpPrice);
  const srpText = latestSrpPrice != null ? `₱${latestSrpPrice.toFixed(2)}` : record.srp ? `₱${Number(record.srp).toFixed(2)}` : undefined;

  return {
    id: record.id,
    storeId: record.store?.id ?? "",
    commodityId: record.commodity?.id ?? "",
    date,
    time,
    dateAndTime: record.dateAndTime,
    store: record.store?.name ?? "Unknown store",
    location: record.store?.location ?? "",
    commodity: record.commodity?.name ?? "Unknown commodity",
    commodityDetails: record.commodity?.category ?? "",
    price: `₱${Number(record.price).toFixed(2)}`,
    status: statusLabel,
    statusValue: record.status as "COMPLIANT" | "OVERPRICE" | "UNDERPRICE" | undefined,
    srp: srpText,
    officerInitials,
    officerName,
  };
}

export default function PriceRecordsPage({
  canCreateRecord = true,
  hideActions = false,
}: {
  canCreateRecord?: boolean;
  hideActions?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [rawRecords, setRawRecords] = useState<BackendPriceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PriceRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CreatePriceRecordPayload, string>>
  >({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [newRecord, setNewRecord] = useState<CreatePriceRecordPayload>(createDefaultRecord);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  // Reference data for the form/filter dropdowns — commodities and stores are
  // bounded registry data (well under the pagination ceiling), so one page at
  // the ceiling size is effectively "all" without a separate unpaginated endpoint.
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [storeResponse, commodityResponse] = await Promise.all([
          apiFetch<{ status: string; data: StoreOption[] }>("/api/stores?pageSize=100"),
          apiFetch<{ status: string; data: CommodityOption[] }>("/api/commodities?pageSize=100"),
        ]);

        setStores(storeResponse.data);
        setCommodities(commodityResponse.data);
      } catch (error) {
        console.error("Unable to load store/commodity options", error);
      }
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const loadRecords = async (page: number) => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (storeFilter) params.set("storeId", storeFilter);
      if (commodityFilter) params.set("commodityId", commodityFilter);

      const response = await apiFetch<PaginatedResponse<BackendPriceRecord>>(
        `/api/price-records?${params.toString()}`,
      );

      setRawRecords(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Unable to load price record data", error);
    }
  };

  useEffect(() => {
    async function run() {
      await loadRecords(currentPage);
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, storeFilter, commodityFilter]);

  const records = useMemo(
    () => rawRecords.map((record) => mapBackendPriceRecord(record, commodities)),
    [rawRecords, commodities],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const handleFieldChange = (
    field: keyof CreatePriceRecordPayload,
    value: string | number,
  ) => {
    setNewRecord((current) => ({ ...current, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
    setFormError(null);
    setFormErrors({});
    setNewRecord(createDefaultRecord());
  };

  const handleOpenCreateForm = () => {
    setEditingRecord(null);
    setFormError(null);
    setFormErrors({});
    setNewRecord(createDefaultRecord());
    setFormOpen(true);
  };

  const handleEditRecord = (record: PriceRecord) => {
    setEditingRecord(record);
    setFormError(null);
    setFormErrors({});
    setNewRecord({
      commodityId: record.commodityId,
      storeId: record.storeId,
      price: Number(record.price.replace(/[^\d.]/g, "")) || 0,
      dateAndTime: record.dateAndTime ? formatInputDateTime(record.dateAndTime) : "",
    });
    setFormOpen(true);
  };

  const handleSubmitRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors: Partial<Record<keyof CreatePriceRecordPayload, string>> =
      {};

    if (!newRecord.storeId) {
      nextErrors.storeId = "Please select a store.";
    }
    if (!newRecord.commodityId) {
      nextErrors.commodityId = "Please select a commodity.";
    }
    if (!newRecord.dateAndTime) {
      nextErrors.dateAndTime = "Please choose a date and time.";
    }
    if (newRecord.price <= 0) {
      nextErrors.price = "Please enter a valid price.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        ...newRecord,
        dateAndTime: new Date(newRecord.dateAndTime).toISOString(),
      };
      await apiFetch<{ status: string; data: BackendPriceRecord }>(
        editingRecord ? `/api/price-records/${editingRecord.id}` : "/api/price-records",
        {
          method: editingRecord ? "PUT" : "POST",
          body: payload,
        },
      );

      if (editingRecord) {
        showToast("Price record updated successfully.", "success");
      } else {
        showToast("Price record created successfully.", "success");
      }

      await loadRecords(editingRecord ? safePage : 1);
      if (!editingRecord) {
        setCurrentPage(1);
      }
      handleCloseForm();
    } catch (error: unknown) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save price record.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="space-y-3">
            <span className="font-sans text-label-caps uppercase tracking-[0.24em] text-outline">
              Monitoring Logs
            </span>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-sans text-h2-desktop text-on-surface">
                  Price Records
                </h1>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Showing {total} validated entries.
                </p>
              </div>
              {canCreateRecord ? (
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-sans font-semibold text-on-primary shadow-sm transition-all hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <MdAdd size={20} />
                  New Entry
                </button>
              ) : null}
            </div>
          </header>

          <div className="relative">
            <PriceRecordFilters
              search={searchQuery}
              storeFilter={storeFilter}
              commodityFilter={commodityFilter}
              onSearchChange={setSearchQuery}
              onStoreChange={(value) => {
                setStoreFilter(value);
                setCurrentPage(1);
              }}
              onCommodityChange={(value) => {
                setCommodityFilter(value);
                setCurrentPage(1);
              }}
              stores={stores}
              commodities={commodities}
            />
          </div>

          {formOpen ? (
            <Modal
              open
              onClose={handleCloseForm}
              title={editingRecord ? "Edit Price Record" : "Add Price Record"}
              description={
                editingRecord
                  ? "Update the selected commodity price entry from your assigned inspection route."
                  : "Record a new commodity price entry from your assigned inspection route."
              }
              maxWidth="max-w-3xl"
            >
              <PriceRecordForm
                stores={stores}
                commodities={commodities}
                formError={formError}
                formErrors={formErrors}
                submitLoading={submitLoading}
                newRecord={newRecord}
                mode={editingRecord ? "edit" : "create"}
                onChange={handleFieldChange}
                onCancel={handleCloseForm}
                onSubmit={handleSubmitRecord}
              />
            </Modal>
          ) : null}

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:p-3">
            <PriceRecordsTable
              records={records}
              onEdit={handleEditRecord}
              hideActions={hideActions}
              hideOfficerColumn
            />
            {total > PAGE_SIZE ? (
              <div className="mt-3 flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-[11px] text-on-surface-variant sm:text-sm">
                  Showing {total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, total)} of {total} records
                </p>
                <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} size="sm" />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
