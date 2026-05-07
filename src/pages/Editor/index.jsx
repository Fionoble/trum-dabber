import { useState, useEffect, useRef } from "preact/hooks";
import { DrumMachine } from "../../utils/drumMachine";
import { useLocation } from "preact-iso";
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
    return drumSounds.map(() => Array(validSteps).fill(false));
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
      loadTab(id);
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
  }, [id, newTab]);

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
        className={`relative w-full p-2 md:p-3 rounded-xl border transition-shadow
          ${isFirstSegment ? 'border-l-[3px] border-l-primary' : 'border-l-primary'}
          ${barRepeats[barIndex] ? 'border-r-[3px] border-r-success' : ''}
          ${!isFirstSegment ? 'mt-[-4px]' : ''}
          border-white/10 bg-surface`}
      >
        {/* Only show the bar number on the first segment, now clickable */}
        {isFirstSegment && (
          <div
            className="bar-number absolute -top-2.5 left-3 bg-primary text-white px-2 py-0.5 rounded-full text-[11px] font-bold z-[5] cursor-pointer flex items-center gap-1 hover:bg-primary-light active:translate-y-px transition-all"
            onClick={(e) => handleBarNumberClick(e, barIndex)}
          >
            {barIndex + 1}
            {barRepeats[barIndex] && (
              <span className="inline-flex items-center ml-0.5 text-[10px]">
                <PlayIcon /> {barRepeats[barIndex].repetitions}x
              </span>
            )}
          </div>
        )}

        {/* Drum rows for this bar segment */}
        <div className={`flex w-full ${barIndex === 0 && isFirstSegment ? '' : ''}`}>
          {/* Only show instrument names for the first bar's first segment */}
          {barIndex === 0 && isFirstSegment && (
            <div className="w-8 min-w-[32px] md:w-[60px] md:min-w-[60px] shrink-0">
              {pattern.map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`h-7 md:h-7 mb-1 last:mb-0 flex items-center ${hiddenTracks[rowIndex] ? 'opacity-40' : ''}`}
                >
                  <div className="w-full flex items-center justify-end pr-1 md:pr-2">
                    <div
                      className={`track-icon relative w-6 h-6 md:w-[30px] md:h-[30px] cursor-pointer flex items-center justify-center text-on-surface-dim rounded hover:bg-white/5 hover:text-primary active:bg-white/10 transition-colors ${hiddenTracks[rowIndex] ? 'opacity-50' : ''}`}
                      onClick={(e) => handleTrackIconClick(e, rowIndex)}
                    >
                      {(() => {
                        const IconComponent =
                          InstrumentIcons[drumSounds[rowIndex]] ||
                          InstrumentIcons.tom;
                        return <IconComponent />;
                      })()}
                      <div className="absolute -top-6 right-0 bg-black/80 text-white px-1.5 py-0.5 rounded text-[10px] opacity-0 pointer-events-none whitespace-nowrap z-50 transition-opacity group-hover:opacity-100">
                        {drumSounds[rowIndex]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`flex-1 min-w-0 overflow-x-auto overflow-y-hidden ${barIndex === 0 && isFirstSegment ? 'max-w-[calc(100%-32px)] md:max-w-[calc(100%-60px)]' : 'w-full'}`}>
            <div className="flex flex-col w-full min-w-full">
              {pattern.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`flex items-center h-7 md:h-7 mb-1 last:mb-0 ${hiddenTracks[rowIndex] ? 'opacity-40 h-4 overflow-hidden' : ''}`}
                >
                  {/* Grid cells for this bar segment */}
                  {!hiddenTracks[rowIndex] && (
                    <div className="flex gap-[1px] md:gap-0.5 w-full">
                      {row.slice(startStep, endStep).map((cell, cellIndex) => {
                        const globalColIndex = startStep + cellIndex;
                        // Only show beat markers at actual beat positions
                        const beatPosition =
                          (globalColIndex - barIndex * stepsPerBar) % 4;
                        const isBeatStart = beatPosition === 0;

                        return (
                          <button
                            key={cellIndex}
                            className={`drum-cell flex-1 min-w-0 h-7 md:h-6 rounded-[3px] border-0 p-0 transition-all duration-75 relative
                              ${cell ? (cell === 'hihatOpen' ? 'bg-primary-light' : 'bg-primary') : 'bg-surface-light'}
                              ${currentStep === globalColIndex ? 'ring-2 ring-primary-light shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}
                              ${cell && currentStep === globalColIndex ? 'scale-105 shadow-[0_0_12px_rgba(99,102,241,0.7)]' : ''}
                              ${isBeatStart && !cell ? 'bg-surface-light/80' : ''}
                              ${!cell ? 'hover:bg-surface-light/60' : 'hover:brightness-110'}
                              active:scale-95`}
                            onClick={() =>
                              handleCellClick(rowIndex, globalColIndex)
                            }
                            aria-label={`${drumSounds[rowIndex]} ${cell === "hihatOpen" ? "open" : ""} bar ${barIndex + 1}, step ${globalColIndex - barIndex * stepsPerBar + 1}`}
                          >
                            {cell === 'hihatOpen' && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">O</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
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
    drumMachineRef.current?.unlock();
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

  const repeatCountRef = useRef({});

  const getNextStep = (currentStep, totalSteps) => {
    const stepsPerBar = timeSignature.numerator * SUBDIVISION;
    const currentBarIndex = Math.floor(currentStep / stepsPerBar);

    if ((currentStep + 1) % stepsPerBar === 0) {
      const nextBarIndex = currentBarIndex + 1;

      if (barRepeats[currentBarIndex]) {
        const { repetitions, bars } = barRepeats[currentBarIndex];
        const counts = repeatCountRef.current;

        if (!counts[currentBarIndex]) {
          counts[currentBarIndex] = 1;
        } else {
          counts[currentBarIndex]++;
        }

        if (counts[currentBarIndex] < repetitions) {
          return bars[0] * stepsPerBar;
        } else {
          counts[currentBarIndex] = 0;
          return nextBarIndex * stepsPerBar;
        }
      }
    }

    if (currentStep + 1 >= totalSteps) {
      return playbackSettings.loopPlayback ? 0 : -1;
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
    await drumMachineRef.current?.unlock();
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

  return (
    <div className="bg-bg min-h-full px-2 py-3 md:p-4">
      <style>{`
        @keyframes editor-fade-out {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-editor-fade-out {
          animation: editor-fade-out 2s forwards;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Header with title input and save button */}
      <div className="flex justify-between items-center mb-3 gap-2">
        <div className="flex items-center relative grow min-w-0">
          <input
            ref={nameInputRef}
            type="text"
            value={tabName}
            onChange={handleNameChange}
            onFocus={() => setIsNameFocused(true)}
            onBlur={handleNameBlur}
            className={`text-lg md:text-2xl font-bold bg-transparent border-b-2 transition-colors px-1 md:px-2 py-1 w-full focus:outline-none truncate text-on-surface ${
              isNameFocused ? "border-primary" : "border-white/20"
            }`}
            placeholder="Untitled Beat"
          />
          {isNameFocused && (
            <div className="absolute -bottom-5 left-1 text-xs text-on-surface-dim hidden md:block">
              Press Enter or click outside to save name
            </div>
          )}
        </div>

        <div className="flex items-center shrink-0">
          {saveSuccess && (
            <span className="text-success mr-3 animate-editor-fade-out hidden sm:inline text-sm">
              Saved!
            </span>
          )}
          <button
            onClick={() => saveTab(true)}
            disabled={isSaving || !isLoaded}
            className="p-2 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-light flex items-center gap-1.5 active:scale-95 disabled:opacity-50 whitespace-nowrap transition-all"
          >
            {isSaving ? (
              <>
                <SpinnerIcon />
                <span className="hidden md:inline">Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon />
                <span className="hidden md:inline">Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Basic Controls */}
      <div className="flex flex-wrap items-center mb-2 md:mb-4 gap-y-2 gap-x-2 md:gap-x-4 p-2 md:p-3 bg-surface rounded-xl sticky top-0 z-20 border border-white/10">
        <button
          onClick={togglePlayback}
          disabled={!isLoaded}
          className="p-2 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-light active:scale-95 disabled:opacity-50 flex items-center gap-1.5 transition-all"
        >
          {isPlaying ? (
            <>
              <StopIcon />
              <span className="hidden md:inline">Stop</span>
            </>
          ) : (
            <>
              <PlayIcon />
              <span className="hidden md:inline">Play</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <label htmlFor="bpm-input" className="text-sm font-medium text-on-surface-dim">
            BPM
          </label>
          <input
            id="bpm-input"
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            onBlur={handleBpmBlur}
            className="w-14 p-1 bg-surface-light border border-white/10 rounded text-center text-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        {/* Bar Count Controls */}
        <div className="flex items-center gap-1.5">
          <label className="text-sm text-on-surface-dim">Bars</label>
          <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => handleBarCountChange(-1)}
              disabled={bars <= 1}
              className="px-1.5 py-1 text-on-surface-dim hover:bg-white/5 focus:outline-none disabled:opacity-30 transition-colors"
            >
              <MinusIcon />
            </button>
            <span className="px-2 py-1 border-l border-r border-white/10 min-w-[24px] text-center text-sm text-on-surface">
              {bars}
            </span>
            <button
              onClick={() => handleBarCountChange(1)}
              disabled={bars >= MAX_BAR_COUNT}
              className="px-1.5 py-1 text-on-surface-dim hover:bg-white/5 focus:outline-none disabled:opacity-30 transition-colors"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="text-on-surface-dim hover:text-primary flex items-center gap-1 text-xs md:text-sm md:ml-auto transition-colors"
        >
          <span className="hidden md:inline">{showAdvancedControls ? "Hide" : "Show"} Advanced</span>
          <span className="md:hidden">More</span>
          <span
            className={`transition-transform ${showAdvancedControls ? "rotate-180" : ""} inline-block`}
          >
            <ChevronDownIcon />
          </span>
        </button>
      </div>

      {/* Advanced Controls - Time Signature and Bars */}
      {showAdvancedControls && (
        <div className="mb-3 p-3 md:p-4 bg-surface border border-white/10 rounded-xl">
          <h3 className="text-sm font-medium text-on-surface-dim mb-3">
            Advanced Controls
          </h3>

          <div className="flex flex-wrap gap-4 md:gap-6">
            {/* Time Signature Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-on-surface-dim">Time Sig:</label>
              <div className="flex">
                <select
                  value={timeSignature.numerator}
                  onChange={(e) =>
                    handleTimeSignatureChange("numerator", e.target.value)
                  }
                  className="p-1 bg-surface-light border border-white/10 rounded-l-md w-12 text-center text-on-surface focus:outline-none focus:border-primary"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 12].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <span className="flex items-center justify-center border-t border-b border-white/10 px-2 bg-surface-light text-on-surface-dim">
                  /
                </span>
                <select
                  value={timeSignature.denominator}
                  onChange={(e) =>
                    handleTimeSignatureChange("denominator", e.target.value)
                  }
                  className="p-1 bg-surface-light border border-white/10 rounded-r-md w-12 text-center text-on-surface focus:outline-none focus:border-primary"
                >
                  {[2, 4, 8, 16].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-on-surface-dim mt-1 w-full">
              Note: Changing time signature, bar count, or note resolution will
              resize your pattern. Existing beats will be preserved when
              possible.
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!isLoaded && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 mb-4 border-3 border-white/10 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-dim">Loading drum samples...</p>
        </div>
      )}

      {/* Drum grid with bar-based layout */}
      {isLoaded && (
        <div ref={sequencerRef} className="w-full">
          {/* Bars container - vertical wrapping happens here */}
          <div className="flex flex-wrap gap-4 w-full">
            {Array(bars)
              .fill(0)
              .map((_, barIndex) => {
                const stepsPerBar = timeSignature.numerator * SUBDIVISION;
                const startStep = barIndex * stepsPerBar;
                const endStep = startStep + stepsPerBar;

                if (stepsPerBar > 8) {
                  const segments = Math.ceil(stepsPerBar / 8);
                  return Array(segments)
                    .fill(0)
                    .map((_, segmentIndex) => {
                      const segmentStart = startStep + segmentIndex * 8;
                      const segmentEnd = Math.min(
                        startStep + (segmentIndex + 1) * 8,
                        endStep,
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

                return renderBar(barIndex, startStep, endStep, 0, stepsPerBar);
              })}
          </div>
        </div>
      )}

      {/* Track Context Menu */}
      {trackContextMenu.visible && (
        <div
          className="track-context-menu fixed bg-surface border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px] z-[100]"
          style={{
            top: `${trackContextMenu.y}px`,
            left: `${trackContextMenu.x}px`,
          }}
        >
          <div
            className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-colors"
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
            className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-colors"
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
            className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-colors"
            onClick={() => {
              setHiddenTracks({});
              closeContextMenu();
            }}
          >
            <GridIcon />
            Show All Tracks
          </div>

          <div className="h-px bg-white/10 my-1" />
          <div
            className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface-dim hover:bg-white/5 transition-colors"
            onClick={closeContextMenu}
          >
            <CloseIcon />
            Cancel
          </div>
        </div>
      )}

      {/* Bar Context Menu */}
      {barContextMenu.visible && (
        <div
          className="bar-context-menu fixed bg-surface border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px] z-[100]"
          style={{
            top: `${barContextMenu.y}px`,
            left: `${barContextMenu.x}px`,
          }}
        >
          <div
            className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-colors"
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
              className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-colors"
              onClick={() => removeBarRepetition(barContextMenu.barIndex)}
            >
              <MinusIcon />
              Remove Repeat
            </div>
          ) : (
            <div
              className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface hover:bg-white/5 transition-colors"
              onClick={() => openRepeatModal(barContextMenu.barIndex)}
            >
              <PlayIcon />
              Set Repeat
            </div>
          )}

          <div className="h-px bg-white/10 my-1" />
          <div
            className="px-3 py-2 cursor-pointer flex items-center gap-2 text-sm text-on-surface-dim hover:bg-white/5 transition-colors"
            onClick={closeBarContextMenu}
          >
            <CloseIcon />
            Cancel
          </div>
        </div>
      )}

      {/* Repeat Modal */}
      {repeatModal.visible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-surface border border-white/10 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-on-surface">Repeat Bars</h3>
              <button
                className="p-1 text-on-surface-dim hover:text-on-surface rounded-full hover:bg-white/5 transition-colors"
                onClick={closeRepeatModal}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-4 flex-grow">
              <div className="space-y-5">
                <div>
                  <label htmlFor="repetitions" className="block mb-2 font-medium text-on-surface text-sm">
                    Total Repetitions:
                  </label>
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
                    className="w-20 px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-on-surface-dim mt-2">
                    The total count includes the first playthrough (2x means
                    play once, then repeat once).
                  </p>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-on-surface text-sm">Bars to Repeat:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Array(bars)
                      .fill(0)
                      .map((_, idx) => (
                        <button
                          key={idx}
                          className={`w-9 h-9 border rounded-lg flex items-center justify-center font-medium text-sm transition-all
                            ${repeatModal.barsToRepeat.includes(idx)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface-light text-on-surface border-white/10 hover:border-primary'
                            }`}
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
                  <p className="text-xs text-on-surface-dim">
                    Select the bars you want to repeat. At least one bar must be
                    selected.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-white/10 text-on-surface-dim hover:bg-white/5 text-sm font-medium transition-colors"
                onClick={closeRepeatModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
