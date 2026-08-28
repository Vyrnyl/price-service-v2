import { useMemo, useState } from "react";
import { PriceRecordsTable, type PriceRecord } from "@/features/price-record";
import Modal from "@/shared/components/Modal";
import Pagination from "@/shared/components/Pagination";

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

  return (
    <Modal
      open={Boolean(storeId)}
      onClose={onClose}
      title="Store Price Records"
      description={storeName ? `Showing price records for ${storeName}.` : "Showing price records for the selected store."}
      maxWidth="max-w-4xl"
    >
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
                <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} size="sm" />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-[11px] text-on-surface-variant sm:text-xs">
            No price records found for this store.
          </div>
        )}
    </Modal>
  );
}
