import { createContext } from "preact";
import { useState, useEffect, useContext } from "preact/hooks";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    const session = supabase.auth.getSession();
    setUser(session?.user || null);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      },
    );

    // setLoading(false);

    // Cleanup function
    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    setError(null);
    try {
      const { user, error } = await supabase.auth.signIn({ email, password });

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password) => {
    setError(null);
    try {
      const { user, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError(null);
    try {
      const { data, error } =
        await supabase.auth.api.resetPasswordForEmail(email);

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading,
    error,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
