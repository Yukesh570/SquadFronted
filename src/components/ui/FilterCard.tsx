import React, { useState } from "react";
import Button from "./Button";
import { Search, Trash2, ChevronDown, ChevronUp, Filter } from "lucide-react";

interface FilterCardProps {
  children: React.ReactNode;
  onSearch: () => void;
  onClear: () => void;
  hideSearchButton?: boolean;
  title?: string;
  defaultOpen?: boolean;
}

const FilterCard: React.FC<FilterCardProps> = ({
  children,
  onSearch,
  onClear,
  hideSearchButton = false,
  title = "Search & Filters",
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hideSearchButton) {
      onSearch();
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card transition-all">
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors select-none ${
          isOpen
            ? "bg-gray-50/70 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 rounded-t-xl"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <Filter size={15} className="text-primary" />
          <span>{title}</span>
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4 lg:grid-cols-6">
            {children}
          </div>

          <div className="mt-5 flex justify-start space-x-3">
            {!hideSearchButton && (
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Search size={16} />}
              >
                Search
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={onClear}
              leftIcon={<Trash2 size={16} />}
            >
              Clear
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FilterCard;