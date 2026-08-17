import { MdOutlineEdit } from "react-icons/md";
import type { PriceRecord } from "../types/price-record.types";

interface PriceRecordsTableProps {
  records: PriceRecord[];
  onEdit?: (record: PriceRecord) => void;
  hideActions?: boolean;
  hideOfficerColumn?: boolean;
  hideCommodityColumn?: boolean;
  compact?: boolean;
  headerHighlight?: string;
}

function getStatusClasses(status: string, compact = false) {
  const baseClasses = compact
    ? "rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold"
    : "rounded-full bg-primary/10 text-primary px-3 py-1 text-[12px] font-semibold";

  if (status === "Compliant") {
    return baseClasses;
  }

  if (status === "Above SRP") {
    return compact
      ? "rounded-full bg-error-container text-on-error-container px-2 py-0.5 text-[10px] font-semibold"
      : "rounded-full bg-error-container text-on-error-container px-3 py-1 text-[12px] font-semibold";
  }

  return compact
    ? "rounded-full bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 text-[10px] font-semibold"
    : "rounded-full bg-secondary-fixed text-on-secondary-fixed px-3 py-1 text-[12px] font-semibold";
}

export default function PriceRecordsTable({
  records,
  onEdit,
  hideActions = false,
  hideOfficerColumn = false,
  hideCommodityColumn = false,
  compact = false,
  headerHighlight,
}: PriceRecordsTableProps) {
  return (
    <>
      <div className={`mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${compact ? "mb-3" : "mb-5"}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {headerHighlight ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary sm:text-xs">
                {headerHighlight}
              </span>
            ) : null}
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full bg-surface-container-low py-1 px-2 text-[11px] text-on-surface-variant ${compact ? "text-[11px]" : "text-body-xs"}`}>
          {records.length} records shown
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-center">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className={`${compact ? "pb-1 text-[8px]" : "pb-2 text-[9px]"} font-sans uppercase tracking-[0.24em] text-outline`}>Date & Time</th>
              <th className={`${compact ? "pb-1 text-[8px]" : "pb-2 text-[9px]"} font-sans uppercase tracking-[0.24em] text-outline`}>Store & Location</th>
              {!hideCommodityColumn ? (
                <th className={`${compact ? "pb-1 text-[8px]" : "pb-2 text-[9px]"} font-sans uppercase tracking-[0.24em] text-outline`}>Commodity</th>
              ) : null}
              <th className={`${compact ? "pb-1 text-[8px]" : "pb-2 text-[9px]"} font-sans uppercase tracking-[0.24em] text-outline`}>Price & Status</th>
              {!hideOfficerColumn ? (
                <th className={`${compact ? "pb-1 text-[8px]" : "pb-2 text-[9px]"} font-sans uppercase tracking-[0.24em] text-outline`}>Officer</th>
              ) : null}
              {!hideActions ? (
                <th className={`${compact ? "pb-1 text-[8px]" : "pb-2 text-[9px]"} font-sans uppercase tracking-[0.24em] text-outline`}>Action</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {records.map((record) => (
              <tr key={record.id}>
                <td className={`${compact ? "py-2" : "py-3"} align-top`}>
                  <div className={`font-semibold text-on-surface ${compact ? "text-xs" : "text-sm"}`}>{record.date}</div>
                  <div className={`${compact ? "text-[10px]" : "text-body-xs"} text-on-surface-variant`}>{record.time}</div>
                </td>
                <td className={`${compact ? "py-2" : "py-3"} align-top`}>
                  <div className={`font-semibold text-on-surface ${compact ? "text-xs" : "text-sm"}`}>{record.store}</div>
                  <div className={`${compact ? "text-[10px]" : "text-body-xs"} text-on-surface-variant`}>{record.location}</div>
                </td>
                {!hideCommodityColumn ? (
                  <td className={`${compact ? "py-2" : "py-3"} align-top`}>
                    <div className={`font-semibold text-on-surface ${compact ? "text-xs" : "text-sm"}`}>{record.commodity}</div>
                    <div className={`${compact ? "text-[10px]" : "text-body-xs"} text-on-surface-variant`}>{record.commodityDetails}</div>
                  </td>
                ) : null}
                <td className={`${compact ? "py-2" : "py-3"} align-top`}>
                  <div className={`font-semibold text-on-surface ${compact ? "text-xs" : "text-sm"}`}>{record.price}</div>
                  <div className={`mt-1 flex flex-wrap items-center justify-center gap-2 ${compact ? "gap-1" : "gap-2"}`}>
                    <span className={getStatusClasses(record.status, compact)}>{record.status}</span>
                    {record.srp ? (
                      <span className={`${compact ? "text-[10px]" : "text-body-xs"} text-on-surface-variant`}>({record.srp})</span>
                    ) : null}
                  </div>
                </td>
                {!hideOfficerColumn ? (
                  <td className={`${compact ? "py-2" : "py-3"} align-top`}>
                    <div className="flex items-center justify-center gap-2">
                      <div className={`flex ${compact ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-sm"} items-center justify-center rounded-full bg-primary-fixed text-primary font-semibold`}>
                        {record.officerInitials}
                      </div>
                      <span className={`${compact ? "text-[10px]" : "text-body-xs"} text-on-surface`}>{record.officerName}</span>
                    </div>
                  </td>
                ) : null}
                {!hideActions ? (
                  <td className={`${compact ? "py-2" : "py-3"} align-top`}>
                    <button
                      type="button"
                      onClick={() => onEdit?.(record)}
                      className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface p-2 text-on-surface transition hover:bg-surface-container-high"
                      aria-label="Edit price record"
                    >
                      <MdOutlineEdit size={16} />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
