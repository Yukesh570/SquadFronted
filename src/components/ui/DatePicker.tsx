import React from "react";
import DatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  // 1. New optional prop
  showTimeSelect?: boolean;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({
  label,
  selected,
  onChange,
  showTimeSelect = false, // 2. Default to false (no time selector)
}) => {

  // 3. New handler to ensure time is set if only date is chosen
  const handleDateChange = (date: Date | null) => {
    if (date && !showTimeSelect) {
      // If time select is off, set the time to midnight for consistency (00:00:00)
      date.setHours(0, 0, 0, 0);
    }
    onChange(date);
  };

  return (
    <div className="flex flex-col">
      <label className="mb-1.5 text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <DatePicker
          selected={selected}
          onChange={handleDateChange}
          showTimeSelect={showTimeSelect}
          dateFormat={showTimeSelect ? "dd/MM/yyyy h:mm aa" : "dd/MM/yyyy"}
          placeholderText={showTimeSelect ? "dd/MM/yyyy h:mm aa" : "dd/MM/yyyy"}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pl-10 text-sm shadow-input transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          wrapperClassName="w-full"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Calendar size={18} />
        </div>
      </div>
    </div>
  );
};

export default CustomDatePicker;