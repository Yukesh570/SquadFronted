import React, { useState, useEffect, useRef, Fragment } from "react";
import ReactDOM from "react-dom";
import { Popover, Transition } from "@headlessui/react";
import { Check, X, ChevronDown } from "lucide-react";

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
  
  const [searchTerm, setSearchTerm] = useState("");

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

  const removeTag = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    const option = options.find((o) => o.value === value);
    const newSelected = selected.filter((v) => v !== value);
    onChange(newSelected, option);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange([]);
      setSearchTerm("");
    }
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover className="relative flex flex-col w-full">
      {({ open, close }) => {
        if (open && !buttonRect) {
            updatePosition();
        }

        return (
          <>
            <label className="text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
              {label}
            </label>

            <Popover.Button
              ref={buttonRef}
              onClick={updatePosition}
              disabled={disabled}
              className={`w-full min-h-[42px] border rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 items-center transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm ${
                disabled
                  ? "bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed border-gray-300 dark:border-gray-600"
                  : "bg-white dark:bg-gray-900 cursor-text hover:border-primary border-gray-300 dark:border-gray-600"
              } ${open ? "ring-1 ring-primary border-primary" : ""}`}
            >
              {/* Badges Container */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[58px] overflow-y-auto custom-grid-scroll w-full mb-1 mt-1">
                  {selected.map((val) => {
                    const opt = options.find((o) => o.value === val);
                    if (!opt) return null;
                    return (
                      <span
                        key={val}
                        // ⚡️ FIX: Switched to dynamic primary theme color
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[13px] font-medium rounded-md border border-primary/20"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <span className="truncate max-w-[150px]">{opt.label}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={(e) => removeTag(e, val)}
                            className="hover:text-red-500 focus:outline-none transition-colors ml-0.5 rounded-full hover:bg-primary/20 p-0.5"
                          >
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Inline Search Input & Icons Wrapper */}
              <div className="flex flex-1 items-center justify-between min-w-[120px] px-1">
                <input
                  type="text"
                  className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-text-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={selected.length === 0 ? placeholder : "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={disabled}
                  onClick={(e) => {
                    if (open) e.stopPropagation(); 
                  }}
                />
                
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {selected.length > 0 && !disabled && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                      title="Clear all"
                    >
                      <X size={16} />
                    </button>
                  )}
                  
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
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
                        <div className="flex-1 overflow-y-auto min-h-0 relative py-1">
                          {filteredOptions.map((opt) => {
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
                                  setSearchTerm("");
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors
                                  ${
                                    opt.isAll
                                      ? "sticky top-0 z-10 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold border-y border-gray-300 dark:border-gray-600 shadow-sm"
                                      : opt.groupIndex !== undefined && opt.groupIndex % 2 !== 0
                                      ? "bg-primary/5 text-gray-800 dark:text-gray-200 hover:bg-primary/10"
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
                          {filteredOptions.length === 0 && (
                            <div className="py-3 px-4 text-center text-gray-500 text-sm">
                              No matching options found
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
        );
      }}
    </Popover>
  );
};