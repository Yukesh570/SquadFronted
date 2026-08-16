import React, { useState, useEffect, useRef, Fragment } from "react";
import ReactDOM from "react-dom";
import { Popover, Transition } from "@headlessui/react";
import { Check, X, ChevronDown, Search } from "lucide-react";

export interface MultiSelectOption {
  label: string;
  value: string;
  isAll?: boolean;
  isUiOnly?: boolean; 
  groupIndex?: number; 
  icon?: React.ReactNode;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selectedValues: string[], clickedOption?: MultiSelectOption) => void;
  disabled?: boolean;
  placeholder?: string;
}

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === "undefined") return null; 
  return ReactDOM.createPortal(children, document.body);
};

const MultiSelectDropdownContent: React.FC<MultiSelectDropdownProps & { open: boolean; close: () => void }> = ({
  label,
  options,
  selected,
  onChange,
  disabled = false,
  placeholder = "Select...",
  open,
  close,
}) => {
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

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

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange([]);
      setSearchTerm("");
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const matchedOption = options.find((opt) => opt.value === selected[0]);
      if (matchedOption) return matchedOption.label;
      const raw = String(selected[0]);
      const match = raw.match(/\(([^)]+)\)/);
      return match ? match[1] : raw;
    }
    return `${selected.length} selected`;
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = filteredOptions.filter(opt => selected.includes(opt.value) && !opt.isAll);
  const unselectedOptions = filteredOptions.filter(opt => !selected.includes(opt.value) || opt.isAll);

  const renderOptionBtn = (opt: MultiSelectOption, isSelected: boolean, onChangeHandler: any) => (
    <button
      key={opt.value}
      type="button"
      onClick={() => {
        if (opt.isAll) {
          onChangeHandler(selected, opt);
        } else {
          if (isSelected) {
            onChangeHandler(selected.filter((v) => v !== opt.value), opt);
          } else {
            onChangeHandler([...selected, opt.value], opt);
          }
        }
      }}
      className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors
        ${
          opt.isAll
            ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold border-y border-gray-300 dark:border-gray-600"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        }
        ${isSelected && !opt.isAll ? "text-primary dark:text-primary font-medium bg-primary/5 hover:bg-primary/10" : ""}
      `}
    >
      <span className="truncate flex items-center gap-2">
        {opt.icon && <span>{opt.icon}</span>}
        {opt.label}
      </span>
      {isSelected && !opt.isAll ? (
        <span className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
            <X size={14} strokeWidth={2.5} />
        </span>
      ) : isSelected && opt.isAll ? (
         <Check size={16} className="text-gray-800 dark:text-gray-200" strokeWidth={2.5} />
      ) : null}
    </button>
  );

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
        className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 flex justify-between items-center transition-all focus:outline-none focus:ring-1 focus:ring-primary shadow-sm ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed"
            : "bg-white dark:bg-gray-900 cursor-pointer hover:border-primary"
        } ${open ? "ring-1 ring-primary border-primary" : ""}`}
      >
        <span className="text-sm truncate text-text-primary dark:text-white">
          {getDisplayText()}
        </span>
        
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selected.length > 0 && !disabled && (
            <div
              onClick={handleClearAll}
              className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none cursor-pointer"
              title="Clear all"
            >
              <X size={14} strokeWidth={2.5} />
            </div>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </Popover.Button>

      {open && buttonRect && !disabled && (
        <Portal>
          <div className="fixed inset-0 z-[9999]" onClick={() => { close(); }}>
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
                  {/* Static Search Input Header */}
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
                     <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          autoFocus
                          type="text"
                          autoComplete="off"
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text-primary dark:text-white placeholder-gray-400"
                          placeholder="Search options..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                  </div>

                  {/* Scrolling List Container */}
                  <div className="flex-1 overflow-y-auto min-h-0 relative py-1 custom-grid-scroll bg-white dark:bg-gray-800">
                    
                    {/* Selected Items Group */}
                    {selectedOptions.length > 0 && (
                      <div className="mb-2">
                         <div className="px-3 py-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            Selected ({selectedOptions.length})
                         </div>
                         {selectedOptions.map(opt => renderOptionBtn(opt, true, onChange))}
                      </div>
                    )}

                    {/* Unselected / Available Items Group */}
                    {unselectedOptions.length > 0 && (
                       <div>
                          {selectedOptions.length > 0 && (
                             <div className="px-3 py-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700">
                                Available Options
                             </div>
                          )}
                          {unselectedOptions.map(opt => {
                            let isSelected = false;
                            if (opt.isAll) {
                              if (opt.value === "ALL_MCC") {
                                const standardOpts = options.filter((o) => !o.isUiOnly);
                                isSelected = standardOpts.length > 0 && standardOpts.every((o) => selected.includes(o.value));
                              } else {
                                const mccPrefix = opt.value.split("(")[0];
                                const standardOpts = options.filter((o) => o.value.startsWith(`${mccPrefix}(`) && !o.isUiOnly);
                                isSelected = standardOpts.length > 0 && standardOpts.every((o) => selected.includes(o.value));
                              }
                            }
                            return renderOptionBtn(opt, isSelected, onChange);
                          })}
                       </div>
                    )}

                    {filteredOptions.length === 0 && (
                      <div className="py-6 px-4 text-center text-gray-500 text-sm">
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
};

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = (props) => {
  return (
    <Popover className="relative flex flex-col w-full">
      {({ open, close }) => <MultiSelectDropdownContent {...props} open={open} close={close} />}
    </Popover>
  );
};

export default MultiSelectDropdown;