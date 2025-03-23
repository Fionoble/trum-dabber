// import { useState, useEffect } from "preact/hooks";
// import "./styles.scss";
// import { tabStorage } from "../../services/storage";

// export default function Settings() {
//   // Audio settings
//   const [volume, setVolume] = useState(70);
//   const [audioLatency, setAudioLatency] = useState("low");
//   const [metronomeEnabled, setMetronomeEnabled] = useState(false);
//   const [preCountBars, setPreCountBars] = useState(1);

//   // Appearance settings
//   const [theme, setTheme] = useState("system");
//   const [gridDensity, setGridDensity] = useState("medium");
//   const [colorScheme, setColorScheme] = useState("default");

//   // Storage settings
//   const [autoSaveInterval, setAutoSaveInterval] = useState(60);
//   const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 });

//   // Feature flags
//   const [betaFeatures, setBetaFeatures] = useState(false);

//   // Account settings (mock data - would come from user authentication in a real app)
//   const [userData, setUserData] = useState({
//     email: "user@example.com",
//     name: "Demo User",
//     created: "2023-01-15"
//   });

//   // Settings status
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

//   // Load settings on mount
//   useEffect(() => {
//     // In a real app, you would fetch these values from a settings store
//     // For demo purposes, we'll simulate loading with a small delay
//     const loadSettings = async () => {
//       try {
//         // Simulate API delay
//         await new Promise(resolve => setTimeout(resolve, 300));

//         // Get number of tabs to calculate storage usage
//         const tabs = tabStorage.getTabs();
//         const usedSpace = Math.min(tabs.length * 0.5, 5);
//         setStorageUsage({ used: usedSpace, total: 5 });

//         // In a real implementation, you would load actual saved settings
//         // For example:
//         // const savedSettings = localStorage.getItem('trum-dabber-settings');
//         // if (savedSettings) {
//         //   const parsed = JSON.parse(savedSettings);
//         //   setVolume(parsed.volume);
//         //   setTheme(parsed.theme);
//         //   // etc.
//         // }
//       } catch (error) {
//         console.error("Failed to load settings:", error);
//       }
//     };

//     loadSettings();
//   }, []);

//   // Save all settings
//   const saveSettings = async () => {
//     setIsSaving(true);
//     try {
//       // Simulate saving delay
//       await new Promise(resolve => setTimeout(resolve, 800));

//       // In a real implementation, you would save to localStorage or an API
//       // localStorage.setItem('trum-dabber-settings', JSON.stringify({
//       //   volume,
//       //   theme,
//       //   audioLatency,
//       //   // etc.
//       // }));

//       setSaveSuccess(true);
//       setTimeout(() => setSaveSuccess(false), 3000);
//     } catch (error) {
//       console.error("Failed to save settings:", error);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // Handle account deletion
//   const handleAccountDelete = async () => {
//     try {
//       // In a real app, this would call your backend API
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Clear all local data
//       localStorage.clear();

//       // Redirect to a logged out state or homepage
//       window.location.href = "/";
//     } catch (error) {
//       console.error("Failed to delete account:", error);
//     }
//   };

//   // Exports all user data as a JSON file
//   const exportUserData = () => {
//     try {
//       const tabs = tabStorage.getTabs();
//       const exportData = {
//         userData,
//         settings: {
//           volume,
//           theme,
//           colorScheme,
//           audioLatency,
//           metronomeEnabled,
//           preCountBars,
//           gridDensity,
//           autoSaveInterval,
//           betaFeatures
//         },
//         tabs
//       };

//       const dataStr = JSON.stringify(exportData, null, 2);
//       const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

//       const exportFileDefaultName = 'dabber-user-data.json';
//       const linkElement = document.createElement('a');
//       linkElement.setAttribute('href', dataUri);
//       linkElement.setAttribute('download', exportFileDefaultName);
//       linkElement.click();
//     } catch (error) {
//       console.error("Failed to export user data:", error);
//     }
//   };

