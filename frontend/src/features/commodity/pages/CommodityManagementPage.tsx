"use client";

import { useEffect, useState } from "react";
import {
  MdAddCircle,
  MdBakeryDining,
  MdEdit,
  MdKitchen,
  MdOutlineInventory2,
  MdOutlineStorefront,
  MdOutlineTrendingUp,
  MdOutlineWarning,
} from "react-icons/md";
import PageShell from "@/shared/components/PageShell";
import AddCommodityDialog from "../components/AddCommodityDialog";
import CommoditySummaryCards from "../components/CommoditySummaryCards";
import CommodityTable, { type CommodityRow } from "../components/CommodityTable";
import UpdateSrpDialog from "../components/UpdateSrpDialog";
import {
  createCommodity,
  getCommodityById,
  getCommodities,
  updateCommodity,
  type CommodityDetailsItem,
  type CommodityItem,
  type CreateCommodityPayload,
} from "../services/commodity.api";
import { createSrp } from "../services/srp.api";
import type { CommodityStatus } from "../commodity.schema";
import type { UserRole } from "@/shared/services/auth";
import { useToast } from "@/shared/components/Toast";

function mapCommodityToRow(item: CommodityItem, index: number) {
  const latestSrp = item.srps?.[0];
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    status: item.status,
    srp: latestSrp ? `₱${latestSrp.price}` : "_",
    statusClass: "border border-primary text-primary",
    icon: index % 2 === 0 ? MdBakeryDining : MdOutlineStorefront,
    iconBg: index % 2 === 0 ? "bg-primary-fixed text-primary" : "bg-secondary-container text-secondary",
  };
}

function mapCommoditiesToRows(commodities: CommodityItem[]): CommodityRow[] {
  return commodities.map(mapCommodityToRow);
}

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 300;

type CommodityManagementPageProps = {
  userRole: UserRole;
};

