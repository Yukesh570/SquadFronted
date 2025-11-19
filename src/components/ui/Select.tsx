import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
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
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
}) => {
  const selectedOption =
    options.find((option) => option.value === value) || null;
  const hasLabel = !!label;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={`flex flex-col ${hasLabel ? "" : "justify-end"}`}>
        {hasLabel && (
          <label className="mb-1.5 text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <Listbox.Button
            className={`w-full rounded-lg border bg-white px-3 pr-10 text-sm text-left shadow-input transition duration-150 ease-in-out focus:outline-none focus:ring-1 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-primary focus:ring-primary"
            } dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              hasLabel ? "py-2.5" : "py-2"
            }`}
          >
            <span
              className={`block truncate ${
                !selectedOption
                  ? "text-gray-400"
                  : "text-text-secondary dark:text-gray-200"
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                size={18}
                className="text-gray-500"
                aria-hidden="true"
              />
            </span>

            {value && (
              <span
                onClick={handleClear}
                className="absolute inset-y-0 right-8 flex items-center pr-2 cursor-pointer hover:text-red-500 group"
                title="Clear selection"
              >
                <X
                  size={16}
                  className="text-gray-400 group-hover:text-red-500"
                />
              </span>
            )}
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active
                        ? "bg-gray-100 dark:bg-gray-700 text-primary"
                        : "text-text-secondary dark:text-gray-300"
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium text-primary" : "font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <Check size={16} aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    </Listbox>
  );
};

export default Select;
