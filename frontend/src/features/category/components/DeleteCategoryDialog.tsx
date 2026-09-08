"use client";

import { MdOutlineWarning } from "react-icons/md";
import Modal from "@/shared/components/Modal";
import Button from "@/shared/components/Button";
import type { CategoryItem } from "../services/category.api";

type DeleteCategoryDialogProps = {
  open: boolean;
  category: CategoryItem | null;
  submitLoading: boolean;
  formError: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function DeleteCategoryDialog({
  open,
  category,
  submitLoading,
  formError,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  if (!category) return null;

  const isBlocked = category.commodityCount > 0;

  return (
    <Modal open={open} onClose={onClose} title="Delete Category" maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <MdOutlineWarning className="mt-0.5 shrink-0 text-warning" size={20} />
          <p className="text-body-sm text-on-surface-variant">
            {isBlocked ? (
              <>
                <span className="font-semibold text-on-surface">{category.name}</span> is still
                used by <span className="font-semibold text-on-surface">{category.commodityCount}</span>{" "}
                {category.commodityCount === 1 ? "commodity" : "commodities"}. Change their
                category or delete them first, then delete this category.
              </>
            ) : (
              <>
                Delete <span className="font-semibold text-on-surface">{category.name}</span>? This
                cannot be undone.
              </>
            )}
          </p>
        </div>

        {formError ? <p className="text-center text-xs font-medium text-error">{formError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isBlocked ? (
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="danger" disabled={submitLoading} onClick={() => onConfirm()}>
                {submitLoading ? "Deleting..." : "Delete Category"}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
