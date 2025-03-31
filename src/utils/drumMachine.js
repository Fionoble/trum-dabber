import kickSound from "../assets/sounds/kick.wav";
import snareSound from "../assets/sounds/snare.wav";
import hihatSound from "../assets/sounds/hi-hat.wav";
import hihatOpenSound from "../assets/sounds/hi-hat-open.wav";
import tomSound from "../assets/sounds/tom.wav";
import crashSound from "../assets/sounds/crash.wav";

export class DrumMachine {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.samples = {};
    this.isLoaded = false;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7; // Set default volume
    this.masterGain.connect(this.audioContext.destination);
    
    // Track active sound sources by instrument group
    this.activeSources = {};
    
    // Define instrument groups (sounds that should cut each other off)
    this.instrumentGroups = {
      "hihat": "hihat-group",
      "hihatOpen": "hihat-group"
    };
  }

  async loadSamples() {
    const sampleList = {
      kick: kickSound,
      snare: snareSound,
      hihat: hihatSound,
      hihatOpen: hihatOpenSound,
      tom: tomSound,
      crash: crashSound,
    };

    try {
      const loadPromises = Object.entries(sampleList).map(
        async ([name, url]) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to load sample: ${name}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            this.samples[name] =
              await this.audioContext.decodeAudioData(arrayBuffer);
          } catch (err) {
            console.error(`Error loading sample ${name}:`, err);
            // Provide fallback for missing samples - create a simple tone
            this.samples[name] = this.createTone(name);
          }
        },
      );

      await Promise.all(loadPromises);
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error("Error loading samples:", error);
      return false;
    }
  }

  // Create a simple tone as fallback for missing samples
  createTone(type) {
    // Create a buffer for a simple synthetic drum sound
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(
      1,
      sampleRate * 0.5,
      sampleRate,
    );
    const channelData = buffer.getChannelData(0);

    // Different frequency and decay for different drum types
    let frequency, decay;

    switch (type) {
      case "kick":
        frequency = 60;
        decay = 0.15;
        break;
      case "snare":
        frequency = 200;
        decay = 0.1;
        break;
      case "hihat":
        frequency = 800;
        decay = 0.05;
        break;
      case "hihatOpen":
        frequency = 800;
        decay = 0.2; // Longer decay for open hi-hat
        break;
      case "tom":
        frequency = 100;
        decay = 0.1;
        break;
      case "crash":
        frequency = 300;
        decay = 0.08;
        break;
      default:
        frequency = 200;
        decay = 0.1;
    }

    // Simple sine wave with exponential decay
    for (let i = 0; i < channelData.length; i++) {
      const t = i / sampleRate;
      channelData[i] =
        Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t / decay);
    }

    return buffer;
  }

  playSound(sampleName, time = 0) {
    if (!this.samples[sampleName]) {
      console.warn(`Sample ${sampleName} not found`);
      return;
    }

    // Resume audio context if it's suspended (needed due to autoplay policies)
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    // Check if this sound is part of an instrument group (like hi-hats)
    const group = this.instrumentGroups[sampleName];
    
    // If this sound is part of a group and there's an active sound playing in that group
    if (group && this.activeSources[group]) {
      // Stop all active sources in this group with a quick fade-out
      const now = this.audioContext.currentTime;
      for (const activeSource of this.activeSources[group]) {
        if (activeSource.gainNode && !activeSource.isStopping) {
          // Mark as stopping to avoid multiple fades
          activeSource.isStopping = true;
          // Quick fade out to avoid clicks (10ms)
          activeSource.gainNode.gain.cancelScheduledValues(now);
          activeSource.gainNode.gain.setValueAtTime(activeSource.gainNode.gain.value, now);
          activeSource.gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
          
          // Schedule source stop after fade out
          setTimeout(() => {
            try {
              activeSource.source.stop();
            } catch (e) {
              // Ignore errors if already stopped
            }
          }, 15);
        }
      }
      
      // Clear the active sources for this group
      this.activeSources[group] = [];
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.samples[sampleName];

    // Create a gain node for this specific sound
    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Start the sound
    source.start(this.audioContext.currentTime + time);
    
    // If this sound is part of a group, add it to active sources
    if (group) {
      if (!this.activeSources[group]) {
        this.activeSources[group] = [];
      }
      
      // Store both the source and its gain node so we can fade it out later
      this.activeSources[group].push({
        source,
        gainNode,
        isStopping: false
      });
      
      // Set up event listener to remove the source when it finishes naturally
      source.onended = () => {
        this.activeSources[group] = this.activeSources[group].filter(s => s.source !== source);
      };
    }
    
    return { source, gainNode };
  }

  setVolume(level) {
    // Set volume between 0 and 1
    const volume = Math.max(0, Math.min(1, level));
    this.masterGain.gain.value = volume;
  }

  // Play all sounds for the current step
  playStep(pattern, step, sounds) {
    // Sort the indices to ensure hi-hat closed plays after hi-hat open
    // This ensures that if both are on the same step, the closed hi-hat chokes the open
    
    // First, get all the active sounds for this step
    const activeSounds = [];
    
    sounds.forEach((sound, index) => {
      const cell = pattern[index][step];
      if (cell) {
        // If the cell contains a string (sound name), use it; otherwise use the default sound
        const soundToPlay = typeof cell === 'string' ? cell : sound;
        activeSounds.push({ index, soundToPlay });
      }
    });
    
    // Sort the activeSounds so that hi-hat closed plays after hi-hat open
    // This ensures the choke behavior works consistently in a step
    activeSounds.sort((a, b) => {
      // If 'a' is hihatOpen and 'b' is hihat, then 'a' should play first
      if (a.soundToPlay === 'hihatOpen' && b.soundToPlay === 'hihat') return -1;
      // If 'a' is hihat and 'b' is hihatOpen, then 'b' should play first
      if (a.soundToPlay === 'hihat' && b.soundToPlay === 'hihatOpen') return 1;
      // Otherwise, preserve original order
      return a.index - b.index;
    });
    
    // Play the sounds in the sorted order
    activeSounds.forEach(({ soundToPlay }) => {
      this.playSound(soundToPlay);
    });
  }

  stop() {
    // Quick volume fade out to avoid clicks
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);

    // Stop all active sources
    Object.keys(this.activeSources).forEach(group => {
      if (this.activeSources[group]) {
        for (const activeSource of this.activeSources[group]) {
          try {
            if (activeSource.source) {
              activeSource.source.stop();
            }
          } catch (e) {
            // Ignore errors if already stopped
          }
        }
        this.activeSources[group] = [];
      }
    });

    // Reset after fade
    setTimeout(() => {
      this.masterGain.gain.value = 0.7;
    }, 100);

    // Suspend audio context after stopping (reduces resource usage)
    setTimeout(() => {
      if (this.audioContext && this.audioContext.state === "running") {
        this.audioContext.suspend().catch((err) => {
          console.warn("Could not suspend audio context:", err);
        });
      }
    }, 200);
  }

  // Add a cleanup method for complete destruction
  cleanup() {
    this.stop();
    
    // Clear all active sources
    Object.keys(this.activeSources).forEach(group => {
      this.activeSources[group] = [];
    });

    // Close the audio context completely when no longer needed
    // Note: Only call this when you're truly done with the context
    // as creating a new one is resource-intensive
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch((err) => {
        console.warn("Could not close audio context:", err);
      });
    }
  }
}
