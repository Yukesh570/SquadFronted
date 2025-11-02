import React, { useState } from "react";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { registerApi } from "../../api/loginAPi/login";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    userType: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const response = await registerApi(formData);
      alert("Account created successfully!");
      console.log("Response:", response.data);
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        userType: "SALES",
      });
    } catch (error: any) {
      console.error("Registration failed:", error);
      alert(error.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Create Account
        </h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder=" "
              required
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
                 text-gray-900 placeholder-transparent focus:outline-none focus:border-primary 
                 focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="username"
              className="absolute left-3 top-0 text-gray-400 text-sm transition-all duration-300 
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
                 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              Username
            </label>
          </div>

          {/* Email */}
          <div className="relative w-full mb-6">
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=" "
              required
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
                 text-gray-900 placeholder-transparent focus:outline-none focus:border-primary 
                 focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="email"
              className="absolute left-3 top-0 text-gray-400 text-sm transition-all duration-300 
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
                 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              Email address
            </label>
          </div>

          {/* Phone */}
          <div className="relative w-full mb-6">
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder=" "
              required
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
                 text-gray-900 placeholder-transparent focus:outline-none focus:border-primary 
                 focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="phone"
              className="absolute left-3 top-0 text-gray-400 text-sm transition-all duration-300 
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
                 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              Phone number
            </label>
          </div>

          {/* Password */}
          <div className="relative w-full mb-6">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder=" "
              required
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
                 text-gray-900 placeholder-transparent focus:outline-none focus:border-primary 
                 focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="password"
              className="absolute left-3 top-0 text-gray-400 text-sm transition-all duration-300 
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
                 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="  absolute right-3 top-2 bottom-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative w-full mb-6">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirm_password"
              id="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder=" "
              required
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
                 text-gray-900 placeholder-transparent focus:outline-none focus:border-primary 
                 focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="confirm_password"
              className="absolute left-3 top-0 text-gray-400 text-sm transition-all duration-300 
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
                 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              Confirm Password
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2 bottom-2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* User Type */}
          <div className="relative w-full mb-6">
            <select
              name="userType"
              id="userType"
              value={formData.userType}
              onChange={handleChange}
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
                 text-gray-900 placeholder-transparent focus:outline-none focus:border-primary 
                 focus:ring-2 focus:ring-primary transition-all duration-300 appearance-none"
            >
              <option value="MERCHANT">Merchant</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
            <label
              htmlFor="userType"
              className="absolute left-3 top-0 text-gray-400 text-sm transition-all duration-300 
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
                 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              User Type
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
          >
            <UserPlus className="mr-2" size={20} />
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
