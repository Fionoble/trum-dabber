import { useLocation } from "preact-iso";
import { useState, useEffect, useRef } from "preact/hooks";
import { isAuthenticated, signOut } from "../../services/auth";

import MenuIcon from "../../assets/icons/Menu.svg";
import LogoutIcon from "../../assets/icons/Logout.svg";
import LoginIcon from "../../assets/icons/Login.svg";
import EditorIcon from "../../assets/icons/Editor.svg";
import TabListIcon from "../../assets/icons/TabList.svg";
import SettingsIcon from "../../assets/icons/Settings.svg";
import HelpIcon from "../../assets/icons/Help.svg";
import MoreIcon from "../../assets/icons/Menu.svg";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { url, route } = useLocation();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef(null);

  const handleLogout = async () => {
    await signOut();
    route("/login");
    setShowPopover(false);
  };

  const togglePopover = () => {
    setShowPopover(!showPopover);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`bg-gray-800 text-white ${
        isOpen ? "w-64" : "w-16"
      } md:h-full flex-shrink-0 transition-all duration-300 ease-in-out flex flex-row md:flex-col`}
    >
      {/* Sidebar header - only shown on desktop */}
      <div className="hidden md:flex items-center justify-between px-4 py-3 h-16 border-b border-gray-700">
        <h2
          className={`text-xl font-semibold transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          Dabber
        </h2>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Desktop Navigation links */}
      <nav className="hidden md:flex px-2 flex-grow flex-col md:mt-5 md:justify-start">
        <NavItem
          href="/editor/new"
          isOpen={isOpen}
          label="New Dab"
          isActive={url.includes("/editor/new")}
          icon={<EditorIcon />}
        />
        <NavItem
          href="/"
          isOpen={isOpen}
          label="Tab List"
          isActive={url === "/" || url === ""}
          icon={<TabListIcon />}
        />
        <NavItem
          href="/settings"
          isOpen={isOpen}
          label="Settings"
          isActive={url.includes("/settings")}
          icon={<SettingsIcon />}
        />
        <NavItem
          href="/help"
          isOpen={isOpen}
          label="Help"
          isActive={url.includes("/help")}
          icon={<HelpIcon />}
        />
      </nav>

      {/* Login/Logout button at the bottom (desktop only) */}
      <div className="hidden md:block md:mt-auto border-t border-gray-700 py-3 px-2">
        {isAuthenticated.value ? (
          <button
            onClick={handleLogout}
            className={`w-full group flex items-center px-2 py-3 text-base font-medium rounded-md hover:bg-gray-700 text-red-400 transition-all duration-200
              ${!isOpen ? "justify-center" : ""}
              active:transform active:translate-y-0.5 active:bg-opacity-90 active:shadow-inner`}
          >
            <div
              className={`${isOpen ? "mr-4" : ""} transition-transform active:scale-95`}
            >
              <LogoutIcon />
            </div>
            {isOpen && (
              <span className="transition-opacity duration-300">Logout</span>
            )}
          </button>
        ) : (
          <a
            href="/login"
            className={`w-full group flex items-center px-2 py-3 text-base font-medium rounded-md hover:bg-gray-700 text-green-400 transition-all duration-200
              ${!isOpen ? "justify-center" : ""}
              active:transform active:translate-y-0.5 active:bg-opacity-90 active:shadow-inner`}
          >
            <div
              className={`${isOpen ? "mr-4" : ""} transition-transform active:scale-95`}
            >
              <LoginIcon />
            </div>
            {isOpen && (
              <span className="transition-opacity duration-300">Login</span>
            )}
          </a>
        )}
      </div>

      {/* Mobile menu button - fixed to right side */}
      <div
        className="fixed bottom-0 right-0 p-2 z-20 md:hidden"
        ref={popoverRef}
      >
        {/* More button */}
        <button
          onClick={togglePopover}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg focus:outline-none hover:bg-indigo-700 active:bg-indigo-800"
          aria-label="More options"
        >
          <MoreIcon className="w-6 h-6" />
        </button>

        {/* Popover menu */}
        {showPopover && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-700 rounded-md shadow-lg overflow-hidden z-10">
            <a
              href="/editor/new"
              onClick={() => setShowPopover(false)}
              className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-600 focus:outline-none flex items-center ${url.includes("/editor/new") ? "bg-indigo-500 text-white" : "text-gray-200"}`}
            >
              <EditorIcon className="mr-3 w-5 h-5" />
              New Dab
            </a>
            <a
              href="/"
              onClick={() => setShowPopover(false)}
              className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-600 focus:outline-none flex items-center ${url === "/" || url === "" ? "bg-indigo-500 text-white" : "text-gray-200"}`}
            >
              <TabListIcon className="mr-3 w-5 h-5" />
              Tab List
            </a>
            <a
              href="/settings"
              onClick={() => setShowPopover(false)}
              className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-600 focus:outline-none flex items-center ${url.includes("/settings") ? "bg-indigo-500 text-white" : "text-gray-200"}`}
            >
              <SettingsIcon className="mr-3 w-5 h-5" />
              Settings
            </a>
            <a
              href="/help"
              onClick={() => setShowPopover(false)}
              className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-600 focus:outline-none flex items-center ${url.includes("/help") ? "bg-indigo-500 text-white" : "text-gray-200"}`}
            >
              <HelpIcon className="mr-3 w-5 h-5" />
              Help
            </a>

            {/* Divider */}
            <div className="border-t border-gray-600 my-1"></div>

            {/* Login/Logout */}
            {isAuthenticated.value ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-600 focus:outline-none flex items-center"
              >
                <LogoutIcon className="mr-3 w-5 h-5" />
                Logout
              </button>
            ) : (
              <a
                href="/login"
                className="block w-full text-left px-4 py-3 text-sm text-green-400 hover:bg-gray-600 focus:outline-none flex items-center"
              >
                <LoginIcon className="mr-3 w-5 h-5" />
                Login
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Navigation Item Component with active state
const NavItem = ({
  href,
  icon,
  label,
  isOpen,
  isActive,
  onClick,
  customClass,
}) => {
  const Component = href ? "a" : "button";
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      className={`group flex items-center px-2 py-3 text-base font-medium rounded-md transition-all duration-200
        ${!isOpen ? "justify-center" : ""}
        ${
          isActive
            ? "bg-indigo-500 text-white"
            : `text-gray-300 hover:bg-gray-700 hover:text-white ${customClass || ""}`
        }
        active:transform active:translate-y-0.5 active:bg-opacity-90 active:shadow-inner`}
    >
      <div
        className={`${isOpen ? "mr-4" : ""} transition-transform active:scale-95`}
      >
        {icon}
      </div>
      {isOpen && (
        <span className="transition-opacity duration-300">{label}</span>
      )}
    </Component>
  );
};

export default Sidebar;
