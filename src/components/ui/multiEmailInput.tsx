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

  const emails = value ? value.split(",").filter((e) => e.trim() !== "") : [];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      const newEmail = inputValue.trim();
      if (newEmail && !emails.includes(newEmail)) {
        const newValue = [...emails, newEmail].join(",");
        onChange(name, newValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      const newEmails = [...emails];
      newEmails.pop();
      onChange(name, newEmails.join(","));
    }
  };

  const removeEmail = (indexToRemove: number) => {
    const emailToRemove = emails[indexToRemove];
    const confirmed = window.confirm(`Remove "${emailToRemove}"?`);
    if (!confirmed) return;

    const newEmails = emails.filter((_, index) => index !== indexToRemove);
    onChange(name, newEmails.join(","));
  };

  const editEmail = (indexToEdit: number) => {
    if (disabled) return;
    const emailToEdit = emails[indexToEdit];
    const newEmails = emails.filter((_, index) => index !== indexToEdit);
    onChange(name, newEmails.join(","));
    setInputValue(emailToEdit);
  };

  const handleBlur = () => {
    const newEmail = inputValue.trim();
    if (newEmail && !emails.includes(newEmail)) {
      const newValue = [...emails, newEmail].join(",");
      onChange(name, newValue);
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col">
      <label
        htmlFor={`${name}-input`}
        className="mb-1.5 text-xs font-medium text-text-secondary dark:text-gray-400"
      >
        {label}
      </label>
      <div
        className={`flex flex-wrap gap-2 items-center p-2 border border-gray-300 dark:border-gray-700 rounded-md focus-within:ring-1 focus-within:ring-primary focus-within:border-primary bg-white dark:bg-gray-800 min-h-[42px] ${
          disabled ? "bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-70" : ""
        }`}
      >
        {emails.map((email, index) => (
          <span
            key={index}
            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded text-sm"
          >
            <span
              onClick={() => editEmail(index)}
              className={!disabled ? "cursor-pointer hover:underline" : ""}
              title={!disabled ? "Click to edit" : undefined}
            >
              {email}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(index)}
                className="text-gray-400 dark:text-gray-400 hover:text-red-500 focus:outline-none ml-1"
              >
                &times;
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          autoComplete="off"
          className="flex-grow min-w-[120px] outline-none border-none focus:ring-0 p-0 text-sm bg-transparent dark:text-white disabled:cursor-not-allowed"
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