//   // Clear all local beats data
//   const clearAllBeats = async () => {
//     if (confirm("Are you sure you want to delete all your beats? This action cannot be undone.")) {
//       // Clear all tabs from storage
//       localStorage.setItem(tabStorage.storageKey, '[]');

//       // Update storage usage
//       setStorageUsage({ used: 0, total: 5 });
//     }
//   };

//   return (
//     <div className="settings-container p-4 max-w-4xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">Settings</h1>

//       {/* Save notification */}
//       {saveSuccess && (
//         <div className="save-notification bg-green-100 text-green-700 p-4 rounded-md mb-6 flex items-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//           </svg>
//           Settings saved successfully
//         </div>
//       )}

//       {/* Audio Settings */}
//       <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4 flex items-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
//           </svg>
//           Audio Settings
//         </h2>

//         {/* Master Volume */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Master Volume: {volume}%
//           </label>
//           <div className="flex items-center">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
//             </svg>

//             <input
//               type="range"
//               min="0"
//               max="100"
//               value={volume}
//               onChange={(e) => setVolume(parseInt(e.target.value))}
//               className="slider flex-grow"
//             />

//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-2" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
//             </svg>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">
//             Adjusts the overall volume of all sounds in the app.
//           </p>
//         </div>

//         {/* Audio Latency */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Audio Latency
//           </label>
//           <select
//             value={audioLatency}
//             onChange={(e) => setAudioLatency(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//           >
//             <option value="lowest">Lowest (may be unstable)</option>
//             <option value="low">Low (recommended)</option>
//             <option value="medium">Medium</option>
//             <option value="high">High (most stable)</option>
//           </select>
//           <p className="text-xs text-gray-500 mt-1">
//             Lower latency gives more responsive playback but may cause audio glitches on some devices.
//           </p>
//         </div>

//         {/* Metronome Settings */}
//         <div className="mb-4">
//           <div className="flex items-center">
//             <input
//               type="checkbox"
//               id="metronome"
//               checked={metronomeEnabled}
//               onChange={(e) => setMetronomeEnabled(e.target.checked)}
//               className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
//             />
//             <label htmlFor="metronome" className="ml-2 block text-sm text-gray-700">
//               Enable Metronome
//             </label>
//           </div>
//           <p className="text-xs text-gray-500 mt-1 ml-6">
//             Plays an audible click on each beat during playback and recording.
//           </p>
//         </div>

//         {/* Pre-count Bars (only visible when metronome is enabled) */}
//         {metronomeEnabled && (
//           <div className="mb-4 ml-6">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Pre-count Bars: {preCountBars}
//             </label>
//             <input
//               type="range"
//               min="0"
//               max="4"
//               step="1"
//               value={preCountBars}
//               onChange={(e) => setPreCountBars(parseInt(e.target.value))}
//               className="slider w-full"
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               Number of bars to count before starting playback (0 to disable).
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Appearance Settings */}
//       <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4 flex items-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
//           </svg>
//           Appearance
//         </h2>

//         {/* Theme Selection */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Theme
//           </label>
//           <div className="flex flex-wrap gap-3">
//             <ThemeOption
//               value="light"
//               label="Light"
//               selected={theme}
//               onChange={setTheme}
//               icon={
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
//                 </svg>
//               }
//             />

//             <ThemeOption
//               value="dark"
//               label="Dark"
//               selected={theme}
//               onChange={setTheme}
//               icon={
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
//                 </svg>
//               }
//             />

//             <ThemeOption
//               value="system"
//               label="System"
//               selected={theme}
//               onChange={setTheme}
//               icon={
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
//                 </svg>
//               }
//             />
//           </div>
//         </div>

