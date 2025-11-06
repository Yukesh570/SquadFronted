import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { changePasswordApi } from "../../api/userApi/userApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import PasswordStrength, {
    validatePassword,
    type ValidationCriteria,
} from "../../components/ui/PasswordStrength";

const ChangePassword = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // State for the form fields
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordCriteria, setPasswordCriteria] = useState<ValidationCriteria>({
        length: false,
        number: false,
        uppercase: false,
        specialChar: false,
    });
    const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

    useEffect(() => {
        const criteria = validatePassword(newPassword);
        setPasswordCriteria(criteria);
    }, [newPassword]);

    useEffect(() => {
        if (confirmPassword.length > 0) {
            setPasswordsMatch(newPassword === confirmPassword);
        } else {
            setPasswordsMatch(null);
        }
    }, [newPassword, confirmPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        const allCriteriaMet = Object.values(validatePassword(newPassword)).every(Boolean);
        if (!allCriteriaMet) {
            toast.error("Password does not meet all criteria.");
            return;
        }

        setLoading(true);
        try {
            await changePasswordApi({
                oldPassword: oldPassword,
                newPassword: newPassword,
            });

            toast.success("Password changed successfully! Please log in again.");
            logout();
            navigate("/login");

        } catch (error: any) {
            console.error("Change password error:", error);
            const errorMessage = error.response?.data?.detail || "Failed to change password. Please check your old password.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleIcon = (isVisible: boolean, setVisible: (val: boolean) => void) => (
        <button
            type="button"
            onClick={() => setVisible(!isVisible)}
            className="text-gray-500 hover:text-gray-700"
        >
            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );

    return (
        <div className="container mx-auto">
            <div className="max-w-lg mx-auto p-6 rounded-xl bg-white dark:bg-gray-800 shadow-card">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                    Change Password
                </h2>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <Input
                        label="Current Password"
                        type={showOld ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        rightIcon={toggleIcon(showOld, setShowOld)}
                    />

                    <div>
                        <Input
                            label="New Password"
                            type={showNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your new password"
                            required
                            rightIcon={toggleIcon(showNew, setShowNew)}
                        />
                        <PasswordStrength
                            criteria={passwordCriteria}
                            passwordLength={newPassword.length}
                        />
                    </div>

                    <div>
                        <Input
                            label="Confirm New Password"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your new password"
                            required
                            rightIcon={toggleIcon(showConfirm, setShowConfirm)}
                        />
                        {passwordsMatch === true && (
                            <div className="mt-2 flex items-center text-sm text-green-600">
                                <CheckCircle size={16} className="mr-1" />
                                Success: Passwords Match
                            </div>
                        )}
                        {passwordsMatch === false && (
                            <div className="mt-2 flex items-center text-sm text-red-600">
                                <XCircle size={16} className="mr-1" />
                                Error: Passwords do not match
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                            leftIcon={<KeyRound className="mr-2" size={20} />}
                        >
                            {loading ? "Saving..." : "Save Password"}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;