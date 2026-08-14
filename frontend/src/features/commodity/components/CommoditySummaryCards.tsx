"use client";

import type { ComponentType } from "react";

export type CommoditySummaryCard = {
  label: string;
  value: string;
  meta?: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  metaStyle?: string;
};

type CommoditySummaryCardsProps = {
  cards: CommoditySummaryCard[];
};

export default function CommoditySummaryCards({ cards }: CommoditySummaryCardsProps) {
  return (
    <section className="flex flex-wrap gap-6">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex min-w-52.5 flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className={`rounded-xl p-2 ${stat.iconBg}`}>
                <Icon className={stat.iconColor} size={24} />
              </div>
              {stat.meta ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    stat.metaStyle ?? "bg-primary/5 text-primary"
                  }`}
                >
                  {stat.meta}
                </span>
              ) : null}
            </div>
            <p className="mb-1 font-label-caps text-label-caps text-on-surface-variant">
              {stat.label}
            </p>
            <h3 className={`text-[32px] font-bold leading-none ${stat.valueColor ?? "text-on-surface"}`}>
              {stat.value}
            </h3>
          </div>
        );
      })}
    </section>
  );
}
