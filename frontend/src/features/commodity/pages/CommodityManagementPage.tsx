"use client";

import { useEffect, useRef, useState } from "react";
import {
  MdAddCircle,
  MdEdit,
  MdKitchen,
  MdOutlineInventory2,
  MdOutlineTrendingUp,
  MdOutlineWarning,
} from "react-icons/md";
import PageShell from "@/shared/components/PageShell";
import Skeleton, { SkeletonStatCard } from "@/shared/components/Skeleton";
import AddCommodityDialog, { type CategoryOption } from "../components/AddCommodityDialog";
import CommoditySummaryCards from "../components/CommoditySummaryCards";
import CommodityTable, { type CommodityRow } from "../components/CommodityTable";
import { SrpHistoryModal } from "../components/SrpHistoryModal";
import { SRP_HISTORY_ENABLED } from "../srp-history.config";
import {
  COMMODITY_CATEGORY_FILTER_ENABLED,
  INLINE_SRP_EDIT_ENABLED,
  NEW_COMMODITY_ENABLED,
} from "../commodity-list.config";
import {
  SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD,
  getManilaDateString,
  getMaxSrpEffectiveDateString,
  isSrpEffectiveDateWithinWindow,
} from "@/shared/utils/srp-effective-date";
import { useSrpHistory } from "../hooks/use-srp-history";
import { useSrpProjection } from "../hooks/use-srp-projection";
import {
  createCommodity,
  getCommodityById,
  getCommodities,
  updateCommodity,
  type CommodityItem,
  type CreateCommodityPayload,
} from "../services/commodity.api";
import { getCategories } from "@/features/category/services/category.api";
import { getCategoryIcon } from "@/features/category/category-icons";
import { ApiError, fetchAllPages } from "@/shared/services/api";
import { formatCurrency } from "@/shared/utils/currency";
import { createSrp } from "../services/srp.api";
import type { CreateCommodityFormSchema } from "../commodity.schema";
import type { UserRole } from "@/shared/services/auth";
import { useToast } from "@/shared/components/Toast";

function formatEffectiveDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapCommodityToRow(item: CommodityItem) {
  const latestSrp = item.srps?.[0];
  return {
    id: item.id,
    name: item.name,
    category: item.category.name,
    status: item.status,
    // Two decimals everywhere ("₱44.00", not "₱44"), in the cell and the edit input.
    srp: latestSrp ? formatCurrency(Number(latestSrp.price)) : "_",
    srpValue: latestSrp ? Number(latestSrp.price).toFixed(2) : null,
    effectiveDate: latestSrp ? formatEffectiveDate(latestSrp.effectiveDate) : "_",
    statusClass: "border border-primary text-primary",
    icon: getCategoryIcon(item.category.name, item.category.iconKey),
    iconBg: "bg-primary-container/10 text-primary",
  };
}

function mapCommoditiesToRows(commodities: CommodityItem[]): CommodityRow[] {
  return commodities.map(mapCommodityToRow);
}

/**
 * Rows whose typed SRP differs from the current one. A blank draft counts as
 * "no change" — an SRP can be replaced, never removed.
 */
