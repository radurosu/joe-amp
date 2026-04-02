# Developer Notes — JoeAmp

Context and decisions that aren't obvious from reading the code.

---

## Architecture in one paragraph

Electron shell (`electron/main.js`) creates a frameless window and handles all Node.js work — file dialogs, metadata reading, directory scanning, playlist saving, and serving local audio files. The React app (`src/`) runs in the Chromium renderer and never touches the filesystem directly. Everything crosses the boundary via IPC, exposed through `electron/preload.js` as `window.winampAPI`.

---

## Key decisions and why

### Custom `joeamp://` protocol (not `file://`)
In dev mode the page loads from `http://localhost:5173`. Chromium blocks loading `file://` audio from an `http://` origin (mixed content). Instead of disabling `webSecurity`, we registered a custom privileged scheme `joeamp://` that proxies to `file://` via `net.fetch`. This keeps security intact and works identically in dev and production.

### `html5: true` in Howler
Required for local file playback. Without it, Howler uses Web Audio API + XHR to fetch audio, which is blocked for `file://` URLs. With `html5: true` it uses an `<audio>` element which our custom protocol supports fine.

### Single BrowserWindow, CSS panels
Classic Winamp has separate draggable sub-windows. We use one `BrowserWindow` with absolutely positioned divs. Simpler IPC, no inter-window state sync. The playlist panel is toggled with CSS, not by resizing the window.

### `music-metadata` dynamic import
`music-metadata` v11 is pure ESM. `electron/main.js` uses CommonJS (`require`). Fix: `await import('music-metadata')` inside each IPC handler. Slightly slower on first call but clean — no need to convert the whole main process to ESM.

### Startup sound as `extraResources`
`public/start.m4a` is bundled outside the `.asar` archive (via `extraResources` in `package.json`). Chromium cannot load audio from inside an asar via `<audio>`. In dev the file is served by Vite from `public/`; in production the main process returns its absolute path via `app:startSoundPath` IPC and the renderer loads it via `joeamp://`. It is played as a fire-and-forget `Howl` and never added to the playlist.

### No TypeScript
Kept intentionally simple. Plain JS + React functional components throughout.

### electron-builder `files` config
Do **not** add `"!node_modules/**/*"` to the `files` array. electron-builder includes production `node_modules` automatically — explicitly excluding them breaks `music-metadata` in the packaged app (we learned this the hard way).

---

## `window.winampAPI` surface

Defined in `electron/preload.js`. Everything the renderer can call:

| Method | What it does |
|--------|-------------|
| `openFiles()` | Native file picker → array of paths |
| `readMetadata(path)` | ID3 tags for one file |
| `readMetadataBatch(paths[])` | ID3 tags for many files |
| `getPathForFile(file)` | Electron `webUtils.getPathForFile` — needed for drag & drop in Electron 32+ (`.path` no longer exists on File objects) |
| `resolveDropped(paths[])` | Expands directories recursively, parses `.m3u` files, returns flat array of audio paths |
| `savePlaylist(tracks[])` | Native save dialog → writes `.m3u` |
| `getStartSoundPath()` | Returns `null` in dev, absolute path to `start.m4a` in production |
| `closeWindow()` | Closes the BrowserWindow |
| `minimizeWindow()` | Minimizes the BrowserWindow |

---

## Adding a feature — checklist

1. **New IPC call needed?** Add handler in `electron/main.js`, expose in `electron/preload.js`, restart Electron (Vite hot-reload does not cover main/preload changes).
2. **New audio format?** Add extension to `AUDIO_EXTS` in `main.js` and to the `filters` array in `dialog:openFiles`.
3. **New player state?** Add to `initialState` and `reducer` in `src/App.jsx`, wire props down through `MainPlayer.jsx`.
4. **New bundled asset?** Put it in `public/`, add to `extraResources` in `package.json` if it needs to be loadable as audio/media in the packaged app.

---

## Known rough edges

- **No code signing** — `identity: null` in `package.json`. macOS Gatekeeper will block the first launch; users must right-click → Open. Proper signing needs an Apple Developer account ($99/yr).
- **arm64 only** — build target is `arm64`. Add `x64` to the arch array for Intel Mac support (untested).
- **Repeat mode** — dispatches `SET_CURRENT_INDEX` with the same index to re-trigger the auto-play effect. Works but is a slight hack; a cleaner approach would be a dedicated `REPLAY` action.
- **No persist** — playlist and volume are not saved between sessions. `localStorage` or `electron-store` would fix this.

---

## Build commands

```bash
npm run dev                                        # dev mode
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build   # build DMG (arm64)
node scripts/make-icon.js                         # regenerate icon.icns
```

---

*JoeAmp — Radu & AI, 2026*
