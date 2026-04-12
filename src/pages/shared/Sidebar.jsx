import { useLocation } from "preact-iso";
import { useEffect } from "preact/hooks";
import { isAuthenticated, signOut } from "../../services/auth";

import MenuIcon from "../../assets/icons/Menu.svg.jsx";
import LogoutIcon from "../../assets/icons/Logout.svg.jsx";
import LoginIcon from "../../assets/icons/Login.svg.jsx";
import EditorIcon from "../../assets/icons/Editor.svg.jsx";
import TabListIcon from "../../assets/icons/TabList.svg.jsx";
import SettingsIcon from "../../assets/icons/Settings.svg.jsx";
import HelpIcon from "../../assets/icons/Help.svg.jsx";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { url, route } = useLocation();
  const handleLogout = async () => {
    await signOut();
    route("/login");
  };

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

      {/* Mobile bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-gray-800 border-t border-gray-700 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          <MobileNavItem
            href="/editor/new"
            label="New"
            isActive={url.includes("/editor")}
            icon={<EditorIcon className="w-5 h-5" />}
          />
          <MobileNavItem
            href="/"
            label="Beats"
            isActive={url === "/" || url === ""}
            icon={<TabListIcon className="w-5 h-5" />}
          />
          <MobileNavItem
            href="/settings"
            label="Settings"
            isActive={url.includes("/settings")}
            icon={<SettingsIcon className="w-5 h-5" />}
          />
          <MobileNavItem
            href="/help"
            label="Help"
            isActive={url.includes("/help")}
            icon={<HelpIcon className="w-5 h-5" />}
          />
        </div>
      </nav>
    </div>
  );
};

// Mobile bottom nav item
const MobileNavItem = ({ href, icon, label, isActive }) => {
  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center py-2 px-3 flex-1 text-[10px] transition-colors ${
        isActive
          ? "text-indigo-400"
          : "text-gray-400 active:text-gray-200"
      }`}
    >
      <div className={`mb-0.5 ${isActive ? "text-indigo-400" : ""}`}>{icon}</div>
      {label}
    </a>
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
