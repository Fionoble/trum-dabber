import { render } from "preact";
import "./index.css";
import { LocationProvider, Router } from "preact-iso";

// Pages
import Editor from "./pages/Editor";
import Settings from "./pages/Settings";
import TabList from "./pages/TabList";
import Help from "./pages/Help";
import Frame from "./pages/shared/Frame";

function App() {
  return (
    <LocationProvider>
      <Frame>
        <Router>
          <TabList path="/" />
          <Editor path="/editor" />
          <Settings path="/settings" />
          <Help path="/help" />
        </Router>
      </Frame>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
