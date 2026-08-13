import type { ReactNode } from "react";
import { IoMdArrowForward } from "react-icons/io";
import { MdCalendarToday, MdEdit, MdLocationOn, MdStore } from "react-icons/md";
import { Store } from "../types/stores.types";
import { getStoreStatus } from "../utils/store-status";

export default function StoreCard({
  store,
  showAssignedOfficer,
  onEdit,
  isExpanded = false,
  onToggleDetails,
  children,
  compact = false,
}: {
  store: Store;
  showAssignedOfficer: boolean;
  onEdit?: (store: Store) => void;
  isExpanded?: boolean;
  onToggleDetails?: (store: Store) => void;
  children?: ReactNode;
  compact?: boolean;
}) {
  const status = getStoreStatus(store);
  const StatusIcon = status.icon;

  return (
    <div className={`flex ${compact ? "h-auto" : "h-full"} flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm transition-shadow hover:shadow-md`}>
      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-6"}`}>
        <div className={`mb-3 flex items-start justify-between gap-3 ${compact ? "" : "mb-4"}`}>
          <div className={`flex ${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-xl bg-primary-fixed text-primary`}>
            <MdStore size={compact ? 20 : 24} />
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] ${status.tone}`}>
            <StatusIcon size={compact ? 12 : 14} />
            <span className={compact ? "text-[10px]" : ""}>{status.label}</span>
          </div>
        </div>

        <h3 className={`mb-1 truncate ${compact ? "text-sm font-semibold" : "font-h3-desktop text-h3-desktop"} text-on-surface`}>{store.name}</h3>

        <div className={`mt-auto space-y-2 border-t border-outline-variant ${compact ? "pt-2" : "pt-4"}`}>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MdLocationOn size={compact ? 16 : 18} />
            <span className={compact ? "text-body-xs" : "text-body-sm"}>{store.location}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MdCalendarToday size={compact ? 16 : 18} />
            <span className={compact ? "text-body-xs" : "text-body-sm"}>
              Last visit: {store.lastVisited ? new Date(store.lastVisited).toLocaleDateString() : "No visits yet"}
            </span>
          </div>
        </div>
      </div>

      <div className={`border-t border-outline-variant bg-surface-container-low ${compact ? "px-4 py-2" : "px-6 py-3"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-label-caps text-label-caps text-on-surface-variant ${compact ? "text-[10px]" : ""}`}>
            {showAssignedOfficer ? `Assigned Officer: ${store.user?.name ?? "Unassigned"}` : store.lastVisited ? "Last visit recorded" : "No visit data"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(store)}
              className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface p-2 text-on-surface transition-colors hover:bg-surface-container-high"
              aria-label="Edit store"
            >
              <MdEdit size={14} />
            </button>
            <button
              type="button"
              onClick={() => onToggleDetails?.(store)}
              className={`flex items-center gap-1 ${compact ? "text-body-sm" : "font-body-sm font-semibold text-primary"} transition-colors hover:underline`}
            >
              {isExpanded ? "Hide Details" : "Details"}
              <IoMdArrowForward className={isExpanded ? "rotate-90 transition-transform" : "transition-transform"} />
            </button>
          </div>
        </div>
      </div>

      {children ? <div className="border-t border-outline-variant bg-surface-container-low p-4">{children}</div> : null}
    </div>
  );
}
