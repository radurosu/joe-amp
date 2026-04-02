# JoeAmp

A Winamp 2.x-style music player for macOS, built with Electron and React.

```
┌─────────────────────────────────┐
│ JOEAMP                      _ x │
│ ┌─────────────────────────────┐ │
│ │ Daft Punk - Get Lucky       │ │
│ │  03:28          ▶           │ │
│ └─────────────────────────────┘ │
│ ══════════════════════          │
│ VOL ──────●────                 │
│ ⏮  ▶  ■  ⏭  ▲   SHF RPT PL   │
└─────────────────────────────────┘
│ PLAYLIST EDITOR             _ x │
│  ⠿ 1. Daft Punk - Get Lucky     │
│  ⠿ 2. Tame Impala - Let It Ha.. │
│  ⠿ 3. LCD Soundsystem - All My  │
│ + ADD  - REM  CLR  SAVE         │
│ 3 tracks — 11:42                │
└─────────────────────────────────┘
```

## Features

- Classic Winamp-inspired dark UI with green LCD display
- Play, pause, stop, previous, next transport controls
- Seekable progress bar — click or drag to scrub
- Volume control slider
- Shuffle and repeat modes
- Scrolling title marquee for long track names
- Click the time display to toggle elapsed / remaining
- Playlist editor with drag-to-reorder (grab the `⠿` handle)
- Drag and drop audio files **or entire folders** onto the window
- Drag and drop `.m3u` playlists to load them
- Save the current playlist as an `.m3u` file
- Startup sound on launch
- Keyboard shortcuts

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` | Next track |
| `←` | Previous track |
| `↑` | Volume up |
| `↓` | Volume down |

## Supported Formats

MP3, FLAC, OGG, WAV, M4A, AAC, OPUS, WMA, M3U playlists

## Requirements

- macOS (Apple Silicon or Intel)
- Node.js 18+
- npm 9+

No Xcode required.

## Development

```bash
# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev
```

The app opens automatically. Vite serves the React frontend with hot module replacement; changes to the renderer code reload instantly. Changes to `electron/main.js` or `electron/preload.js` require restarting (`Ctrl+C`, then `npm run dev` again).

## Building

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build
```

The built app is output to `dist-electron/mac-arm64/JoeAmp.app`.

To install:
1. Open `dist-electron/mac-arm64/` in Finder
2. Drag `JoeAmp.app` to `/Applications` or your Desktop
3. First launch: right-click → **Open** to bypass the unsigned app warning
4. Drag from Applications to the Dock for quick access

To regenerate the icon after changes:

```bash
node scripts/make-icon.js
```

## Project Structure

```
joeamp/
├── electron/
│   ├── main.js          # Electron main process — window, IPC, file system
│   └── preload.js       # Context bridge (exposes APIs to renderer)
├── src/
│   ├── App.jsx           # Root component — state, audio wiring, keyboard shortcuts
│   ├── hooks/
│   │   └── useAudioPlayer.js   # Howler.js wrapper
│   ├── components/
│   │   ├── MainPlayer.jsx
│   │   ├── TitleBar.jsx
│   │   ├── LCD.jsx             # Time display + scrolling title
│   │   ├── Controls.jsx        # Transport buttons
│   │   ├── SeekBar.jsx
│   │   ├── VolumeSlider.jsx
│   │   ├── ToggleButtons.jsx   # SHF / RPT / PL
│   │   └── Playlist.jsx        # Playlist editor with drag-to-reorder
│   └── styles/
│       ├── main-player.css
│       └── playlist.css
├── scripts/
│   └── make-icon.js     # Generates public/icon.icns (no Xcode needed)
└── public/
    ├── icon.icns
    └── start.m4a        # Startup sound (bundled as extraResource, not in playlist)
```

## Tech Stack

| Layer | Library |
|-------|---------|
| Shell | [Electron](https://www.electronjs.org/) |
| UI | [React](https://react.dev/) + [Vite](https://vitejs.dev/) |
| Audio | [Howler.js](https://howlerjs.com/) |
| Metadata | [music-metadata](https://github.com/Borewit/music-metadata) |
| Drag-to-reorder | [@dnd-kit](https://dndkit.com/) |
| Packaging | [electron-builder](https://www.electron.build/) |

## License

MIT — © 2026 Radu & AI
