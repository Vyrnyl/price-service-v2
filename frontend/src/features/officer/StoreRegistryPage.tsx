"use client";

import { useMemo, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { CreateStoreDialog } from "@/features/officer/components/CreateStoreDialog";
import { StoreRegistryHeader } from "./components/StoreRegistryHeader";
import { StoreRegistryToolbar } from "./components/StoreRegistryToolbar";
import { StoreRegistryGrid } from "./components/StoreRegistryGrid";
import { useStoreRegistryState } from "@/features/officer/store/use-stores";
import { StorePriceRecordsModal } from "@/features/officer/store/StorePriceRecordsModal";
import { StoreRegistryPageProps } from "@/features/officer/types";
import { ICON_BUTTON_CLASSES } from "./constants";

export default function StoreRegistryPage({ showAssignedOfficer = true, canCreateStore = true }: StoreRegistryPageProps) {
  const {
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
  } = useStoreRegistryState();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const selectedStoreName = stores.find((store) => store.id === expandedStoreId)?.name;
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedStores = useMemo(
    () => filteredStores.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [filteredStores, safeCurrentPage],
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleMunicipalityFilterChange = (value: string) => {
    setMunicipalityFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleQuickFilterSelect = (value: string) => {
    handleQuickFilterChange(value);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen lg:ml-72">
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
            storeCount={filteredStores.length}
          />

          {isLoading ? (
            <div className="rounded-2xl border border-outline-variant bg-white p-8 text-center text-body-md text-on-surface-variant">
              Loading stores...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-error bg-error-container p-8 text-center text-body-md text-on-error">
              {error}
            </div>
          ) : (
            <>
              <StoreRegistryGrid
                stores={pagedStores}
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
            <span className="font-body-sm text-on-surface-variant">
              Showing {filteredStores.length === 0 ? 0 : `${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, filteredStores.length)}`} of {filteredStores.length} store{filteredStores.length === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <button
                className={ICON_BUTTON_CLASSES}
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <MdChevronLeft size={20} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold shadow-sm ${
                    safeCurrentPage === page ? "bg-primary text-on-primary" : `${ICON_BUTTON_CLASSES} text-on-surface-variant`
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={ICON_BUTTON_CLASSES}
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
