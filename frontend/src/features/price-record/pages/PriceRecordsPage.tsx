"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MdAdd } from "react-icons/md";
import { apiFetch } from "@/shared/services/api";
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

const FILTERS = [
  { id: "all", label: "All Price Records" },
  { id: "compliant", label: "Compliant" },
];

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
  const [activeFilter, setActiveFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [records, setRecords] = useState<PriceRecord[]>([]);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storeResponse, commodityResponse, recordResponse] =
          await Promise.all([
            apiFetch<{ status: string; data: StoreOption[] }>("/api/stores"),
            apiFetch<{ status: string; data: CommodityOption[] }>(
              "/api/commodities",
            ),
            apiFetch<{ status: string; data: BackendPriceRecord[] }>("/api/price-records"),
          ]);

        setStores(storeResponse.data);
        setCommodities(commodityResponse.data);
        setRecords(recordResponse.data.map((record) => mapBackendPriceRecord(record, commodityResponse.data)));
      } catch (error) {
        console.error("Unable to load price record data", error);
      }
    };

    void loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((record) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "above" && record.status === "Above SRP") ||
        (activeFilter === "compliant" && record.status === "Compliant");

      const matchesSearch =
        query === "" ||
        record.store.toLowerCase().includes(query) ||
        record.commodity.toLowerCase().includes(query) ||
        record.officerName.toLowerCase().includes(query);

      const matchesStore = storeFilter === "" || record.storeId === storeFilter;
      const matchesCommodity =
        commodityFilter === "" || record.commodityId === commodityFilter;

      return matchesFilter && matchesSearch && matchesStore && matchesCommodity;
    });
  }, [activeFilter, commodityFilter, records, searchQuery, storeFilter]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      const response = await apiFetch<{ status: string; data: BackendPriceRecord }>(
        editingRecord ? `/api/price-records/${editingRecord.id}` : "/api/price-records",
        {
          method: editingRecord ? "PUT" : "POST",
          body: payload,
        },
      );

      if (editingRecord) {
        setRecords((current) =>
          current.map((record) =>
            record.id === editingRecord.id
              ? mapBackendPriceRecord(response.data, commodities)
              : record,
          ),
        );
        showToast("Price record updated successfully.", "success");
      } else {
        setRecords((current) => [
          mapBackendPriceRecord(response.data, commodities),
          ...current,
        ]);
        showToast("Price record created successfully.", "success");
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
                  Showing {records.length} validated entries in the last 30
                  days.
                </p>
              </div>
              {canCreateRecord ? (
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-sans font-semibold text-on-primary shadow-sm transition-all hover:shadow-md"
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
              onStoreChange={setStoreFilter}
              onCommodityChange={setCommodityFilter}
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
              records={pagedRecords}
              onEdit={handleEditRecord}
              hideActions={hideActions}
              hideOfficerColumn
            />
            {filteredRecords.length > pageSize ? (
              <div className="mt-3 flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-[11px] text-on-surface-variant sm:text-sm">
                  Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
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
