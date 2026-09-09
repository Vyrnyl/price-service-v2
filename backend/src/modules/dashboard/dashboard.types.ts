export type PriceTrendPoint = {
  date: string;
  averagePrice: number;
};

export type CommodityComparisonPoint = {
  commodityId: string;
  commodityName: string;
  averagePrice: number;
};

export type SrpVsActualPoint = {
  commodityId: string;
  commodityName: string;
  srp: number;
  actualAverage: number;
};

export type CommodityOption = {
  commodityId: string;
  commodityName: string;
};

export type DashboardAnalytics = {
  priceTrend: PriceTrendPoint[];
  commodityComparison: CommodityComparisonPoint[];
  srpVsActual: SrpVsActualPoint[];
  /** Commodities with records in the selected window — populates the trend filter. */
  commodityOptions: CommodityOption[];
};

export type StoreViolationPoint = {
  storeId: string;
  storeName: string;
  violationCount: number;
  totalRecords: number;
  violationRate: number;
};
