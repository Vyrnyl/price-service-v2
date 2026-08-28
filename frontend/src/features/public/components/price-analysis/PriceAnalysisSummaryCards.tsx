import type { ComponentType } from "react";

type SummaryCard = {
  title: string;
  value: string;
  detail: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
};

type PriceAnalysisSummaryCardsProps = {
  cards: SummaryCard[];
};

export function PriceAnalysisSummaryCards({ cards }: PriceAnalysisSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-xl border border-outline-variant/80 bg-linear-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container p-4 data-card-shadow transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-outline sm:text-[11px]">
                {card.title}
              </span>
              <div className={`rounded-xl bg-surface-container-high p-2.5 shadow-sm ${card.accent}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{card.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
