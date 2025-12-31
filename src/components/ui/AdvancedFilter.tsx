import React, { Fragment, useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Popover, Transition } from "@headlessui/react";
import { Filter, Search, Check, X } from "lucide-react";
import Button from "./Button";

export interface FilterColumn {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
}

export interface AdvancedFilterProps {
  columns: FilterColumn[];
  selectedColumns: string[];
  onFilter: (selectedColumns: string[]) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  columns,
  selectedColumns,
  onFilter,
  onClear,
  isLoading = false,
}) => {
  const [tempSelectedKeys, setTempSelectedKeys] = useState<string[]>([]);
  const [columnSearch, setColumnSearch] = useState("");
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTempSelectedKeys(selectedColumns);
  }, [selectedColumns]);

  const handleToggleColumn = (key: string) => {
    setTempSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (tempSelectedKeys.length === columns.length) {
      setTempSelectedKeys([]);
    } else {
      setTempSelectedKeys(columns.map((c) => c.key));
    }
  };

  const handleApply = (close: () => void) => {
    onFilter(tempSelectedKeys);
    close();
  };

  const handleClearAll = (close: () => void) => {
    setTempSelectedKeys([]);
    onClear();
    close();
  };

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

  const filteredColumns = columns.filter((c) =>
    c.label.toLowerCase().includes(columnSearch.toLowerCase())
  );

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <StateResetter
            open={open}
            selectedColumns={selectedColumns}
            setTempSelectedKeys={setTempSelectedKeys}
            updatePosition={updatePosition}
          />

          <Popover.Button
            ref={buttonRef}
            onClick={updatePosition}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition duration-150 ease-in-out focus:outline-none focus:ring-1 
              ${
                open || selectedColumns.length > 0
                  ? "border-primary ring-primary bg-gray-50 dark:bg-gray-700 text-primary dark:text-white"
                  : "border-gray-200 focus:border-primary focus:ring-primary bg-white text-text-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              }`}
          >
            <Filter
              size={16}
              className={
                selectedColumns.length > 0
                  ? "text-primary dark:text-white"
                  : "text-gray-500"
              }
            />
            <span>Filters</span>
            {selectedColumns.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-primary rounded-full">
                {selectedColumns.length}
              </span>
            )}
          </Popover.Button>

          {open && buttonRect && (
            <Portal>
              <div className="fixed inset-0 z-[9999]" onClick={() => close()}>
                <div
                  className="absolute"
                  style={{
                    top: buttonRect.bottom + 8,
                    left: buttonRect.left,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Transition
                    appear={true}
                    show={true}
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <div className="w-80 overflow-hidden rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                      {/* Header */}
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-text-secondary dark:text-gray-300">
                            Select In Columns
                          </span>
                          <button
                            type="button"
                            onClick={() => close()}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Find column..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-white"
                            value={columnSearch}
                            onChange={(e) => setColumnSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Select All */}
                      <div className="px-1 py-1 border-b border-gray-100 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-primary hover:text-primary-dark dark:text-blue-400 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                        >
                          <span
                            className={
                              tempSelectedKeys.length === columns.length
                                ? "opacity-100"
                                : "opacity-0"
                            }
                          >
                            <Check size={14} />
                          </span>
                          {tempSelectedKeys.length === columns.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto max-h-60">
                        {filteredColumns.map((col) => {
                          const isSelected = tempSelectedKeys.includes(col.key);
                          return (
                            <button
                              key={col.key}
                              type="button"
                              onClick={() => handleToggleColumn(col.key)}
                              className={`relative w-full cursor-pointer select-none py-2 pl-10 pr-4 text-left transition-colors
                                ${
                                  isSelected
                                    ? "bg-gray-100 dark:bg-gray-700 text-primary dark:text-white"
                                    : "text-text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                }
                              `}
                            >
                              <span
                                className={`block truncate ${
                                  isSelected ? "font-medium" : "font-normal"
                                }`}
                              >
                                {col.label}
                              </span>
                              {isSelected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary dark:text-white">
                                  <Check size={16} aria-hidden="true" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {filteredColumns.length === 0 && (
                          <div className="py-2 px-4 text-center text-gray-500 text-sm">
                            No columns found
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleClearAll(close)}
                          className="text-xs font-medium text-gray-500 hover:text-text-primary dark:text-gray-400 dark:hover:text-white transition-colors px-3 py-1"
                        >
                          Clear
                        </button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleApply(close)}
                          className="px-4 py-1.5 h-auto text-xs"
                        >
                          {isLoading ? "Applying..." : "Apply"}
                        </Button>
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

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

const StateResetter: React.FC<{
  open: boolean;
  selectedColumns: string[];
  setTempSelectedKeys: (keys: string[]) => void;
  updatePosition: () => void;
}> = ({ open, selectedColumns, setTempSelectedKeys, updatePosition }) => {
  useEffect(() => {
    if (open) {
      updatePosition();
    } else {
      setTempSelectedKeys(selectedColumns);
    }
  }, [open, selectedColumns, setTempSelectedKeys, updatePosition]);

  return null;
};

export default AdvancedFilter;
