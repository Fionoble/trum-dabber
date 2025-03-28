import { useState, useEffect, useRef } from "preact/hooks";
import { DrumMachine } from "../../utils/drumMachine";
import { useLocation } from "preact-iso";
import { isAuthenticated, isLoading } from "../../services/auth";
import "./styles.scss";
import { tabStorage } from "../../services/storage";
import PlayIcon from "../../assets/icons/Play.svg.jsx";
import StopIcon from "../../assets/icons/Stop.svg.jsx";
import SaveIcon from "../../assets/icons/Save.svg.jsx";
import SpinnerIcon from "../../assets/icons/Spinner.svg.jsx";
import PlusIcon from "../../assets/icons/Plus.svg.jsx";
import MinusIcon from "../../assets/icons/Minus.svg.jsx";
import ChevronDownIcon from "../../assets/icons/ChevronDown.svg.jsx";

const MAX_BAR_COUNT = 25;

export default function Editor({ id, newTab }) {
  // Define drum sounds and pattern
  const drumSounds = ["hihat", "tom", "snare", "crash", "kick"];

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
  const [subdivision, setSubdivision] = useState(4); // Default: 16th notes (4 subdivisions per beat)

  // Time signature and bars
  const [timeSignature, setTimeSignature] = useState({
    numerator: 4,
    denominator: 4,
  });
  const [bars, setBars] = useState(1);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const calculateTotalSteps = () => {
    const num = Number(timeSignature.numerator) || 4;
    const sub = Number(subdivision) || 4;
    const barCount = Number(bars) || 1;
    return num * sub * barCount;
  };

  const [totalSteps, setTotalSteps] = useState(calculateTotalSteps());

  const createEmptyPattern = (steps) => {
    // Make sure steps is a positive integer
    const validSteps = Math.max(1, Math.floor(Number(steps) || 1));
    return drumSounds.map(() => Array(validSteps).fill(false));
  };

  const [pattern, setPattern] = useState(createEmptyPattern(totalSteps));

  // Refs
  const drumMachineRef = useRef(null);
  const intervalRef = useRef(null);
  const nameInputRef = useRef(null);

  const { route } = useLocation();

  // Initialize drum machine and load tab if exists
  useEffect(async () => {
    const initDrumMachine = async () => {
      drumMachineRef.current = new DrumMachine();
      await drumMachineRef.current.loadSamples();
      setIsLoaded(true);
    };

    initDrumMachine();

    if (newTab) {
      // Handle new tab creation with defaults
      setTabName("New Beat");
      setTabId(null);
      setBpm(120);
      setTimeSignature({ numerator: 4, denominator: 4 });
      setBars(1);
      setSubdivision(4);
      setTotalSteps(calculateTotalSteps());
      setPattern(createEmptyPattern(calculateTotalSteps()));
    } else if (id) {
      if (!isLoading.value) {
        if (isAuthenticated.value) {
          loadTab(id);
        } else {
          route("/login?redirect=" + encodeURIComponent(location.pathname));
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
  }, [isLoading.value, isAuthenticated.value]);

  // Update total steps when time signature, bars, or subdivision change
  useEffect(() => {
    const newTotalSteps = calculateTotalSteps();

    if (newTotalSteps !== totalSteps) {
      setTotalSteps(newTotalSteps);

      // Resize the pattern to match the new step count
      resizePattern(newTotalSteps);
    }
  }, [timeSignature, bars, subdivision]);

  const loadTab = async (tabId) => {
    try {
      const tab = await tabStorage.getTab(tabId);
      if (tab) {
        setTabId(tab.id);
        setTabName(tab.name);
        setBpm(tab.bpm || 120);
        setTimeSignature({
          numerator: tab.tsNumerator || 4,
          denominator: tab.tsDenominator || 4,
        });

        if (tab.measures) {
          setBars(tab.measures);
        }

        const steps =
          (tab.tsNumerator || 4) * (tab.subdivision || 4) * (tab.measures || 1);
        setTotalSteps(steps);

        // Load pattern
        if (tab.tracks && tab.tracks[0]?.pattern?.length === steps) {
          setPattern(tab.tracks.map((track) => track.pattern));
        } else {
          // Handle case where time signature changed but pattern doesn't match
          setPattern(createEmptyPattern(steps));
        }
      } else {
        route("/editor/new");
      }
    } catch (error) {
      console.error("Error loading tab:", error);
    }
  };

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

  const handleSubdivisionChange = (newSubdivision) => {
    // Store current pattern to preserve existing beats
    const currentPattern = [...pattern];

    // Calculate new total steps based on new subdivision
    const beatsPerBar = timeSignature.numerator;
    const oldSubdivisionsPerBeat = subdivision;
    const newSubdivisionsPerBeat = newSubdivision;

    const oldTotalSteps = beatsPerBar * oldSubdivisionsPerBeat * bars;
    const newTotalSteps = beatsPerBar * newSubdivisionsPerBeat * bars;

    // Create new pattern with adjusted size
    const newPattern = drumSounds.map((_, rowIndex) => {
      const newRow = Array(newTotalSteps).fill(false);

      // Map old beats to new positions
      if (newSubdivisionsPerBeat > oldSubdivisionsPerBeat) {
        // Expanding: spread existing beats out
        const ratio = newSubdivisionsPerBeat / oldSubdivisionsPerBeat;

        for (let i = 0; i < oldTotalSteps; i++) {
          if (currentPattern[rowIndex][i]) {
            newRow[Math.floor(i * ratio)] = true;
          }
        }
      } else {
        // Contracting: combine beats (with potential data loss)
        const ratio = oldSubdivisionsPerBeat / newSubdivisionsPerBeat;

        for (let i = 0; i < oldTotalSteps; i++) {
          if (currentPattern[rowIndex][i]) {
            const newIndex = Math.floor(i / ratio);
            if (newIndex < newTotalSteps) {
              newRow[newIndex] = true;
            }
          }
        }
      }

      return newRow;
    });

    // Update state
    setSubdivision(newSubdivision);
    setTotalSteps(newTotalSteps);
    setPattern(newPattern);

    // If playing, restart to avoid issues
    if (isPlaying) {
      togglePlayback();
      setCurrentStep(-1);
    }

    // Save if tab exists
    if (tabId) {
      saveTab(false);
    }
  };

  // Handlers
  //
  const handleCellClick = (row, col) => {
    const newPattern = [...pattern];
    newPattern[row][col] = !newPattern[row][col];
    setPattern(newPattern);

    // Play the sound when activating a cell
    if (newPattern[row][col] && drumMachineRef.current) {
      drumMachineRef.current.playSound(drumSounds[row]);
    }
  };

  const handleNameChange = (e) => {
    setTabName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsNameFocused(false);
    if (tabId) {
      saveTab(false); // Silent save (no notification)
    }
  };

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
    stopPlaybackIfPlaying();
    if (tabId) saveTab(false); // Silent save
  };

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

    if (tabId) saveTab(false); // Silent save
  };

  const handleBarCountChange = (change) => {
    let newBarCount = bars + change;
    if (newBarCount < 1) {
      newBarCount = 1;
    } else if (newBarCount > MAX_BAR_COUNT) {
      newBarCount = MAX_BAR_COUNT;
    }
    setBars(newBarCount);
    if (tabId) saveTab(false); //Silent save
  };

  const stopPlaybackIfPlaying = () => {
    if (isPlaying) togglePlayback();
  };

  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setCurrentStep(-1);
      if (drumMachineRef.current) {
        drumMachineRef.current.stop();
      }
      setIsPlaying(false);
    } else {
      // Calculate step time based on BPM, time signature, and subdivision
      const quarterNoteTime = (60 * 1000) / bpm;
      const stepTime = quarterNoteTime / subdivision;

      let step = 0;
      const totalPatternSteps = calculateTotalSteps();

      intervalRef.current = setInterval(() => {
        setCurrentStep(step);

        // Play sounds for current step
        pattern.forEach((row, rowIndex) => {
          if (row[step] && drumMachineRef.current) {
            drumMachineRef.current.playSound(drumSounds[rowIndex]);
          }
        });

        step = (step + 1) % totalPatternSteps;

        // Scroll to the bar containing the current step if needed
        const stepsPerBar = timeSignature.numerator * subdivision;
        const currentBarIndex = Math.floor(step / stepsPerBar);

        // Only scroll on larger screens where bars are arranged vertically
        if (window.innerWidth >= 768) {
          const barElement = document.querySelector(
            `.bar-section:nth-child(${currentBarIndex + 1})`,
          );
          if (barElement && step % stepsPerBar === 0) {
            barElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
      }, stepTime);

      setIsPlaying(true);
    }
  };

  const saveTab = async (showNotification = true) => {
    if (!isAuthenticated.value) {
      // Redirect to login if not authenticated
      route("/login?redirect=" + encodeURIComponent(location.pathname));
      return;
    }

    if (showNotification) {
      setIsSaving(true);
      setSaveSuccess(false);
    }

    try {
      const tab = {
        id: tabId,
        name: tabName || "Untitled Beat",
        bpm,
        tsNumerator: timeSignature.numerator,
        tsDenominator: timeSignature.denominator,
        measures: bars,
        subdivision,
        tracks: pattern.map((patternRow, index) => ({
          id: `track-${index + 1}`,
          name: drumSounds[index],
          sound: drumSounds[index],
          pattern: patternRow,
        })),
        stepsPerMeasure: timeSignature.numerator * subdivision,
        volume: 0.7,
      };

      const savedId = await tabStorage.saveTab(tab);

      if (savedId) {
        setTabId(savedId);

        // Update URL if it's a new tab
        if (!tabId) {
          window.history.replaceState(null, "", `/editor/${savedId}`);
          route(`/editor/${savedId}`);
        }

        if (showNotification) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error("Error saving tab:", error);
      // You could add an error state here to show the user
      // setError("Failed to save beat. Please try again.");
    } finally {
      if (showNotification) {
        setIsSaving(false);
      }
    }
  };

  if (id && isLoading.value) {
    return (
      <div className="text-center py-8">
        <div className="spinner mb-4"></div>
        <p>Loading...</p>
      </div>
    );
  }

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
                <SpinnerIcon />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon />
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
              <StopIcon />
              Stop
            </>
          ) : (
            <>
              <PlayIcon />
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
              <MinusIcon />
            </button>
            <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[30px] text-center">
              {bars}
            </span>
            <button
              onClick={() => handleBarCountChange(1)}
              disabled={bars >= MAX_BAR_COUNT}
              className="px-2 py-1 hover:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="ml-auto text-gray-600 hover:text-indigo-600 flex items-center gap-1 text-sm"
        >
          {showAdvancedControls ? "Hide" : "Show"} Advanced Controls
          <span className={`transition-transform ${showAdvancedControls ? "rotate-180" : ""} inline-block`}>
            <ChevronDownIcon />
          </span>
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

            {/* Note Resolution Control */}
            <div className="subdivision-control flex items-center gap-2">
              <label className="text-sm text-gray-600">Note Resolution:</label>
              <div className="flex">
                <select
                  value={subdivision}
                  onChange={(e) =>
                    handleSubdivisionChange(parseInt(e.target.value))
                  }
                  className="p-1 border border-gray-300 rounded-md"
                >
                  <option value="2">8th Notes</option>
                  <option value="4">16th Notes</option>
                  <option value="8">32nd Notes</option>
                </select>
              </div>
              <span className="text-xs text-gray-500">
                {subdivision === 2
                  ? "8th"
                  : subdivision === 4
                    ? "16th"
                    : "32nd"}{" "}
                notes
              </span>
            </div>

            <div className="text-xs text-gray-500 mt-1 col-span-full">
              Note: Changing time signature, bar count, or note resolution will
              resize your pattern. Existing beats will be preserved when
              possible.
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

      {/* Drum grid with bar-based layout */}
      {isLoaded && (
        <div className="sequencer">
          {/* Bars container - vertical wrapping happens here */}
          <div className="bars-container">
            {Array(bars)
              .fill(0)
              .map((_, barIndex) => {
                // Calculate step range for this bar
                const stepsPerBar = timeSignature.numerator * subdivision;
                const startStep = barIndex * stepsPerBar;
                const endStep = startStep + stepsPerBar;

                return (
                  <div key={barIndex} className="bar-section">
                    {/* Bar number indicator */}
                    <div className="bar-number">{barIndex + 1}</div>

                    {/* Beat markers for this bar */}
                    <div className="measure-indicators">
                      <div className="beat-markers">
                        {Array(timeSignature.numerator)
                          .fill(0)
                          .map((_, beatIndex) => (
                            <div key={beatIndex} className="beat-marker-group">
                              {Array(subdivision)
                                .fill(0)
                                .map((_, subIndex) => {
                                  const step =
                                    beatIndex * subdivision + subIndex;
                                  // Determine what type of marker to display
                                  const isMainBeat = subIndex === 0;
                                  const isEighthNote =
                                    subdivision >= 2 &&
                                    subIndex % (subdivision / 2) === 0;
                                  const isSixteenthNote =
                                    subdivision >= 4 &&
                                    subIndex % (subdivision / 4) === 0;

                                  return (
                                    <div
                                      key={step}
                                      className={`step-marker
                                        ${isMainBeat ? "beat-marker" : ""}
                                        ${!isMainBeat && isEighthNote ? "eighth-marker" : ""}
                                        ${!isMainBeat && !isEighthNote && isSixteenthNote ? "sixteenth-marker" : ""}`}
                                    >
                                      {isMainBeat ? beatIndex + 1 : ""}
                                    </div>
                                  );
                                })}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Drum rows for this bar */}
                    <div className="drum-rows-container">
                      {pattern.map((row, rowIndex) => (
                        <div key={rowIndex} className="drum-row">
                          {/* Instrument name - show only in first bar or on smaller screens */}
                          {barIndex === 0 ? (
                            <div className="drum-name">
                              {drumSounds[rowIndex]}
                            </div>
                          ) : null}
                          {/* Grid cells for this bar */}
                          <div
                            className={`drum-grid resolution-${subdivision}`}
                            style={{
                              width: `${timeSignature.numerator * subdivision * 29}px`,
                            }}
                          >
                            {row
                              .slice(startStep, endStep)
                              .map((cell, cellIndex) => {
                                const globalColIndex = startStep + cellIndex;
                                const isBeatStart = cellIndex % 4 === 0;

                                return (
                                  <button
                                    key={cellIndex}
                                    className={`drum-cell
                                    ${cell ? "active" : ""}
                                    ${currentStep === globalColIndex ? "playing" : ""}
                                    ${isBeatStart ? "beat-start" : ""}
                                    ${cellIndex === 0 ? "bar-start" : ""}
                                  `}
                                    onClick={() =>
                                      handleCellClick(rowIndex, globalColIndex)
                                    }
                                    aria-label={`${drumSounds[rowIndex]} bar ${barIndex + 1}, step ${cellIndex + 1}`}
                                  />
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
