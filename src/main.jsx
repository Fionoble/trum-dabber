import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import './index.css';
import { LocationProvider, Router } from 'preact-iso';
import { initAuth } from './services/auth';
import { BottomNav } from './components/BottomNav.jsx';
import ProtectedRoute from './pages/shared/ProtectedRoute';

import Editor from './pages/Editor';
import Settings from './pages/Settings';
import TabList from './pages/TabList';
import Help from './pages/Help';
import Login from './pages/Login';
import Signup from './pages/Signup';

function Shell({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cleanup;
    initAuth().then((fn) => {
      cleanup = fn;
      setReady(true);
    });
    return () => { if (cleanup) cleanup(); };
  }, []);

  if (!ready) {
    return (
      <div class="flex items-center justify-center h-screen bg-bg">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <LocationProvider>
      <Shell>
        <main class="flex-1 overflow-y-auto pb-24">
          <Router>
            <Login path="/login" />
            <Signup path="/signup" />
            <Help path="/help" />
            <Editor path="/editor/new" newTab />
            <Editor path="/editor/:id" />
            <ProtectedRoute path="/" component={TabList} />
            <ProtectedRoute path="/settings" component={Settings} />
          </Router>
        </main>
        <BottomNav />
      </Shell>
    </LocationProvider>
  );
}

render(<App />, document.getElementById('app'));
