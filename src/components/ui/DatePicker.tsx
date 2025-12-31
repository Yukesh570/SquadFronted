import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

const customDatePickerStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  
  /* --- MAIN CONTAINER --- */
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background-color: white;
  }
  /* Stronger selector for Dark Mode */
  .dark .react-datepicker,
  body.dark .react-datepicker {
    background-color: #1f2937 !important; /* gray-800 */
    border-color: #374151 !important;     /* gray-700 */
    color: #f3f4f6 !important;
  }

  /* --- HEADER --- */
  .react-datepicker__header {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    padding-top: 10px;
  }
  .dark .react-datepicker__header,
  body.dark .react-datepicker__header {
    background-color: #111827 !important; /* gray-900 */
    border-color: #374151 !important;     /* gray-700 */
  }

  /* --- TEXT COLORS --- */
  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker-year-header {
    color: #111827;
    font-weight: 600;
  }
  .dark .react-datepicker__current-month,
  .dark .react-datepicker-time__header,
  .dark .react-datepicker-year-header,
  body.dark .react-datepicker__current-month {
    color: #f3f4f6 !important;
  }

  .react-datepicker__day-name {
    color: #6b7280;
    width: 2rem;
    margin: 0.2rem;
  }
  .dark .react-datepicker__day-name,
  body.dark .react-datepicker__day-name {
    color: #9ca3af !important;
  }

  /* --- DAYS --- */
  .react-datepicker__day {
    width: 2rem;
    line-height: 2rem;
    margin: 0.2rem;
    border-radius: 0.375rem;
    color: #374151;
  }
  .dark .react-datepicker__day,
  body.dark .react-datepicker__day {
    color: #e5e7eb !important;
  }
  
  /* Hover State */
  .react-datepicker__day:hover {
    background-color: #f3f4f6;
  }
  .dark .react-datepicker__day:hover,
  body.dark .react-datepicker__day:hover {
    background-color: #374151 !important; /* gray-700 */
    color: white !important;
  }
  
  /* Selected State */
  .react-datepicker__day--selected, 
  .react-datepicker__day--keyboard-selected {
    background-color: var(--color-primary) !important; 
    color: white !important;
    font-weight: 500;
  }

  /* --- TIME COLUMN --- */
  .react-datepicker__time-container {
    border-left: 1px solid #e5e7eb;
    width: 100px;
  }
  .dark .react-datepicker__time-container,
  body.dark .react-datepicker__time-container {
    border-left: 1px solid #374151 !important;
  }
  
  .react-datepicker__time-container .react-datepicker__time {
    background: white;
  }
  .dark .react-datepicker__time-container .react-datepicker__time,
  body.dark .react-datepicker__time-container .react-datepicker__time {
    background: #1f2937 !important; /* gray-800 */
  }

  .react-datepicker__time-list-item {
    color: #374151 !important;
  }
  .dark .react-datepicker__time-list-item,
  body.dark .react-datepicker__time-list-item {
    color: #e5e7eb !important;
  }
  
  .react-datepicker__time-list-item:hover {
    background-color: #f3f4f6 !important;
  }
  .dark .react-datepicker__time-list-item:hover,
  body.dark .react-datepicker__time-list-item:hover {
    background-color: #374151 !important;
  }
  
  .react-datepicker__time-list-item--selected {
    background-color: var(--color-primary) !important;
    color: white !important;
  }
`;

interface DatePickerProps {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  isClearable?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, any>(
  (
    {
      value,
      onClick,
      onChange,
      placeholder,
      className,
      onClear,
      disabled,
      isClearable,
    },
    ref
  ) => (
    <div className={`relative group w-full`}>
      <div className="relative">
        <input
          value={value}
          onClick={!disabled ? onClick : undefined}
          onChange={!disabled ? onChange : undefined}
          ref={ref}
          disabled={disabled}
          placeholder={placeholder}
          readOnly
          className={`w-full rounded-lg border px-3 py-2.5 pl-10 pr-10 text-sm shadow-input transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer
          ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
              : "bg-white border-gray-200 text-text-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
          }
          ${className}`}
        />

        {/* Calendar Icon */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-colors ${
            disabled
              ? "text-gray-400"
              : "text-gray-500 dark:text-gray-400 group-hover:text-primary"
          }`}
        >
          <Calendar size={18} />
        </div>

        {/* Clear Button */}
        {value && isClearable && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear date"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
);

CustomInput.displayName = "CustomInput";

const CustomDatePicker: React.FC<DatePickerProps> = ({
  label,
  selected,
  onChange,
  showTimeSelect = false,
  placeholder,
  minDate,
  disabled = false,
  isClearable = true,
}) => {
  const handleDateChange = (date: Date | null) => {
    if (disabled) return;
    onChange(date);
  };

  const handleClear = () => {
    if (!disabled) onChange(null);
  };

  return (
    <div className="flex flex-col w-full">
      <style>{customDatePickerStyles}</style>

      <label className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-400">
        {label}
      </label>

      <div className="relative">
        <DatePicker
          selected={selected}
          onChange={handleDateChange}
          showTimeSelect={showTimeSelect}
          dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "yyyy-MM-dd"}
          placeholderText={
            placeholder ||
            (showTimeSelect ? "Select Date & Time" : "Select Date")
          }
          customInput={
            <CustomInput
              onClear={handleClear}
              disabled={disabled}
              isClearable={isClearable}
            />
          }
          disabled={disabled}
          timeIntervals={15}
          minDate={minDate}
          showPopperArrow={false}
          autoComplete="off"
          popperPlacement="bottom-start"
          calendarClassName={
            document.documentElement.classList.contains("dark") ? "dark" : ""
          }
          popperProps={{
            strategy: "fixed",
          }}
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between px-2 py-2">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                type="button"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 disabled:opacity-30 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {date.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                type="button"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 disabled:opacity-30 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default CustomDatePicker;
