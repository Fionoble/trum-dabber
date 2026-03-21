import { useState, useEffect, useRef } from "preact/hooks";
import { DrumMachine } from "../../utils/drumMachine";
import { useLocation } from "preact-iso";
import { isAuthenticated, isLoading } from "../../services/auth";
import "./styles.scss";
import { tabStorage } from "../../services/storage";
import { exportTabAsJson } from "../../utils/tabIO";
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
import DownloadIcon from "../../assets/icons/Download.svg.jsx";
import InstrumentIcons from "../../assets/icons/instruments";

const MAX_BAR_COUNT = 25;
const SUBDIVISION = 8;
const CELLS_PER_ROW = 8; // Default number of cells per row
const defaultDrumSounds = [
  "hihat",
  "hiTom",
  "snare",
  "crash",
  "kick",
  "floorTom",
]; // These should come from the drum machine

export default function Editor({ id, newTab }) {
  const [drumSounds, setDrumSounds] = useState(defaultDrumSounds);
  const [hiddenTracks, setHiddenTracks] = useState({});
  const [trackContextMenu, setTrackContextMenu] = useState({
    visible: false,
    trackIndex: null,
    x: 0,
    y: 0,
  });
  const [specialTracks, setSpecialTracks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [tabName, setTabName] = useState("New Beat");
  const [tabId, setTabId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [playbackSettings, setPlaybackSettings] = useState({
    countIn: false,
    loopPlayback: true
  });

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
    const validSteps = Math.max(1, Math.floor(Number(steps) || 1));
    return drumSounds.map((_, index) => {
      if (specialTracks[index]) {
        return Array(validSteps).fill(false);
      }
      return Array(validSteps).fill(false);
    });
  };

  const [pattern, setPattern] = useState(createEmptyPattern(totalSteps));

  const drumMachineRef = useRef(null);
  const intervalRef = useRef(null);
  const nameInputRef = useRef(null);
  const sequencerRef = useRef(null);

  const location = useLocation();
  const { route, history } = location;

  useEffect(() => {
    if (isPlaying && drumMachineRef.current) {
      clearInterval(intervalRef.current);
      drumMachineRef.current.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }

    return () => {
      if (drumMachineRef.current) drumMachineRef.current.stop();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setCurrentStep(-1);
      }
    };
  }, [location.url]);

  useEffect(() => {
    const hihatIndex = drumSounds.indexOf("hihat");

    if (hihatIndex !== -1) {
      setSpecialTracks({
        [hihatIndex]: {
          states: [false, "hihat", "hihatOpen"],
          nextState: {
            false: "hihat",
            hihat: "hihatOpen",
            hihatOpen: false,
          },
        },
      });
    } else {
      setSpecialTracks({});
    }
  }, [drumSounds]);

  // Function to initialize a new tab with default values
  const initNewTab = () => {
    setTabName("New Beat");
    setTabId(null);
    setBpm(120);
    setTimeSignature({ numerator: 4, denominator: 4 });
    setBars(1);
    setBarRepeats({}); // Reset repeats
    setTotalSteps(calculateTotalSteps());
    setPattern(createEmptyPattern(calculateTotalSteps()));
    setCurrentStep(-1);

    // Reset any playing state
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      drumMachineRef?.current?.stop();
      setIsPlaying(false);
    }
  };

  useEffect(async () => {
    const initDrumMachine = async () => {
      drumMachineRef.current = new DrumMachine();
      window.globalDrumMachine = drumMachineRef.current;
      await drumMachineRef.current.loadSamples();
      setIsLoaded(true);
    };

    const loadSettings = async () => {
      try {
        // Load instruments
        const savedInstruments = await tabStorage.getUserInstruments();
        setDrumSounds(savedInstruments);
        
        // Load playback settings
        const savedPlaybackSettings = await tabStorage.getPlaybackSettings();
        setPlaybackSettings(savedPlaybackSettings);
      } catch (error) {
        console.error("Error loading settings:", error);
        setDrumSounds(defaultDrumSounds);
      }
    };

    initDrumMachine();
    loadSettings();

    if (newTab) {
      // Handle new tab creation with defaults
      initNewTab();
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
        if (intervalRef.current) clearInterval(intervalRef.current);
        drumMachineRef?.current?.stop();
        setIsPlaying(false);
        setCurrentStep(-1);
      }
    };

    const handleBeforeUnload = () => {
      drumMachineRef?.current?.stop();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      drumMachineRef?.current?.stop();
      window.globalDrumMachine = null;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading.value, isAuthenticated.value, id, newTab]);

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

        // Load bar repeat configuration if available
        if (tab.barRepeats) {
          setBarRepeats(tab.barRepeats);
        }

        const steps =
          (tab.tsNumerator || 4) * SUBDIVISION * (tab.measures || 1);
        setTotalSteps(steps);

        if (tab.tracks && tab.tracks.length > 0) {
          const trackMap = {};
          tab.tracks.forEach((track) => {
            if (track.sound && track.pattern) {
              trackMap[track.sound] = track.pattern;
            }
          });

          // Check if the tab has stored instrument order
          let currentSounds;
          if (
            tab.instrumentOrder &&
            Array.isArray(tab.instrumentOrder) &&
            tab.instrumentOrder.length > 0
          ) {
            // Use the stored order, but add any missing instruments that might have been added since
            const userInstruments = await tabStorage.getUserInstruments();
            currentSounds = [...tab.instrumentOrder];

            // Add any new instruments that weren't in the original tab
            userInstruments.forEach((sound) => {
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
          const newPattern = currentSounds.map((sound) => {
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
    setHiddenTracks((prev) => ({
      ...prev,
      [trackIndex]: !prev[trackIndex],
    }));

    // Close context menu
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };

  // Bar context menu state
  const [barContextMenu, setBarContextMenu] = useState({
    visible: false,
    barIndex: null,
    x: 0,
    y: 0,
  });

  // Bar repeat configuration state
  const [barRepeats, setBarRepeats] = useState({});

  // Repeat modal state
  const [repeatModal, setRepeatModal] = useState({
    visible: false,
    barIndex: null,
    repetitions: 1,
    barsToRepeat: [],
  });

  // Handle bar number click to show context menu
  const handleBarNumberClick = (e, barIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    setBarContextMenu({
      visible: true,
      barIndex,
      x: rect.right,
      y: rect.bottom,
    });
  };

  // Close bar context menu
  const closeBarContextMenu = () => {
    setBarContextMenu({ visible: false, barIndex: null, x: 0, y: 0 });
  };

  // Open repeat modal
  const openRepeatModal = (barIndex) => {
    const currentRepeat = barRepeats[barIndex] || {
      repetitions: 1,
      bars: [barIndex],
    };
    setRepeatModal({
      visible: true,
      barIndex,
      repetitions: currentRepeat.repetitions,
      barsToRepeat: [...currentRepeat.bars],
    });
    closeBarContextMenu();
  };

  // Close repeat modal
  const closeRepeatModal = () => {
    setRepeatModal({
      visible: false,
      barIndex: null,
      repetitions: 1,
      barsToRepeat: [],
    });
  };

  // Set bar repetition
  const setBarRepetition = () => {
    const { barIndex, repetitions, barsToRepeat } = repeatModal;

    if (repetitions < 1 || barsToRepeat.length === 0) {
      closeRepeatModal();
      return;
    }

    // Sort the bars to repeat
    const sortedBars = [...barsToRepeat].sort((a, b) => a - b);

    // Store repetitions as 1 less than displayed, since we count the first playthrough
    // in the display but in the logic it's treated as a separate event
    setBarRepeats((prev) => ({
      ...prev,
      [barIndex]: {
        repetitions,
        bars: sortedBars,
      },
    }));

    closeRepeatModal();

    // If there's a tab ID, save changes
    if (tabId) saveTab(false); // Silent save
  };

  // Remove bar repetition
  const removeBarRepetition = (barIndex) => {
    setBarRepeats((prev) => {
      const newRepeats = { ...prev };
      delete newRepeats[barIndex];
      return newRepeats;
    });

    closeBarContextMenu();

    // If there's a tab ID, save changes
    if (tabId) saveTab(false); // Silent save
  };

  // Setup click outside listener for bar context menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        barContextMenu.visible &&
        !e.target.closest(".bar-context-menu") &&
        !e.target.closest(".bar-number")
      ) {
        closeBarContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [barContextMenu.visible]);

  // Render a bar or bar segment
  const renderBar = (
    barIndex,
    startStep,
    endStep,
    segmentIndex,
    stepsPerBar,
  ) => {
    const isFirstSegment = segmentIndex === 0;
    const key = `bar-${barIndex}-segment-${segmentIndex}`;

    return (
      <div
        key={key}
        className={`bar-section segment-${segmentIndex} ${isFirstSegment ? "" : "continuation"} ${barRepeats[barIndex] ? "has-repeat" : ""}`}
      >
        {/* Only show the bar number on the first segment, now clickable */}
        {isFirstSegment && (
          <div
            className="bar-number"
            onClick={(e) => handleBarNumberClick(e, barIndex)}
          >
            {barIndex + 1}
            {barRepeats[barIndex] && (
              <span
                className="repeat-indicator"
                title={`Plays ${barRepeats[barIndex].repetitions} times`}
              >
                <PlayIcon /> {barRepeats[barIndex].repetitions}x
              </span>
            )}
          </div>
        )}

        {/* Drum rows for this bar segment */}
        <div
          className={`bar-content-wrapper ${barIndex === 0 && isFirstSegment ? "first-bar" : "secondary-bar"}`}
        >
          {/* Only show instrument names for the first bar's first segment */}
          {barIndex === 0 && isFirstSegment && (
            <div className="drum-names-column">
              {pattern.map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`drum-name-wrapper ${hiddenTracks[rowIndex] ? "hidden-track" : ""}`}
                >
                  <div className="drum-name">
                    <div
                      className={`track-icon ${hiddenTracks[rowIndex] ? "hidden-track" : ""}`}
                      onClick={(e) => handleTrackIconClick(e, rowIndex)}
                    >
                      {(() => {
                        const IconComponent =
                          InstrumentIcons[drumSounds[rowIndex]] ||
                          InstrumentIcons.tom;
                        return <IconComponent />;
                      })()}
                      <div className="track-tooltip">
                        {drumSounds[rowIndex]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className={`scrollable-grid-container ${barIndex === 0 && isFirstSegment ? "with-names" : "full-width"}`}
          >
            <div className="drum-rows-container">
              {pattern.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`drum-row ${hiddenTracks[rowIndex] ? "hidden-track" : ""}`}
                >
                  {/* Grid cells for this bar segment */}
                  <div
                    className={`drum-grid resolution-${SUBDIVISION} ${isFirstSegment ? "segment-start" : ""}`}
                  >
                    {row.slice(startStep, endStep).map((cell, cellIndex) => {
                      const globalColIndex = startStep + cellIndex;
                      // Only show beat markers at actual beat positions
                      const beatPosition =
                        (globalColIndex - barIndex * stepsPerBar) % 4;
                      const isBeatStart = beatPosition === 0;

                      return (
                        <button
                          key={cellIndex}
                          className={`drum-cell
                            ${cell ? "active" : ""}
                            ${cell === "hihatOpen" ? "open-hihat" : ""}
                            ${currentStep === globalColIndex ? "playing" : ""}
                            ${isBeatStart ? "beat-start" : ""}
                            ${cellIndex === 0 && isFirstSegment ? "bar-start" : ""}
                          `}
                          onClick={() =>
                            handleCellClick(rowIndex, globalColIndex)
                          }
                          aria-label={`${drumSounds[rowIndex]} ${cell === "hihatOpen" ? "open" : ""} bar ${barIndex + 1}, step ${globalColIndex - barIndex * stepsPerBar + 1}`}
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
  };

  const handleTrackIconClick = (e, trackIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    setTrackContextMenu({
      visible: true,
      trackIndex,
      x: rect.right,
      y: rect.top,
    });
  };

  const closeContextMenu = () => {
    setTrackContextMenu({ visible: false, trackIndex: null, x: 0, y: 0 });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        trackContextMenu.visible &&
        !e.target.closest(".track-context-menu") &&
        !e.target.closest(".track-icon")
      ) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [trackContextMenu.visible]);

  const handleCellClick = (row, col) => {
    const newPattern = [...pattern];

    if (specialTracks[row]) {
      const currentState = newPattern[row][col];
      const track = specialTracks[row];
      const nextState = track.nextState[currentState];

      newPattern[row][col] = nextState;
      setPattern(newPattern);

      if (nextState && drumMachineRef.current) {
        drumMachineRef.current.playSound(nextState);
      }
    } else {
      const newState = !newPattern[row][col];
      newPattern[row][col] = newState;
      setPattern(newPattern);

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

  const handleBpmBlur = (e) => {
    let newBpm = parseInt(e.target.value);
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

  const getNextStep = (currentStep, totalSteps) => {
    const stepsPerBar = timeSignature.numerator * SUBDIVISION;
    const currentBarIndex = Math.floor(currentStep / stepsPerBar);

    if ((currentStep + 1) % stepsPerBar === 0) {
      const nextBarIndex = currentBarIndex + 1;

      if (barRepeats[currentBarIndex]) {
        const { repetitions, bars } = barRepeats[currentBarIndex];

        if (!barRepeats[currentBarIndex].currentRepetition) {
          barRepeats[currentBarIndex].currentRepetition = 1;
        } else {
          barRepeats[currentBarIndex].currentRepetition++;
        }

        if (barRepeats[currentBarIndex].currentRepetition < repetitions) {
          return bars[0] * stepsPerBar;
        } else {
          barRepeats[currentBarIndex].currentRepetition = 0;
          return nextBarIndex * stepsPerBar;
        }
      }
    }

    // If we've reached the end of the pattern and loop playback is enabled, loop back to start
    // Otherwise, go to the next step normally (which will loop anyway due to the modulo)
    if (currentStep + 1 >= totalSteps) {
      return playbackSettings.loopPlayback ? 0 : -1; // Return -1 to signal end of playback when not looping
    }

    return (currentStep + 1) % totalSteps;
  };
  
  // Function to play count-in clicks
  const playCountIn = async () => {
    if (!drumMachineRef.current) return;
    
    const quarterNoteTime = (60 * 1000) / bpm;
    const stepsPerBar = timeSignature.numerator;
    
    // Play one bar of quarter note clicks
    for (let i = 0; i < stepsPerBar; i++) {
      setTimeout(() => {
        // Play a hihat for the count-in
        drumMachineRef.current.playSound("hihat");
      }, i * quarterNoteTime);
    }
    
    // Return a promise that resolves after the count-in finishes
    return new Promise((resolve) => {
      setTimeout(resolve, stepsPerBar * quarterNoteTime);
    });
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setCurrentStep(-1);
      if (drumMachineRef.current) {
        drumMachineRef.current.stop();
      }
      setIsPlaying(false);

      // Reset all repetition counters
      const resetRepeats = { ...barRepeats };
      Object.keys(resetRepeats).forEach((barIdx) => {
        if (resetRepeats[barIdx]) {
          resetRepeats[barIdx].currentRepetition = 0;
        }
      });
      setBarRepeats(resetRepeats);
    } else {
      // Set to playing state immediately to prevent double-clicks
      setIsPlaying(true);
      
      // Do count-in if enabled
      if (playbackSettings.countIn) {
        await playCountIn();
      }

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
            hiddenTracks[index] ? Array(row.length).fill(false) : row,
          );

          // Use the filtered pattern for playback
          drumMachineRef.current.playStep(visiblePattern, step, drumSounds);
        }

        // Get the next step, considering repeats
        step = getNextStep(step, totalPatternSteps);
        
        // If step is -1, we've reached the end and should stop playback (non-loop mode)
        if (step === -1) {
          clearInterval(intervalRef.current);
          setCurrentStep(-1);
          if (drumMachineRef.current) {
            drumMachineRef.current.stop();
          }
          setIsPlaying(false);
          return;
        }

        // Scroll to the bar containing the current step if needed
        const stepsPerBar = timeSignature.numerator * SUBDIVISION;
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
    }
  };

  const saveTab = async (showNotification = true) => {
    if (!isAuthenticated.value) {
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
        // Store bar repeats configuration
        barRepeats: Object.keys(barRepeats).length > 0 ? barRepeats : undefined,
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
              states: specialTracks[index].states,
            };
          }

          return {
            id: trackId,
            name: sound,
            sound: sound,
            pattern: patternRow,
          };
        }),
        volume: 0.7,
      };

      const savedId = await tabStorage.saveTab(tab);

      if (savedId) {
        setTabId(savedId);

        if (!tabId) {
          setTabId(savedId); // Update the component's tabId state
          history.replaceState(null, "", `/editor/${savedId}`);
        }

        if (showNotification) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error("Error saving tab:", error);
    } finally {
      if (showNotification) {
        setIsSaving(false);
      }
    }
  };

  const handleExportJson = () => {
    exportTabAsJson({
      name: tabName || 'Untitled Beat',
      bpm,
      tsNumerator: timeSignature.numerator,
      tsDenominator: timeSignature.denominator,
      measures: bars,
      instrumentOrder: [...drumSounds],
      barRepeats: Object.keys(barRepeats).length > 0 ? barRepeats : undefined,
      tracks: pattern.map((patternRow, index) => {
        const sound = drumSounds[index];
        if (specialTracks[index]) {
          return { id: `track-${sound}`, name: sound, sound, pattern: patternRow, states: specialTracks[index].states };
        }
        return { id: `track-${sound}`, name: sound, sound, pattern: patternRow };
      }),
      volume: 0.7,
    });
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
        <div className="flex items-center relative grow max-w-[calc(100%-80px)] sm:max-w-[calc(100%-100px)]">
          <input
            ref={nameInputRef}
            type="text"
            value={tabName}
            onChange={handleNameChange}
            onFocus={() => setIsNameFocused(true)}
            onBlur={handleNameBlur}
            className={`text-xl sm:text-2xl font-bold bg-transparent border-b-2 transition-colors px-2 py-1 w-full focus:outline-none truncate ${
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

        <div className="flex items-center shrink-0 ml-2 gap-2">
          {saveSuccess && (
            <span className="text-green-500 mr-1 animate-fade-out hidden sm:inline">
              Saved successfully!
            </span>
          )}
          <button
            onClick={handleExportJson}
            disabled={!isLoaded}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2 active:transform active:translate-y-0.5 disabled:opacity-50 whitespace-nowrap"
            title="Export as JSON"
          >
            <DownloadIcon />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => saveTab(true)}
            disabled={isSaving || !isLoaded}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 active:transform active:translate-y-0.5 active:bg-opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <span className="text-white">
                  <SpinnerIcon />
                </span>
                <span className="sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Basic Controls */}
      <div className="controls flex flex-wrap items-center mb-4 gap-y-3 gap-x-4 p-4 bg-gray-50 rounded-lg">
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
            onChange={(e) => setBpm(e.target.value)}
            onBlur={handleBpmBlur}
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
          className="text-gray-600 hover:text-indigo-600 flex items-center gap-1 text-sm md:ml-auto w-full md:w-auto"
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
        <div className="sequencer" ref={sequencerRef}>
          {/* Bars container - vertical wrapping happens here */}
          <div className="bars-container">
            {Array(bars)
              .fill(0)
              .map((_, barIndex) => {
                // Calculate step range for this bar
                const stepsPerBar = timeSignature.numerator * SUBDIVISION;
                const startStep = barIndex * stepsPerBar;
                const endStep = startStep + stepsPerBar;

                console.log(
                  `Bar ${barIndex + 1}: stepsPerBar=${stepsPerBar}, cellsPerRow=${CELLS_PER_ROW}`,
                );

                // FORCE TESTING: For testing purposes, always split the bar if it has more than 8 steps
                // Remove this for production and use the calculation below
                if (stepsPerBar > 8) {
                  // Force 8 cells per segment for testing
                  const forcedSegments = Math.ceil(stepsPerBar / 8);
                  console.log(
                    `Forcing ${forcedSegments} segments for bar ${barIndex + 1}`,
                  );

                  return Array(forcedSegments)
                    .fill(0)
                    .map((_, segmentIndex) => {
                      const segmentStart = startStep + segmentIndex * 8;
                      const segmentEnd = Math.min(
                        startStep + (segmentIndex + 1) * 8,
                        endStep,
                      );

                      console.log(
                        `Bar ${barIndex + 1} Segment ${segmentIndex}: ${segmentStart} - ${segmentEnd}`,
                      );

                      return renderBar(
                        barIndex,
                        segmentStart,
                        segmentEnd,
                        segmentIndex,
                        stepsPerBar,
                      );
                    });
                }

                // Fallback - render the entire bar
                return renderBar(barIndex, startStep, endStep, 0, stepsPerBar);
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
            {hiddenTracks[trackContextMenu.trackIndex] ? (
              <EyeIcon />
            ) : (
              <EyeOffIcon />
            )}
            {hiddenTracks[trackContextMenu.trackIndex]
              ? "Show Track"
              : "Hide Track"}
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

      {/* Bar Context Menu */}
      {barContextMenu.visible && (
        <div
          className="bar-context-menu"
          style={{
            top: `${barContextMenu.y}px`,
            left: `${barContextMenu.x}px`,
          }}
        >
          <div
            className="menu-item"
            onClick={() => {
              duplicateBar(barContextMenu.barIndex);
              closeBarContextMenu();
            }}
          >
            <DuplicateIcon />
            Duplicate Bar
          </div>

          {barRepeats[barContextMenu.barIndex] ? (
            <div
              className="menu-item"
              onClick={() => removeBarRepetition(barContextMenu.barIndex)}
            >
              <MinusIcon />
              Remove Repeat
            </div>
          ) : (
            <div
              className="menu-item"
              onClick={() => openRepeatModal(barContextMenu.barIndex)}
            >
              <PlayIcon />
              Set Repeat
            </div>
          )}

          {/* Additional bar actions can be added here */}
          <div className="divider"></div>
          <div className="menu-item" onClick={closeBarContextMenu}>
            <CloseIcon />
            Cancel
          </div>
        </div>
      )}

      {/* Repeat Modal */}
      {repeatModal.visible && (
        <div className="modal-overlay">
          <div className="repeat-modal">
            <div className="modal-header">
              <h3>Repeat Bars</h3>
              <button className="close-btn" onClick={closeRepeatModal}>
                <CloseIcon />
              </button>
            </div>

            <div className="modal-content">
              <div className="repeat-form">
                <div className="form-group">
                  <label htmlFor="repetitions">Total Repetitions:</label>
                  <input
                    id="repetitions"
                    type="number"
                    min="2"
                    max="16"
                    value={repeatModal.repetitions}
                    onChange={(e) =>
                      setRepeatModal({
                        ...repeatModal,
                        repetitions: e.target.value,
                      })
                    }
                    onBlur={(e) => {
                      setRepeatModal({
                        ...repeatModal,
                        repetitions: Math.max(
                          2,
                          Math.min(16, parseInt(e.target.value) || 2),
                        ),
                      });
                    }}
                    className="number-input"
                  />
                  <p className="help-text">
                    The total count includes the first playthrough (2x means
                    play once, then repeat once).
                  </p>
                </div>

                <div className="form-group">
                  <label>Bars to Repeat:</label>
                  <div className="bar-selection">
                    {Array(bars)
                      .fill(0)
                      .map((_, idx) => (
                        <button
                          key={idx}
                          className={`bar-select-btn ${repeatModal.barsToRepeat.includes(idx) ? "selected" : ""}`}
                          onClick={() => {
                            const newBars = repeatModal.barsToRepeat.includes(
                              idx,
                            )
                              ? repeatModal.barsToRepeat.filter(
                                  (barIdx) => barIdx !== idx,
                                )
                              : [...repeatModal.barsToRepeat, idx];

                            setRepeatModal({
                              ...repeatModal,
                              barsToRepeat: newBars,
                            });
                          }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                  </div>
                  <p className="help-text">
                    Select the bars you want to repeat. At least one bar must be
                    selected.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeRepeatModal}>
                Cancel
              </button>
              <button
                className="apply-btn"
                onClick={setBarRepetition}
                disabled={repeatModal.barsToRepeat.length === 0}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
