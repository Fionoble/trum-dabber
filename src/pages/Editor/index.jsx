import { useState, useEffect, useRef } from "preact/hooks";
import { DrumMachine } from "../../utils/drumMachine";
import { useLocation } from "preact-iso";
import "./styles.scss";
import { tabStorage } from "../../services/storage";

export default function Editor() {
  // Define drum sounds and pattern
  const drumSounds = ["kick", "snare", "hihat", "tom", "clap"];
  const steps = 16;

  // Create initial empty pattern
  const initialPattern = drumSounds.map(() => Array(steps).fill(false));

  // States
  const [pattern, setPattern] = useState(initialPattern);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabName, setTabName] = useState("New Beat");
  const [tabId, setTabId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

  // Refs
  const drumMachineRef = useRef(null);
  const intervalRef = useRef(null);
  const nameInputRef = useRef(null);
  const location = useLocation();

  // Initialize drum machine and load tab if exists
  useEffect(() => {
    const initDrumMachine = async () => {
      drumMachineRef.current = new DrumMachine();
      await drumMachineRef.current.loadSamples();
      setIsLoaded(true);
    };

    initDrumMachine();

    // Check if we're editing an existing tab or creating a new one
    const hash = location.url.split("#")[1] || "";
    if (hash && hash !== "new") {
      const tab = tabStorage.getTab(hash);
      if (tab) {
        setTabId(tab.id);
        setTabName(tab.name);
        setBpm(tab.bpm || 120);
        setPattern(tab.tracks.map((track) => track.pattern));
      }
    }

    // Cleanup on component unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (drumMachineRef.current) {
        drumMachineRef.current.stop();
      }
    };
  }, []);

  // Handle cell click
  const handleCellClick = (row, col) => {
    const newPattern = [...pattern];
    newPattern[row][col] = !newPattern[row][col];
    setPattern(newPattern);

    // Play the sound when activating a cell
    if (newPattern[row][col] && drumMachineRef.current) {
      drumMachineRef.current.playSound(drumSounds[row]);
    }
  };

  // Play/pause the pattern
  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setCurrentStep(-1);
      if (drumMachineRef.current) {
        drumMachineRef.current.stop();
      }
    } else {
      const stepTime = (60 * 1000) / bpm / 4; // 16th notes
      let step = 0;

      intervalRef.current = setInterval(() => {
        setCurrentStep(step);

        // Play sounds for current step
        pattern.forEach((row, rowIndex) => {
          if (row[step] && drumMachineRef.current) {
            drumMachineRef.current.playSound(drumSounds[rowIndex]);
          }
        });

        step = (step + 1) % steps;
      }, stepTime);
    }

    setIsPlaying(!isPlaying);
  };

  // Handle tab name change
  const handleNameChange = (e) => {
    setTabName(e.target.value);
  };

  // Handle name input blur (save when user stops editing)
  const handleNameBlur = () => {
    setIsNameFocused(false);
    if (tabId) {
      saveTab(false); // Silent save (no notification)
    }
  };

  // Handle BPM change with input validation
  const handleBpmChange = (e) => {
    let newBpm = parseInt(e.target.value);

    // Validate BPM range
    if (isNaN(newBpm)) {
      newBpm = 120;
    } else if (newBpm < 40) {
      newBpm = 40;
    } else if (newBpm > 240) {
      newBpm = 240;
    }

    setBpm(newBpm);

    // Update playback if currently playing
    if (isPlaying) {
      clearInterval(intervalRef.current);
      const stepTime = (60 * 1000) / newBpm / 4;
      let step = currentStep;

      intervalRef.current = setInterval(() => {
        step = (step + 1) % steps;
        setCurrentStep(step);

        pattern.forEach((row, rowIndex) => {
          if (row[step] && drumMachineRef.current) {
            drumMachineRef.current.playSound(drumSounds[rowIndex]);
          }
        });
      }, stepTime);
    }

    // Save BPM if tab exists
    if (tabId) {
      saveTab(false); // Silent save (no notification)
    }
  };

  // BPM slider change handler
  const handleBpmSliderChange = (e) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);

    // Don't restart playback during slider adjustment
    // Only save when slider interaction is complete
  };

  // BPM slider change complete handler
  const handleBpmSliderChangeComplete = () => {
    // Restart playback with new tempo if currently playing
    if (isPlaying) {
      clearInterval(intervalRef.current);
      const stepTime = (60 * 1000) / bpm / 4;
      let step = currentStep;

      intervalRef.current = setInterval(() => {
        step = (step + 1) % steps;
        setCurrentStep(step);

        pattern.forEach((row, rowIndex) => {
          if (row[step] && drumMachineRef.current) {
            drumMachineRef.current.playSound(drumSounds[rowIndex]);
          }
        });
      }, stepTime);
    }

    // Save BPM if tab exists
    if (tabId) {
      saveTab(false); // Silent save
    }
  };

  // Save the current pattern
  const saveTab = (showNotification = true) => {
    if (showNotification) {
      setIsSaving(true);
    }

    try {
      const tab = {
        id: tabId,
        name: tabName || "Untitled Beat",
        bpm,
        tracks: pattern.map((patternRow, index) => ({
          id: `track-${index + 1}`,
          name: drumSounds[index],
          sound: drumSounds[index],
          pattern: patternRow,
        })),
        measures: 1,
        stepsPerMeasure: steps,
        volume: 0.7,
      };

      const savedId = tabStorage.saveTab(tab);
      setTabId(savedId);

      // Update URL if it's a new tab
      if (!tabId) {
        window.history.replaceState(null, "", `/editor#${savedId}`);
      }

      if (showNotification) {
        setSaveSuccess(true);

        // Hide success message after 2 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving tab:", error);
    } finally {
      if (showNotification) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="editor-container p-4">
      {/* Header with title input and save button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center relative">
          <input
            ref={nameInputRef}
            type="text"
            value={tabName}
            onChange={handleNameChange}
            onFocus={() => setIsNameFocused(true)}
            onBlur={handleNameBlur}
            className={`text-2xl font-bold bg-transparent border-b-2 transition-colors px-2 py-1 min-w-[200px] focus:outline-none ${
              isNameFocused ? "border-indigo-500" : "border-gray-300"
            }`}
            placeholder="Untitled Beat"
          />
          {isNameFocused && (
            <div className="absolute -bottom-6 left-2 text-xs text-gray-500">
              Press Enter or click outside to save name
            </div>
          )}
        </div>

        <div className="flex items-center">
          {saveSuccess && (
            <span className="text-green-500 mr-3 animate-fade-out">
              Saved successfully!
            </span>
          )}
          <button
            onClick={() => saveTab(true)}
            disabled={isSaving || !isLoaded}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 active:transform active:translate-y-0.5 active:bg-opacity-90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                Saving...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="controls flex flex-wrap items-center mb-6 gap-4 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={togglePlayback}
          disabled={!isLoaded}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:transform active:translate-y-0.5 active:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {isPlaying ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="bpm" className="font-medium text-gray-700">
            BPM:
          </label>
          <input
            id="bpm-input"
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={handleBpmChange}
            className="w-16 p-1 border border-gray-300 rounded text-center"
          />
          <input
            id="bpm-slider"
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={handleBpmSliderChange}
            onMouseUp={handleBpmSliderChangeComplete}
            onTouchEnd={handleBpmSliderChangeComplete}
            className="w-36 mx-2"
          />
        </div>
      </div>

      {/* Loading state */}
      {!isLoaded && (
        <div className="text-center py-8">
          <div className="spinner mb-4"></div>
          <p>Loading drum samples...</p>
        </div>
      )}

      {/* Drum grid */}
      {isLoaded && (
        <div className="sequencer">
          {pattern.map((row, rowIndex) => (
            <div key={rowIndex} className="flex mb-2 items-center">
              <div className="drum-name w-20 text-right pr-3 font-medium">
                {drumSounds[rowIndex]}
              </div>
              <div className="drum-grid flex-1">
                {row.map((cell, colIndex) => (
                  <button
                    key={colIndex}
                    className={`drum-cell ${cell ? "active" : ""} ${currentStep === colIndex ? "playing" : ""}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    aria-label={`${drumSounds[rowIndex]} step ${colIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
