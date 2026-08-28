import type { StoreFormData } from "../types/stores.types";

export const BLANK_FORM_DATA: StoreFormData = {
  name: "",
  location: "",
  lastVisited: "",
};

export const STORE_FILTER_OPTIONS = ["All Municipalities", "Virac", "San Andres", "Caramoran", "Pandan", "Bato"];
export const STATUS_FILTER_OPTIONS = ["All Statuses", "Monitored", "Pending"];
export const STATUS_CHIPS = ["All", "Monitored", "Pending", "Recently Updated"];
