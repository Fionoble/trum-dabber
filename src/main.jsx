import { render } from "preact";
import { useEffect } from "preact/hooks";
import "./index.css";
import { LocationProvider, Router } from "preact-iso";
import { initAuth } from "./services/auth";
import ProtectedRoute from "./pages/shared/ProtectedRoute";

// Pages
import Editor from "./pages/Editor";
import Settings from "./pages/Settings";
import TabList from "./pages/TabList";
import Help from "./pages/Help";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Frame from "./pages/shared/Frame";

function App() {
  useEffect(() => {
    const cleanup = initAuth();
    return cleanup;
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      // Pause any audio elements
      const audioContexts = document.querySelectorAll("audio");
      audioContexts.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
        }
      });
      // Stop the drum machine if it exists
      if (window.globalDrumMachine) {
        window.globalDrumMachine.stop();
      }
    };
    
    // Create a more focused observer to specifically detect route changes
    // This only triggers on navigationEnd events from the router
    const handleRouteFromRouter = () => {
      console.log('Router change detected, stopping drum machine if needed');
      handleRouteChange();
    };
    
    // Add listeners for route changes
    window.addEventListener('popstate', handleRouteChange);
    document.addEventListener('routeChangeComplete', handleRouteFromRouter);
    
    // Create a simple location listener 
    let lastPath = window.location.pathname;
    const locationCheckInterval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        console.log(`Path changed: ${lastPath} -> ${currentPath}`);
        lastPath = currentPath;
        handleRouteChange();
      }
    }, 200); // Check every 200ms
    
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      document.removeEventListener('routeChangeComplete', handleRouteFromRouter);
      clearInterval(locationCheckInterval);
    };
  }, []);

  return (
    <LocationProvider>
      <Frame>
        <Router>
          <Login path="/login" />
          <Signup path="/signup" />
          <Help path="/help" />
          <Editor path="/editor/new" newTab />
          <Editor path="/editor/:id" />
          <ProtectedRoute path="/" component={TabList} />
          <ProtectedRoute path="/settings" component={Settings} />
        </Router>
      </Frame>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
