import React, { useState, useEffect, useRef, Fragment } from "react";
import ReactDOM from "react-dom";
import { Popover, Transition } from "@headlessui/react";
import { Check } from "lucide-react";

export interface MultiSelectOption {
  label: string;
  value: string;
  isAll?: boolean;
  isUiOnly?: boolean; // True if it's an artificial header, False if it comes from the DB
  groupIndex?: number; // Used for zebra-striping different groups
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selectedValues: string[], clickedOption?: MultiSelectOption) => void;
  disabled?: boolean;
  placeholder?: string;
}

// --- React Portal Helper ---
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === "undefined") return null; // Safety for SSR/Next.js
  return ReactDOM.createPortal(children, document.body);
};

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  disabled = false,
  placeholder = "Select...",
}) => {
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, []);

  let topPosition = 0;
  let leftPosition = 0;
  let maxDropdownHeight = 320;
  let dropdownWidth = 280;

  if (buttonRect) {
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - buttonRect.bottom - 20;
    topPosition = buttonRect.bottom + 4;
    maxDropdownHeight = Math.min(320, Math.max(220, spaceBelow));
    leftPosition = buttonRect.left;
    dropdownWidth = buttonRect.width;
  }

  // FIXED: Intelligent UI label handling for single rows
  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const matchedOption = options.find((opt) => opt.value === selected[0]);
      return matchedOption ? matchedOption.label : "1 selected";
    }
    return `${selected.length} selected`;
  };

  return (
    <Popover className="relative flex flex-col w-full">
      {({ open, close }) => (
        <>
          <label className="text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
            {label}
          </label>
          <Popover.Button
            ref={buttonRef}
            onClick={updatePosition}
            disabled={disabled}
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 flex justify-between items-center transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm ${
              disabled
                ? "bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed"
                : "bg-white dark:bg-gray-900 cursor-pointer hover:border-primary"
            } ${open ? "ring-1 ring-primary border-primary" : ""}`}
          >
            <span className="text-sm truncate text-text-primary dark:text-white">
              {getDisplayText()}
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </Popover.Button>

          {open && buttonRect && !disabled && (
            <Portal>
              <div className="fixed inset-0 z-[9999]" onClick={() => close()}>
                <div
                  className="absolute flex flex-col"
                  style={{
                    top: topPosition,
                    left: leftPosition,
                    width: dropdownWidth,
                    maxHeight: maxDropdownHeight,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Transition
                    appear={true}
                    show={true}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <div
                      className="w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
                      style={{ maxHeight: "inherit" }}
                    >
                      <div className="flex-1 overflow-y-auto min-h-0 relative">
                        {options.map((opt) => {
                          let isSelected = false;

                          if (opt.isAll) {
                            if (opt.value === "ALL_MCC") {
                              const standardOpts = options.filter((o) => !o.isUiOnly);
                              isSelected =
                                standardOpts.length > 0 &&
                                standardOpts.every((o) => selected.includes(o.value));
                            } else {
                              const mccPrefix = opt.value.split("(")[0];
                              const standardOpts = options.filter(
                                (o) => o.value.startsWith(`${mccPrefix}(`) && !o.isUiOnly
                              );
                              isSelected =
                                standardOpts.length > 0 &&
                                standardOpts.every((o) => selected.includes(o.value));
                            }
                          } else {
                            isSelected = selected.includes(opt.value);
                          }

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                if (opt.isAll) {
                                  onChange(selected, opt);
                                } else {
                                  if (isSelected) {
                                    onChange(
                                      selected.filter((v) => v !== opt.value),
                                      opt
                                    );
                                  } else {
                                    onChange([...selected, opt.value], opt);
                                  }
                                }
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors
                                ${
                                  opt.isAll
                                    ? "sticky top-0 z-10 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold border-y border-gray-300 dark:border-gray-600 shadow-sm"
                                    : opt.groupIndex !== undefined && opt.groupIndex % 2 !== 0
                                    ? "bg-blue-50/60 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                }
                                ${
                                  isSelected && !opt.isAll
                                    ? "text-primary dark:text-primary font-medium"
                                    : ""
                                }
                              `}
                            >
                              <span className="truncate">{opt.label}</span>
                              {isSelected && (
                                <Check
                                  size={16}
                                  className={
                                    opt.isAll
                                      ? "text-gray-800 dark:text-gray-200"
                                      : "text-primary"
                                  }
                                  strokeWidth={2.5}
                                />
                              )}
                            </button>
                          );
                        })}
                        {options.length === 0 && (
                          <div className="py-3 px-4 text-left text-gray-500 text-sm">
                            No options available
                          </div>
                        )}
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </Portal>
          )}
        </>
      )}
    </Popover>
  );
};