import { MdAddBusiness, MdOutlineStorefront } from "react-icons/md";

interface StoreRegistryHeaderProps {
  canCreateStore: boolean;
  formOpen: boolean;
  editingStore: boolean;
  onToggleForm: () => void;
}

export function StoreRegistryHeader({ canCreateStore, formOpen, editingStore, onToggleForm }: StoreRegistryHeaderProps) {
  if (!canCreateStore) {
    return (
      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <MdOutlineStorefront size={20} />
          <span className="font-sans text-label-caps text-outline">Registry Management</span>
        </div>
        <h1 className="font-sans text-h1-desktop text-on-surface mobile:font-sans mobile:text-h1-mobile">
          Establishment Registry
        </h1>
        <p className="mt-1 font-sans text-on-surface-variant">
          Manage and monitor registered retail outlets across Catanduanes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-primary">
          <MdOutlineStorefront size={20} />
          <span className="font-sans text-label-caps text-outline">Registry Management</span>
        </div>
        <h1 className="font-sans text-h1-desktop text-on-surface mobile:font-sans mobile:text-h1-mobile">
          Establishment Registry
        </h1>
        <p className="mt-1 font-sans text-on-surface-variant">
          Manage and monitor registered retail outlets across Catanduanes.
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleForm}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-sans font-semibold text-on-primary shadow-sm transition-all hover:shadow-md"
      >
        <MdAddBusiness size={18} />
        <span>{formOpen ? (editingStore ? "Close Edit Outlet" : "Close Add Outlet") : "Add New Outlet"}</span>
      </button>
    </div>
  );
}
