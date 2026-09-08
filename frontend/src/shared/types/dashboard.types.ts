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

export type DashboardAnalytics = {
  priceTrend: PriceTrendPoint[];
  commodityComparison: CommodityComparisonPoint[];
  srpVsActual: SrpVsActualPoint[];
};

export type StoreViolationPoint = {
  storeId: string;
  storeName: string;
  violationCount: number;
  totalRecords: number;
  violationRate: number;
};
