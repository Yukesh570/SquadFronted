import React from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightIcon?: ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, rightIcon, ...props }) => {
  const inputId = id || label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="flex flex-col">
      <label
        htmlFor={inputId}
        className="mb-1.5 text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-input transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${rightIcon ? "pr-10" : ""
            }`}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;