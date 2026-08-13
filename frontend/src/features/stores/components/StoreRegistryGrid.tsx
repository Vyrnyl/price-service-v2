import type { ReactNode } from "react";
import StoreCard from "./StoreCard";
import type { Store } from "../types/stores.types";

interface StoreRegistryGridProps {
  stores: Store[];
  showAssignedOfficer: boolean;
  onEdit: (store: Store) => void;
  expandedStoreId: string | null;
  onToggleDetails: (store: Store) => void;
  emptyState?: ReactNode;
}

export function StoreRegistryGrid({
  stores,
  showAssignedOfficer,
  onEdit,
  expandedStoreId,
  onToggleDetails,
  emptyState,
}: StoreRegistryGridProps) {
  if (stores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center text-body-md text-on-surface-variant">
        {emptyState ?? "No matching outlets found for the current filters."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 auto-rows-fr">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          showAssignedOfficer={showAssignedOfficer}
          onEdit={onEdit}
          isExpanded={expandedStoreId === store.id}
          onToggleDetails={() => void onToggleDetails(store)}
          compact
        />
      ))}
    </div>
  );
}