//         {/* Grid Density */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Grid Density
//           </label>
//           <select
//             value={gridDensity}
//             onChange={(e) => setGridDensity(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//           >
//             <option value="compact">Compact (more cells visible)</option>
//             <option value="medium">Medium</option>
//             <option value="comfortable">Comfortable (larger cells)</option>
//           </select>
//           <p className="text-xs text-gray-500 mt-1">
//             Controls the size and spacing of cells in the beat grid.
//           </p>
//         </div>

//         {/* Color Scheme */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Color Scheme
//           </label>
//           <div className="color-schemes flex flex-wrap gap-2">
//             <ColorSchemeOption
//               value="default"
//               colors={["#4f46e5", "#4ade80", "#f87171"]}
//               selected={colorScheme}
//               onChange={setColorScheme}
//             />
//             <ColorSchemeOption
//               value="sunset"
//               colors={["#f59e0b", "#ef4444", "#8b5cf6"]}
//               selected={colorScheme}
//               onChange={setColorScheme}
//             />
//             <ColorSchemeOption
//               value="ocean"
//               colors={["#0ea5e9", "#14b8a6", "#6366f1"]}
//               selected={colorScheme}
//               onChange={setColorScheme}
//             />
//             <ColorSchemeOption
//               value="forest"
//               colors={["#22c55e", "#84cc16", "#0ea5e9"]}
//               selected={colorScheme}
//               onChange={setColorScheme}
//             />
//             <ColorSchemeOption
//               value="monochrome"
//               colors={["#000000", "#4b5563", "#9ca3af"]}
//               selected={colorScheme}
//               onChange={setColorScheme}
//             />
//           </div>
//           <p className="text-xs text-gray-500 mt-1">
//             Changes the color palette used throughout the application.
//           </p>
//         </div>
//       </div>

//       {/* Data and Storage */}
//       <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4 flex items-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
//             <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
//             <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
//           </svg>
//           Data &amp; Storage
//         </h2>

//         {/* Auto-Save Interval */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Auto-Save Interval: {autoSaveInterval === 0 ? "Off" : `${autoSaveInterval} seconds`}
//           </label>
//           <input
//             type="range"
//             min="0"
//             max="300"
//             step="30"
//             value={autoSaveInterval}
//             onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
//             className="slider w-full"
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             How often your work is automatically saved. Set to 0 to disable auto-save.
//           </p>
//         </div>

//         {/* Storage Usage */}
//         <div className="mb-4">
//           <div className="flex justify-between items-center mb-1">
//             <label className="block text-sm font-medium text-gray-700">
//               Storage Usage
//             </label>
//             <span className="text-xs text-gray-500">
//               {storageUsage.used.toFixed(1)} MB of {storageUsage.total} MB used
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2.5">
//             <div
//               className="bg-indigo-600 h-2.5 rounded-full"
//               style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
//             ></div>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">
//             Local storage used by your beats and settings.
//           </p>
//         </div>

//         {/* Data Management Buttons */}
//         <div className="flex flex-wrap gap-3 mt-6">
//           <button
//             onClick={exportUserData}
//             className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//             </svg>
//             Export Data
//           </button>

//           <button
//             onClick={clearAllBeats}
//             className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
//             </svg>
//             Clear All Beats
//           </button>
//         </div>
//       </div>

//       {/* Experimental Features */}
//       <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4 flex items-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//           </svg>
//           Experimental Features
//         </h2>

//         <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-md">
//           <div>
//             <h3 className="font-medium text-indigo-900">Beta Features</h3>
//             <p className="text-sm text-indigo-700">
//               Enable upcoming experimental features. These may be unstable.
//             </p>
//           </div>

//           <label className="switch">
//             <input
//               type="checkbox"
//               checked={betaFeatures}
//               onChange={(e) => setBetaFeatures(e.target.checked)}
//             />
//             <span className="slider-toggle round"></span>
//           </label>
//         </div>

