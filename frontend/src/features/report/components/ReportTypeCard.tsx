import type { ReportType } from "../types/report.types";

export default function ReportTypeCard({
  type,
  isSelected,
  onSelect,
}: {
  type: ReportType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = type.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-w-0 cursor-pointer flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-left transition-all duration-200 hover:border-primary ${
        isSelected ? "border-primary data-card-shadow" : ""
      }`}
    >
      <div className="absolute right-4 top-4">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
          isSelected ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"
        }`}>
          {isSelected ? "✓" : ""}
        </span>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2 ${type.iconBg}`}>
          <Icon className={type.iconColor} size={24} />
        </div>
        {type.meta ? (
          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${type.metaStyle}`}>
            {type.meta}
          </span>
        ) : null}
      </div>
      <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">Report Type</p>
      <h4 className={`text-[22px] font-semibold leading-tight ${isSelected ? "text-primary" : "text-on-surface"}`}>
        {type.title}
      </h4>
      <span className="mt-3 text-body-sm text-on-surface-variant">{type.description}</span>
    </button>
  );
}
