import { useState } from "preact/hooks";
import {
  signUp,
  signInWithGoogle,
  authError,
  isAuthenticated,
} from "../../services/auth";
import { useLocation } from "preact-iso";
import { Icon } from "../../components/Icon";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { route } = useLocation();

  if (isAuthenticated.value) route("/");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      return setFormError("Passwords do not match");
    }

    if (password.length < 6) {
      return setFormError("Password must be at least 6 characters");
    }

    setLoading(true);
    const successful = await signUp(email, password);
    setLoading(false);

    if (successful) {
      setSuccess(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="music_note" size="text-3xl" className="text-primary" filled />
          </div>
          <h1 className="text-3xl font-bold text-on-surface">Create Account</h1>
          <p className="text-on-surface-dim text-sm">
            Sign up to start creating and saving beats
          </p>
        </div>

        {(formError || authError.value) && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm" role="alert">
            {formError || authError.value}
          </div>
        )}

        {success && (
          <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl text-sm" role="alert">
            <p>Account created! Please check your email to confirm your registration.</p>
            <a href="/login" className="font-medium underline mt-2 inline-block">
              Go to Login
            </a>
          </div>
        )}

        {!success && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-on-surface placeholder-on-surface-dim/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-on-surface placeholder-on-surface-dim/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-on-surface placeholder-on-surface-dim/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-bg text-on-surface-dim">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3 bg-surface border border-white/10 rounded-xl text-on-surface text-sm font-medium hover:bg-surface-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              {googleLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </>
              )}
            </button>

            <div className="text-center text-sm pt-2">
              <p className="text-on-surface-dim">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:text-primary-light font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
