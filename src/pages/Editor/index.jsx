import { useState, useEffect, useRef } from "preact/hooks";
import { DrumMachine } from "../../utils/drumMachine";
import { useLocation } from "preact-iso";
import "./styles.scss";
import { tabStorage } from "../../services/storage";

export default function Editor() {
  // Define drum sounds and pattern
  const drumSounds = ["kick", "snare", "hihat", "tom", "clap"];

  // States
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabName, setTabName] = useState("New Beat");
  const [tabId, setTabId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // Time signature and bars
  const [timeSignature, setTimeSignature] = useState({
    numerator: 4,
    denominator: 4,
  });
  const [bars, setBars] = useState(1);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // Calculate total steps based on time signature and bars
  const calculateTotalSteps = () => {
    // In 4/4, each bar has 16 steps (4 beats × 4 subdivisions)
    // In other time signatures, we adapt accordingly
    return timeSignature.numerator * 4 * bars;
  };

  const [totalSteps, setTotalSteps] = useState(calculateTotalSteps());

  // Initialize pattern with the correct number of steps
  const createEmptyPattern = (steps) => {
    return drumSounds.map(() => Array(steps).fill(false));
  };

  const [pattern, setPattern] = useState(createEmptyPattern(totalSteps));

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

        // Load time signature and bars
        if (tab.timeSignature) {
          setTimeSignature(tab.timeSignature);
        }
        if (tab.measures) {
          setBars(tab.measures);
        }

        // Calculate total steps based on loaded values
        const steps =
          (tab.timeSignature?.numerator || 4) * 4 * (tab.measures || 1);
        setTotalSteps(steps);

        // Load pattern, or create a new one with the right size if pattern doesn't match
        if (tab.tracks && tab.tracks[0]?.pattern?.length === steps) {
          setPattern(tab.tracks.map((track) => track.pattern));
        } else {
          // Handle case where time signature changed but pattern doesn't match
          setPattern(createEmptyPattern(steps));
        }
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

  // Update total steps when time signature or bars change
  useEffect(() => {
    const newTotalSteps = calculateTotalSteps();

    if (newTotalSteps !== totalSteps) {
      setTotalSteps(newTotalSteps);

      // Resize the pattern to match the new step count
      resizePattern(newTotalSteps);
    }
  }, [timeSignature, bars]);

  // Resize pattern when total steps change (preserving existing data)
  const resizePattern = (newStepCount) => {
    const newPattern = pattern.map((row) => {
      if (row.length < newStepCount) {
        // Add new empty steps
        return [...row, ...Array(newStepCount - row.length).fill(false)];
      } else if (row.length > newStepCount) {
        // Remove excess steps
        return row.slice(0, newStepCount);
      }
      return row;
    });

    setPattern(newPattern);

    // If playing, restart to avoid issues
    if (isPlaying) {
      togglePlayback();
      setCurrentStep(-1);
    }
  };

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
      // Calculate step time based on BPM and time signature
      // Base calculation on quarter notes
      const quarterNoteTime = (60 * 1000) / bpm;
      const sixteenthNoteTime = quarterNoteTime / 4;

      let step = 0;

      intervalRef.current = setInterval(() => {
        setCurrentStep(step);

        // Play sounds for current step
        pattern.forEach((row, rowIndex) => {
          if (row[step] && drumMachineRef.current) {
            drumMachineRef.current.playSound(drumSounds[rowIndex]);
          }
        });

        step = (step + 1) % totalSteps;
      }, sixteenthNoteTime);
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
    updatePlaybackIfNeeded();

    // Save BPM if tab exists
    if (tabId) {
      saveTab(false); // Silent save (no notification)
    }
  };

  // BPM slider change handler
  const handleBpmSliderChange = (e) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);
  };

  // BPM slider change complete handler
  const handleBpmSliderChangeComplete = () => {
    // Update playback if needed
    updatePlaybackIfNeeded();

    // Save BPM if tab exists
    if (tabId) {
      saveTab(false); // Silent save
    }
  };

  // Handles time signature changes
  const handleTimeSignatureChange = (type, value) => {
    let newValue = parseInt(value);

    if (type === "numerator") {
      // Validate numerator (typically 2-15)
      if (isNaN(newValue) || newValue < 1) {
        newValue = 4;
      } else if (newValue > 15) {
        newValue = 15;
      }

      setTimeSignature({
        ...timeSignature,
        numerator: newValue,
      });
    } else if (type === "denominator") {
      // Denominator is typically 2, 4, 8, or 16
      const validDenominators = [2, 4, 8, 16];
      if (!validDenominators.includes(newValue)) {
        newValue = 4;
      }

      setTimeSignature({
        ...timeSignature,
        denominator: newValue,
      });
    }

    // Save if tab exists
    if (tabId) {
      saveTab(false);
    }
  };

  // Handle bar count changes
  const handleBarCountChange = (change) => {
    let newBarCount = bars + change;

    // Validate bar count (1-8)
    if (newBarCount < 1) {
      newBarCount = 1;
    } else if (newBarCount > 8) {
      newBarCount = 8;
    }

    setBars(newBarCount);

    // Save if tab exists
    if (tabId) {
      saveTab(false);
    }
  };

  // Update playback if currently playing
  const updatePlaybackIfNeeded = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);

      const quarterNoteTime = (60 * 1000) / bpm;
      const sixteenthNoteTime = quarterNoteTime / 4;

      let step = currentStep;

      intervalRef.current = setInterval(() => {
        step = (step + 1) % totalSteps;
        setCurrentStep(step);

        pattern.forEach((row, rowIndex) => {
          if (row[step] && drumMachineRef.current) {
            drumMachineRef.current.playSound(drumSounds[rowIndex]);
          }
        });
      }, sixteenthNoteTime);
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
        timeSignature,
        measures: bars,
        tracks: pattern.map((patternRow, index) => ({
          id: `track-${index + 1}`,
          name: drumSounds[index],
          sound: drumSounds[index],
          pattern: patternRow,
        })),
        stepsPerMeasure: timeSignature.numerator * 4,
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

  // Get bar markers for the drum grid
  const getBarMarkers = () => {
    const markers = [];
    const stepsPerBar = timeSignature.numerator * 4;

    for (let i = 0; i < bars; i++) {
      markers.push(i * stepsPerBar);
    }

    return markers;
  };

  // Render grid for a single measure with beat indicators
  const renderMeasureIndicators = () => {
    const stepsPerBar = timeSignature.numerator * 4;
    const beatMarkers = [];

    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < timeSignature.numerator; beat++) {
        // Each beat has 4 subdivisions (16th notes)
        for (let subdivision = 0; subdivision < 4; subdivision++) {
          const step = bar * stepsPerBar + beat * 4 + subdivision;
          let label = "";
          let className = "step-marker";

          if (subdivision === 0) {
            // First subdivision of each beat
            label = (beat + 1).toString();
            className += " beat-marker";

            if (beat === 0 && bar > 0) {
              // First beat of bars after the first one
              className += " bar-start";
            } else if (beat === 0 && bar === 0) {
              // First beat of the first bar
              className += " first-bar";
            }
          }

          beatMarkers.push(
            <div key={step} className={className}>
              {label}
            </div>,
          );
        }
      }
    }

    return (
      <div className="measure-indicators">
        <div className="beat-markers">{beatMarkers}</div>
      </div>
    );
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

      {/* Basic Controls */}
      <div className="controls flex flex-wrap items-center mb-4 gap-4 p-4 bg-gray-50 rounded-lg">
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
          <label htmlFor="bpm-input" className="font-medium text-gray-700">
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

        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="ml-auto text-gray-600 hover:text-indigo-600 flex items-center gap-1 text-sm"
        >
          {showAdvancedControls ? "Hide" : "Show"} Advanced Controls
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${showAdvancedControls ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Advanced Controls - Time Signature and Bars */}
      {showAdvancedControls && (
        <div className="advanced-controls mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Advanced Controls
          </h3>

          <div className="flex flex-wrap gap-6">
            {/* Time Signature Controls */}
            <div className="time-signature flex items-center gap-2">
              <label className="text-sm text-gray-600">Time Signature:</label>
              <div className="flex">
                <select
                  value={timeSignature.numerator}
                  onChange={(e) =>
                    handleTimeSignatureChange("numerator", e.target.value)
                  }
                  className="p-1 border border-gray-300 rounded-l-md w-12 text-center"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 12].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <span className="flex items-center justify-center border-t border-b border-gray-300 px-2 bg-gray-50">
                  /
                </span>
                <select
                  value={timeSignature.denominator}
                  onChange={(e) =>
                    handleTimeSignatureChange("denominator", e.target.value)
                  }
                  className="p-1 border border-gray-300 rounded-r-md w-12 text-center"
                >
                  {[2, 4, 8, 16].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bar Count Controls */}
            <div className="bars-control flex items-center gap-2">
              <label className="text-sm text-gray-600">Bars:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleBarCountChange(-1)}
                  disabled={bars <= 1}
                  className="px-2 py-1 hover:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[30px] text-center">
                  {bars}
                </span>
                <button
                  onClick={() => handleBarCountChange(1)}
                  disabled={bars >= 8}
                  className="px-2 py-1 hover:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-1 col-span-full">
              Note: Changing time signature or bar count will resize your
              pattern. Existing beats will be preserved when possible.
            </div>
          </div>
        </div>
      )}

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
          {/* Beat markers */}
          {renderMeasureIndicators()}

          {/* Drum rows */}
          {pattern.map((row, rowIndex) => (
            <div key={rowIndex} className="flex mb-2 items-center">
              <div className="drum-name w-20 text-right pr-3 font-medium">
                {drumSounds[rowIndex]}
              </div>
              <div className="drum-grid flex-1 relative">
                {row.map((cell, colIndex) => {
                  // Determine if this cell is the first in a bar
                  const stepsPerBar = timeSignature.numerator * 4;
                  const isBarStart = colIndex % stepsPerBar === 0;
                  const isFirstBar = colIndex === 0;

                  // Determine beat within measure
                  const beatInMeasure =
                    Math.floor((colIndex % stepsPerBar) / 4) + 1;
                  const isBeatStart = colIndex % 4 === 0;

                  return (
                    <button
                      key={colIndex}
                      className={`drum-cell
                        ${cell ? "active" : ""}
                        ${currentStep === colIndex ? "playing" : ""}
                        ${isBarStart ? "bar-start" : ""}
                        ${isFirstBar ? "first-bar" : ""}
                        ${isBeatStart ? "beat-start" : ""}
                      `}
                      data-beat={isBeatStart ? beatInMeasure : ""}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      aria-label={`${drumSounds[rowIndex]} step ${colIndex + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
