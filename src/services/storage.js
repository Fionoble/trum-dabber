import { supabase } from "./supabase";
import { user, isAuthenticated } from "./auth";

const DEFAULT_INSTRUMENTS = [
  "hihat",
  "hiTom",
  "snare",
  "crash",
  "kick",
  "floorTom",
];
const SETTINGS_TABLE = "user_settings";

export class TabStorage {
  constructor() {
    this.tableName = "tabs";
    this.settingsTable = SETTINGS_TABLE;
  }

  // Get user-configured instruments or return default ones
  async getUserInstruments() {
    try {
      // Return default instruments if not logged in
      if (!isAuthenticated.value) {
        return DEFAULT_INSTRUMENTS;
      }

      // Try to get user's instrument settings from Supabase
      const { data, error } = await supabase
        .from(this.settingsTable)
        .select("settings")
        .eq("user_id", user.value.id)
        .eq("key", "instruments")
        .single();

      if (error || !data) {
        // If no settings found or there was an error, use default
        console.log("No saved instruments found, using defaults");
        // Save the defaults for next time
        this.saveUserInstruments(DEFAULT_INSTRUMENTS);
        return DEFAULT_INSTRUMENTS;
      }

      // Return the instruments from the settings
      return data.settings.instruments || DEFAULT_INSTRUMENTS;
    } catch (error) {
      console.error("Error getting instruments:", error);
      // Return default instruments on error
      return DEFAULT_INSTRUMENTS;
    }
  }

