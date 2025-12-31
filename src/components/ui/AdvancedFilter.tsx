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
            title="Select columns to filter search"
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
                    <div className="w-72 overflow-hidden rounded-lg bg-white dark:bg-gray-800 py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                      {/* Header */}
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2 bg-gray-50/30 dark:bg-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-300">
                            Search In Columns
                          </span>
                          <button
                            type="button"
                            onClick={() => close()}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Find column..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-white"
                            value={columnSearch}
                            onChange={(e) => setColumnSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Select All */}
                      <div className="border-b border-gray-100 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-text-secondary hover:text-primary hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div
                            className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                              tempSelectedKeys.length === columns.length
                                ? "bg-primary border-primary text-white"
                                : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800"
                            }`}
                          >
                            {tempSelectedKeys.length === columns.length && (
                              <Check size={10} />
                            )}
                          </div>
                          <span>
                            {tempSelectedKeys.length === columns.length
                              ? "Deselect All"
                              : "Select All"}
                          </span>
                        </button>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto max-h-60 p-1">
                        {filteredColumns.map((col) => {
                          const isSelected = tempSelectedKeys.includes(col.key);
                          return (
                            <button
                              key={col.key}
                              type="button"
                              onClick={() => handleToggleColumn(col.key)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors mb-0.5 group
                                ${
                                  isSelected
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 font-medium"
                                    : "text-text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                }
                              `}
                            >
                              <div className="flex items-center justify-center w-4 h-4">
                                {isSelected && (
                                  <Check
                                    size={16}
                                    className="text-primary dark:text-blue-400"
                                  />
                                )}
                              </div>

                              <span className="truncate">{col.label}</span>
                            </button>
                          );
                        })}
                        {filteredColumns.length === 0 && (
                          <div className="py-4 px-4 text-center text-gray-400 text-xs">
                            No columns found
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleClearAll(close)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-text-primary dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          Clear
                        </button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleApply(close)}
                          className="px-4 py-1.5 h-auto text-xs min-w-[70px]"
                        >
                          {isLoading ? "..." : "Apply"}
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
