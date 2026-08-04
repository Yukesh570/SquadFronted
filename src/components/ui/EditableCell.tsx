import React, { useState, useEffect, useRef } from "react";
import Select from "./Select";
import { Edit2 } from "lucide-react";
import { toast } from "react-toastify";

interface Option {
  label: string;
  value: string;
}

interface EditableCellProps {
  value: string;
  type?: "text" | "number" | "select";
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
    e.preventDefault();
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
    if (!isEditing) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(e.target as Node)) {
        endEdit();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      if ((type === "text" || type === "number") && inputRef.current) {
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
        autoComplete="off"
        type="text" 
        inputMode={type === "number" ? "numeric" : undefined} 
        value={currentVal}
        onClick={(e) => {
           e.stopPropagation();
           e.preventDefault();
        }}
        onBlur={(e) => {
           e.stopPropagation();
           e.preventDefault();
        }}
        onChange={(e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const val = e.target.value;
          
          if (type === "number") {
            if (val === "" || /^\d+$/.test(val)) {
              setCurrentVal(val);
            }
          } else {
            setCurrentVal(val);
          }
        }}
        onKeyDown={(e) => {
          e.stopPropagation(); 
          
          if (e.key === "Enter") {
             e.preventDefault();
             if (currentVal !== "" && currentVal !== value) {
                 onSave(currentVal);
                 endEdit();
             } else if (currentVal === "") {
                 toast.error("Value cannot be empty");
             } else {
                 endEdit();
             }
          } else if (e.key === "Escape") { 
             e.preventDefault();
             setCurrentVal(value); 
             endEdit(); 
          }
        }}
        onKeyUp={(e) => e.stopPropagation()}
        onKeyPress={(e) => e.stopPropagation()}
        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-primary text-text-primary dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
    </div>
  );
};