import { useState } from "preact/hooks";
import {
  signIn,
  signInWithGoogle,
  resetPassword,
  authError,
  isAuthenticated,
} from "../../services/auth";
import { useLocation } from "preact-iso";
import { useSignal } from "@preact/signals";
import SpinnerIcon from "../../assets/icons/Spinner.svg.jsx";
import LockIcon from "../../assets/icons/Lock.svg.jsx";
import GoogleIcon from "../../assets/icons/Google.svg.jsx";
import "./styles.scss";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const resetSuccess = useSignal(false);
  const { route, query } = useLocation();

  const redirectPath = new URLSearchParams(query).get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resetMode) {
      setLoading(true);
      const success = await resetPassword(email);
      setLoading(false);
      if (success) resetSuccess.value = true;
      return;
    }

    setLoading(true);
    const success = await signIn(email, password);
    setLoading(false);

    if (success) route(redirectPath);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    // Note: we don't need to handle success here as Supabase will redirect
    // the browser after successful authentication
    setGoogleLoading(false);
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Dabber</h2>
          <p className="mt-2 text-sm text-gray-600">
            {resetMode
              ? "Enter your email to reset your password"
              : "Sign in to access your beats"}
          </p>
        </div>

        {authError.value && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{authError.value}</span>
          </div>
        )}

        {resetSuccess.value && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">
              Password reset link sent! Check your email.
            </span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!resetMode && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required={!resetMode}
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {!resetMode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <span className="text-white">
                    <SpinnerIcon />
                  </span>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockIcon />
                </span>
              )}
              {resetMode ? "Send Reset Link" : "Sign in"}
            </button>
          </div>

          {!resetMode && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {googleLoading ? (
                    <span className="text-gray-600 mr-2">
                      <SpinnerIcon />
                    </span>
                  ) : (
                    <>
                      <GoogleIcon />
                      Sign in with Google
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {resetMode ? (
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to login
              </button>
            </div>
          ) : (
            <div className="text-center text-sm">
              <p>
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
