import React, { Fragment, useState, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { ChevronDown, Check, X } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  clearable?: boolean;
  disabled?: boolean;
  placement?: "top" | "bottom";
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  clearable = true,
  disabled = false,
  placement = "bottom",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(50); 
  const hasLabel = !!label;

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    setVisibleCount(50);
  }, [query, options]);

  // ⚡️ FIX: Changed HTMLUListElement to HTMLElement to resolve the strict TypeScript error
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      if (visibleCount < filteredOptions.length) {
        setVisibleCount((prev) => prev + 50);
      }
    }
  };

  const visibleOptions = filteredOptions.slice(0, visibleCount);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <Combobox value={value} onChange={(val: string | null) => onChange(val || "")} disabled={disabled}>
      <div
        className={`flex flex-col ${
          hasLabel ? "" : "justify-end"
        } ${className}`}
      >
        {hasLabel && (
          <label className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-400">
            {label}
          </label>
        )}
        <div className="relative">
          <div
            className={`relative w-full rounded-lg border text-sm text-left shadow-input transition duration-150 ease-in-out focus-within:outline-none focus-within:ring-1 
            ${
              error
                ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500"
                : "border-gray-200 focus-within:border-primary focus-within:ring-primary"
            } 
            ${
              disabled
                ? "bg-gray-100 dark:bg-gray-800"
                : "bg-white dark:bg-gray-800"
            }
            dark:border-gray-700`}
          >
            <Combobox.Input
              className={`w-full border-none bg-transparent px-3 pr-10 outline-none focus:outline-none focus:ring-0 focus:border-transparent text-text-primary dark:text-white ${
                hasLabel ? "py-2.5" : "py-2"
              } ${
                disabled
                  ? "text-gray-400 cursor-not-allowed dark:text-gray-500"
                  : ""
              }`}
              displayValue={(val: string) =>
                options.find((option) => option.value === val)?.label || ""
              }
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />

            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                size={18}
                className={`${
                  disabled
                    ? "text-gray-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                aria-hidden="true"
              />
            </Combobox.Button>

            {value && clearable && !disabled && (
              <span
                onClick={handleClear}
                className="absolute inset-y-0 right-8 flex items-center pr-2 cursor-pointer hover:text-red-500 group z-10"
                title="Clear selection"
              >
                <X
                  size={16}
                  className="text-gray-400 group-hover:text-red-500"
                />
              </span>
            )}
          </div>

          {!disabled && (
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery("")}
            >
              <Combobox.Options
                onScroll={handleScroll}
                className={`absolute z-20 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-gray-700 custom-grid-scroll
                max-h-60 
                ${placement === "top" ? "bottom-full mb-1" : "mt-1"}`}
              >
                {filteredOptions.length === 0 && query !== "" ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-text-secondary dark:text-gray-400">
                    Nothing found.
                  </div>
                ) : (
                  visibleOptions.map((option) => (
                    <Combobox.Option
                      key={option.value}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-primary/10 text-primary dark:text-primary dark:bg-primary/20"
                            : "text-text-secondary dark:text-gray-300"
                        }`
                      }
                      value={option.value}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected
                                ? "font-medium text-primary dark:text-primary"
                                : "font-normal"
                            }`}
                          >
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary dark:text-primary">
                              <Check size={16} aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
                {visibleCount < filteredOptions.length && (
                  <div className="text-center py-2 text-xs text-gray-400">
                    Scroll for more...
                  </div>
                )}
              </Combobox.Options>
            </Transition>
          )}
        </div>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    </Combobox>
  );
};

export default Select;