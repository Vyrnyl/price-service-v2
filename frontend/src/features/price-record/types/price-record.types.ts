export interface PriceRecord {
  id: string;
  storeId: string;
  commodityId: string;
  date: string;
  time: string;
  dateAndTime?: string;
  store: string;
  location: string;
  commodity: string;
  commodityDetails: string;
  price: string;
  status: string;
  statusValue?: PriceStatusValue;
  srp?: string;
  officerInitials: string;
  officerName: string;
  /** Stored end of the date range (ISO), when the record covers one. */
  periodEnd?: string;
  /** The period the price covers — shown instead of date and time when `periodEnd` is set. */
  dateRange?: { label: string; days: number };
}

export interface StoreOption {
  id: string;
  name: string;
  location: string;
}

export interface CommodityOption {
  id: string;
  name: string;
  /** Present on GET /commodities; the bulk Add form groups by it. */
  category?: { id: string; name: string };
  srps?: Array<{ id: string; price: string; effectiveDate: string }>;
}

export type PriceStatusValue = "COMPLIANT" | "OVERPRICE" | "UNDERPRICE";

export interface CreatePriceRecordPayload {
  commodityId: string;
  storeId: string;
  price: number;
  /** datetime-local value, or the "YYYY-MM-DD" range start when PRICE_RECORD_DATE_RANGE_ENABLED. */
  dateAndTime: string;
  /** "YYYY-MM-DD" range end — form state only while PRICE_RECORD_DATE_RANGE_ENABLED. */
  periodEnd?: string;
}
