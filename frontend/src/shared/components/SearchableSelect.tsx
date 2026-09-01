import { useEffect, useRef, useState } from "react";
import { MdKeyboardArrowDown, MdSearch } from "react-icons/md";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  clearLabel?: string;
  "aria-label"?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyLabel = "No matches found.",
  clearLabel,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded-lg border border-outline-variant bg-surface px-4 py-3 text-left text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        onClick={() => {
          setIsOpen((current) => !current);
          setSearch("");
        }}
      >
        <span className={selectedLabel ? "text-on-surface" : "text-on-surface-variant"}>
          {selectedLabel ?? placeholder}
        </span>
        <MdKeyboardArrowDown className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-2 data-card-shadow">
          <div className="relative mb-2">
            <MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoFocus
              className="w-full rounded-xl border border-outline-variant bg-surface-container-high py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {clearLabel && !search.trim() ? (
              <button
                type="button"
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  value === ""
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
              >
                {clearLabel}
              </button>
            ) : null}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    value === option.value
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface hover:bg-surface-container-high"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-on-surface-variant">{emptyLabel}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
