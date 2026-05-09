import { render } from 'preact';
import './index.css';
import { LocationProvider, Router } from 'preact-iso';
import { BottomNav } from './components/BottomNav.jsx';

import Editor from './pages/Editor';
import Settings from './pages/Settings';
import TabList from './pages/TabList';
import Help from './pages/Help';

function App() {
  return (
    <LocationProvider>
      <main class="flex-1 overflow-y-auto pb-24 pt-safe">
        <Router>
          <Help path="/help" />
          <Editor path="/editor/new" newTab />
          <Editor path="/editor/:id" />
          <TabList path="/" />
          <Settings path="/settings" />
        </Router>
      </main>
      <BottomNav />
    </LocationProvider>
  );
}

render(<App />, document.getElementById('app'));
