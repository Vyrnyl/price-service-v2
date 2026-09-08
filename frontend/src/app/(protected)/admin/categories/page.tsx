import { CategoryManagementPage } from "@/features/category";

export default function AdminCategoriesRoute() {
  return <CategoryManagementPage userRole="admin" />;
}
