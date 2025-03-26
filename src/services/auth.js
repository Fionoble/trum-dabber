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
  // Get initial session
  const session = supabase.auth.getSession();
  user.value = session?.user || null;
  isAuthenticated.value = !!session?.user;

  // Set up auth state change listener
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_, session) => {
      user.value = session?.user || null;
      isAuthenticated.value = !!session?.user;
    },
  );

  isLoading.value = false;

  // Return unsubscribe function
  return () => {
    if (authListener?.unsubscribe) {
      authListener.unsubscribe();
    }
  };
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
