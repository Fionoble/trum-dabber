[![Netlify Status](https://api.netlify.com/api/v1/badges/ebcba1d1-572d-4fd3-b162-79e4249044e4/deploy-status)](https://app.netlify.com/sites/trum-dabber/deploys)

# Drum Dabber

A drum-tab editor and step sequencer built as a Progressive Web App. Write out grooves on a grid, hit play to hear them through real drum samples, and save your tabs to come back to — all from your phone or desktop, even offline.

> 🌱 **A personal project.** Drum Dabber is just one of a handful of small PWAs I build for myself to help with everyday life — not a commercial product, just my own everyday tools.

## Features

- **Grid-based tab editor** — Lay out beats across bars and subdivisions, one row per instrument
- **Built-in drum machine** — Plays back your tab with sampled kick, snare, hi-hats (closed/open), toms, crash, ride, and cowbell using the Web Audio API
- **Per-instrument controls** — Add, remove, reorder (drag-and-drop), duplicate, hide, and solo instrument rows
- **Adjustable tempo and bars** — Set the BPM and grow your pattern across multiple bars
- **Tab library** — Save tabs, name them, and reopen or edit them later
- **Settings** — Customize your default instrument set and preferences
- **Offline-first** — Tabs and settings persist in `localStorage`; installable as a PWA with a service worker

## Tech Stack

- **UI**: [Preact](https://preactjs.com/) + [@preact/signals](https://preactjs.com/guide/v10/signals/)
- **Routing**: [preact-iso](https://github.com/preactjs/preact-iso)
- **Audio**: Web Audio API (custom `DrumMachine`) with `.wav` samples
- **Drag & drop**: [dnd-kit](https://dndkit.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Build**: [Vite](https://vite.dev/)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox
- **Deploy**: [Netlify](https://www.netlify.com/)

## Getting Started

```bash
git clone https://github.com/Fionoble/trum-dabber.git
cd trum-dabber
pnpm install
pnpm dev
```

Requires [Node.js](https://nodejs.org/) 18+ and [pnpm](https://pnpm.io/). The dev server runs at `http://localhost:5173`.

### Build

```bash
pnpm build
pnpm preview
```

## Using Drum Dabber

1. From the tab list, create a **new tab**
2. Tap cells on the grid to place hits; adjust tempo and add bars as you go
3. Hit **play** to hear it; use solo/hide to focus on individual instruments
4. **Save** your tab — it'll be waiting in your library next time

### Install on your phone

- **iOS (Safari)** — Share → Add to Home Screen
- **Android (Chrome)** — Menu → Install app
