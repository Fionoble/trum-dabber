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

  return (
    <LocationProvider>
      <Frame>
        <Router>
          <Login path="/login" />
          <Signup path="/signup" />
          <Help path="/help" />
          <Editor path="/editor" />
          <ProtectedRoute path="/" component={TabList} />
          <ProtectedRoute path="/settings" component={Settings} />
        </Router>
      </Frame>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
