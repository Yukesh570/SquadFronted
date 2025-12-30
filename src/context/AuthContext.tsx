import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi, type loginData } from "../api/loginAPi/login";
import { decodeJwtPayload } from "../helper/decrypt";

// Define the shape of the user data (from the token)
interface AuthPayload {
  user_id: number;
  username: string;
  userType: string;
}

// Define the shape of the context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  payload: AuthPayload | null;
  login: (loginData: loginData) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the "Provider" component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [payload, setPayload] = useState<AuthPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const navigate = useNavigate();

  // This effect runs ONCE when the app loads
  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      try {
        const { token, payload } = decodeJwtPayload();
        if (token && payload) {
          setIsAuthenticated(true);
          setPayload(payload as AuthPayload);
        } else {
          setIsAuthenticated(false);
          setPayload(null);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setIsAuthenticated(false);
        setPayload(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for changes in other tabs
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  // Create the LOGIN function
  const login = async (loginData: loginData) => {
    const response = await loginApi(loginData); // Throws error on failure
    const token = response.token;
    if (token) {
      localStorage.setItem("token", token);
      const { payload } = decodeJwtPayload();
      setIsAuthenticated(true);
      setPayload(payload as AuthPayload);
      window.dispatchEvent(new Event("storage")); // Trigger sync
      navigate("/dashboard");
    } else {
      throw new Error("Login failed: No token received.");
    }
  };

  // Create the LOGOUT function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sidebar_collapsed");
    setIsAuthenticated(false);
    setPayload(null);
    window.dispatchEvent(new Event("storage")); // Trigger sync
    navigate("/login"); // Redirect to login
  };

  // Provide all values to children
  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, payload, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to easily use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
