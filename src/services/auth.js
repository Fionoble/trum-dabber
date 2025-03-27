import { supabase } from "./supabase";
import { signal } from "@preact/signals";

// Create signals for auth state
export const user = signal(null);
export const isAuthenticated = signal(false);
export const isLoading = signal(true);
export const authError = signal(null);

// Initialize auth on app load
export async function initAuth() {
  isLoading.value = true;

  try {
    // Get initial session using getSession() properly
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Set user and auth state based on session
    if (session) {
      user.value = session.user;
      isAuthenticated.value = true;
    } else {
      user.value = null;
      isAuthenticated.value = false;
    }

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        user.value = session?.user || null;
        isAuthenticated.value = !!session?.user;
      },
    );

    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  } catch (error) {
    console.error("Auth initialization error:", error);
    user.value = null;
    isAuthenticated.value = false;
  } finally {
    isLoading.value = false;
  }
}

// Sign in with email and password
export async function signIn(email, password) {
  authError.value = null;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      authError.value = error.message;
      return false;
    }

    user.value = data.user;
    isAuthenticated.value = true;
    return true;
  } catch (error) {
    authError.value = error.message;
    return false;
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  authError.value = null;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      authError.value = error.message;
      return false;
    }

    return true;
  } catch (error) {
    authError.value = error.message;
    return false;
  }
}

// Sign up with email and password
export async function signUp(email, password) {
  authError.value = null;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      authError.value = error.message;
      return false;
    }

    user.value = user;
    return true;
  } catch (error) {
    authError.value = error.message;
    return false;
  }
}

// Sign out
export async function signOut() {
  authError.value = null;
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      authError.value = error.message;
      return false;
    }

    return true;
  } catch (error) {
    authError.value = error.message;
    return false;
  }
}

// Reset password
export async function resetPassword(email) {
  authError.value = null;
  try {
    const { data, error } =
      await supabase.auth.api.resetPasswordForEmail(email);

    if (error) {
      authError.value = error.message;
      return false;
    }

    return true;
  } catch (error) {
    authError.value = error.message;
    return false;
  }
}
