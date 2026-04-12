import { useState, useEffect } from "preact/hooks";
import { signOut } from "../../services/auth";
import { tabStorage } from "../../services/storage";
import { useLocation } from "preact-iso";
import { Icon } from "../../components/Icon";
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
      className={`flex items-center justify-between py-2.5 px-3 border-b border-white/5 last:border-0 ${
        isDragging ? "bg-primary/10 rounded-lg" : ""
      }`}
    >
      <div
        className="flex items-center gap-2 cursor-move flex-1 min-w-0"
        {...attributes}
        {...listeners}
      >
        <Icon name="drag_indicator" size="text-lg" className="text-on-surface-dim shrink-0" />
        <span className="font-mono text-sm text-on-surface truncate">{instrument}</span>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="text-danger hover:text-red-400 ml-2 p-1 shrink-0"
        title="Remove"
      >
        <Icon name="close" size="text-lg" />
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const availableInstruments = [
    "kick", "snare", "hihat", "hihatOpen", "tom", "hiTom",
    "floorTom", "crash", "cowbell",
  ];

  useEffect(() => {
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
      localStorage.clear();
      await signOut();
      route("/login");
    } catch (error) {
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleSaveInstruments = async () => {
    try {
      setIsSaving(true);
      setError(null);
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

  const LoadingSpinner = () => (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Settings</h1>

      {/* Drum Kit Section */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="music_note" size="text-xl" className="text-primary" />
          Drum Kit
        </h2>

        {isLoading ? <LoadingSpinner /> : (
          <>
            <p className="text-sm text-on-surface-dim mb-3">
              Customize your drum kit. Changes apply to new beats.
            </p>

            <div className="bg-surface-light rounded-lg p-3 mb-3">
              <p className="text-xs text-on-surface-dim mb-2">
                Drag to reorder instruments
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
                  <ul className="mb-3">
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

              <div className="flex gap-2">
                <select
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface flex-1 min-w-0"
                >
                  <option value="">Add instrument...</option>
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
                  disabled={!newInstrument || instruments.includes(newInstrument)}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                {saveSuccess && <span className="text-success">Saved!</span>}
                {error && <span className="text-danger">{error}</span>}
              </div>
              <button
                onClick={handleSaveInstruments}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Playback Section */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="play_circle" size="text-xl" className="text-primary" />
          Playback
        </h2>

        {isLoading ? <LoadingSpinner /> : (
          <>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={playbackSettings.countIn}
                  onChange={(e) => handlePlaybackSettingsChange('countIn', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 text-primary focus:ring-primary bg-surface-light"
                />
                <div>
                  <span className="text-sm text-on-surface">Count-in before playing</span>
                  <p className="text-xs text-on-surface-dim mt-0.5">
                    Play a one-bar count-in before the track starts.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={playbackSettings.loopPlayback}
                  onChange={(e) => handlePlaybackSettingsChange('loopPlayback', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 text-primary focus:ring-primary bg-surface-light"
                />
                <div>
                  <span className="text-sm text-on-surface">Loop playback</span>
                  <p className="text-xs text-on-surface-dim mt-0.5">
                    Continue playing from the beginning when the track ends.
                  </p>
                </div>
              </label>
            </div>
          </>
        )}
      </section>

      {/* API Keys Section */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="key" size="text-xl" className="text-primary" />
          API Keys
        </h2>

        {isLoading ? <LoadingSpinner /> : (
          <>
            <p className="text-sm text-on-surface-dim mb-3">
              Configure API keys for AI-powered features.
            </p>

            <div className="space-y-3 mb-3">
              <div>
                <label htmlFor="openai-key" className="block text-sm text-on-surface-dim mb-1">
                  OpenAI API Key
                </label>
                <div className="flex gap-2">
                  <input
                    id="openai-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={apiKeys.openaiKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, openaiKey: e.target.value })}
                    placeholder="sk-..."
                    className="flex-1 min-w-0 px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm font-mono placeholder-on-surface-dim/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface-dim hover:text-on-surface shrink-0"
                  >
                    <Icon name={showOpenaiKey ? 'visibility_off' : 'visibility'} size="text-lg" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="anthropic-key" className="block text-sm text-on-surface-dim mb-1">
                  Anthropic API Key
                </label>
                <div className="flex gap-2">
                  <input
                    id="anthropic-key"
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={apiKeys.anthropicKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, anthropicKey: e.target.value })}
                    placeholder="sk-ant-..."
                    className="flex-1 min-w-0 px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm font-mono placeholder-on-surface-dim/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface-dim hover:text-on-surface shrink-0"
                  >
                    <Icon name={showAnthropicKey ? 'visibility_off' : 'visibility'} size="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                {apiKeysSaveSuccess && <span className="text-success">Saved!</span>}
                {error && <span className="text-danger">{error}</span>}
              </div>
              <button
                onClick={handleSaveApiKeys}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                disabled={apiKeysSaving}
              >
                {apiKeysSaving ? 'Saving...' : 'Save Keys'}
              </button>
            </div>

            <p className="text-xs text-on-surface-dim mt-2">
              Keys are stored in your account and never shared.
            </p>
          </>
        )}
      </section>

      {/* Help Link */}
      <a
        href="/help"
        className="flex items-center justify-between bg-surface rounded-xl p-4 mb-4 hover:bg-surface-light transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="help" size="text-xl" className="text-primary" />
          <span className="text-on-surface font-medium">Help & Support</span>
        </div>
        <Icon name="chevron_right" size="text-xl" className="text-on-surface-dim" />
      </a>

      {/* Account / Danger Zone */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="person" size="text-xl" className="text-primary" />
          Account
        </h2>

        <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-danger mb-1">Danger Zone</h3>
          <p className="text-xs text-danger/80 mb-3">
            Once you delete your account, there is no going back.
          </p>
          <button
            onClick={openDeleteModal}
            className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-500 active:scale-95 transition-all"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Sign Out */}
      <button
        onClick={() => { signOut(); route('/login'); }}
        className="w-full py-3 bg-surface rounded-xl text-on-surface-dim text-sm font-medium hover:bg-surface-light transition-colors mb-4"
      >
        Sign Out
      </button>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-danger mb-3">
              {deleteStep === 1 ? "Delete Account" : "Final Confirmation"}
            </h3>

            {deleteStep === 1 ? (
              <>
                <p className="text-sm text-on-surface-dim mb-4">
                  This action is permanent and cannot be undone. All your beats and settings will be lost.
                </p>
                <p className="text-sm text-on-surface mb-2">
                  Type "delete" to confirm:
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-on-surface-dim mb-4">
                  <strong className="text-danger">Final warning:</strong> You are about to permanently delete your account and all associated data.
                </p>
                <p className="text-sm text-on-surface mb-2">
                  Type "confirm delete" to proceed:
                </p>
              </>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-danger mb-3"
              placeholder={deleteStep === 1 ? "Type 'delete'" : "Type 'confirm delete'"}
              disabled={isDeleting}
            />

            {error && <p className="text-danger text-xs mb-3">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 bg-surface-light text-on-surface rounded-lg text-sm hover:bg-white/10"
              >
                Cancel
              </button>

              {deleteStep === 1 ? (
                <button
                  onClick={proceedToFinalConfirmation}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
