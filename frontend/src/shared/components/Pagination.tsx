import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";

type PaginationSize = "sm" | "md";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: PaginationSize;
  className?: string;
}

const SIZE_CLASSES: Record<PaginationSize, { button: string; icon: number }> = {
  sm: { button: "h-8 w-8 text-[11px] sm:h-9 sm:w-9 sm:text-sm", icon: 18 },
  md: { button: "h-10 w-10 text-sm", icon: 20 },
};

const MAX_VISIBLE_WITHOUT_WINDOWING = 7;

function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= MAX_VISIBLE_WITHOUT_WINDOWING) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const keep = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  });
  return result;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  size = "md",
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const { button: buttonClasses, icon: iconSize } = SIZE_CLASSES[size];
  const FOCUS_RING_CLASSES =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const navButtonClasses = `flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING_CLASSES} ${buttonClasses}`;

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      <button
        type="button"
        className={navButtonClasses}
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label="Previous page"
      >
        <MdOutlineChevronLeft size={iconSize} />
      </button>

      {getPageWindow(currentPage, totalPages).map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-on-surface-variant">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            className={`flex items-center justify-center rounded-lg border font-semibold transition-colors ${FOCUS_RING_CLASSES} ${buttonClasses} ${
              currentPage === page
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
            }`}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        className={navButtonClasses}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label="Next page"
      >
        <MdOutlineChevronRight size={iconSize} />
      </button>
    </div>
  );
}
