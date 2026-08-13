import type { IconType } from "react-icons";
import { MdCheckCircle, MdHourglassEmpty } from "react-icons/md";
import type { Store } from "@/features/officer/types";

export function getStoreStatus(store: Store): { label: "Monitored" | "Pending"; tone: string; icon: IconType } {
  if (!store.lastVisited) {
    return {
      label: "Pending",
      tone: "border border-secondary-fixed bg-secondary-fixed/20 text-on-secondary-container",
      icon: MdHourglassEmpty,
    };
  }

  const lastVisitedDate = new Date(store.lastVisited);
  const ageInDays = Math.floor((Date.now() - lastVisitedDate.getTime()) / 86400000);

  return ageInDays > 30
    ? {
        label: "Pending",
        tone: "border border-secondary-fixed bg-secondary-fixed/20 text-on-secondary-container",
        icon: MdHourglassEmpty,
      }
    : {
        label: "Monitored",
        tone: "border border-green-200 bg-green-50 text-green-700",
        icon: MdCheckCircle,
      };
}
