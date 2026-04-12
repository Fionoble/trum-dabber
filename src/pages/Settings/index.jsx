import { useState, useEffect } from "preact/hooks";
import { signOut } from "../../services/auth";
import { tabStorage } from "../../services/storage";
import "./styles.scss";
import { useLocation } from "preact-iso";
import MusicIcon from "../../assets/icons/MusicIcon.svg.jsx";
import PlayIcon from "../../assets/icons/Play.svg.jsx";
import EyeIcon from "../../assets/icons/Eye.svg.jsx";
import EyeOffIcon from "../../assets/icons/EyeOff.svg.jsx";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable instrument component
function SortableInstrumentItem({ instrument, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instrument });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${
        isDragging ? "bg-indigo-50 rounded" : ""
      }`}
    >
      <div 
        className="flex items-center cursor-move" 
        {...attributes} 
        {...listeners}
      >
        <svg viewBox="0 0 20 20" width="12" height="12" className="mr-2 text-gray-400">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" fill="currentColor"></path>
        </svg>
        <span className="font-mono text-sm">{instrument}</span>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="text-red-500 hover:text-red-700 ml-2"
        title="Remove"
      >
        ×
      </button>
    </li>
  );
}

export default function Settings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [playbackSettings, setPlaybackSettings] = useState({
    countIn: false,
    loopPlayback: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newInstrument, setNewInstrument] = useState("");
  const [apiKeys, setApiKeys] = useState({ openaiKey: '', anthropicKey: '' });
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [apiKeysSaving, setApiKeysSaving] = useState(false);
  const [apiKeysSaveSuccess, setApiKeysSaveSuccess] = useState(false);
  const { route } = useLocation();
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start dragging after moving 5px to avoid conflicts with click events
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Available instruments to choose from
  const availableInstruments = [
    "kick",
    "snare",
    "hihat",
    "hihatOpen",
    "tom",
    "hiTom",
    "floorTom",
    "crash",
    "cowbell",
  ];

  useEffect(() => {
    // Load saved instruments and playback settings when the component mounts
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const savedInstruments = await tabStorage.getUserInstruments();
        const savedPlaybackSettings = await tabStorage.getPlaybackSettings();
        const savedApiKeys = await tabStorage.getSetting('apiKeys', { openaiKey: '', anthropicKey: '' });

        setInstruments(savedInstruments);
        setPlaybackSettings(savedPlaybackSettings);
        setApiKeys(savedApiKeys);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);
  
  // Handler for saving playback settings
  const handlePlaybackSettingsChange = async (key, value) => {
    const newSettings = { ...playbackSettings, [key]: value };
    setPlaybackSettings(newSettings);
    
    try {
      setIsSaving(true);
      setError(null);
      
      const success = await tabStorage.savePlaybackSettings(newSettings);
      
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError("Failed to save playback settings. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save playback settings:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for saving API keys
  const handleSaveApiKeys = async () => {
    try {
      setApiKeysSaving(true);
      setError(null);

      const success = await tabStorage.saveSetting('apiKeys', apiKeys);

      if (success) {
        setApiKeysSaveSuccess(true);
        setTimeout(() => setApiKeysSaveSuccess(false), 3000);
      } else {
        setError('Failed to save API keys. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setApiKeysSaving(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setConfirmText("");
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const proceedToFinalConfirmation = () => {
    if (confirmText.toLowerCase() !== "delete") {
      setError("Please type 'delete' to confirm");
      return;
    }

    setError(null);
    setDeleteStep(2);
    setConfirmText("");
  };

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== "confirm delete") {
      setError("Please type 'confirm delete' to proceed");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // First clear all local data
      localStorage.clear();

      // Then sign out the user
      await signOut();

      // Redirect to login page
      route("/login");
    } catch (error) {
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  // New handler functions for instrument management
  const handleSaveInstruments = async () => {
    try {
      setIsSaving(true);
      setError(null); // Clear any previous errors

      const success = await tabStorage.saveUserInstruments(instruments);

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError("Failed to save instrument settings. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save instruments:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInstrument = () => {
    if (newInstrument && !instruments.includes(newInstrument)) {
      setInstruments([...instruments, newInstrument]);
      setNewInstrument("");
    }
  };

  const handleRemoveInstrument = (index) => {
    const updatedInstruments = [...instruments];
    updatedInstruments.splice(index, 1);
    setInstruments(updatedInstruments);
  };

  // Handler for when drag ends - update the instruments array
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setInstruments((instruments) => {
        const oldIndex = instruments.indexOf(active.id);
        const newIndex = instruments.indexOf(over.id);
        
        return arrayMove(instruments, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="settings-container p-2 md:p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Settings</h1>

      {/* Drum Machine Settings Section */}
      <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <MusicIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Drum Kit
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Customize your drum kit by adding, removing, or reordering
              instruments. Changes will apply to new beats you create.
            </p>

            <div className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Current Instruments
              </h3>
              
              <div className="mb-4 drag-container">
                <p className="text-xs text-gray-500 mb-2 italic">
                  Drag and drop to reorder instruments
                </p>
                
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={instruments}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="mb-4">
                      {instruments.map((instrument, index) => (
                        <SortableInstrumentItem
                          key={instrument}
                          instrument={instrument}
                          index={index}
                          onRemove={handleRemoveInstrument}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="flex gap-2 mt-4">
                <select
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm flex-grow"
                >
                  <option value="">Select an instrument...</option>
                  {availableInstruments
                    .filter((inst) => !instruments.includes(inst))
                    .map((instrument) => (
                      <option key={instrument} value={instrument}>
                        {instrument}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddInstrument}
                  disabled={
                    !newInstrument || instruments.includes(newInstrument)
                  }
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="text-green-500 text-sm animate-fade-out">
                    Settings saved successfully!
                  </span>
                )}
                {error && <span className="text-red-500 text-sm">{error}</span>}
              </div>
              <button
                onClick={handleSaveInstruments}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Playback Settings Section */}
      <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <PlayIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Playback
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Adjust how drum tracks play back in the editor.
            </p>

            <div className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Playback Options
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="count-in"
                    type="checkbox"
                    checked={playbackSettings.countIn}
                    onChange={(e) => handlePlaybackSettingsChange('countIn', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="count-in" className="ml-2 text-sm text-gray-700">
                    Count-in before playing
                    <p className="text-xs text-gray-500 mt-1">
                      Play a one-bar count-in before the track starts.
                    </p>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="loop-playback"
                    type="checkbox"
                    checked={playbackSettings.loopPlayback}
                    onChange={(e) => handlePlaybackSettingsChange('loopPlayback', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="loop-playback" className="ml-2 text-sm text-gray-700">
                    Loop playback
                    <p className="text-xs text-gray-500 mt-1">
                      Continue playing from the beginning when the track ends.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* API Keys Section */}
      <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-indigo-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
              clipRule="evenodd"
            />
          </svg>
          API Keys
        </h2>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Configure API keys for AI-powered features. Keys are stored in
              your account and never shared.
            </p>

            <div className="mb-4 bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="openai-key"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    OpenAI API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="openai-key"
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={apiKeys.openaiKey}
                      onChange={(e) =>
                        setApiKeys({ ...apiKeys, openaiKey: e.target.value })
                      }
                      placeholder="sk-..."
                      className="border border-gray-300 rounded-md p-2 text-sm flex-grow font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600"
                      title={showOpenaiKey ? 'Hide key' : 'Show key'}
                    >
                      <span className="h-4 w-4 block">
                        {showOpenaiKey ? <EyeOffIcon /> : <EyeIcon />}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="anthropic-key"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Anthropic API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="anthropic-key"
                      type={showAnthropicKey ? 'text' : 'password'}
                      value={apiKeys.anthropicKey}
                      onChange={(e) =>
                        setApiKeys({ ...apiKeys, anthropicKey: e.target.value })
                      }
                      placeholder="sk-ant-..."
                      className="border border-gray-300 rounded-md p-2 text-sm flex-grow font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600"
                      title={showAnthropicKey ? 'Hide key' : 'Show key'}
                    >
                      <span className="h-4 w-4 block">
                        {showAnthropicKey ? <EyeOffIcon /> : <EyeIcon />}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {apiKeysSaveSuccess && (
                  <span className="text-green-500 text-sm animate-fade-out">
                    API keys saved successfully!
                  </span>
                )}
                {error && <span className="text-red-500 text-sm">{error}</span>}
              </div>
              <button
                onClick={handleSaveApiKeys}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                disabled={apiKeysSaving}
              >
                {apiKeysSaving ? 'Saving...' : 'Save Keys'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 italic">
              Keys are stored in your account and never shared.
            </p>
          </>
        )}
      </div>

      {/* Account Management Section */}
      <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-indigo-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          Account
        </h2>

        <div className="bg-red-50 rounded-md p-4 mt-6 border border-red-100">
          <h3 className="text-lg font-medium text-red-700 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Once you delete your account, there is no going back. This is a
            permanent action.
          </p>
          <button
            onClick={openDeleteModal}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              {deleteStep === 1 ? "Delete Account" : "Final Confirmation"}
            </h3>

            {deleteStep === 1 ? (
              <>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to delete your account? This action is
                  permanent and cannot be undone. All your beats and settings
                  will be lost.
                </p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Type "delete" to confirm:
                </p>
              </>
            ) : (
              <>
                <p className="mb-6 text-gray-700">
                  <strong className="text-red-600">Final warning:</strong> You
                  are about to permanently delete your account and all
                  associated data. This action cannot be reversed.
                </p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Type "confirm delete" to permanently delete your account:
                </p>
              </>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 mb-4"
              placeholder={
                deleteStep === 1 ? "Type 'delete'" : "Type 'confirm delete'"
              }
              disabled={isDeleting}
            />

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              {deleteStep === 1 ? (
                <button
                  onClick={proceedToFinalConfirmation}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete My Account"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
