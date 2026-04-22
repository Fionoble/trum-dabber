const DEFAULT_INSTRUMENTS = [
  "hihat",
  "hiTom",
  "snare",
  "crash",
  "kick",
  "floorTom",
];

const TABS_KEY = "dabber_tabs";
const SETTINGS_KEY = "dabber_settings";

function generateId() {
  return crypto.randomUUID();
}

function loadTabs() {
  try {
    return JSON.parse(localStorage.getItem(TABS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTabs(tabs) {
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

function loadSetting(key, defaults) {
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return all[key] ? { ...defaults, ...all[key] } : defaults;
  } catch {
    return defaults;
  }
}

function saveSettingToStore(key, value) {
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    all[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export class TabStorage {
  async getUserInstruments() {
    return loadSetting("instruments", null)?.instruments || DEFAULT_INSTRUMENTS;
  }

  async saveUserInstruments(instruments) {
    return saveSettingToStore("instruments", { instruments });
  }

  async getPlaybackSettings() {
    return loadSetting("playback", { countIn: false, loopPlayback: true });
  }

  async savePlaybackSettings(settings) {
    return saveSettingToStore("playback", settings);
  }

  async getSetting(key, defaults = {}) {
    return loadSetting(key, defaults);
  }

  async saveSetting(key, settings) {
    return saveSettingToStore(key, settings);
  }

  async getTabs() {
    const tabs = loadTabs();
    tabs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    return tabs;
  }

  async getTab(id) {
    const tabs = loadTabs();
    return tabs.find((t) => t.id === id) || null;
  }

  async saveTab(tab) {
    const tabs = loadTabs();
    const now = new Date().toISOString();

    if (tab.id) {
      const index = tabs.findIndex((t) => t.id === tab.id);
      if (index !== -1) {
        tabs[index] = { ...tab, modified: now };
        saveTabs(tabs);
        return tab.id;
      }
    }

    const newTab = { ...tab, id: generateId(), created: now, modified: now };
    delete newTab.user_id;
    tabs.push(newTab);
    saveTabs(tabs);
    return newTab.id;
  }

  async deleteTab(id) {
    const tabs = loadTabs();
    const filtered = tabs.filter((t) => t.id !== id);
    if (filtered.length === tabs.length) return false;
    saveTabs(filtered);
    return true;
  }

  async createEmptyTab(name = "New Beat") {
    const drumSounds = await this.getUserInstruments();
    const steps = 16;

    return {
      name,
      bpm: 120,
      tags: [],
      timeSignature: { numerator: 4, denominator: 4 },
      instrumentOrder: [...drumSounds],
      tracks: drumSounds.map((sound) => ({
        id: `track-${sound}`,
        name: sound,
        sound: sound,
        pattern: Array(steps).fill(false),
        ...(sound === "hihat"
          ? { states: [false, "hihat", "hihatOpen"] }
          : {}),
      })),
      measures: 1,
      stepsPerMeasure: 16,
      volume: 0.7,
      isFavorite: false,
    };
  }
}

export const tabStorage = new TabStorage();
