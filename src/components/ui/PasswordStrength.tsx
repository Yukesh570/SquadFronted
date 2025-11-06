import React from "react";
import { Check, X } from "lucide-react";

// 1. Define the validation criteria
export interface ValidationCriteria {
    length: boolean;
    number: boolean;
    uppercase: boolean;
    specialChar: boolean;
}

// 2. Define the props our component accepts
interface PasswordStrengthProps {
    criteria: ValidationCriteria;
    passwordLength: number;
}

const CriteriaItem: React.FC<{ text: string; met: boolean }> = ({ text, met }) => (
    <li className={`flex items-center text-sm ${met ? "text-green-600" : "text-text-secondary"}`}>
        {met ? (
            <Check size={16} className="mr-2" />
        ) : (
            <X size={16} className="mr-2 text-red-500" />
        )}
        {text}
    </li>
);

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ criteria, passwordLength }) => {
    const criteriaMetCount = Object.values(criteria).filter(Boolean).length;
    const allMet = criteriaMetCount === 4;

    let message = "";
    let messageColor = "";

    // 3. This is the logic for the warning message
    if (passwordLength === 0) {
        message = "";
    } else if (allMet) {
        message = "Success: Password is strong";
        messageColor = "text-green-600";
    } else if (criteria.length && criteriaMetCount >= 2) {
        message = "Warning: Password is moderate";
        messageColor = "text-yellow-600";
    } else {
        message = "Warning: Password is weak";
        messageColor = "text-red-600";
    }

    return (
        <div className="mt-4 space-y-2">
            {/* 4. The Warning/Success Message */}
            {message && (
                <div className={`text-sm font-medium ${messageColor}`}>
                    {message}
                </div>
            )}

            {/* 5. The Criteria List */}
            <ul className="space-y-1">
                <CriteriaItem text="Use 6 to 14 characters" met={criteria.length} />
                <CriteriaItem text="Use a number (e.g. 123)" met={criteria.number} />
                <CriteriaItem text="Use uppercase and lowercase letters (e.g. Aa)" met={criteria.uppercase} />
                <CriteriaItem text="Use a special character (e.g. @, #, $)" met={criteria.specialChar} />
            </ul>
        </div>
    );
};

export default PasswordStrength;

export const validatePassword = (password: string): ValidationCriteria => {
    return {
        length: password.length >= 6 && password.length <= 14,
        number: /[0-9]/.test(password),
        uppercase: /[a-z]/.test(password) && /[A-Z]/.test(password),
        specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
    };
};