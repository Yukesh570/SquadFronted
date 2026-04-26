import React, { useState, type KeyboardEvent } from "react";
interface MultiEmailInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MultiEmailInput: React.FC<MultiEmailInputProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState("");

  // Split the comma-separated string into an array of emails
  const emails = value ? value.split(",").filter((e) => e.trim() !== "") : [];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // If user presses Enter or Comma, add the email as a tag
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // Prevent form submission

      const newEmail = inputValue.trim();
      if (newEmail && !emails.includes(newEmail)) {
        const newValue = [...emails, newEmail].join(",");
        onChange(name, newValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      // Optional: Delete the last email tag if the input is empty and user hits backspace
      const newEmails = [...emails];
      newEmails.pop();
      onChange(name, newEmails.join(","));
    }
  };

  const removeEmail = (indexToRemove: number) => {
    const newEmails = emails.filter((_, index) => index !== indexToRemove);
    onChange(name, newEmails.join(","));
  };

  const handleBlur = () => {
    // Save any lingering typed text as an email when the user clicks away
    const newEmail = inputValue.trim();
    if (newEmail && !emails.includes(newEmail)) {
      const newValue = [...emails, newEmail].join(",");
      onChange(name, newValue);
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className={`flex flex-wrap gap-2 items-center p-2 border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-primary focus-within:border-primary bg-white min-h-[42px] ${
          disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""
        }`}
      >
        {emails.map((email, index) => (
          <span
            key={index}
            className="flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-800 px-2 py-0.5 rounded text-sm"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(index)}
                className="text-gray-400 hover:text-red-500 focus:outline-none ml-1"
              >
                &times;
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          className="flex-grow min-w-[120px] outline-none border-none focus:ring-0 p-0 text-sm bg-transparent disabled:cursor-not-allowed"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? placeholder : ""}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default MultiEmailInput;
