import { useState, useEffect } from "preact/hooks";
import { tabStorage } from "../../services/storage";
import { isAuthenticated } from "../../services/auth";
import { Icon } from "../../components/Icon";

export default function TabList() {
  const [tabs, setTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

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
    <div className="px-4 pt-6 pb-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Your Beats</h1>

        <button
          onClick={toggleViewMode}
          className="p-2 rounded-lg bg-surface hover:bg-surface-light transition-colors text-on-surface-dim"
          aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
        >
          <Icon name={viewMode === "grid" ? "view_list" : "grid_view"} size="text-xl" />
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger p-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
          <Icon name="error" size="text-lg" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          <p className="mt-4 text-on-surface-dim text-sm">Loading your beats...</p>
        </div>
      )}

      {!isLoading && tabs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <Icon name="music_note" size="text-3xl" className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">No beats yet</h2>
          <p className="text-on-surface-dim mb-6 max-w-xs text-sm">
            Start creating your first beat to build your collection
          </p>
          <a
            href="/editor/new"
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium text-base active:scale-95 transition-transform"
          >
            Create Your First Beat
          </a>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && tabs.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="bg-surface rounded-xl p-4 flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <a href={`/editor/${tab.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-on-surface truncate">
                    {tab.name}
                  </h3>
                </a>
                <button
                  onClick={() => handleDeleteTab(tab.id)}
                  className={`p-1.5 rounded-lg ml-2 transition-colors ${
                    deleteConfirm === tab.id
                      ? "bg-danger/20 text-danger"
                      : "text-on-surface-dim hover:text-danger hover:bg-white/5"
                  }`}
                  aria-label={deleteConfirm === tab.id ? "Confirm delete" : "Delete tab"}
                >
                  <Icon name="delete" filled={deleteConfirm === tab.id} size="text-lg" />
                </button>
              </div>

              {/* Mini pattern preview */}
              <div className="mb-3 flex-grow">
                <div className="grid grid-cols-8 gap-0.5 h-16">
                  {Array(8)
                    .fill(0)
                    .map((_, colIndex) => (
                      <div key={colIndex} className="grid grid-rows-5 gap-0.5">
                        {Array(5)
                          .fill(0)
                          .map((_, rowIndex) => {
                            const isActive =
                              tab.tracks &&
                              tab.tracks[rowIndex] &&
                              tab.tracks[rowIndex].pattern &&
                              tab.tracks[rowIndex].pattern[colIndex];
                            return (
                              <div
                                key={rowIndex}
                                className={`rounded-sm ${
                                  isActive ? "bg-primary" : "bg-surface-light"
                                }`}
                              />
                            );
                          })}
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-on-surface-dim">
                <span>{tab.bpm || 120} BPM</span>
                <span>{formatDate(tab.modified || tab.created)}</span>
              </div>

              <a
                href={`/editor/${tab.id}`}
                className="mt-3 py-2 bg-surface-light hover:bg-white/10 text-on-surface text-center rounded-lg transition-colors text-sm font-medium"
              >
                Open Beat
              </a>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && tabs.length > 0 && viewMode === "list" && (
        <div className="space-y-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="bg-surface rounded-xl p-3 flex items-center gap-3"
            >
              <a href={`/editor/${tab.id}`} className="flex-1 min-w-0">
                <div className="font-medium text-on-surface truncate text-sm">
                  {tab.name}
                </div>
                <div className="text-xs text-on-surface-dim mt-0.5">
                  {tab.bpm || 120} BPM · {formatDate(tab.modified || tab.created)}
                </div>
              </a>
              <button
                onClick={() => handleDeleteTab(tab.id)}
                className={`p-2 rounded-lg transition-colors shrink-0 ${
                  deleteConfirm === tab.id
                    ? "bg-danger/20 text-danger"
                    : "text-on-surface-dim hover:text-danger"
                }`}
                aria-label={deleteConfirm === tab.id ? "Confirm delete" : "Delete tab"}
              >
                <Icon name="delete" filled={deleteConfirm === tab.id} size="text-lg" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB - New Beat */}
      {!isLoading && tabs.length > 0 && (
        <a
          href="/editor/new"
          className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-20"
          aria-label="Create new beat"
        >
          <Icon name="add" size="text-2xl" />
        </a>
      )}
    </div>
  );
}
