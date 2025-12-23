import React, { useState, useContext } from "react";
import { Eye, EyeOff, AlertCircle, Sun, Moon, Palette } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { ThemeContext } from "../../context/themeContext";
import FullLogo from "../../assets/logos/logo.svg";

const Login = () => {
  const { theme, toggleTheme, primaryColor, changePrimaryColor } =
    useContext(ThemeContext);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();

  const currentYear = new Date().getFullYear();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await login({ username: formData.username, password: formData.password });
    } catch (error) {
      setErrorMessage("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changePrimaryColor(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-gray-900 relative overflow-hidden transition-colors duration-300">
      <div
        className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse dark:opacity-10"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse dark:opacity-10"
        style={{ backgroundColor: primaryColor, animationDelay: "2s" }}
      />

      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <div className="relative group">
          <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-transform">
            <Palette size={20} className="text-gray-600 dark:text-gray-300" />
            <input
              type="color"
              value={primaryColor}
              onChange={handleColorChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Change Theme Color"
            />
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform text-gray-600 dark:text-gray-300"
          title="Toggle Dark Mode"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-10 relative">
        <div className="text-center mb-6">
          <div className="flex justify-center -mb-3">
            <img
              src={FullLogo}
              alt="Squad Logo"
              className="h-24 w-auto object-contain transition-transform hover:scale-105 duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">
            Squad Login
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="flex items-start p-4 text-sm bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-300">
                  Login Failed
                </h3>
                <p className="mt-1 text-red-700 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              className="py-3"
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="py-3"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <div className="flex justify-end mt-2">
                <a
                  href="#"
                  className="text-xs font-medium hover:underline transition-colors"
                  style={{ color: primaryColor }}
                >
                  Forgot Password?
                </a>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-base font-semibold transition-all duration-200"
            style={{
              boxShadow: `0 8px 20px -6px ${primaryColor}80`,
            }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {currentYear} Squad. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
