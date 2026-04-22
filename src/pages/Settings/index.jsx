import { useState, useEffect, useRef } from "preact/hooks";
import { tabStorage } from "../../services/storage";
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
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importExportMsg, setImportExportMsg] = useState(null);
  const fileInputRef = useRef(null);
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
        setInstruments(savedInstruments);
        setPlaybackSettings(savedPlaybackSettings);
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

  const handleExport = async () => {
    setIsExporting(true);
    setImportExportMsg(null);
    try {
      const tabs = await tabStorage.getTabs();
      const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tabs }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drum-dabber-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setImportExportMsg({ type: 'success', text: `Exported ${tabs.length} beat${tabs.length !== 1 ? 's' : ''}.` });
    } catch (err) {
      console.error('Export failed:', err);
      setImportExportMsg({ type: 'error', text: 'Export failed. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsImporting(true);
    setImportExportMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const tabs = data.tabs || data;
      if (!Array.isArray(tabs)) throw new Error('Invalid format');
      let imported = 0;
      for (const tab of tabs) {
        const { id, user_id, created, modified, ...rest } = tab;
        await tabStorage.saveTab(rest);
        imported++;
      }
      setImportExportMsg({ type: 'success', text: `Imported ${imported} beat${imported !== 1 ? 's' : ''}.` });
    } catch (err) {
      console.error('Import failed:', err);
      setImportExportMsg({ type: 'error', text: 'Import failed. Check that the file is a valid export.' });
    } finally {
      setIsImporting(false);
    }
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

      {/* Export / Import Section */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="swap_vert" size="text-xl" className="text-primary" />
          Export / Import Beats
        </h2>
        <p className="text-sm text-on-surface-dim mb-3">
          Export all your beats as a JSON file, or import from a previous export.
        </p>

        {importExportMsg && (
          <div className={`text-sm mb-3 ${importExportMsg.type === 'success' ? 'text-success' : 'text-danger'}`}>
            {importExportMsg.text}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icon name="download" size="text-lg" />
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 px-4 py-2.5 bg-surface-light border border-white/10 text-on-surface rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icon name="upload" size="text-lg" />
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </section>

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

    </div>
  );
}
