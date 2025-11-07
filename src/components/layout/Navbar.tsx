import {
  LogOut,
  User,
  Menu,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  KeyRound,
  Clock,
  ChevronDown,
  Maximize,
  Minimize,
  Archive,
} from "lucide-react";
import Button from "../ui/Button";
import Logo from "../../../src/assets/logos/logo.svg";
import { Link } from "react-router-dom";
import { useContext, Fragment, useState, useEffect } from "react";
import { ThemeContext } from "../../context/themeContext";
import { useAuth } from "../../context/AuthContext";
import { Menu as HeadlessMenu, Popover, Transition } from "@headlessui/react";

interface NavbarProps {
  onToggleSidebar: () => void;
}

const notifications = [
  { id: 1, text: "New user 'Alex' just registered.", time: "5m ago" },
  { id: 2, text: "Your password will expire in 3 days.", time: "1h ago" },
  { id: 3, text: "Server #4 is experiencing high load.", time: "yesterday" },
];

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { payload, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const ThemeToggle = () => (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="text-gray-900 dark:text-white" size={20} />
      ) : (
        <Moon className="text-gray-900 dark:text-white" size={20} />
      )}
    </Button>
  );

  return (
    <header
      className="h-16 flex justify-between items-center px-6 z-10 
                   bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300"
    >
      {/* --- Left Side --- */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={onToggleSidebar} className="mr-2">
          <Menu
            className="text-gray-900 dark:text-white transition-colors duration-300"
            size={24}
          />
        </Button>
        <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
          <Link to="/">
            <img src={Logo} alt="Logo" className="h-10 sm:h-20 w-auto" />
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-sm text-gray-900 dark:text-white font-medium hidden md:block">
          {currentTime.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })} | {currentTime.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block" />

        <Button
          variant="ghost"
          onClick={handleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="text-gray-900 dark:text-white" size={20} />
          ) : (
            <Maximize className="text-gray-900 dark:text-white" size={20} />
          )}
        </Button>

        <ThemeToggle />

        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                as={Button}
                variant="ghost"
                className={`relative ${open ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
              >
                <Bell
                  className="text-gray-900 dark:text-white transition-colors duration-300"
                  size={20}
                />
                {/* Notification dot */}
                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex-shrink-0">
                          <Archive size={20} className="text-primary" />
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            {notification.text}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700">
                    <Button variant="ghost" className="w-full">
                      View all notifications
                    </Button>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>

        <Button variant="ghost">
          <HelpCircle
            className="text-gray-900 dark:text-white transition-colors duration-300"
            size={20}
          />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-3" />

        {/* User Dropdown Menu */}
        <HeadlessMenu as="div" className="relative">
          <div>
            <HeadlessMenu.Button as={Button} variant="ghost">
              <User
                className="mr-1 text-gray-900 dark:text-white transition-colors duration-300"
                size={20}
              />
              <span className="text-gray-900 dark:text-white transition-colors duration-300">
                {payload?.userType}
              </span>
              <ChevronDown
                className="ml-1 h-5 w-5 text-gray-900 dark:text-white"
              />
            </HeadlessMenu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-1 py-1">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <Link
                      to="/change-password"
                      className={`${active ? 'bg-primary text-white' : 'text-gray-900 dark:text-white'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                    >
                      <KeyRound className="mr-2 h-5 w-5" />
                      Change Password
                    </Link>
                  )}
                </HeadlessMenu.Item>

                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      className={`${active ? 'bg-primary text-white' : 'text-gray-900 dark:text-white'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                    >
                      <Clock className="mr-2 h-5 w-5" />
                      Login duration: 08h:00m
                    </button>
                  )}
                </HeadlessMenu.Item>
              </div>
              <div className="px-1 py-1">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${active ? 'bg-primary text-white' : 'text-gray-900 dark:text-white'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Logout
                    </button>
                  )}
                </HeadlessMenu.Item>
              </div>
            </HeadlessMenu.Items>
          </Transition>
        </HeadlessMenu>

      </div>
    </header>
  );
};

export default Navbar;