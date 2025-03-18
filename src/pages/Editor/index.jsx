import { useState, useEffect, useRef } from "preact/hooks";
import { DrumMachine } from "../../utils/drumMachine";
import "./styles.scss";

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

  // Refs
  const drumMachineRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize drum machine
  useEffect(() => {
    const initDrumMachine = async () => {
      drumMachineRef.current = new DrumMachine();
      await drumMachineRef.current.loadSamples();
      setIsLoaded(true);
    };

    initDrumMachine();

    // Cleanup on component unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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

  // Change BPM
  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    setBpm(newBpm);

    // Restart playback with new tempo if currently playing
    if (isPlaying) {
      clearInterval(intervalRef.current);
      togglePlayback();
    }
  };

  return (
    <div className="editor-container p-4">
      <h1 className="text-2xl font-bold mb-4">Drum Sequencer</h1>

      {/* Controls */}
      <div className="controls flex items-center mb-6 gap-4">
        <button
          onClick={togglePlayback}
          disabled={!isLoaded}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:transform active:translate-y-0.5 active:bg-opacity-90 disabled:opacity-50"
        >
          {isPlaying ? "Stop" : "Play"}
        </button>

        <div className="flex items-center">
          <label htmlFor="bpm" className="mr-2">
            BPM:
          </label>
          <input
            id="bpm"
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={handleBpmChange}
            className="w-32"
          />
          <span className="ml-2">{bpm}</span>
        </div>
      </div>

      {/* Loading state */}
      {!isLoaded && (
        <div className="text-center py-8">Loading drum samples...</div>
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
