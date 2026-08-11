import React from "react";
import Button from "./Button";
import { Search, Trash2 } from "lucide-react";

interface FilterCardProps {
  children: React.ReactNode;
  onSearch: () => void;
  onClear: () => void;
  hideSearchButton?: boolean;
}

const FilterCard: React.FC<FilterCardProps> = ({
  children,
  onSearch,
  onClear,
  hideSearchButton = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hideSearchButton) {
      onSearch();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl bg-white p-5 shadow-card dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 lg:grid-cols-6 items-end">
        {children}

        <div className="flex justify-start space-x-3 pb-0.5">
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
      </div>
    </form>
  );
};

export default FilterCard;