export default function CommodityManagementPage({ userRole }: CommodityManagementPageProps) {
  // Commodity and SRP management belongs to the officer (Phase 5.1); the admin
  // route renders the same page read-only. Mirrors authorize('OFFICER') on the
  // commodity and srp write routes — both layers are required.
  const canManage = userRole === "officer";
  const [commodityRows, setCommodityRows] = useState<CommodityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summaryStats, setSummaryStats] = useState({ total: 0, active: 0, categories: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<CommodityItem | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityDetailsItem | null>(null);
  const [updateSrpOpen, setUpdateSrpOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  const loadCommodities = async (page: number) => {
    try {
      const response = await getCommodities({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setCommodityRows(mapCommoditiesToRows(response.data));
      setTotal(response.total);
    } catch {
      setError("Unable to load commodity list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    async function run() {
      await loadCommodities(currentPage);
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, statusFilter]);

  const loadStats = async () => {
    try {
      const response = await getCommodities({ pageSize: 100 });
      setSummaryStats({
        total: response.total,
        active: response.data.filter((item) => item.status === "Active").length,
        categories: new Set(response.data.map((item) => item.category)).size,
      });
    } catch {
      // Summary stats are non-critical; leave the previous values in place.
    }
  };

  useEffect(() => {
    async function run() {
      await loadStats();
    }
    void run();
  }, []);

  const handleSaveCommodity = async (data: CreateCommodityPayload) => {
    setFormError(null);
    setFormSuccess(null);
    setSubmitLoading(true);

    try {
      if (editingCommodity) {
        await updateCommodity(editingCommodity.id, data);
        setFormSuccess("Commodity updated successfully.");
        showToast("Commodity updated successfully.", "success");
        await loadCommodities(currentPage);
      } else {
        await createCommodity(data);
        setFormSuccess("Commodity created successfully.");
        showToast("Commodity created successfully.", "success");
        setCurrentPage(1);
        await loadCommodities(1);
      }
      await loadStats();

      setFormOpen(false);
      setEditingCommodity(null);
      if (selectedCommodity?.id === editingCommodity?.id) {
        setSelectedCommodity(null);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormError(error.message ?? "Unable to save commodity.");
      } else {
        setFormError("Unable to save commodity.");
      }
      console.error("Failed to save commodity", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditCommodity = (commodity: CommodityItem) => {
    setEditingCommodity(commodity);
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(true);
  };

  const openUpdateSrpDirect = async (commodityId: string) => {
    setError(null);
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);
    try {
      const commodity = await getCommodityById(commodityId);
      setSelectedCommodity(commodity);
      setUpdateSrpOpen(true);
    } catch {
      setError("Unable to load commodity details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseUpdateSrp = () => {
    setUpdateSrpOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreateSrp = async (payload: { price: number; effectiveDate: string }) => {
    if (!selectedCommodity) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitLoading(true);

    try {
      await createSrp({
        commodityId: selectedCommodity.id,
        price: payload.price,
        effectiveDate: payload.effectiveDate,
      });

      const refreshedCommodity = await getCommodityById(selectedCommodity.id);
      setSelectedCommodity(refreshedCommodity);
      setFormSuccess("SRP updated successfully.");
      showToast("SRP updated successfully.", "success");
      await loadCommodities(currentPage);
      setUpdateSrpOpen(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFormError(error.message ?? "Unable to update SRP.");
      } else {
        setFormError("Unable to update SRP.");
      }
      console.error("Failed to update SRP", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalListed = summaryStats.total;
  const activeCount = summaryStats.active;
  const categoriesCount = summaryStats.categories;

  const selectedCommoditySrp = selectedCommodity?.srps?.[0];
  const srpDefaultValues = selectedCommoditySrp
    ? {
        price: Number(selectedCommoditySrp.price),
        effectiveDate: new Date(selectedCommoditySrp.effectiveDate).toISOString().slice(0, 10),
      }
    : undefined;

  const summaryCards = [
    {
      label: "Total Listed",
      value: String(totalListed),
      meta: "Live commodity count",
      icon: MdOutlineInventory2,
      iconBg: "bg-primary-container/10",
      iconColor: "text-primary",
    },
    {
      label: "Active",
      value: String(activeCount),
      meta: "Currently active",
      icon: MdOutlineTrendingUp,
      iconBg: "bg-tertiary-container/10",
      iconColor: "text-tertiary",
    },
    {
      label: "Categories",
      value: String(categoriesCount),
      meta: "Unique categories",
      icon: MdKitchen,
      iconBg: "bg-secondary-container/10",
      iconColor: "text-secondary",
    },
  ];


  return (
    <PageShell>
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-6xl space-y-6">
          <AddCommodityDialog
            open={formOpen}
            mode={editingCommodity ? "edit" : "create"}
            defaultValues={
              editingCommodity
                ? {
                    name: editingCommodity.name,
                    category: editingCommodity.category,
                    status: editingCommodity.status,
                  }
                : undefined
            }
            formError={formError}
            formSuccess={formSuccess}
            submitLoading={submitLoading}
            onClose={() => {
              setFormOpen(false);
              setFormError(null);
              setFormSuccess(null);
              setEditingCommodity(null);
            }}
            onSubmit={handleSaveCommodity}
          />
          <UpdateSrpDialog
            key={`update-srp-${selectedCommodity?.id ?? "new"}-${selectedCommoditySrp?.id ?? ""}`}
            open={updateSrpOpen}
            commodityName={selectedCommodity?.name ?? null}
            defaultValues={srpDefaultValues}
            onClose={handleCloseUpdateSrp}
            onSubmit={handleCreateSrp}
            submitLoading={submitLoading}
            formError={formError}
            formSuccess={formSuccess}
          />
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-sans text-h1-desktop text-on-surface">
                Commodity with SRP
              </h2>
              <p className="mt-1 font-sans text-on-surface-variant">
                Track and manage commodity listings, SRP updates, and compliance status.
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setEditingCommodity(null);
                  setFormOpen(true);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition-all hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <MdAddCircle size={20} />
                New Commodity
              </button>
            ) : null}
          </div>

          <CommoditySummaryCards cards={summaryCards} />

          <div className="flex flex-col gap-6 xl:flex-row">
            <CommodityTable
              commodityRows={commodityRows}
              total={total}
              isLoading={isLoading}
              error={error}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              currentPage={currentPage}
              onSearchTermChange={setSearchTerm}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
              onOpenUpdateSrp={canManage ? openUpdateSrpDirect : undefined}
              onEditCommodity={canManage ? handleEditCommodity : undefined}
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
