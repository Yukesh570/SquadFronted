import React from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, id, ...props }) => {
    const textAreaId = id || label.replace(/\s+/g, "-").toLowerCase();

    return (
        <div className="flex flex-col">
            <label
                htmlFor={textAreaId}
                className="mb-1.5 text-xs font-medium text-text-secondary"
            >
                {label}
            </label>
            <textarea
                {...props}
                id={textAreaId}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-input transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
        </div>
    );
};

export default TextArea;