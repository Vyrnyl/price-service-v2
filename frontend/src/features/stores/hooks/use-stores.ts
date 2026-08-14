import { useEffect, useMemo, useState, type FormEvent } from "react";
import { mapBackendPriceRecord, fetchCommodities, fetchStores, fetchStorePriceRecords, saveStore } from "../services/stores.api";
import type { Store, StoreFormData } from "../types/stores.types";
import type { PriceRecord } from "@/features/price-record/types/price-record.types";
import { getStoreStatus } from "../utils/store-status";
import { useToast } from "@/shared/components/Toast";

const RECENTLY_UPDATED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function useStoreRegistryState() {
  const [stores, setStores] = useState<Store[]>([]);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [quickFilter, setQuickFilter] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    async function loadStores() {
      try {
        const response = await fetchStores();
        setStores(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load stores");
      } finally {
        setIsLoading(false);
      }
    }

    loadStores();
  }, []);

  const filteredStores = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = Date.now();

    return stores.filter((store) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [store.name, store.location, store.user?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesMunicipality =
        municipalityFilter.length === 0 || store.location.toLowerCase().includes(municipalityFilter.toLowerCase());

      const storeStatus = getStoreStatus(store).label;
      const matchesStatus = statusFilter === "All Statuses" || storeStatus === statusFilter;

      const matchesQuickFilter =
        quickFilter.length === 0 ||
        quickFilter === "All" ||
        (quickFilter === "Recently Updated" && !!store.lastVisited && new Date(store.lastVisited).getTime() > now - RECENTLY_UPDATED_WINDOW_MS) ||
        storeStatus === quickFilter;

      return matchesSearch && matchesMunicipality && matchesStatus && matchesQuickFilter;
    });
  }, [municipalityFilter, quickFilter, searchTerm, statusFilter, stores]);

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
      const response = await saveStore(formData, editingStore?.id);

      if (editingStore) {
        setStores((current) => current.map((store) => (store.id === editingStore.id ? response.data : store)));
        setFormSuccess("Store updated successfully.");
        showToast("Store updated successfully.", "success");
      } else {
        setStores((current) => [response.data, ...current]);
        setFormSuccess("Store created successfully.");
        showToast("Store created successfully.", "success");
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
        fetchStorePriceRecords(),
        fetchCommodities(),
      ]);
      const recordsForStore = priceRecordsResponse.data
        .filter((record: { store?: { id?: string } }) => record.store?.id === store.id)
        .map((record: { store?: { id?: string } }) => mapBackendPriceRecord(record as never, commoditiesResponse.data));

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

  const handleQuickFilterChange = (chip: string) => {
    setQuickFilter((current) => (current === chip ? "" : chip));
  };

  return {
    stores,
    filteredStores,
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
    setMunicipalityFilter,
    statusFilter,
    setStatusFilter,
    quickFilter,
    handleFormChange,
    handleOpenCreateForm,
    handleEditStore,
    handleCloseForm,
    handleCreateStore,
    handleToggleStoreDetails,
    handleClosePriceRecords,
    handleQuickFilterChange,
  };
}
