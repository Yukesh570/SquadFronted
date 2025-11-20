import React from "react";
import Button from "./Button";
import { Search, Trash2 } from "lucide-react";

interface FilterCardProps {
  children: React.ReactNode;
  onSearch: () => void;
  onClear: () => void;
}

const FilterCard: React.FC<FilterCardProps> = ({
  children,
  onSearch,
  onClear,
}) => {
  return (
    <div className="mb-6 rounded-xl bg-white p-5 shadow-card dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      {/* Grid layout fixed to make inputs smaller (4 cols on medium, 6 on large) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 lg:grid-cols-6">
        {children}
      </div>

      {/* Buttons aligned Left */}
      <div className="mt-5 flex justify-start space-x-3">
        <Button
          variant="primary"
          onClick={onSearch}
          leftIcon={<Search size={16} />}
        >
          Search
        </Button>
        <Button
          variant="secondary"
          onClick={onClear}
          leftIcon={<Trash2 size={16} />}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default FilterCard;
