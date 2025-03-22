import { useState, useEffect } from "preact/hooks";
import { tabStorage } from "../../services/storage";
import "./styles.scss";

export default function TabList() {
  const [tabs, setTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load tabs from storage
  useEffect(() => {
    loadTabs();
  }, []);

  const loadTabs = () => {
    setIsLoading(true);
    try {
      const loadedTabs = tabStorage.getTabs();
      // Sort by most recently modified
      loadedTabs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      setTabs(loadedTabs);
    } catch (error) {
      console.error("Error loading tabs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTab = (id) => {
    if (deleteConfirm === id) {
      tabStorage.deleteTab(id);
      setTabs(tabs.filter((tab) => tab.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Clear confirmation after 3 seconds if not clicked
      setTimeout(() => {
        setDeleteConfirm((state) => (state === id ? null : state));
      }, 3000);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Format date to be more user-friendly
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="tab-list-container p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Beats</h1>

        <div className="flex gap-3">
          {/* View toggle button */}
          <button
            onClick={toggleViewMode}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            {viewMode === "grid" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            )}
          </button>

          {/* Create new tab button */}
          <a
            href="/editor#new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:transform active:translate-y-0.5 active:bg-opacity-90 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create New Beat
          </a>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading your beats...</p>
        </div>
      )}

      {/* Empty state with CTA */}
      {!isLoading && tabs.length === 0 && (
        <div className="empty-state flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">No beats yet</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Start creating your first beat to build your collection
          </p>
          <a
            href="/editor#new"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:transform active:translate-y-0.5 active:bg-opacity-90 text-lg transition-all"
          >
            Create Your First Beat
          </a>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && tabs.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="tab-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-lg truncate pr-2">
                  {tab.name}
                </h3>
                <div className="flex items-center">
                  <button
                    onClick={() => handleDeleteTab(tab.id)}
                    className={`p-1.5 rounded-full ${deleteConfirm === tab.id ? "bg-red-100 text-red-500" : "text-gray-400 hover:text-red-500 hover:bg-gray-100"}`}
                    aria-label={
                      deleteConfirm === tab.id ? "Confirm delete" : "Delete tab"
                    }
                    title={
                      deleteConfirm === tab.id ? "Confirm delete" : "Delete tab"
                    }
                  >
                    {deleteConfirm === tab.id ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="beat-grid-preview mb-4 flex-grow">
                {/* Mini visualization of the pattern */}
                <div className="grid grid-cols-8 gap-1 h-20">
                  {Array(8)
                    .fill(0)
                    .map((_, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="col-span-1 grid grid-rows-5 gap-1"
                      >
                        {Array(5)
                          .fill(0)
                          .map((_, cellIndex) => {
                            // Display first 8 steps of each track for visual preview
                            const isActive =
                              tab.tracks &&
                              tab.tracks[cellIndex] &&
                              tab.tracks[cellIndex].pattern &&
                              tab.tracks[cellIndex].pattern[rowIndex];
                            return (
                              <div
                                key={cellIndex}
                                className={`row-span-1 rounded-sm ${isActive ? "bg-indigo-500" : "bg-gray-100"}`}
                              ></div>
                            );
                          })}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div>BPM: {tab.bpm || 120}</div>
                <div>{formatDate(tab.modified || tab.created)}</div>
              </div>

              <a
                href={`/editor#${tab.id}`}
                className="mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-center rounded-md transition-colors w-full"
              >
                Open Beat
              </a>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && tabs.length > 0 && viewMode === "list" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  BPM
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Modified
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tabs.map((tab) => (
                <tr key={tab.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {tab.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {tab.bpm || 120}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(tab.modified || tab.created)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <a
                        href={`/editor#${tab.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </a>
                      <button
                        onClick={() => handleDeleteTab(tab.id)}
                        className={`${deleteConfirm === tab.id ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}
                      >
                        {deleteConfirm === tab.id ? "Confirm?" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
