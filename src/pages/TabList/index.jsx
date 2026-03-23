import { useState, useEffect } from "preact/hooks";
import { tabStorage } from "../../services/storage";
import { isAuthenticated } from "../../services/auth";
import AiImportModal from "./AiImportModal";
import MenuIcon from "../../assets/icons/Menu.svg.jsx";
import GridViewIcon from "../../assets/icons/GridView.svg.jsx";
import PlusIcon from "../../assets/icons/Plus.svg.jsx";
import ErrorIcon from "../../assets/icons/Error.svg.jsx";
import MusicIcon from "../../assets/icons/MusicIcon.svg.jsx";
import TrashIcon from "../../assets/icons/TrashIcon.svg.jsx";
import TrashIconFilled from "../../assets/icons/TrashIconFilled.svg.jsx";
import "./styles.scss";

export default function TabList() {
  const [tabs, setTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [showAiImport, setShowAiImport] = useState(false);

  useEffect(() => {
    loadTabs();
  }, [isAuthenticated.value]);

  const loadTabs = async () => {
    setIsLoading(true);
    setError(null);

    if (!isAuthenticated.value) {
      setTabs([]);
      setIsLoading(false);
      return;
    }

    try {
      const loadedTabs = await tabStorage.getTabs();
      loadedTabs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      setTabs(loadedTabs);
    } catch (error) {
      console.error("Error loading tabs:", error);
      setError("Failed to load your beats. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTab = async (id) => {
    if (deleteConfirm === id) {
      setIsLoading(true);
      try {
        const success = await tabStorage.deleteTab(id);
        if (success) {
          setTabs(tabs.filter((tab) => tab.id !== id));
        } else {
          setError("Failed to delete tab. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting tab:", error);
        setError("Failed to delete tab. Please try again.");
      } finally {
        setIsLoading(false);
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      setTimeout(() => {
        setDeleteConfirm((state) => (state === id ? null : state));
      }, 3000);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

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
            {viewMode === "grid" ? <MenuIcon /> : <GridViewIcon />}
          </button>

          {/* AI Transcribe button */}
          <button
            onClick={() => setShowAiImport(true)}
            disabled={!isAuthenticated.value}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 active:transform active:translate-y-0.5 active:bg-opacity-90 flex items-center gap-2 disabled:opacity-50 transition-colors"
            title={isAuthenticated.value ? 'Transcribe from image' : 'Log in to transcribe'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="hidden sm:inline">Transcribe</span>
          </button>

          {/* Create new tab button */}
          <a
            href="/editor/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:transform active:translate-y-0.5 active:bg-opacity-90 flex items-center gap-2"
          >
            <PlusIcon />
            <span className="hidden sm:inline">Create New Beat</span>
            <span className="sm:hidden">New</span>
          </a>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6 flex items-center">
          <ErrorIcon />
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading your beats...</p>
        </div>
      )}

      {/* Empty state with CTA */}
      {!isLoading && tabs.length === 0 && !error && (
        <div className="empty-state flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="mb-6">
            <MusicIcon />
          </div>
          <h2 className="text-xl font-bold mb-2">No beats yet</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Start creating your first beat to build your collection
          </p>
          <a
            href="/editor/new"
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
                      <TrashIconFilled />
                    ) : (
                      <TrashIcon />
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
                href={`/editor/${tab.id}`}
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
                        href={`/editor/${tab.id}`}
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
      {showAiImport && (
        <AiImportModal onClose={() => setShowAiImport(false)} />
      )}
    </div>
  );
}
