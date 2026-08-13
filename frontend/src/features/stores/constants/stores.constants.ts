import type { StoreFormData } from "../types/stores.types";

export const BLANK_FORM_DATA: StoreFormData = {
  name: "",
  location: "",
  lastVisited: "",
};

export const ICON_BUTTON_CLASSES =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-all hover:bg-surface-container";

export const STORE_FILTER_OPTIONS = ["All Municipalities", "Virac", "San Andres", "Caramoran", "Pandan", "Bato"];
export const STATUS_FILTER_OPTIONS = ["All Statuses", "Monitored", "Pending"];
export const STATUS_CHIPS = ["All", "Monitored", "Pending", "Recently Updated"];
