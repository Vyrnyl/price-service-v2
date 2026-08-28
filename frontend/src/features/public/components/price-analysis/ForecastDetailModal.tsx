import { MdClose } from "react-icons/md";
import Modal from "@/shared/components/Modal";

type ForecastDetailModalProps = {
  selectedCommodity: string;
  currentPrice: number | null;
  projectedPrice: number | null;
  confidence: number | null;
  srpPrice: number | null;
  onClose: () => void;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatConfidence(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export function ForecastDetailModal({
  selectedCommodity,
  currentPrice,
  projectedPrice,
  confidence,
  srpPrice,
  onClose,
}: ForecastDetailModalProps) {
  return (
    <Modal open onClose={onClose} maxWidth="max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">Detailed forecast report</p>
            <h3 className="mt-1 text-2xl font-semibold text-on-surface">{selectedCommodity} forecast overview</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Insights for the selected commodity, including current price, expected movement, and the statistical basis behind the projection.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-surface-container-high p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            onClick={onClose}
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">Current price</p>
            <p className="mt-2 text-3xl font-semibold text-on-surface">{formatCurrency(currentPrice)}</p>
            <p className="mt-1 text-sm text-on-surface-variant">Compared with the SRP benchmark of {formatCurrency(srpPrice)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">Forecast window</p>
            <p className="mt-2 text-3xl font-semibold text-on-surface">{formatCurrency(projectedPrice)}</p>
            <p className="mt-1 text-sm text-on-surface-variant">Projected for the next week</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-outline-variant bg-surface-container p-4">
          <p className="text-sm font-semibold text-on-surface">Why this forecast matters</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            The outlook is based on the latest price pattern, seasonality, and recent market volatility. The ARIMA model continues to update as new price points arrive, making this view useful for short-term monitoring and planning.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: "Confidence", value: formatConfidence(confidence) },
            { label: "Range", value: `${formatCurrency(currentPrice)} - ${formatCurrency(projectedPrice)}` },
            { label: "Model", value: "ARIMA" },
          ].map((item) => (
            <div key={item.label} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm">
              <span className="text-on-surface-variant">{item.label}: </span>
              <span className="font-semibold text-on-surface">{item.value}</span>
            </div>
          ))}
        </div>
    </Modal>
  );
}
