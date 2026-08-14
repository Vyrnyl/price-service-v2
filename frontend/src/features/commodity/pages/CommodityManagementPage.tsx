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

type CommodityManagementPageProps = {
  userRole: UserRole;
};

export default function CommodityManagementPage({ userRole }: CommodityManagementPageProps) {
  const canManage = userRole === "admin";
  const [commodityRows, setCommodityRows] = useState<CommodityRow[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  const refreshCommodityRows = async () => {
    try {
      const commodities = await getCommodities();
      setCommodityRows(mapCommoditiesToRows(commodities));
    } catch {
      setError("Unable to load commodity list.");
    }
  };

  useEffect(() => {
    async function loadCommodities() {
      try {
        const commodities = await getCommodities();
        setCommodityRows(mapCommoditiesToRows(commodities));
      } catch {
        setError("Unable to load commodity list.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadCommodities();
  }, []);

  const handleSaveCommodity = async (data: CreateCommodityPayload) => {
    setFormError(null);
    setFormSuccess(null);
    setSubmitLoading(true);

    try {
      if (editingCommodity) {
        const updatedCommodity = await updateCommodity(editingCommodity.id, data);
        setCommodityRows((prev) =>
          prev.map((row, index) =>
            row.id === updatedCommodity.id ? mapCommodityToRow(updatedCommodity, index) : row,
          ),
        );
        setFormSuccess("Commodity updated successfully.");
        showToast("Commodity updated successfully.", "success");
      } else {
        const createdCommodity = await createCommodity(data);
        setCommodityRows((prev) => [mapCommodityToRow(createdCommodity, prev.length), ...prev]);
        setFormSuccess("Commodity created successfully.");
        showToast("Commodity created successfully.", "success");
      }

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
      setCommodityRows((prev) =>
        prev.map((row, index) =>
          row.id === refreshedCommodity.id ? mapCommodityToRow(refreshedCommodity, index) : row,
        ),
      );
      setFormSuccess("SRP updated successfully.");
      showToast("SRP updated successfully.", "success");
      await refreshCommodityRows();
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

  const totalListed = commodityRows.length;
  const activeCount = commodityRows.filter((row) => row.status === "Active").length;
  const categoriesCount = new Set(commodityRows.map((row) => row.category)).size;

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
    <main className="min-h-screen lg:ml-72">
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
              <h2 className="font-h1-desktop text-h1-desktop text-on-surface">
                Commodity with SRP
              </h2>
              <p className="mt-1 font-body-lg text-on-surface-variant">
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
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition-all hover:shadow-md"
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
              isLoading={isLoading}
              error={error}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              currentPage={currentPage}
              onSearchTermChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
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
    </main>
  );
}
