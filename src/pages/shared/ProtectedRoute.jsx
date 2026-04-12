import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { isAuthenticated, isLoading } from "../../services/auth";

export default function ProtectedRoute({ component: Component }) {
  const [shouldRender, setShouldRender] = useState(false);
  const { route, url } = useLocation();

  useEffect(() => {
    if (!isLoading.value && !isAuthenticated.value) {
      route(`/login?redirect=${encodeURIComponent(url)}`);
    } else if (!isLoading.value && isAuthenticated.value) {
      setShouldRender(true);
    }
  }, [isLoading.value, isAuthenticated.value]);

  if (isLoading.value) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return shouldRender ? <Component /> : null;
}
