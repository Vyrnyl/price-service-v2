import StoreRegistryPage from "@/features/stores";

export default function AdminStoreRoute() {
  return <StoreRegistryPage showAssignedOfficer canCreateStore={false} />;
}
