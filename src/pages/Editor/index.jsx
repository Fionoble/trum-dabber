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
import DuplicateIcon from "../../assets/icons/Duplicate.svg.jsx";
import EyeIcon from "../../assets/icons/Eye.svg.jsx";
import EyeOffIcon from "../../assets/icons/EyeOff.svg.jsx";
import SoloIcon from "../../assets/icons/Solo.svg.jsx";
import GridIcon from "../../assets/icons/Grid.svg.jsx";
import CloseIcon from "../../assets/icons/Close.svg.jsx";
import InstrumentIcons from "../../assets/icons/instruments";

const MAX_BAR_COUNT = 25;
const SUBDIVISION = 8;

export default function Editor({ id, newTab }) {
  // Define drum sounds and pattern
  const defaultDrumSounds = ["hihat", "hiTom", "snare", "crash", "kick", "floorTom"];
  const [drumSounds, setDrumSounds] = useState(defaultDrumSounds);
  
  // Instrument visibility state
  const [hiddenTracks, setHiddenTracks] = useState({});
  const [trackContextMenu, setTrackContextMenu] = useState({ visible: false, trackIndex: null, x: 0, y: 0 });
  
  // Define special tracks that can have multiple states
  // This is dynamically calculated based on the current instrument order
  const [specialTracks, setSpecialTracks] = useState({});
  
  // Update special tracks when instrument order changes
  useEffect(() => {
    // Find the index of the hihat in the current instrument order
    const hihatIndex = drumSounds.indexOf("hihat");
    
    if (hihatIndex !== -1) {
      setSpecialTracks({
        [hihatIndex]: { // hihat track index - dynamically determined
          states: [false, "hihat", "hihatOpen"],
          nextState: {
            false: "hihat",
            "hihat": "hihatOpen",
            "hihatOpen": false
          }
        }
      });
    } else {
      setSpecialTracks({});
    }
  }, [drumSounds]);

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

  const calculateTotalSteps = () => {
    const num = Number(timeSignature.numerator) || 4;
    const barCount = Number(bars) || 1;
    return num * SUBDIVISION * barCount;
  };

  const [totalSteps, setTotalSteps] = useState(calculateTotalSteps());

  const createEmptyPattern = (steps) => {
    // Make sure steps is a positive integer
    const validSteps = Math.max(1, Math.floor(Number(steps) || 1));
    return drumSounds.map((sound, index) => {
      // For special tracks with multiple states, we need to store string values
      if (specialTracks[index]) {
        return Array(validSteps).fill(false);
      }
      return Array(validSteps).fill(false);
    });
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
    
    // Load user's configured instruments
    const loadInstruments = async () => {
      try {
        const savedInstruments = await tabStorage.getUserInstruments();
        setDrumSounds(savedInstruments);
      } catch (error) {
        console.error("Error loading instruments:", error);
        // Use default instruments if there's an error
        setDrumSounds(defaultDrumSounds);
      }
    };

    initDrumMachine();
    loadInstruments();

    if (newTab) {
      // Handle new tab creation with defaults
      setTabName("New Beat");
      setTabId(null);
      setBpm(120);
      setTimeSignature({ numerator: 4, denominator: 4 });
      setBars(1);
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

    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        // User switched tabs or minimized window
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (drumMachineRef.current) {
          drumMachineRef.current.stop();
        }
        setIsPlaying(false);
        setCurrentStep(-1);
      }
    };

    const handleBeforeUnload = () => {
      if (drumMachineRef.current) {
        drumMachineRef.current.stop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (drumMachineRef.current) {
        drumMachineRef.current.stop();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading.value, isAuthenticated.value]);

  // Update total steps when time signature or bar change
  useEffect(() => {
    const newTotalSteps = calculateTotalSteps();

    if (newTotalSteps !== totalSteps) {
      setTotalSteps(newTotalSteps);

      // Resize the pattern to match the new step count
      resizePattern(newTotalSteps);
    }
  }, [timeSignature, bars]);

  const duplicateBar = (barIndex) => {
    // Stop playback if in progress to avoid issues
    if (isPlaying) togglePlayback();

    // Calculate steps per bar
    const stepsPerBar = timeSignature.numerator * SUBDIVISION;

    // Create a new pattern with the duplicated bar
    const newPattern = pattern.map((row) => {
      // Get the steps for the bar to duplicate
      const barStart = barIndex * stepsPerBar;
      const barEnd = barStart + stepsPerBar;
      const barData = row.slice(barStart, barEnd);

      // Create a new row with the duplicated bar inserted after the current one
      return [...row.slice(0, barEnd), ...barData, ...row.slice(barEnd)];
    });

    // Update pattern with duplicated bar
    setPattern(newPattern);

    // Increment bar count
    setBars(bars + 1);

    // If there's a tab ID, save changes
    if (tabId) saveTab(false); // Silent save
  };

  const loadTab = async (tabId) => {
    try {
      const tab = await tabStorage.getTab(tabId);
      console.log(tab);
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
          (tab.tsNumerator || 4) * SUBDIVISION * (tab.measures || 1);
        setTotalSteps(steps);

        // Handle instrument mapping when loading
        if (tab.tracks && tab.tracks.length > 0) {
          // Build a mapping of instrument sounds to their patterns
          const trackMap = {};
          tab.tracks.forEach(track => {
            if (track.sound && track.pattern) {
              trackMap[track.sound] = track.pattern;
            }
          });
          
          // Check if the tab has stored instrument order
          let currentSounds;
          if (tab.instrumentOrder && Array.isArray(tab.instrumentOrder) && tab.instrumentOrder.length > 0) {
            // Use the stored order, but add any missing instruments that might have been added since
            const userInstruments = await tabStorage.getUserInstruments();
            currentSounds = [...tab.instrumentOrder];
            
            // Add any new instruments that weren't in the original tab
            userInstruments.forEach(sound => {
              if (!currentSounds.includes(sound)) {
                currentSounds.push(sound);
              }
            });
          } else {
            // Fall back to user's current instrument configuration
            currentSounds = await tabStorage.getUserInstruments();
          }
          setDrumSounds(currentSounds);
          
          // Create a pattern that matches the current instrument order
          const newPattern = currentSounds.map(sound => {
            // If we have this sound in the saved tab, use its pattern
            if (trackMap[sound] && trackMap[sound].length === steps) {
              return trackMap[sound];
            } else {
              // Otherwise create an empty pattern for this instrument
              return Array(steps).fill(false);
            }
          });
          
          setPattern(newPattern);
        } else {
          // Handle case where there are no tracks or the pattern doesn't match
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

  // Track visibility and context menu handlers
  const toggleTrackVisibility = (trackIndex) => {
    setHiddenTracks(prev => ({
      ...prev,
      [trackIndex]: !prev[trackIndex]
    }));
    
    // Close context menu
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };
  
  const handleTrackIconClick = (e, trackIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the position for the context menu
    const rect = e.currentTarget.getBoundingClientRect();
    
    setTrackContextMenu({
      visible: true,
      trackIndex,
      x: rect.right,
      y: rect.top
    });
  };
  
  const closeContextMenu = () => {
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };
  
  // Setup click outside listener to close context menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (trackContextMenu.visible && !e.target.closest('.track-context-menu') && !e.target.closest('.track-icon')) {
        closeContextMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [trackContextMenu.visible]);

  // Handlers
  //
  const handleCellClick = (row, col) => {
    const newPattern = [...pattern];
    
    // Handle special tracks with multiple states
    if (specialTracks[row]) {
      const currentState = newPattern[row][col];
      const track = specialTracks[row];
      const nextState = track.nextState[currentState];
      
      newPattern[row][col] = nextState;
      setPattern(newPattern);
      
      // Play the appropriate sound when activating a cell
      if (nextState && drumMachineRef.current) {
        // This will automatically choke other sounds in the same group
        drumMachineRef.current.playSound(nextState);
      }
    } else {
      // Handle regular tracks (binary on/off)
      const newState = !newPattern[row][col];
      newPattern[row][col] = newState;
      setPattern(newPattern);
      
      // Play the sound when activating a cell
      if (newState && drumMachineRef.current) {
        drumMachineRef.current.playSound(drumSounds[row]);
      }
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
      const quarterNoteTime = (60 * 1000) / bpm;
      const stepTime = quarterNoteTime / SUBDIVISION;

      let step = 0;
      const totalPatternSteps = calculateTotalSteps();

      intervalRef.current = setInterval(() => {
        setCurrentStep(step);

        // Play sounds for current step, skipping hidden tracks
        if (drumMachineRef.current) {
          // Filter out hidden tracks before playing
          const visiblePattern = pattern.map((row, index) => 
            hiddenTracks[index] ? Array(row.length).fill(false) : row
          );
          
          // Use the filtered pattern for playback
          drumMachineRef.current.playStep(visiblePattern, step, drumSounds);
        }

        step = (step + 1) % totalPatternSteps;

        // Scroll to the bar containing the current step if needed
        const stepsPerBar = timeSignature.numerator * 4;
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
        // Store the current instrument order for future compatibility
        instrumentOrder: [...drumSounds],
        tracks: pattern.map((patternRow, index) => {
          const sound = drumSounds[index];
          const trackId = `track-${sound}`;
          
          // Handle special tracks like hihat
          if (specialTracks[index]) {
            return {
              id: trackId,
              name: sound,
              sound: sound,
              pattern: patternRow,
              // Add metadata for special track states
              states: specialTracks[index].states,
            };
          }
          
          // Regular tracks
          return {
            id: trackId,
            name: sound,
            sound: sound,
            pattern: patternRow,
          };
        }),
        stepsPerMeasure: timeSignature.numerator * SUBDIVISION,
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
                <span className="text-white">
                  <SpinnerIcon />
                </span>
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
          <span
            className={`transition-transform ${showAdvancedControls ? "rotate-180" : ""} inline-block`}
          >
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
                const stepsPerBar = timeSignature.numerator * SUBDIVISION;
                const startStep = barIndex * stepsPerBar;
                const endStep = startStep + stepsPerBar;

                return (
                  <div key={barIndex} className="bar-section">
                    {/* Bar number indicator */}
                    <div className="bar-number">{barIndex + 1}</div>

                    <div className="bar-actions">
                      <button
                        onClick={() => duplicateBar(barIndex)}
                        className="duplicate-bar-btn"
                        title="Duplicate this bar"
                        aria-label="Duplicate bar"
                      >
                        <DuplicateIcon />
                      </button>
                    </div>

                    {/* Drum rows for this bar */}
                    <div className={`bar-content-wrapper ${barIndex === 0 ? 'first-bar' : 'secondary-bar'}`}>
                      {/* Only show instrument names for the first bar */}
                      {barIndex === 0 && (
                        <div className="drum-names-column">
                          {pattern.map((_, rowIndex) => (
                            <div key={rowIndex} className={`drum-name-wrapper ${hiddenTracks[rowIndex] ? 'hidden-track' : ''}`}>
                              <div className="drum-name">
                                <div 
                                  className={`track-icon ${hiddenTracks[rowIndex] ? 'hidden-track' : ''}`}
                                  onClick={(e) => handleTrackIconClick(e, rowIndex)}
                                >
                                  {(() => {
                                    const IconComponent = InstrumentIcons[drumSounds[rowIndex]] || InstrumentIcons.tom;
                                    return <IconComponent />;
                                  })()}
                                  <div className="track-tooltip">{drumSounds[rowIndex]}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`scrollable-grid-container ${barIndex === 0 ? 'with-names' : 'full-width'}`}>
                        <div className="drum-rows-container">
                          {pattern.map((row, rowIndex) => (
                            <div key={rowIndex} className={`drum-row ${hiddenTracks[rowIndex] ? 'hidden-track' : ''}`}>
                              {/* Grid cells for this bar */}
                              <div className={`drum-grid resolution-${SUBDIVISION}`}>
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
                                        ${cell === "hihatOpen" ? "open-hihat" : ""}
                                        ${currentStep === globalColIndex ? "playing" : ""}
                                        ${isBeatStart ? "beat-start" : ""}
                                        ${cellIndex === 0 ? "bar-start" : ""}
                                      `}
                                        onClick={() =>
                                          handleCellClick(rowIndex, globalColIndex)
                                        }
                                        aria-label={`${drumSounds[rowIndex]} ${cell === "hihatOpen" ? "open" : ""} bar ${barIndex + 1}, step ${cellIndex + 1}`}
                                      />
                                    );
                                  })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      
      {/* Track Context Menu */}
      {trackContextMenu.visible && (
        <div 
          className="track-context-menu" 
          style={{ 
            top: `${trackContextMenu.y}px`, 
            left: `${trackContextMenu.x}px`,
          }}
        >
          <div 
            className="menu-item" 
            onClick={() => toggleTrackVisibility(trackContextMenu.trackIndex)}
          >
            {hiddenTracks[trackContextMenu.trackIndex] ? <EyeIcon /> : <EyeOffIcon />}
            {hiddenTracks[trackContextMenu.trackIndex] ? 'Show Track' : 'Hide Track'}
          </div>
          
          <div 
            className="menu-item" 
            onClick={() => {
              const newHiddenTracks = {};
              drumSounds.forEach((_, index) => {
                newHiddenTracks[index] = index !== trackContextMenu.trackIndex;
              });
              setHiddenTracks(newHiddenTracks);
              closeContextMenu();
            }}
          >
            <SoloIcon />
            Solo This Track
          </div>
          
          <div 
            className="menu-item" 
            onClick={() => {
              setHiddenTracks({});
              closeContextMenu();
            }}
          >
            <GridIcon />
            Show All Tracks
          </div>
          
          {/* Additional context menu items can be added here */}
          <div className="divider"></div>
          <div className="menu-item" onClick={closeContextMenu}>
            <CloseIcon />
            Cancel
          </div>
        </div>
      )}
    </div>
  );
}
