import { useMemo, useState } from "react";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";
import { PriceRecordsTable, type PriceRecord } from "@/features/price-record";

function getStatusLabel(status: string | undefined, price: number, srpPrice: number | null) {
  if (Number.isFinite(price) && srpPrice != null) {
    if (price > srpPrice) {
      return "Above SRP";
    }

    if (price < srpPrice) {
      return "Below SRP";
    }

    return "Compliant";
  }

  switch (status) {
    case "Above SRP":
    case "OVERPRICE":
      return "Above SRP";
    case "Below SRP":
    case "UNDERPRICE":
      return "Below SRP";
    case "Compliant":
    case "COMPLIANT":
      return "Compliant";
    default:
      return "Unknown";
  }
}

interface StorePriceRecordsModalProps {
  storeId: string | null;
  storeName?: string;
  records: PriceRecord[];
  loading: boolean;
  onClose: () => void;
}

export function StorePriceRecordsModal({ storeId, storeName, records, loading, onClose }: StorePriceRecordsModalProps) {
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedRecords = useMemo(() => {
    return records.map((record) => {
      const numericPrice = Number(record.price.replace(/[^\d.]/g, ""));
      const srpValue = record.srp ? Number(record.srp.replace(/[^\d.]/g, "")) : null;

      return {
        ...record,
        status: getStatusLabel(record.statusValue, numericPrice, srpValue),
      };
    });
  }, [records]);

  const totalPages = Math.max(1, Math.ceil(normalizedRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRecords = normalizedRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!storeId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-on-surface">Store Price Records</h2>
            <p className="mt-0.5 text-[11px] text-on-surface-variant sm:text-xs">
              {storeName ? `Showing price records for ${storeName}.` : "Showing price records for the selected store."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-full bg-surface px-2.5 py-1.5 text-xs text-on-surface transition hover:bg-surface-container-high sm:px-3 sm:py-2 sm:text-sm"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-[11px] text-on-surface-variant sm:text-xs">
            Loading price records...
          </div>
        ) : normalizedRecords.length > 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:p-3">
            <PriceRecordsTable records={pagedRecords} hideActions hideOfficerColumn hideCommodityColumn compact />
            {normalizedRecords.length > pageSize ? (
              <div className="mt-3 flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-[11px] text-on-surface-variant sm:text-sm">
                  Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, normalizedRecords.length)} of {normalizedRecords.length} records
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <MdOutlineChevronLeft size={18} />
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                        safePage === page
                          ? "border-primary bg-primary text-on-primary"
                          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    <MdOutlineChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-[11px] text-on-surface-variant sm:text-xs">
            No price records found for this store.
          </div>
        )}
      </div>
    </div>
  );
}
