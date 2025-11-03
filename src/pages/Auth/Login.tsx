import React, { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
// import { useNavigate } from "react-router-dom"; // No longer needed
// import { loginApi } from "../../api/loginAPi/login"; // No longer needed
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext"; // 1. Import our hook

const Login = () => {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // 2. Get the 'login' function from context
  // const navigate = useNavigate(); // No longer needed, context handles it

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 3. Call the context 'login' function
      await login({ username, password });
      // The context will handle saving the token and navigating
    } catch (error) {
      console.log("error", error);
      alert("Login failed. Please check your username and password."); // Give user feedback
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (The rest of your JSX form is 100% the same) ...
    <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
           Squad Login
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            name="username"
            id="username"
            value={username}
            onChange={(e) => setusername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700"
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
          <p className="text-center text-sm text-gray-900 dark:text-white">
            Don't have an account?{" "}
            <a
              href="/signUp"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;