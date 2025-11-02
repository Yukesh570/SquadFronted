import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../../api/loginAPi/login";

const Login = () => {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginApi({ username, password });
      const token = response.token;
      if (token) {
        localStorage.setItem("token", token);
        window.dispatchEvent(new Event("storage"));
        // alert("Login successful!");
        navigate("/dashboard");
      } else {
        alert("Login failed: No token received.");
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary  dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-secondary  dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Park Alarm Admin
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative w-full mb-6">
            <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={(e) => setusername(e.target.value)}
              placeholder=" "
              required
              className="peer block w-full px-3 pt-5 pb-2 border border-gray-300  rounded-md bg-transparent 
               text-gray-900 dark:text-white placeholder-transparent focus:outline-none focus:border-primary 
               focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="username"
              className="absolute left-3 top-0 text-gray-900 dark:text-white text-sm transition-all duration-300 
               peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
               peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary "
            >
              Username
            </label>
          </div>

          <div className="relative w-full mb-6">
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer block w-full px-4 pt-5 pb-2 border border-gray-300 rounded-md bg-transparent 
               text-gray-900 dark:text-white placeholder-transparent focus:outline-none focus:border-primary 
               focus:ring-2 focus:ring-primary transition-all duration-300"
            />
            <label
              htmlFor="password"
              className="absolute left-3   top-0 text-gray-900 dark:text-white text-sm transition-all duration-300 
               peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base 
               peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary"
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <LogIn className="mr-2" size={20} />
            Sign in
          </button>

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
