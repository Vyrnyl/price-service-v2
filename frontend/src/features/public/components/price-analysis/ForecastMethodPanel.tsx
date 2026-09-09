export function ForecastMethodPanel() {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">How the forecast works</p>
      <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-high p-4">
        <p className="text-sm font-semibold text-on-surface">A projection, not a guarantee</p>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          We look at a commodity&apos;s recently recorded prices and project where the price is likely headed over the next few days, based on that recent pattern. It&apos;s an estimate — actual prices can move differently.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { label: "Based on", value: "Recently recorded prices" },
          { label: "Looks ahead", value: "Next 7 days" },
          // Recalculated per request in `publicController.getPublicForecastByCommodityId`
          // — there is no scheduled job, so the old "When DTI runs a new forecast"
          // described a manual step that does not exist.
          { label: "Refreshed", value: "Every time new prices are recorded" },
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
