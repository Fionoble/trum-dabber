import { useLocation } from "preact-iso";
import { isAuthenticated, signOut } from "../../services/auth";

import MenuIcon from "../../assets/icons/Menu.svg";
import LogoutIcon from "../../assets/icons/Logout.svg";
import LoginIcon from "../../assets/icons/Login.svg";
import EditorIcon from "../../assets/icons/Editor.svg";
import TabListIcon from "../../assets/icons/TabList.svg";
import SettingsIcon from "../../assets/icons/Settings.svg";
import HelpIcon from "../../assets/icons/Help.svg";

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

      {/* Navigation links */}
      <nav className="px-2 flex-grow flex flex-row md:flex-col md:mt-5 justify-around md:justify-start">
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

      {/* Login/Logout button at the bottom */}
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
      
      {/* Mobile Login/Logout button */}
      <div className="md:hidden px-2">
        {isAuthenticated.value ? (
          <NavItem
            icon={<LogoutIcon />}
            label="Logout"
            isOpen={isOpen}
            isActive={false}
            onClick={handleLogout}
            customClass="text-red-400"
          />
        ) : (
          <NavItem
            href="/login"
            icon={<LoginIcon />}
            label="Login"
            isOpen={isOpen}
            isActive={false}
            customClass="text-green-400"
          />
        )}
      </div>
    </div>
  );
};

// Navigation Item Component with active state
const NavItem = ({ href, icon, label, isOpen, isActive, onClick, customClass }) => {
  const Component = href ? 'a' : 'button';
  const props = href ? { href } : { onClick };
  
  return (
    <Component
      {...props}
      className={`group flex items-center px-2 py-3 text-base font-medium rounded-md transition-all duration-200
        ${!isOpen ? "justify-center" : ""}
        ${
          isActive
            ? "bg-indigo-500 text-white"
            : `text-gray-300 hover:bg-gray-700 hover:text-white ${customClass || ''}`
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
