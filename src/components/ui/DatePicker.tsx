import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

const customDatePickerStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker-popper {
    z-index: 9999 !important; /* Forces it above the Modal */
  }
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  .dark .react-datepicker {
    background-color: #1f2937;
    border-color: #374151;
    color: #f3f4f6;
  }
  .react-datepicker__header {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    padding-top: 10px;
  }
  .dark .react-datepicker__header {
    background-color: #111827;
    border-color: #374151;
  }
  .react-datepicker__current-month {
    font-weight: 600;
    color: #111827;
  }
  .dark .react-datepicker__current-month {
    color: #f3f4f6;
  }
  .react-datepicker__day-name {
    color: #6b7280;
    width: 2.5rem;
    margin: 0.2rem;
  }
  .dark .react-datepicker__day-name {
    color: #9ca3af;
  }
  .react-datepicker__day {
    width: 2.5rem;
    height: 2.5rem;
    line-height: 2.5rem;
    margin: 0.2rem;
    border-radius: 0.375rem;
    color: #374151;
  }
  .dark .react-datepicker__day {
    color: #e5e7eb;
  }
  .react-datepicker__day:hover {
    background-color: #f3f4f6;
  }
  .dark .react-datepicker__day:hover {
    background-color: #374151;
  }
  .react-datepicker__day--selected, 
  .react-datepicker__day--keyboard-selected {
    background-color: var(--color-primary) !important; 
    color: white !important;
    font-weight: 500;
  }
  .react-datepicker__time-container {
    border-left: 1px solid #e5e7eb;
    width: 100px; 
  }
  .dark .react-datepicker__time-container {
    border-left: 1px solid #374151;
  }
  .react-datepicker__time-container .react-datepicker__time {
    background: white;
  }
  .dark .react-datepicker__time-container .react-datepicker__time {
    background: #1f2937;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
    height: auto;
    padding: 8px 10px;
    color: #374151;
  }
  .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
    color: #e5e7eb;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
    background-color: #f3f4f6;
  }
  .dark .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
    background-color: #374151;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
    background-color: var(--color-primary) !important;
    color: white !important;
  }
  .react-datepicker__header--time {
    padding-bottom: 8px;
  }
  .dark .react-datepicker__header--time {
    background-color: #111827;
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
    <div
      className={`relative group ${
        disabled ? "opacity-75 cursor-not-allowed" : ""
      }`}
    >
      <input
        value={value}
        onClick={!disabled ? onClick : undefined}
        onChange={!disabled ? onChange : undefined}
        ref={ref}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2.5 pl-10 pr-10 text-sm shadow-sm transition duration-150 ease-in-out 
        ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
            : "bg-white border-gray-200 text-text-primary group-hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        } 
        ${className}`}
      />

      <div
        className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 transition-colors ${
          disabled ? "text-gray-400" : "text-gray-400 group-hover:text-primary"
        }`}
      >
        <Calendar size={18} />
      </div>

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
  )
);

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
    if (date && !showTimeSelect) {
      date.setHours(0, 0, 0, 0);
    }
    onChange(date);
  };

  const handleClear = () => {
    if (!disabled) onChange(null);
  };

  return (
    <div className="flex flex-col w-full">
      <style>{customDatePickerStyles}</style>

      <label className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-300">
        {label}
      </label>

      <div className="relative">
        <DatePicker
          selected={selected}
          onChange={handleDateChange}
          showTimeSelect={showTimeSelect}
          dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
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
          timeIntervals={1}
          minDate={minDate}
          showPopperArrow={false}
          autoComplete="off"
          popperPlacement="bottom-start"
          popperProps={{
            strategy: "fixed",
          }}
          isClearable={false}
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 disabled:opacity-30 transition"
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 disabled:opacity-30 transition"
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
