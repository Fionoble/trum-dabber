import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { isAuthenticated, isLoading } from "../../services/auth";

export default function ProtectedRoute({ component: Component }) {
  const [shouldRender, setShouldRender] = useState(false);
  const { route, url } = useLocation();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading.value && !isAuthenticated.value) {
      // Navigate directly without trying to serialize the location object
      route(`/login?redirect=${encodeURIComponent(url)}`);
    } else if (!isLoading.value && isAuthenticated.value) {
      setShouldRender(true);
    }
  }, [isLoading.value, isAuthenticated.value]);

  // Show loading state if still checking auth
  if (isLoading.value) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Render children only when authenticated
  return shouldRender ? <Component /> : null;
}
