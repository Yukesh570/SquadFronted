import { LogOut, User, Menu, Bell, HelpCircle } from "lucide-react";
import Button from "../ui/Button";
import Logo from "../../../src/assets/logos/logo.svg";
import { Link } from "react-router-dom";
import { decodeJwtPayload } from "../../helper/decrypt";
import { useState, useEffect, useContext } from "react";
import sunIcon from "../../assets/logos/contrast.png";
import moonIcon from "../../assets/logos/moon.png";
import { ThemeContext } from "../../context/themeContext";
interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const { token, payload } = decodeJwtPayload();

  const {theme,toggleTheme}=useContext(ThemeContext);
  
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
          theme === "dark" ? "translate-x-7" : "translate-x-0"
        }`}
      >
        <img
          src={theme === "dark" ? moonIcon : sunIcon}
          alt="theme icon"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    </button>
  );
  return (
    <header
      className="h-16 flex justify-between items-center px-6 z-10 
                   bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300"
    >
      <div className="flex items-center">
        <Button variant="ghost" onClick={onToggleSidebar} className="mr-2">
          <Menu
            className="text-gray-900 dark:text-white transition-colors duration-300"
            size={24}
          />
        </Button>
        <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
          <Link to="/">
            <img src={Logo} alt="Logo" className="h-10 sm:h-7 w-auto" />
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <Button variant="ghost" className="relative">
          <Bell
            className="text-gray-900 dark:text-white transition-colors duration-300"
            size={20}
          />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>
        <Button variant="ghost">
          <HelpCircle
            className="text-gray-900 dark:text-white transition-colors duration-300"
            size={20}
          />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-3 transition-colors duration-300" />
        <Button variant="ghost" onClick={handleLogout}>
          <User
            className="mr-1 text-gray-900 dark:text-white transition-colors duration-300"
            size={20}
          />
          <span className="text-gray-900 dark:text-white transition-colors duration-300">
            {payload?.userType}
          </span>
          <LogOut
            className="ml-2 text-gray-900 dark:text-white transition-colors duration-300"
            size={20}
          />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