function getChangedSrpRows(rows: CommodityRow[], drafts: Record<string, string>) {
  return rows.filter((row) => {
    const draft = drafts[row.id]?.trim() ?? "";
    if (!draft) return false;
    return row.srpValue === null || Number(draft) !== Number(row.srpValue);
  });
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
  const [statsLoading, setStatsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  // Separate from `isLoading` (first load only), which also gates the header's
  // Add button — a page change should redraw the table, not the header.
  const [isPaging, setIsPaging] = useState(false);
  const listRequestRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<CommodityItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [historyRow, setHistoryRow] = useState<CommodityRow | null>(null);

  const srpHistory = useSrpHistory(historyRow?.id ?? null);
  const srpProjection = useSrpProjection(historyRow?.id ?? null);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isEditingSrp, setIsEditingSrp] = useState(false);
  const [isSavingSrp, setIsSavingSrp] = useState(false);
  const [srpDrafts, setSrpDrafts] = useState<Record<string, string>>({});
  const [srpErrors, setSrpErrors] = useState<Record<string, string>>({});
  const [srpEffectiveDate, setSrpEffectiveDate] = useState(() => getManilaDateString());
  const [srpEffectiveDateError, setSrpEffectiveDateError] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadCommodities = async (page: number) => {
    // Only the newest request may write: clicking through pages quickly must
    // not let a slower, earlier page land on top of the one asked for last.
    const requestId = ++listRequestRef.current;
    try {
      const response = await getCommodities({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        categoryId: categoryFilter || undefined,
      });
      if (requestId !== listRequestRef.current) return;
      setCommodityRows(mapCommoditiesToRows(response.data));
      setTotal(response.total);
      setError(null);
    } catch {
      if (requestId === listRequestRef.current) setError("Unable to load commodity list.");
    } finally {
      if (requestId === listRequestRef.current) {
        setIsLoading(false);
        setIsPaging(false);
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setIsPaging(true);
    setCurrentPage(page);
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
  }, [currentPage, debouncedSearch, statusFilter, categoryFilter]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const allCommodities = await fetchAllPages<CommodityItem>("/api/commodities");
      setSummaryStats({
        total: allCommodities.length,
        active: allCommodities.filter((item) => item.status === "Active").length,
        categories: new Set(allCommodities.map((item) => item.category.id)).size,
      });
    } catch {
      // Summary stats are non-critical; leave the previous values in place.
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await loadStats();
    }
    void run();
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setCategoryOptionsLoading(true);
        const categories = await getCategories();
        setCategoryOptions(categories.map(({ id, name }) => ({ id, name })));
      } catch {
        // Category options are non-critical to page load; the dropdown just
        // stays empty and the form's own validation catches an unset category.
      } finally {
        setCategoryOptionsLoading(false);
      }
    }
    void run();
  }, []);

  const handleSaveCommodity = async (data: CreateCommodityFormSchema) => {
    setFormError(null);
    setNameError(null);
    setFormSuccess(null);
    setSubmitLoading(true);

    try {
      if (editingCommodity) {
        await updateCommodity(editingCommodity.id, {
          name: data.name,
          categoryId: data.categoryId,
          status: data.status,
        });
        if (data.srpPrice && data.srpEffectiveDate) {
          await createSrp({
            commodityId: editingCommodity.id,
            price: Number(data.srpPrice),
            effectiveDate: data.srpEffectiveDate,
          });
        }
        setFormSuccess("Commodity updated successfully.");
        showToast("Commodity updated successfully.", "success");
        await loadCommodities(currentPage);
      } else {
        const payload: CreateCommodityPayload = {
          name: data.name,
          categoryId: data.categoryId,
          status: data.status,
          ...(data.srpPrice && data.srpEffectiveDate
            ? { srpPrice: Number(data.srpPrice), srpEffectiveDate: data.srpEffectiveDate }
            : {}),
        };
        await createCommodity(payload);
        setFormSuccess("Commodity created successfully.");
        showToast("Commodity created successfully.", "success");
        setCurrentPage(1);
        await loadCommodities(1);
      }
      await loadStats();

      setFormOpen(false);
      setEditingCommodity(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        setNameError(error.message);
      } else if (error instanceof Error) {
        setFormError(error.message ?? "Unable to save commodity.");
        console.error("Failed to save commodity", error);
      } else {
        setFormError("Unable to save commodity.");
        console.error("Failed to save commodity", error);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditCommodity = async (commodity: Pick<CommodityItem, "id">) => {
    setFormError(null);
    setNameError(null);
    setFormSuccess(null);
    setError(null);
    try {
      const fullCommodity = await getCommodityById(commodity.id);
      setEditingCommodity(fullCommodity);
      setFormOpen(true);
    } catch {
      setError("Unable to load commodity details.");
    }
  };

  const startSrpEdit = () => {
    setSrpDrafts(Object.fromEntries(commodityRows.map((row) => [row.id, row.srpValue ?? ""])));
    setSrpErrors({});
    setSrpEffectiveDate(getManilaDateString());
    setSrpEffectiveDateError(null);
    setIsEditingSrp(true);
  };

  const cancelSrpEdit = () => {
    setIsEditingSrp(false);
    setSrpDrafts({});
    setSrpErrors({});
    setSrpEffectiveDateError(null);
  };

  const handleSrpDraftChange = (commodityId: string, value: string) => {
    setSrpDrafts((current) => ({ ...current, [commodityId]: value }));
    setSrpErrors((current) => {
      if (!current[commodityId]) return current;
      const next = { ...current };
      delete next[commodityId];
      return next;
    });
  };

  const handleSrpEffectiveDateChange = (value: string) => {
    setSrpEffectiveDate(value);
    setSrpEffectiveDateError(null);
  };

  const handleSaveSrps = async () => {
    const changedRows = getChangedSrpRows(commodityRows, srpDrafts);
    if (changedRows.length === 0) {
      showToast("No SRP changes to save.", "neutral");
      cancelSrpEdit();
      return;
    }

    // Same rules as the SRP fields in the commodity form and the backend's
    // createSrpSchema: price > 0, date required and at most N days ahead.
    const nextErrors: Record<string, string> = {};
    for (const row of changedRows) {
      const price = Number(srpDrafts[row.id]);
      if (!Number.isFinite(price) || price <= 0) nextErrors[row.id] = "Price must be greater than 0";
    }
    let dateError: string | null = null;
    if (!srpEffectiveDate) {
      dateError = "Effective date is required";
    } else if (!isSrpEffectiveDateWithinWindow(srpEffectiveDate)) {
      dateError = `Cannot be more than ${SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD} days ahead (latest: ${getMaxSrpEffectiveDateString()})`;
    }
    setSrpErrors(nextErrors);
    setSrpEffectiveDateError(dateError);
    if (Object.keys(nextErrors).length > 0 || dateError) return;

    // One new SRP row per changed commodity through the existing POST /srps
    // (officer-only, audited) — SRPs are historical, so nothing is overwritten.
    // allSettled, not all: a failure on one row must not hide that the others
    // were saved.
    setIsSavingSrp(true);
    const results = await Promise.allSettled(
      changedRows.map((row) =>
        createSrp({
          commodityId: row.id,
          price: Number(srpDrafts[row.id]),
          effectiveDate: srpEffectiveDate,
        }),
      ),
    );
    const failedErrors: Record<string, string> = {};
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const reason = result.reason;
        failedErrors[changedRows[index]!.id] =
          reason instanceof Error && reason.message ? reason.message : "Unable to save this SRP.";
      }
    });
    const failedCount = Object.keys(failedErrors).length;
    const savedCount = changedRows.length - failedCount;

    // Reload so the table shows what the database now holds. Saved rows come
    // back with their new SRP, so their drafts no longer count as changes.
    await loadCommodities(currentPage);
    setIsSavingSrp(false);

    if (failedCount === 0) {
      cancelSrpEdit();
      showToast(`SRP updated for ${savedCount} ${savedCount === 1 ? "commodity" : "commodities"}.`, "success");
      return;
    }

    // Stay in edit mode on the rows that failed, each showing its own error.
    setSrpErrors(failedErrors);
    if (savedCount === 0) {
      showToast("Unable to save the SRP changes. See the highlighted rows.", "error");
    } else {
      showToast(`Saved ${savedCount} of ${changedRows.length} SRPs. ${failedCount} failed — see the highlighted rows.`, "error");
    }
  };

  // The Add button stays a placeholder until every fetch this page depends on
  // has settled. `categoryOptionsLoading` is the load-bearing one: it gates the
  // dialog's category dropdown, so gating on it means the form can never open
  // with an empty category list.
  const pageLoading = statsLoading || isLoading || categoryOptionsLoading;

  const totalListed = summaryStats.total;
  const activeCount = summaryStats.active;
  const categoriesCount = summaryStats.categories;

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
                    categoryId: editingCommodity.category.id,
                    status: editingCommodity.status,
                    srpPrice: "",
                    srpEffectiveDate: "",
                  }
                : undefined
            }
            categoryOptions={categoryOptions}
            categoryOptionsLoading={categoryOptionsLoading}
            showSrpFields={!editingCommodity || !INLINE_SRP_EDIT_ENABLED}
            nameError={nameError}
            formError={formError}
            formSuccess={formSuccess}
            submitLoading={submitLoading}
            onClose={() => {
              setFormOpen(false);
              setFormError(null);
              setNameError(null);
              setFormSuccess(null);
              setEditingCommodity(null);
            }}
            onSubmit={handleSaveCommodity}
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
            {canManage && NEW_COMMODITY_ENABLED ? (
              pageLoading ? (
                // Placeholder rather than nothing: the button sits in a flex row
                // beside the heading, so omitting it until the data lands would
                // shift the header. Sized to the real button's footprint
                // (px-6 py-3 around a 20px icon + label) so nothing moves on swap.
                <Skeleton className="h-12 w-52 shrink-0 rounded-xl" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommodity(null);
                    setFormOpen(true);
                    setFormError(null);
                    setNameError(null);
                    setFormSuccess(null);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition-all hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <MdAddCircle size={20} />
                  New Commodity
                </button>
              )
            ) : null}
          </div>

          {statsLoading ? (
            <section className="flex flex-wrap gap-6">
              {summaryCards.map((stat) => (
                <SkeletonStatCard key={stat.label} />
              ))}
            </section>
          ) : (
            <CommoditySummaryCards cards={summaryCards} />
          )}

          <div className="flex flex-col gap-6 xl:flex-row">
            <CommodityTable
              commodityRows={commodityRows}
              total={total}
              isLoading={isLoading || isPaging}
              error={error}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              currentPage={currentPage}
              onSearchTermChange={setSearchTerm}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              onPageChange={handlePageChange}
              onEditCommodity={canManage ? handleEditCommodity : undefined}
              onViewSrpHistory={SRP_HISTORY_ENABLED ? setHistoryRow : undefined}
              categoryFilter={
                COMMODITY_CATEGORY_FILTER_ENABLED
                  ? {
                      value: categoryFilter,
                      options: categoryOptions.map(({ id, name }) => ({ value: id, label: name })),
                      isLoading: categoryOptionsLoading,
                      onChange: (value) => {
                        if (value === categoryFilter) return;
                        // Same as the status filter: back to page 1, with the
                        // skeleton while the narrowed list loads.
                        setIsPaging(true);
                        setCategoryFilter(value);
                        setCurrentPage(1);
                      },
                    }
                  : undefined
              }
              srpEdit={
                canManage && INLINE_SRP_EDIT_ENABLED
                  ? {
                      isEditing: isEditingSrp,
                      isSaving: isSavingSrp,
                      drafts: srpDrafts,
                      errors: srpErrors,
                      effectiveDate: srpEffectiveDate,
                      effectiveDateError: srpEffectiveDateError,
                      maxEffectiveDate: getMaxSrpEffectiveDateString(),
                      changedCount: getChangedSrpRows(commodityRows, srpDrafts).length,
                      onStart: startSrpEdit,
                      onCancel: cancelSrpEdit,
                      onSave: () => void handleSaveSrps(),
                      onDraftChange: handleSrpDraftChange,
                      onEffectiveDateChange: handleSrpEffectiveDateChange,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      <SrpHistoryModal
        open={historyRow !== null}
        onClose={() => setHistoryRow(null)}
        commodityName={historyRow?.name ?? ""}
        category={historyRow?.category}
        entries={srpHistory.entries}
        isLoading={srpHistory.isLoading}
        error={srpHistory.error}
        onRetry={srpHistory.retry}
        projection={srpProjection}
      />

    </PageShell>
  );
}
