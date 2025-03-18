import { render } from "preact";
import "./index.css";
import { LocationProvider, Router } from "preact-iso";

// Pages
import Editor from "./pages/Editor";
import Settings from "./pages/Settings";
import TabList from "./pages/TabList";
import Frame from "./pages/shared/Frame";

function App() {
  return (
    <LocationProvider>
      <Frame>
        <Router>
          <TabList path="/" />
          <Editor path="/editor" />
          <Settings path="/settings" />
        </Router>
      </Frame>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
