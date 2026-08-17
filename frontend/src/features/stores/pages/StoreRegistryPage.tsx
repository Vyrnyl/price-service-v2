"use client";

import PageShell from "@/shared/components/PageShell";
import Pagination from "@/shared/components/Pagination";
import { CreateStoreDialog } from "../components/CreateStoreDialog";
import { StoreRegistryHeader } from "../components/StoreRegistryHeader";
import { StoreRegistryToolbar } from "../components/StoreRegistryToolbar";
import { StoreRegistryGrid } from "../components/StoreRegistryGrid";
import { STORE_PAGE_SIZE, useStoreRegistryState } from "../hooks/use-stores";
import { StorePriceRecordsModal } from "../components/StorePriceRecordsModal";
import { StoreRegistryPageProps } from "../types/stores.types";

export default function StoreRegistryPage({ showAssignedOfficer = true, canCreateStore = true }: StoreRegistryPageProps) {
  const {
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
  } = useStoreRegistryState();

  const selectedStoreName = stores.find((store) => store.id === expandedStoreId)?.name;
  const totalPages = Math.max(1, Math.ceil(total / STORE_PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleMunicipalityFilterChange = (value: string) => {
    setMunicipalityFilter(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleQuickFilterSelect = (value: string) => {
    handleQuickFilterChange(value);
  };

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-6xl space-y-6">
          <StoreRegistryHeader
            canCreateStore={canCreateStore}
            formOpen={formOpen}
            editingStore={Boolean(editingStore)}
            onToggleForm={formOpen ? handleCloseForm : handleOpenCreateForm}
          />

          {canCreateStore && formOpen && (
            <CreateStoreDialog
              formData={formData}
              formErrors={formErrors}
              formError={formError}
              formSuccess={formSuccess}
              submitLoading={submitLoading}
              mode={editingStore ? "edit" : "create"}
              onClose={handleCloseForm}
              onChange={handleFormChange}
              onSubmit={handleCreateStore}
            />
          )}

          <StoreRegistryToolbar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            municipalityFilter={municipalityFilter}
            onMunicipalityFilterChange={handleMunicipalityFilterChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            quickFilter={quickFilter}
            onQuickFilterChange={handleQuickFilterSelect}
            storeCount={total}
          />

          {isLoading ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-body-sm text-on-surface-variant">
              Loading stores...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error bg-error-container p-8 text-center text-body-sm text-on-error-container">
              {error}
            </div>
          ) : (
            <>
              <StoreRegistryGrid
                stores={stores}
                showAssignedOfficer={showAssignedOfficer}
                onEdit={handleEditStore}
                expandedStoreId={expandedStoreId}
                onToggleDetails={handleToggleStoreDetails}
                emptyState="No outlets match the current filters."
              />

              <StorePriceRecordsModal
                storeId={expandedStoreId}
                storeName={selectedStoreName}
                records={expandedStoreId ? storeRecords[expandedStoreId] ?? [] : []}
                loading={Boolean(expandedStoreId && storeRecordsLoading[expandedStoreId])}
                onClose={handleClosePriceRecords}
              />
            </>
          )}

          <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant py-6 md:flex-row">
            <span className="font-sans text-on-surface-variant">
              Showing {total === 0 ? 0 : `${(safeCurrentPage - 1) * STORE_PAGE_SIZE + 1}-${Math.min(safeCurrentPage * STORE_PAGE_SIZE, total)}`} of {total} store{total === 1 ? "" : "s"}
            </span>
            <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
