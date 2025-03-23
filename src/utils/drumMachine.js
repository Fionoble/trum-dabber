import kickSound from "../assets/sounds/kick.wav";
import snareSound from "../assets/sounds/snare.wav";
import hihatSound from "../assets/sounds/hi-hat.wav";
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
  }

  async loadSamples() {
    const sampleList = {
      kick: kickSound,
      snare: snareSound,
      hihat: hihatSound,
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
            console.log(`Loaded sample: ${name}`);
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
      case "tom":
        frequency = 100;
        decay = 0.1;
        break;
      case "clap":
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

    const source = this.audioContext.createBufferSource();
    source.buffer = this.samples[sampleName];

    // Create a gain node for this specific sound
    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Start the sound
    source.start(this.audioContext.currentTime + time);
  }

  setVolume(level) {
    // Set volume between 0 and 1
    const volume = Math.max(0, Math.min(1, level));
    this.masterGain.gain.value = volume;
  }

  // Play all sounds for the current step
  playStep(pattern, step, sounds) {
    sounds.forEach((sound, index) => {
      if (pattern[index][step]) {
        this.playSound(sound);
      }
    });
  }

  // Completely stop all audio
  stop() {
    // Quick volume fade out to avoid clicks
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);

    // Reset after fade
    setTimeout(() => {
      this.masterGain.gain.value = 0.7;
    }, 100);
  }
}
