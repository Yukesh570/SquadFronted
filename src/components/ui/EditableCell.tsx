import React, { useState, useEffect, useRef } from "react";
import Select from "./Select";
import { Edit2 } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface EditableCellProps {
  value: string;
  type?: "text" | "select";
  options?: Option[];
  onSave: (val: string) => void;
  disabled?: boolean;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  type = "text",
  options = [],
  onSave,
  disabled = false,
  isEditing: controlledIsEditing,
  onEditStart,
  onEditEnd,
}) => {
  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value || "");
  const [dropdownPlacement, setDropdownPlacement] = useState<"top" | "bottom">("bottom");
  
  const inputRef = useRef<any>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const isEditing = controlledIsEditing !== undefined ? controlledIsEditing : localIsEditing;

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (onEditStart) onEditStart();
    else setLocalIsEditing(true);
  };

  const endEdit = () => {
    if (onEditEnd) onEditEnd();
    else setLocalIsEditing(false);
  };

  useEffect(() => {
    setCurrentVal(value || "");
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type === "text" && inputRef.current) {
        inputRef.current.focus();
      }
      if (type === "select" && cellRef.current) {
        const rect = cellRef.current.getBoundingClientRect();
        const scrollContainer = cellRef.current.closest('.custom-grid-scroll');
        
        let spaceBelow = window.innerHeight - rect.bottom;

        if (scrollContainer) {
          const style = window.getComputedStyle(scrollContainer);
          if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
             const containerRect = scrollContainer.getBoundingClientRect();
             spaceBelow = containerRect.bottom - rect.bottom;
          }
        }
        
        if (spaceBelow < 180) {
          setDropdownPlacement("top");
        } else {
          setDropdownPlacement("bottom");
        }
      }
    } else {
      setCurrentVal(value || "");
    }
  }, [isEditing, type, value]);

  // Local outside click listener for when state is NOT controlled by parent
  useEffect(() => {
    if (controlledIsEditing !== undefined) return; // Let parent handle outside clicks

    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && cellRef.current.contains(event.target as Node)) {
        return;
      }
      if (isEditing) {
        endEdit();
        if (currentVal !== value) {
          onSave(currentVal);
        }
      }
    };

    if (isEditing) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditing, currentVal, value, onSave, endEdit, controlledIsEditing]);

  const handleSelectChange = (newVal: string) => {
    setCurrentVal(newVal);
    endEdit();
    if (newVal !== value) {
      onSave(newVal);
    }
  };

  if (!isEditing) {
    let displayVal = value;
    if (type === "select") {
      const match = options.find((o) => o.value === value);
      if (match) displayVal = match.label;
    }

    return (
      <div
        className={`w-full min-h-[28px] px-2 py-1.5 rounded transition-all flex items-center justify-between group ${
          disabled
            ? "cursor-not-allowed text-gray-500 opacity-80" 
            : "cursor-pointer bg-blue-50/40 dark:bg-blue-900/20 border border-transparent hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-600"
        }`}
        onClick={startEdit}
        title={disabled ? "" : "Click to edit"}
      >
        <span className="truncate">{displayVal || <span className="text-gray-400 italic">Empty</span>}</span>
        {!disabled && (
          <Edit2 size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity ml-2 shrink-0" />
        )}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div ref={cellRef} className="w-full min-w-[140px] relative z-[9999]">
        <Select
          label=""
          value={currentVal}
          onChange={handleSelectChange}
          options={options}
          placeholder="Select..."
          placement={dropdownPlacement} 
        />
      </div>
    );
  }

  return (
    <div ref={cellRef} className="w-full relative z-[9999]">
      <input
        ref={inputRef}
        type="text"
        value={currentVal}
        onChange={(e) => setCurrentVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
             endEdit();
             if (currentVal !== value) onSave(currentVal);
          }
          if (e.key === "Escape") { setCurrentVal(value); endEdit(); }
        }}
        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-primary text-text-primary dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
    </div>
  );
};