//         {betaFeatures && (
//           <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-md">
//             <h4 className="font-medium text-yellow-800 mb-2">Active Beta Features</h4>
//             <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
//               <li>MIDI controller support</li>
//               <li>Effect plugins</li>
//               <li>Sample import from URL</li>
//               <li>Collaborative editing (coming soon)</li>
//             </ul>
//           </div>
//         )}
//       </div>

//       {/* Account Management */}
//       <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4 flex items-center">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//           </svg>
//           Account
//         </h2>

//         <div className="mb-6">
//           <div className="flex items-center mb-4">
//             <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mr-4">
//               {userData.name.charAt(0)}
//             </div>
//             <div>
//               <h3 className="font-medium">{userData.name}</h3>
//               <p className="text-sm text-gray-500">{userData.email}</p>
//               <p className="text-xs text-gray-400">Member since {new Date(userData.created).toLocaleDateString()}</p>
//             </div>
//           </div>
//         </div>

//         {/* Account actions */}
//         <div>
//           <h4 className="text-sm font-medium text-gray-700 mb-2">Account Actions</h4>

//           <div className="space-y-3">
//             <button className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-left">
//               <div className="flex items-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
//                   <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
//                 </svg>
//                 <span>Edit Profile</span>
//               </div>
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//               </svg>
//             </button>

//             <button className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-left">
//               <div className="flex items-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
//                 </svg>
//                 <span>Change Password</span>
//               </div>
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//               </svg>
//             </button>

//             <button
//               className="w-full flex items-center justify-between px-4 py-2 bg-red-50 hover:bg-red-100 rounded-md text-left text-red-600"
//               onClick={() => setShowDeleteConfirm(true)}
//             >
//               <div className="flex items-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
//                 </svg>
//                 <span>Delete Account</span>
//               </div>
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Save Button */}
//       <div className="sticky bottom-4 bg-white rounded-lg shadow-lg p-4 flex justify-end">
//         <button
//           onClick={saveSettings}
//           disabled={isSaving}
//           className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
//         >
//           {isSaving ? (
//             <>
//               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//               Saving...
//             </>
//           ) : (
//             <>
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//               </svg>
//               Save Settings
//             </>
//           )}
//         </button>
//       </div>

//       {/* Delete Account Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
//             <h3 className="text-xl font-bold text-red-600 mb-4">Delete Account</h3>
//             <p className="mb-6 text-gray-700">
//               Are you sure you want to delete your account? This action is permanent and cannot be undone. All your beats and settings will be lost.
//             </p>

//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowDeleteConfirm(false)}
//                 className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAccountDelete}
//                 className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
//               >
//                 Yes, Delete My Account
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
//        }

//        // Theme option component
//        const ThemeOption = ({ value, label, selected, onChange, icon }) => {
//          return (
//            <button
//              className={`px-3 py-2 rounded-md flex items-center ${selected === value ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600' : 'bg-gray-100 hover:bg-gray-200'}`}
//              onClick={() => onChange(value)}
//            >
//              <div className="mr-2">{icon}</div>
//              <span>{label}</span>
//            </button>
//          );
//        };

//        // Color scheme option component
//        const ColorSchemeOption = ({ value, colors, selected, onChange }) => {
//          return (
//            <button
//              className={`p-1 rounded-md ${selected === value ? 'ring-2 ring-indigo-500' : 'hover:ring-2 hover:ring-gray-300'}`}
//              onClick={() => onChange(value)}
//              title={value.charAt(0).toUpperCase() + value.slice(1)}
//            >
//              <div className="flex">
//                {colors.map((color, i) => (
//                  <div
//                    key={i}
//                    className="h-8 w-8 first:rounded-l-sm last:rounded-r-sm"
//                    style={{ backgroundColor: color }}
//                  ></div>
//                ))}
//              </div>
//            </button>
//          );
//        };

//        export default Settings;

export default function Settings() {
  return (
    <div>
      <h1>Settings</h1>
    </div>
  );
}
