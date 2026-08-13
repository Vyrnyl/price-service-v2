"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maxWidth?: string;
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  maxWidth = "max-w-xl",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`w-full ${maxWidth} rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow`}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="modal-title" className="text-h3-desktop font-semibold text-on-surface">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 text-body-sm text-on-surface-variant">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex rounded-full bg-surface px-3 py-2 text-on-surface transition hover:bg-surface-container-high"
            >
              Close
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
