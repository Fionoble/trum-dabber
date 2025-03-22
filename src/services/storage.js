export class TabStorage {
  constructor() {
    this.storageKey = "trum-dabber-tabs";
    this.favoriteKey = "trum-dabber-favorites";
  }

  // Get all tabs
  getTabs() {
    const tabsJson = localStorage.getItem(this.storageKey);
    return tabsJson ? JSON.parse(tabsJson) : [];
  }

  // Get a specific tab by ID
  getTab(id) {
    const tabs = this.getTabs();
    return tabs.find((tab) => tab.id === id) || null;
  }

  // Save a new tab or update existing one
  saveTab(tab) {
    const tabs = this.getTabs();
    const now = new Date().toISOString();

    // If tab has an ID, it's an update
    if (tab.id) {
      const index = tabs.findIndex((t) => t.id === tab.id);
      if (index !== -1) {
        // Update existing tab
        tabs[index] = {
          ...tab,
          modified: now,
        };
      } else {
        // Add as new if ID not found
        tabs.push({
          ...tab,
          created: now,
          modified: now,
        });
      }
    } else {
      // New tab
      tabs.push({
        ...tab,
        id: `tab-${Date.now()}`,
        created: now,
        modified: now,
      });
    }

    localStorage.setItem(this.storageKey, JSON.stringify(tabs));
    return tab.id || tabs[tabs.length - 1].id;
  }

  deleteTab(id) {
    const tabs = this.getTabs();
    const tabToDelete = tabs.find((tab) => tab.id === id);

    if (!tabToDelete) {
      return false;
    }

    const newTabs = tabs.filter((tab) => tab.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(newTabs));

    // Store the deleted tab temporarily in case of accidental deletion
    const deletedTabs = JSON.parse(
      localStorage.getItem("trum-dabber-deleted-tabs") || "[]",
    );
    deletedTabs.push({ ...tabToDelete, deletedAt: new Date().toISOString() });

    // Only keep the last 5 deleted tabs
    if (deletedTabs.length > 5) {
      deletedTabs.shift();
    }

    localStorage.setItem(
      "trum-dabber-deleted-tabs",
      JSON.stringify(deletedTabs),
    );
    return true;
  }

  // New method to recover recently deleted tabs
  recoverDeletedTab(id) {
    const deletedTabs = JSON.parse(
      localStorage.getItem("trum-dabber-deleted-tabs") || "[]",
    );
    const tabToRecover = deletedTabs.find((tab) => tab.id === id);

    if (!tabToRecover) {
      return false;
    }

    // Remove from deleted tabs
    localStorage.setItem(
      "trum-dabber-deleted-tabs",
      JSON.stringify(deletedTabs.filter((tab) => tab.id !== id)),
    );

    // Add back to regular tabs
    const tabs = this.getTabs();
    delete tabToRecover.deletedAt;
    tabs.push(tabToRecover);
    localStorage.setItem(this.storageKey, JSON.stringify(tabs));

    return true;
  }

  // Toggle favorite status
  toggleFavorite(id) {
    const tabs = this.getTabs();
    const index = tabs.findIndex((tab) => tab.id === id);

    if (index !== -1) {
      tabs[index].isFavorite = !tabs[index].isFavorite;
      localStorage.setItem(this.storageKey, JSON.stringify(tabs));
      return tabs[index].isFavorite;
    }
    return false;
  }

  // Create a new empty tab template
  createEmptyTab(name = "New Beat") {
    const drumSounds = ["kick", "snare", "hihat", "tom", "clap"];
    const steps = 16;

    return {
      name,
      bpm: 120,
      tags: [],
      timeSignature: {
        numerator: 4,
        denominator: 4,
      },
      tracks: drumSounds.map((sound, index) => ({
        id: `track-${index + 1}`,
        name: sound,
        sound: sound,
        pattern: Array(steps).fill(false),
      })),
      measures: 1,
      stepsPerMeasure: 16,
      volume: 0.7,
      isFavorite: false,
    };
  }
}

export const tabStorage = new TabStorage();
