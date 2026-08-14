import type { ExportFormat } from "../types/report.types";

export default function ExportFormatButton({
  format,
  isSelected,
  onSelect,
}: {
  format: ExportFormat;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = format.icon;
  const baseClasses = "flex items-center gap-3 rounded-xl border px-6 py-3 transition-all duration-200 text-left w-full";
  const activeClasses = "border-primary bg-primary-container text-on-primary-container";
  const inactiveClasses = "border-outline-variant bg-surface-container-lowest hover:border-primary";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${baseClasses} ${isSelected ? activeClasses : inactiveClasses}`}
    >
      <Icon className={format.iconClass} size={20} />
      <span className="text-body-sm font-semibold">{format.label}</span>
    </button>
  );
}
