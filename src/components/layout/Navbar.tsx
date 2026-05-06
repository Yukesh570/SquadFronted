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
  Palette,
  RefreshCcw,
} from "lucide-react";
import Button from "../ui/Button";
import { Link } from "react-router-dom";
import { useContext, Fragment, useState, useEffect } from "react";
import { ThemeContext } from "../../context/themeContext";
import { useAuth } from "../../context/AuthContext";
import {
  Menu as HeadlessMenu,
  Popover,
  Transition,
  Dialog,
} from "@headlessui/react";
import {
  getNotificationApi,
  type NotificationData,
} from "../../api/userActionApi/notificationApi";

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { payload, logout } = useAuth();
  const { theme, toggleTheme, primaryColor, changePrimaryColor } =
    useContext(ThemeContext);
  const [notificationData, setNotificationData] = useState<NotificationData[]>(
    [],
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [localColor, setLocalColor] = useState(primaryColor);

  const [recentColors, setRecentColors] = useState<string[]>([]);

  // ---> NEW: Make timezone a state so it can re-render instantly <---
  const [appTimezone, setAppTimezone] = useState(
    localStorage.getItem("app_timezone") || "UTC"
  );

  // ---> NEW: Listen for the custom event from GeneralSettings <---
  useEffect(() => {
    const handleTimezoneChange = () => {
      setAppTimezone(localStorage.getItem("app_timezone") || "UTC");
    };

    window.addEventListener("timezoneChanged", handleTimezoneChange);
    return () => {
      window.removeEventListener("timezoneChanged", handleTimezoneChange);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response: any = await getNotificationApi();
      if (response && response.results) {
        setNotificationData(response.results);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    const savedRecents = localStorage.getItem("recentThemeColors");
    if (savedRecents) {
      try {
        setRecentColors(JSON.parse(savedRecents));
      } catch (e) {
        console.error("Failed to parse recent colors");
      }
    }
    // Initial fetch
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isThemeModalOpen) {
      setLocalColor(primaryColor);
    }
  }, [isThemeModalOpen, primaryColor]);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
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

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalColor(e.target.value);
  };

  const handleResetTheme = () => {
    const defaultColor = "#7F58D8";
    setLocalColor(defaultColor);
  };

  const handleSaveAndClose = () => {
    changePrimaryColor(localColor);
    let newRecents = [localColor, ...recentColors];
    newRecents = [...new Set(newRecents)];
    newRecents = newRecents.slice(0, 5);
    setRecentColors(newRecents);
    localStorage.setItem("recentThemeColors", JSON.stringify(newRecents));
    setIsThemeModalOpen(false);
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
    <>
      <header className="h-16 flex justify-between items-center px-6 z-10 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onToggleSidebar} className="mr-2">
            <Menu className="text-gray-900 dark:text-white transition-colors duration-300" size={24} />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Live Clock using state appTimezone */}
          <div className="text-sm text-gray-900 dark:text-white font-medium hidden md:block">
            {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: appTimezone }).format(currentTime)} | {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: appTimezone }).format(currentTime)}
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block" />

          <Button variant="ghost" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} className="hidden md:flex">
            {isFullscreen ? <Minimize className="text-gray-900 dark:text-white" size={20} /> : <Maximize className="text-gray-900 dark:text-white" size={20} />}
          </Button>

          <ThemeToggle />

          {/* Improved Notification Popover */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  as={Button}
                  variant="ghost"
                  onClick={fetchNotifications}
                  className={`relative transition-all duration-200 ${open ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                >
                  <Bell className="text-gray-900 dark:text-white" size={20} />
                  {notificationData.length > 0 && (
                    <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                  )}
                </Popover.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1 scale-95"
                  enterTo="opacity-100 translate-y-0 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 scale-100"
                  leaveTo="opacity-0 translate-y-1 scale-95"
                >
                  <Popover.Panel className="absolute right-0 z-50 mt-3 w-80 sm:w-96 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 focus:outline-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {notificationData.length} New
                      </span>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50 custom-scrollbar">
                      {notificationData.length > 0 ? (
                        notificationData.map((notification) => (
                          <div key={notification.id} className="group relative flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all cursor-pointer">
                            <div className="flex-shrink-0 mt-1">
                              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Archive size={16} className="text-primary" />
                              </div>
                            </div>
                            <div className="ml-4 w-0 flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate pr-4">
                                  {notification.title || "Module Update"}
                                </p>
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                              </div>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {notification.description}
                              </p>
                              {/* Notification time using cached timezone */}
                              <div className="mt-2 flex items-center text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                <Clock size={12} className="mr-1" />
                                {notification.createdAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: appTimezone }).format(new Date(notification.createdAt)) : "Just now"}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-full mb-4">
                            <Bell size={32} className="text-gray-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">All caught up!</p>
                          <p className="text-xs text-gray-500 mt-1">No new notifications to show.</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center bg-white dark:bg-gray-800">
                      <Link to="/notifications" className="text-xs font-bold text-primary hover:underline transition-all block py-1">
                        View All Notifications
                      </Link>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          <Button variant="ghost" className="hidden md:flex">
            <HelpCircle className="text-gray-900 dark:text-white transition-colors duration-300" size={20} />
          </Button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-3 hidden md:block" />

          {/* User Dropdown */}
          <HeadlessMenu as="div" className="relative">
            <div>
              <HeadlessMenu.Button as={Button} variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  <User size={18} />
                </div>
                <span className="text-gray-900 dark:text-white transition-colors duration-300 hidden sm:block">
                  {payload?.userType}
                </span>
                <ChevronDown className="ml-1 h-5 w-5 text-gray-900 dark:text-white" />
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
              <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700">
                <div className="px-1 py-1">
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <Link to="/change-password" className={`${active ? "bg-primary text-white" : "text-gray-900 dark:text-white"} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}>
                        <KeyRound className="mr-2 h-5 w-5" /> Change Password
                      </Link>
                    )}
                  </HeadlessMenu.Item>
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button onClick={() => setIsThemeModalOpen(true)} className={`${active ? "bg-primary text-white" : "text-gray-900 dark:text-white"} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}>
                        <Palette className="mr-2 h-5 w-5" /> Theme Change
                      </button>
                    )}
                  </HeadlessMenu.Item>
                </div>
                <div className="px-1 py-1">
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button onClick={logout} className={`${active ? "bg-primary text-white" : "text-gray-900 dark:text-white"} group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors`}>
                        <LogOut className="mr-2 h-5 w-5" /> Logout
                      </button>
                    )}
                  </HeadlessMenu.Item>
                </div>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>
      </header>

      {/* Theme Modal */}
      <Transition appear show={isThemeModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsThemeModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Theme Color</Dialog.Title>
                    <button onClick={handleResetTheme} className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 transition-colors">
                      <RefreshCcw size={12} /> Reset
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative group mb-6">
                      <div className="w-24 h-24 rounded-full shadow-lg border-[4px] border-white dark:border-gray-700 transition-transform group-hover:scale-105" style={{ backgroundColor: localColor }}></div>
                      <input type="color" value={localColor} onChange={handleColorChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full" />
                      <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-md pointer-events-none">
                        <Palette size={16} className="text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Click the circle to pick a color</p>
                    <div className="w-full max-w-[200px] mb-6">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
                        <input
                          type="text"
                          value={localColor.replace("#", "")}
                          onChange={(e) => setLocalColor("#" + e.target.value)}
                          className="w-full pl-7 pr-4 py-2 text-center text-sm font-mono border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none uppercase"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    {recentColors.length > 0 && (
                      <div className="w-full">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Recently Used</p>
                        <div className="flex justify-center gap-3">
                          {recentColors.map((color, index) => (
                            <button key={index} onClick={() => setLocalColor(color)} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-8">
                    <Button variant="primary" onClick={handleSaveAndClose} className="w-full justify-center transition-all shadow-md" style={{ backgroundColor: localColor, borderColor: localColor }}>
                      Done
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Navbar;