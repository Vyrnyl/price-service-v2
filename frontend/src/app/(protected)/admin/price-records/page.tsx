import PriceRecordsPage from "@/features/price-record";

export default function AdminPriceRecordsRoute() {
  return <PriceRecordsPage canCreateRecord={false} hideActions />;
}
