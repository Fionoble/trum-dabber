import kickSound from "../assets/sounds/kick.wav";
import snareSound from "../assets/sounds/snare.wav";
import hihatSound from "../assets/sounds/hi-hat.wav";
import hihatOpenSound from "../assets/sounds/hi-hat-open.wav";
import tomSound from "../assets/sounds/tom.wav";
import hiTomSound from "../assets/sounds/hi-tom.wav";
import floorTomSound from "../assets/sounds/floor-tom.wav";
import crashSound from "../assets/sounds/crash.wav";
import cowbellSound from "../assets/sounds/cowbell.wav";

export class DrumMachine {
  constructor() {
    this.samples = {};
    this.isLoaded = false;
    this.activeSources = {};
    this.instrumentGroups = {
      hihat: "hihat-group",
      hihatOpen: "hihat-group",
      ride: "ride-group",
      rideBell: "ride-group",
    };
    this._unlocked = false;
    this._initContext();
  }

  _initContext() {
    if (window.sharedAudioContext) {
      this.audioContext = window.sharedAudioContext;
    } else {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      window.sharedAudioContext = this.audioContext;
    }
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.audioContext.destination);
  }

  // iOS requires audio to be triggered from a user gesture.
  // Call this on the first tap/click to unlock playback.
  async unlock() {
    if (this._unlocked) return;
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    // Play a silent buffer to fully unlock on iOS
    const buf = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
    const src = this.audioContext.createBufferSource();
    src.buffer = buf;
    src.connect(this.audioContext.destination);
    src.start(0);
    this._unlocked = true;
  }

  async loadSamples() {
    const sampleList = {
      kick: kickSound,
      snare: snareSound,
      hihat: hihatSound,
      hihatOpen: hihatOpenSound,
      tom: tomSound,
      hiTom: hiTomSound,
      floorTom: floorTomSound,
      crash: crashSound,
      cowbell: cowbellSound,
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
    let frequency, decay, pitchDecay, noiseMix, method;

    switch (type) {
      case "kick":
        frequency = 60;
        decay = 0.15;
        pitchDecay = 0.05;
        noiseMix = 0.1;
        method = "sine";
        break;
      case "snare":
        frequency = 200;
        decay = 0.1;
        pitchDecay = 0.02;
        noiseMix = 0.5;
        method = "mix";
        break;
      case "hihat":
        frequency = 800;
        decay = 0.05;
        pitchDecay = 0.01;
        noiseMix = 0.8;
        method = "noise";
        break;
      case "hihatOpen":
        frequency = 800;
        decay = 0.2; // Longer decay for open hi-hat
        pitchDecay = 0.01;
        noiseMix = 0.8;
        method = "noise";
        break;
      case "tom":
        frequency = 100;
        decay = 0.1;
        pitchDecay = 0.03;
        noiseMix = 0.3;
        method = "mix";
        break;
      case "hiTom":
        frequency = 150;
        decay = 0.08;
        pitchDecay = 0.04;
        noiseMix = 0.2;
        method = "mix";
        break;
      case "floorTom":
        frequency = 80;
        decay = 0.12;
        pitchDecay = 0.04;
        noiseMix = 0.3;
        method = "mix";
        break;
      case "cowbell":
        frequency = 600;
        decay = 0.2;
        pitchDecay = 0.001;
        noiseMix = 0.1;
        method = "square";
        break;
      case "ride":
        frequency = 500;
        decay = 0.15;
        pitchDecay = 0.01;
        noiseMix = 0.6;
        method = "noise";
        break;
      case "rideBell":
        frequency = 800;
        decay = 0.12;
        pitchDecay = 0.005;
        noiseMix = 0.2;
        method = "mix";
        break;
      case "crash":
        frequency = 300;
        decay = 0.08;
        pitchDecay = 0.01;
        noiseMix = 0.7;
        method = "noise";
        break;
      default:
        frequency = 200;
        decay = 0.1;
        pitchDecay = 0.02;
        noiseMix = 0.2;
        method = "sine";
    }

    // Generate sound based on the method
    for (let i = 0; i < channelData.length; i++) {
      const t = i / sampleRate;

      // Calculate amplitude envelope with exponential decay
      const amplitude = Math.exp(-t / decay);

      // Calculate pitch envelope (frequency drops over time for toms and kicks)
      const currentFreq = frequency * Math.exp(-t / pitchDecay);

      let sample = 0;

      if (method === "sine" || method === "mix") {
        // Sine wave component
        sample += Math.sin(2 * Math.PI * currentFreq * t) * (1 - noiseMix);
      }

      if (method === "square" || method === "mix") {
        // Square wave component
        sample +=
          Math.sign(Math.sin(2 * Math.PI * currentFreq * t)) *
          0.5 *
          (1 - noiseMix);
      }

      if (method === "noise" || method === "mix") {
        // Noise component
        sample += (Math.random() * 2 - 1) * noiseMix;
      }

      // Apply amplitude envelope
      channelData[i] = sample * amplitude;
    }

    return buffer;
  }

  async playSound(sampleName, time = 0) {
    if (!this.samples[sampleName]) {
      console.warn(`Sample ${sampleName} not found`);
      return;
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const group = this.instrumentGroups[sampleName];

    if (group && this.activeSources[group]) {
      const now = this.audioContext.currentTime;
      for (const activeSource of this.activeSources[group]) {
        if (activeSource.gainNode && !activeSource.isStopping) {
          activeSource.isStopping = true;
          activeSource.gainNode.gain.cancelScheduledValues(now);
          activeSource.gainNode.gain.setValueAtTime(
            activeSource.gainNode.gain.value,
            now,
          );
          activeSource.gainNode.gain.linearRampToValueAtTime(0, now + 0.01);

          setTimeout(() => {
            try {
              activeSource.source.stop();
            } catch (e) {
              // Ignore errors if already stopped
            }
          }, 15);
        }
      }

      this.activeSources[group] = [];
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.samples[sampleName];

    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(this.audioContext.currentTime + time);

    if (group) {
      if (!this.activeSources[group]) {
        this.activeSources[group] = [];
      }

      this.activeSources[group].push({
        source,
        gainNode,
        isStopping: false,
      });

      source.onended = () => {
        this.activeSources[group] = this.activeSources[group].filter(
          (s) => s.source !== source,
        );
      };
    }

    return { source, gainNode };
  }

  setVolume(level) {
    const volume = Math.max(0, Math.min(1, level));
    this.masterGain.gain.value = volume;
  }

  // Schedule a single step's sounds at a precise audio-clock time
  scheduleStep(pattern, step, sounds, when) {
    sounds.forEach((sound, index) => {
      const cell = pattern[index][step];
      if (cell) {
        const soundToPlay = typeof cell === "string" ? cell : sound;
        this.playSoundAt(soundToPlay, when);
      }
    });
  }

  // Play a sound at a precise audioContext time (non-async, no resume)
  playSoundAt(sampleName, when) {
    if (!this.samples[sampleName]) return;
    const group = this.instrumentGroups[sampleName];

    if (group && this.activeSources[group]) {
      for (const s of this.activeSources[group]) {
        if (s.gainNode && !s.isStopping) {
          s.isStopping = true;
          s.gainNode.gain.cancelScheduledValues(when);
          s.gainNode.gain.setValueAtTime(s.gainNode.gain.value, when);
          s.gainNode.gain.linearRampToValueAtTime(0, when + 0.01);
          try { s.source.stop(when + 0.02); } catch (_) {}
        }
      }
      this.activeSources[group] = [];
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.samples[sampleName];
    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(when);

    if (group) {
      if (!this.activeSources[group]) this.activeSources[group] = [];
      this.activeSources[group].push({ source, gainNode, isStopping: false });
      source.onended = () => {
        this.activeSources[group] = this.activeSources[group].filter(s => s.source !== source);
      };
    }
  }

  // --- Look-ahead sequencer ---
  // Schedules notes using the audio clock, driven by a fast JS timer.
  // onStep(step) is called for UI updates when each step fires.
  startSequencer({ bpm, subdivision, pattern, sounds, totalSteps, getNextStep, onStep, onEnd }) {
    this.stopSequencer();
    if (this.audioContext.state === "suspended") this.audioContext.resume();

    const stepTime = 60 / bpm / subdivision;
    const lookAhead = 0.1;   // schedule 100ms ahead
    const timerInterval = 25; // check every 25ms

    let currentStep = 0;
    let nextStepTime = this.audioContext.currentTime + 0.05; // small initial delay

    const scheduler = () => {
      while (nextStepTime < this.audioContext.currentTime + lookAhead) {
        // Schedule audio at precise time
        this.scheduleStep(pattern, currentStep, sounds, nextStepTime);

        // UI callback (fires immediately, visual will be slightly early but consistent)
        onStep(currentStep);

        nextStepTime += stepTime;
        const next = getNextStep(currentStep, totalSteps);
        if (next === -1) {
          this.stopSequencer();
          if (onEnd) onEnd();
          return;
        }
        currentStep = next;
      }
    };

    this._seqTimer = setInterval(scheduler, timerInterval);
    scheduler(); // run immediately
  }

  stopSequencer() {
    if (this._seqTimer) {
      clearInterval(this._seqTimer);
      this._seqTimer = null;
    }
  }

  // Legacy method kept for single-sound preview on cell tap
  async playStep(pattern, step, sounds) {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    sounds.forEach((sound, index) => {
      const cell = pattern[index][step];
      if (cell) {
        const soundToPlay = typeof cell === "string" ? cell : sound;
        this.playSound(soundToPlay);
      }
    });
  }

  stop() {
    this.stopSequencer();
    // Quick volume fade out to avoid clicks
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);

    Object.keys(this.activeSources).forEach((group) => {
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

    setTimeout(() => {
      this.masterGain.gain.value = 0.7;
    }, 100);

  }

  cleanup() {
    this.stop();

    Object.keys(this.activeSources).forEach((group) => {
      this.activeSources[group] = [];
    });

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch((err) => {
        console.warn("Could not close audio context:", err);
      });
    }
  }
}
