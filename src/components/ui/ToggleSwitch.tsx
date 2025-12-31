import React from "react";

interface ToggleSwitchProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <label className="flex items-center cursor-pointer">
      {/* The Toggle Switch */}
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        {/* The track (background) */}
        <div
          className={`block w-10 h-5 rounded-full transition ${
            checked ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
          }`}
        ></div>
        {/* The circle (knob) */}
        <div
          className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        ></div>
      </div>

      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

export default ToggleSwitch;
