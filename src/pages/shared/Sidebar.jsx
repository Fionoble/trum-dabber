import { h } from "preact";
// import { signOut } from "../../services/auth";
import { useLocation } from "preact-iso";
import { useState, useEffect } from "preact/hooks";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { url } = useLocation();

  const handleLogout = () => {
    // Call the signOut function from your auth service
    // signOut();
    // You might want to redirect to login page or homepage after logout
  };

  return (
    <div
      className={`bg-gray-800 text-white ${
        isOpen ? "w-64" : "w-16"
      } h-full flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 h-16 border-b border-gray-700">
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Navigation links */}
      <nav className="mt-5 px-2 flex-grow">
        <NavItem
          href="/editor#new"
          isOpen={isOpen}
          label="New Dab"
          isActive={url.includes("/editor#new")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        />

        <NavItem
          href="/"
          isOpen={isOpen}
          label="Tab List"
          isActive={url === "/" || url === ""}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          }
        />

        <NavItem
          href="/settings"
          isOpen={isOpen}
          label="Settings"
          isActive={url.includes("/settings")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />

        <NavItem
          href="/help"
          isOpen={isOpen}
          label="Help"
          isActive={url.includes("/help")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </nav>

      {/* Logout button at the bottom */}
      <div className="mt-auto border-t border-gray-700 py-3 px-2">
        <button
          onClick={handleLogout}
          className={`w-full group flex items-center px-2 py-3 text-base font-medium rounded-md hover:bg-gray-700 text-red-400 transition-all duration-200
            ${!isOpen ? "justify-center" : ""}
            active:transform active:translate-y-0.5 active:bg-opacity-90 active:shadow-inner`}
        >
          <div
            className={`${isOpen ? "mr-4" : ""} transition-transform active:scale-95`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          {isOpen && (
            <span className="transition-opacity duration-300">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

// Navigation Item Component with active state
const NavItem = ({ href, icon, label, isOpen, isActive }) => {
  return (
    <a
      href={href}
      className={`group flex items-center px-2 py-3 text-base font-medium rounded-md transition-all duration-200
        ${!isOpen ? "justify-center" : ""}
        ${
          isActive
            ? "bg-indigo-500 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
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
    </a>
  );
};

export default Sidebar;
