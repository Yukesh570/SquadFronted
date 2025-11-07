import React from "react";

export interface SegmentOption {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

interface SegmentedControlProps {
    label: string;
    selectedValue: string;
    options: SegmentOption[];
    onChange: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
    label,
    selectedValue,
    options,
    onChange,
}) => (
    <div className="space-y-1">
        <label className="block mb-1.5 text-xs font-medium text-text-secondary">
            {label}
        </label>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-inner text-sm">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${selectedValue === option.value
                        ? "bg-white dark:bg-gray-800 text-primary font-semibold shadow ring-1 ring-gray-200 dark:ring-gray-600"
                        : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
                        }`}
                >
                    {option.icon}
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

export default SegmentedControl;