  // Save user-configured instruments
  async saveUserInstruments(instruments) {
    try {
      // Don't save if not logged in
      if (!isAuthenticated.value) {
        console.log("User not authenticated, can't save instruments");
        return false;
      }

      // Check if a settings record already exists
      const { data: existingData, error: checkError } = await supabase
        .from(this.settingsTable)
        .select("id")
        .eq("user_id", user.value.id)
        .eq("key", "instruments")
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "No rows returned"
        console.error("Error checking settings:", checkError);
        return false;
      }

      if (existingData) {
        // Update existing settings
        const { error } = await supabase
          .from(this.settingsTable)
          .update({
            settings: { instruments },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);

        if (error) {
          console.error("Error updating instruments:", error);
          return false;
        }
      } else {
        // Insert new settings
        const { error } = await supabase.from(this.settingsTable).insert({
          user_id: user.value.id,
          key: "instruments",
          settings: { instruments },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error inserting instruments:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving instruments:", error);
      return false;
    }
  }
  
  // Get playback settings
  async getPlaybackSettings() {
    try {
      const defaultSettings = {
        countIn: false,
        loopPlayback: true
      };
      
      // Return defaults if not logged in
      if (!isAuthenticated.value) {
        return defaultSettings;
      }

      // Try to get user's playback settings from Supabase
      const { data, error } = await supabase
        .from(this.settingsTable)
        .select("settings")
        .eq("user_id", user.value.id)
        .eq("key", "playback")
        .single();

      if (error || !data) {
        // If no settings found or there was an error, use default
        console.log("No saved playback settings found, using defaults");
        // Save the defaults for next time
        this.savePlaybackSettings(defaultSettings);
        return defaultSettings;
      }

      // Return the settings
      return {
        ...defaultSettings,
        ...data.settings
      };
    } catch (error) {
      console.error("Error getting playback settings:", error);
      // Return defaults on error
      return {
        countIn: false,
        loopPlayback: true
      };
    }
  }

  // Save playback settings
  async savePlaybackSettings(settings) {
    try {
      // Don't save if not logged in
      if (!isAuthenticated.value) {
        console.log("User not authenticated, can't save playback settings");
        return false;
      }

      // Check if a settings record already exists
      const { data: existingData, error: checkError } = await supabase
        .from(this.settingsTable)
        .select("id")
        .eq("user_id", user.value.id)
        .eq("key", "playback")
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "No rows returned"
        console.error("Error checking settings:", checkError);
        return false;
      }

      if (existingData) {
        // Update existing settings
        const { error } = await supabase
          .from(this.settingsTable)
          .update({
            settings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);

        if (error) {
          console.error("Error updating playback settings:", error);
          return false;
        }
      } else {
        // Insert new settings
        const { error } = await supabase.from(this.settingsTable).insert({
          user_id: user.value.id,
          key: "playback",
          settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error inserting playback settings:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving playback settings:", error);
      return false;
    }
  }

  // Get a generic setting by key
  async getSetting(key, defaults = {}) {
    try {
      if (!isAuthenticated.value) return defaults;

      const { data, error } = await supabase
        .from(this.settingsTable)
        .select("settings")
        .eq("user_id", user.value.id)
        .eq("key", key)
        .single();

      if (error || !data) return defaults;

      return { ...defaults, ...data.settings };
    } catch (error) {
      console.error(`Error getting setting "${key}":`, error);
      return defaults;
    }
  }

  // Save a generic setting by key
  async saveSetting(key, settings) {
    try {
      if (!isAuthenticated.value) return false;

      const { data: existingData, error: checkError } = await supabase
        .from(this.settingsTable)
        .select("id")
        .eq("user_id", user.value.id)
        .eq("key", key)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error(`Error checking setting "${key}":`, checkError);
        return false;
      }

      if (existingData) {
        const { error } = await supabase
          .from(this.settingsTable)
          .update({ settings, updated_at: new Date().toISOString() })
          .eq("id", existingData.id);

        if (error) {
          console.error(`Error updating setting "${key}":`, error);
          return false;
        }
      } else {
        const { error } = await supabase.from(this.settingsTable).insert({
          user_id: user.value.id,
          key,
          settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`Error inserting setting "${key}":`, error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Error saving setting "${key}":`, error);
      return false;
    }
  }

  // Get all tabs for the current user
  async getTabs() {
    try {
      // Only get tabs if user is authenticated
      if (!isAuthenticated.value) {
        return []; // Return empty array if not logged in
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", user.value.id)
        .order("modified", { ascending: false });

      if (error) {
        console.error("Error fetching tabs:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Exception fetching tabs:", error);
      return []; // Return empty array on error
    }
  }

  // Get a specific tab by ID
  async getTab(id) {
    try {
      if (!isAuthenticated.value) {
        return null; // Return null if not logged in
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.value.id)
        .single();

      if (error) {
        console.error("Error fetching tab:", error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error("Exception fetching tab:", error);
      return null;
    }
  }

  // Save a new tab or update existing one
  async saveTab(tab) {
    try {
      if (!isAuthenticated.value) {
        // Inform user they need to be logged in
        alert("Please log in to save your beat");
        return null;
      }

      const now = new Date().toISOString();

      // Prepare tab data with user ID
      const tabData = {
        ...tab,
        modified: now,
        user_id: user.value.id,
      };

      // If tab has an ID and it's a valid UUID, update it
      if (tab.id && this.isValidUUID(tab.id)) {
        const { data, error } = await supabase
          .from(this.tableName)
          .update(tabData)
          .eq("id", tab.id)
          .eq("user_id", user.value.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating tab:", error);
          throw error;
        }

        return data.id;
      } else {
        // This is a new tab, remove any ID so Supabase can generate a UUID
        const { id, ...dataWithoutId } = tabData;

        // Add created timestamp for new tabs
        dataWithoutId.created = now;

        const { data, error } = await supabase
          .from(this.tableName)
          .insert(dataWithoutId)
          .select()
          .single();

        if (error) {
          console.error("Error inserting tab:", error);
          throw error;
        }

        return data.id;
      }
    } catch (error) {
      console.error("Exception saving tab:", error);
      throw error; // Re-throw to allow handling at the UI level
    }
  }

  // Delete a tab
  async deleteTab(id) {
    try {
      if (!isAuthenticated.value) {
        return false;
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (error) {
        console.error("Error deleting tab:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception deleting tab:", error);
      return false;
    }
  }

  // Toggle favorite status
  async toggleFavorite(id) {
    try {
      if (!isAuthenticated.value) {
        return false;
      }

      // Get current tab
      const tab = await this.getTab(id);
      if (!tab) {
        return false;
      }

      // Toggle the favorite status
      const { error } = await supabase
        .from(this.tableName)
        .update({ isFavorite: !tab.isFavorite })
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (error) {
        console.error("Error toggling favorite:", error);
        return false;
      }

      return !tab.isFavorite;
    } catch (error) {
      console.error("Exception toggling favorite:", error);
      return false;
    }
  }

  // Create a new empty tab template
  async createEmptyTab(name = "New Beat") {
    const drumSounds = await this.getUserInstruments();
    const steps = 16;

    return {
      name,
      bpm: 120,
      tags: [],
      timeSignature: {
        numerator: 4,
        denominator: 4,
      },
      // Store the instrument order for future compatibility
      instrumentOrder: [...drumSounds],
      tracks: drumSounds.map((sound) => ({
        id: `track-${sound}`,
        name: sound,
        sound: sound,
        pattern: Array(steps).fill(false),
        // Add special states for hihat
        ...(sound === "hihat"
          ? {
              states: [false, "hihat", "hihatOpen"],
            }
          : {}),
      })),
      measures: 1,
      stepsPerMeasure: 16,
      volume: 0.7,
      isFavorite: false,
    };
  }

  // Helper method to validate UUID format
  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

export const tabStorage = new TabStorage();
