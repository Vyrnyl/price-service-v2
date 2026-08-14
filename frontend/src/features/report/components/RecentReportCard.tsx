import { RecentReport } from "../types/report.types";

export default function RecentReportCard({ report }: { report: RecentReport }) {
  const StatusIcon = report.statusIcon;
  const ButtonIcon = report.buttonIcon;

  const handleClick = () => {
    window.open(report.downloadUrl, "_blank");
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 data-card-shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-on-surface">{report.name}</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">{report.meta}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-label-caps font-semibold ${report.statusClass}`}>
          <StatusIcon size={14} />
          {report.status}
        </span>
      </div>

      <button
        type="button"
        disabled={report.disabled ?? false}
        onClick={handleClick}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition-colors ${report.buttonClass}`}
      >
        <ButtonIcon size={18} />
        {report.buttonLabel}
      </button>
    </div>
  );
}
