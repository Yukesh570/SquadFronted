import React, { useState } from "react";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await login({ username, password });
    } catch (error) {
      setErrorMessage("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Squad Login
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="flex items-start p-4 text-sm bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800">
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

          <Input
            label="Username"
            type="text"
            name="username"
            id="username"
            value={username}
            onChange={(e) => {
              setusername(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="Enter your username"
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="Enter your password"
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            leftIcon={<LogIn className="mr-2" size={20} />}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
