export function ForecastMethodPanel() {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">Forecast method</p>
      <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-high p-4">
        <p className="text-sm font-semibold text-on-surface">ARIMA-based forecasting</p>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          Prices are projected using an ARIMA model that studies recent trends, seasonality, and short-term shifts to estimate the next likely movement.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { label: "Historical pattern", value: "Included" },
          { label: "Seasonal effects", value: "Included" },
          { label: "Short-term outlook", value: "Updated daily" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 rounded-xl bg-surface-container px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-on-surface-variant">{item.label}</span>
            <span className="text-sm font-semibold text-on-surface">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
