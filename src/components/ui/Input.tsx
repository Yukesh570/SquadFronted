import React, { useRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightIcon?: ReactNode;
  isClearable?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  id, 
  rightIcon, 
  disabled, 
  required,
  isClearable = true, 
  value, 
  autoComplete = "off",
  ...props 
}) => {
  const inputId = id || label.replace(/\s+/g, "-").toLowerCase();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.onChange) {
      const event = {
        target: { value: "", name: props.name },
        currentTarget: { value: "", name: props.name },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      props.onChange(event);
    }
  };

  // Sync browser autofill and native input changes into React state
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (props.onChange) {
      props.onChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const hasValue = value !== undefined && value !== null && value !== "";
  const showClear = isClearable && !disabled && !props.readOnly && hasValue && !rightIcon;

  return (
    <div className="flex flex-col w-full">
      <label
        htmlFor={inputId}
        className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-400 min-h-[32px] flex items-end"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          {...props}
          ref={inputRef}
          autoComplete={autoComplete}
          id={inputId}
          value={value}
          disabled={disabled}
          required={required}
          onInput={handleInput}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-input transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary 
          ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
              : "bg-white border-gray-200 text-text-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
          }
          ${rightIcon || showClear ? "pr-10" : ""}`}
        />
        
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear input"
          >
            <X size={16} />
          </button>
        )}

        {rightIcon && (
          <div className={`absolute inset-y-0 right-0 flex items-center pr-3 ${disabled ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;