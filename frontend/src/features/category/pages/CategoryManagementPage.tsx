"use client";

import { useEffect, useMemo, useState } from "react";
import { MdAddCircle } from "react-icons/md";
import PageShell from "@/shared/components/PageShell";
import AddCategoryDialog from "../components/AddCategoryDialog";
import CategoryTable from "../components/CategoryTable";
import DeleteCategoryDialog from "../components/DeleteCategoryDialog";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type CategoryItem,
} from "../services/category.api";
import type { CreateCategoryFormSchema } from "../schemas/category.schema";
import type { UserRole } from "@/shared/services/auth";
import { useToast } from "@/shared/components/Toast";
import { ApiError } from "@/shared/services/api";

const PAGE_SIZE = 8;

type CategoryManagementPageProps = {
  userRole: UserRole;
};

export default function CategoryManagementPage({ userRole }: CategoryManagementPageProps) {
  // Category CRUD follows commodity writes to the officer (Phase 7.6, matching
  // the 5.1 role swap) — the admin route renders the same page read-only.
  const canManage = userRole === "officer";

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch {
      setError("Unable to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await loadCategories();
    }
    void run();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleSaveCategory = async (data: CreateCategoryFormSchema) => {
    setFormError(null);
    setFormSuccess(null);
    setSubmitLoading(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data.name);
        setFormSuccess("Category updated successfully.");
        showToast("Category updated successfully.", "success");
      } else {
        await createCategory(data.name);
        setFormSuccess("Category created successfully.");
        showToast("Category created successfully.", "success");
        setCurrentPage(1);
      }

      await loadCategories();
      setFormOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to save category.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      await deleteCategory(deleteTarget.id);
      showToast("Category deleted successfully.", "success");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Unable to delete category.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-6xl space-y-6">
          <AddCategoryDialog
            open={formOpen}
            mode={editingCategory ? "edit" : "create"}
            defaultValues={editingCategory ? { name: editingCategory.name } : undefined}
            formError={formError}
            formSuccess={formSuccess}
            submitLoading={submitLoading}
            onClose={() => {
              setFormOpen(false);
              setFormError(null);
              setFormSuccess(null);
              setEditingCategory(null);
            }}
            onSubmit={handleSaveCategory}
          />

          <DeleteCategoryDialog
            open={deleteOpen}
            category={deleteTarget}
            submitLoading={deleteLoading}
            formError={deleteError}
            onClose={() => {
              setDeleteOpen(false);
              setDeleteTarget(null);
              setDeleteError(null);
            }}
            onConfirm={handleDeleteCategory}
          />

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-sans text-h1-desktop text-on-surface">Categories</h2>
              <p className="mt-1 font-sans text-on-surface-variant">
                Manage the categories offered on the Add Commodity form.
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setFormOpen(true);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-sm transition-all hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <MdAddCircle size={20} />
                New Category
              </button>
            ) : null}
          </div>

          <CategoryTable
            categoryRows={paginated}
            total={filtered.length}
            isLoading={isLoading}
            error={error}
            searchTerm={searchTerm}
            currentPage={currentPage}
            canManage={canManage}
            onSearchTermChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            onEditCategory={
              canManage
                ? (category) => {
                    setEditingCategory(category);
                    setFormError(null);
                    setFormSuccess(null);
                    setFormOpen(true);
                  }
                : undefined
            }
            onDeleteCategory={
              canManage
                ? (category) => {
                    setDeleteTarget(category);
                    setDeleteError(null);
                    setDeleteOpen(true);
                  }
                : undefined
            }
          />
        </div>
      </section>
    </PageShell>
  );
}
