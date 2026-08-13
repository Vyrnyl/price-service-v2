export interface Store {
  id: string;
  name: string;
  location: string;
  userId: string;
  user?: { id: string; name: string };
  lastVisited: string | null;
  createdAt: string;
}

export interface StoreFormData {
  name: string;
  location: string;
  lastVisited: string;
}

export interface StoreRegistryPageProps {
  showAssignedOfficer?: boolean;
  canCreateStore?: boolean;
}
