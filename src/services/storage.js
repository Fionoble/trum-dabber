import { supabase } from "./supabase";
import { user } from "./auth";

export class TabStorage {
  constructor() {
    this.tableName = "tabs";
  }

  // Get all tabs for the current user
  async getTabs() {
    try {
      // Check if user is authenticated
      if (!user.value) {
        return this.getLocalTabs(); // Fallback to local storage when not logged in
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", user.value.id)
        .order("modified", { ascending: false });

      if (error) {
        console.error("Error fetching tabs:", error);
        return this.getLocalTabs(); // Fallback to local storage on error
      }

      return data || [];
    } catch (error) {
      console.error("Exception fetching tabs:", error);
      return this.getLocalTabs(); // Fallback to local storage on exception
    }
  }

  // Get a specific tab by ID
  async getTab(id) {
    try {
      if (!user.value) {
        return this.getLocalTab(id);
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.value.id)
        .single();

      if (error) {
        console.error("Error fetching tab:", error);
        return this.getLocalTab(id);
      }

      return data || null;
    } catch (error) {
      console.error("Exception fetching tab:", error);
      return this.getLocalTab(id);
    }
  }

  // Save a new tab or update existing one
  async saveTab(tab) {
    const now = new Date().toISOString();

    try {
      if (!user.value) {
        return this.saveLocalTab(tab);
      }

      // Prepare tab data with user ID
      const tabData = {
        ...tab,
        modified: now,
        user_id: user.value.id,
      };

      // If tab has an ID, update it; otherwise insert a new one
      if (tab.id && !tab.id.startsWith("local-")) {
        const { data, error } = await supabase
          .from(this.tableName)
          .update(tabData)
          .eq("id", tab.id)
          .eq("user_id", user.value.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating tab:", error);
          return this.saveLocalTab(tab);
        }

        return data.id;
      } else {
        // Remove any local ID prefix if it exists
        if (tabData.id && tabData.id.startsWith("local-")) {
          delete tabData.id;
        }

        // Add created timestamp for new tabs
        tabData.created = now;

        const { data, error } = await supabase
          .from(this.tableName)
          .insert(tabData)
          .select()
          .single();

        if (error) {
          console.error("Error inserting tab:", error);
          return this.saveLocalTab(tab);
        }

        return data.id;
      }
    } catch (error) {
      console.error("Exception saving tab:", error);
      return this.saveLocalTab(tab);
    }
  }

  // Delete a tab
  async deleteTab(id) {
    try {
      if (!user.value) {
        return this.deleteLocalTab(id);
      }

      // Store tab for potential recovery
      const tabToDelete = await this.getTab(id);
      if (tabToDelete) {
        this.storeDeletedTab(tabToDelete);
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("id", id)
        .eq("user_id", user.value.id);

      if (error) {
        console.error("Error deleting tab:", error);
        return this.deleteLocalTab(id);
      }

      return true;
    } catch (error) {
      console.error("Exception deleting tab:", error);
      return this.deleteLocalTab(id);
    }
  }

  // Store deleted tab for potential recovery
  async storeDeletedTab(tab) {
    try {
      if (!user.value) {
        return this.storeLocalDeletedTab(tab);
      }

      // Add deletion timestamp
      const tabWithTimestamp = {
        ...tab,
        deletedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("deleted_tabs")
        .insert(tabWithTimestamp);

      if (error) {
        console.error("Error storing deleted tab:", error);
        this.storeLocalDeletedTab(tab);
      }
    } catch (error) {
      console.error("Exception storing deleted tab:", error);
      this.storeLocalDeletedTab(tab);
    }
  }

  // Recover a recently deleted tab
  async recoverDeletedTab(id) {
    try {
      if (!user.value) {
        return this.recoverLocalDeletedTab(id);
      }

      // Get the deleted tab
      const { data: deletedTab, error: fetchError } = await supabase
        .from("deleted_tabs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.value.id)
        .single();

      if (fetchError || !deletedTab) {
        console.error("Error fetching deleted tab:", fetchError);
        return this.recoverLocalDeletedTab(id);
      }

      // Remove deletion-specific fields
      const { deletedAt, ...tabToRecover } = deletedTab;

      // Re-insert into tabs table
      const { error: insertError } = await supabase
        .from(this.tableName)
        .insert(tabToRecover);

      if (insertError) {
        console.error("Error recovering tab:", insertError);
        return this.recoverLocalDeletedTab(id);
      }

      // Remove from deleted_tabs
      await supabase
        .from("deleted_tabs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.value.id);

      return true;
    } catch (error) {
      console.error("Exception recovering tab:", error);
      return this.recoverLocalDeletedTab(id);
    }
  }

  // Toggle favorite status
  async toggleFavorite(id) {
    try {
      if (!user.value) {
        return this.toggleLocalFavorite(id);
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
        return this.toggleLocalFavorite(id);
      }

      return !tab.isFavorite;
    } catch (error) {
      console.error("Exception toggling favorite:", error);
      return this.toggleLocalFavorite(id);
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

  // Migration function to move tabs from localStorage to Supabase (one-time operation)
  async migrateLocalTabsToSupabase() {
    try {
      if (!user.value) {
        return false;
      }

      const localTabs = this.getLocalTabs();

      if (localTabs.length === 0) {
        return true; // No tabs to migrate
      }

      // Add user_id to each tab and ensure IDs don't conflict
      const tabsToMigrate = localTabs.map((tab) => ({
        ...tab,
        id: `migrated-${tab.id}`, // Add prefix to avoid potential conflicts
        user_id: user.value.id,
      }));

      const { error } = await supabase
        .from(this.tableName)
        .insert(tabsToMigrate);

      if (error) {
        console.error("Error migrating tabs:", error);
        return false;
      }

      // Clear local storage after successful migration
      localStorage.removeItem("trum-dabber-tabs");
      localStorage.removeItem("trum-dabber-deleted-tabs");
      localStorage.removeItem("trum-dabber-favorites");

      return true;
    } catch (error) {
      console.error("Exception migrating tabs:", error);
      return false;
    }
  }

  // LOCAL STORAGE FALLBACK METHODS
  // These methods will be used when user is not authenticated or when there are API errors

  getLocalTabs() {
    const tabsJson = localStorage.getItem("trum-dabber-tabs");
    return tabsJson ? JSON.parse(tabsJson) : [];
  }

  getLocalTab(id) {
    const tabs = this.getLocalTabs();
    return tabs.find((tab) => tab.id === id) || null;
  }

  saveLocalTab(tab) {
    const tabs = this.getLocalTabs();
    const now = new Date().toISOString();

    // If tab has an ID, it's an update
    if (tab.id) {
      const index = tabs.findIndex((t) => t.id === tab.id);
      if (index !== -1) {
        tabs[index] = {
          ...tab,
          modified: now,
        };
      } else {
        tabs.push({
          ...tab,
          created: now,
          modified: now,
        });
      }
    } else {
      // New tab with local ID prefix
      tabs.push({
        ...tab,
        id: `local-${Date.now()}`,
        created: now,
        modified: now,
      });
    }

    localStorage.setItem("trum-dabber-tabs", JSON.stringify(tabs));
    return tab.id || tabs[tabs.length - 1].id;
  }

  deleteLocalTab(id) {
    const tabs = this.getLocalTabs();
    const tabToDelete = tabs.find((tab) => tab.id === id);

    if (!tabToDelete) {
      return false;
    }

    const newTabs = tabs.filter((tab) => tab.id !== id);
    localStorage.setItem("trum-dabber-tabs", JSON.stringify(newTabs));

    this.storeLocalDeletedTab(tabToDelete);
    return true;
  }

  storeLocalDeletedTab(tab) {
    const deletedTabs = JSON.parse(
      localStorage.getItem("trum-dabber-deleted-tabs") || "[]",
    );
    deletedTabs.push({ ...tab, deletedAt: new Date().toISOString() });

    // Only keep the last 5 deleted tabs
    if (deletedTabs.length > 5) {
      deletedTabs.shift();
    }

    localStorage.setItem(
      "trum-dabber-deleted-tabs",
      JSON.stringify(deletedTabs),
    );
  }

  recoverLocalDeletedTab(id) {
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
    const tabs = this.getLocalTabs();
    delete tabToRecover.deletedAt;
    tabs.push(tabToRecover);
    localStorage.setItem("trum-dabber-tabs", JSON.stringify(tabs));

    return true;
  }

  toggleLocalFavorite(id) {
    const tabs = this.getLocalTabs();
    const index = tabs.findIndex((tab) => tab.id === id);

    if (index !== -1) {
      tabs[index].isFavorite = !tabs[index].isFavorite;
      localStorage.setItem("trum-dabber-tabs", JSON.stringify(tabs));
      return tabs[index].isFavorite;
    }
    return false;
  }
}

export const tabStorage = new TabStorage();
