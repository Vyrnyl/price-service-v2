import { useEffect, useState, type FormEvent } from "react";
import { mapBackendPriceRecord, fetchCommodities, fetchStores, fetchStorePriceRecords, saveStore } from "../services/stores.api";
import type { Store, StoreFormData } from "../types/stores.types";
import type { PriceRecord } from "@/features/price-record/types/price-record.types";
import { useToast } from "@/shared/components/Toast";

export const STORE_PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

export function useStoreRegistryState() {
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({ name: "", location: "", lastVisited: "" });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StoreFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [storeRecords, setStoreRecords] = useState<Record<string, PriceRecord[]>>({});
  const [storeRecordsLoading, setStoreRecordsLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTermState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const { showToast } = useToast();

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const loadStores = async (targetPage: number) => {
    setIsLoading(true);
    try {
      const response = await fetchStores({
        page: targetPage,
        pageSize: STORE_PAGE_SIZE,
        search: debouncedSearch || undefined,
        municipality: municipalityFilter || undefined,
        status: statusFilter !== "All Statuses" ? statusFilter : undefined,
      });
      setStores(response.data);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await loadStores(page);
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, municipalityFilter, statusFilter]);

  const resetStoreForm = () => {
    setFormData({ name: "", location: "", lastVisited: "" });
    setFormErrors({});
    setFormError(null);
    setFormSuccess(null);
  };

  const handleFormChange = (field: keyof StoreFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof StoreFormData, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Store name is required.";
    }
    if (!formData.location.trim()) {
      nextErrors.location = "Location is required.";
    }

    return nextErrors;
  };

  const handleOpenCreateForm = () => {
    setEditingStore(null);
    resetStoreForm();
    setFormOpen(true);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      location: store.location,
      lastVisited: store.lastVisited ? new Date(store.lastVisited).toISOString().slice(0, 10) : "",
    });
    setFormErrors({});
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingStore(null);
    resetStoreForm();
  };

  const handleCreateStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    setSubmitLoading(true);

    try {
      await saveStore(formData, editingStore?.id);

      if (editingStore) {
        setFormSuccess("Store updated successfully.");
        showToast("Store updated successfully.", "success");
        await loadStores(page);
      } else {
        setFormSuccess("Store created successfully.");
        showToast("Store created successfully.", "success");
        setPage(1);
        await loadStores(1);
      }

      setFormData({ name: "", location: "", lastVisited: "" });
      setFormOpen(false);
      setEditingStore(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create store.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStoreDetails = async (store: Store) => {
    if (expandedStoreId === store.id) {
      setExpandedStoreId(null);
      return;
    }

    setExpandedStoreId(store.id);

    if (storeRecords[store.id]) {
      return;
    }

    setStoreRecordsLoading((current) => ({ ...current, [store.id]: true }));

    try {
      const [priceRecordsResponse, commoditiesResponse] = await Promise.all([
        fetchStorePriceRecords(store.id),
        fetchCommodities(),
      ]);
      const recordsForStore = priceRecordsResponse.data.map((record) =>
        mapBackendPriceRecord(record as never, commoditiesResponse.data),
      );

      setStoreRecords((current) => ({ ...current, [store.id]: recordsForStore }));
    } catch {
      setStoreRecords((current) => ({ ...current, [store.id]: [] }));
    } finally {
      setStoreRecordsLoading((current) => ({ ...current, [store.id]: false }));
    }
  };

  const handleClosePriceRecords = () => {
    setExpandedStoreId(null);
  };

  const setSearchTerm = (value: string) => {
    setSearchTermState(value);
  };

  const updateMunicipalityFilter = (value: string) => {
    setMunicipalityFilter(value);
    setPage(1);
  };

  const updateStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return {
    stores,
    total,
    page,
    setPage,
    isLoading,
    error,
    formOpen,
    formData,
    formErrors,
    formError,
    formSuccess,
    submitLoading,
    editingStore,
    expandedStoreId,
    storeRecords,
    storeRecordsLoading,
    searchTerm,
    setSearchTerm,
    municipalityFilter,
    setMunicipalityFilter: updateMunicipalityFilter,
    statusFilter,
    setStatusFilter: updateStatusFilter,
    handleFormChange,
    handleOpenCreateForm,
    handleEditStore,
    handleCloseForm,
    handleCreateStore,
    handleToggleStoreDetails,
    handleClosePriceRecords,
  };
}
