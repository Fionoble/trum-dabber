import { supabase } from "./supabase";
import { user, isAuthenticated } from "./auth";

export class TabStorage {
  constructor() {
    this.tableName = "tabs";
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

  // Helper method to validate UUID format
  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

export const tabStorage = new TabStorage();
