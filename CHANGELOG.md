# Changelog

All notable changes to JoeAmp are documented here.

## [1.0.0] — 2026-04-01

### Added

- Classic Winamp 2.x-inspired UI with dark chrome and green LCD display
- Audio playback via Howler.js — play, pause, stop, seek, volume control
- Playlist editor with drag-to-reorder (`@dnd-kit`)
- Shuffle and repeat modes
- Scrolling marquee for long track names
- Click time display to toggle elapsed / remaining
- Drag and drop audio files onto the window
- Drag and drop entire folders — recursively loads all audio files
- Drag and drop `.m3u` playlists to load them
- Save current playlist as `.m3u` via native save dialog
- Open files via native file picker (supports MP3, FLAC, OGG, WAV, M4A, AAC, OPUS, WMA)
- Keyboard shortcuts: Space, arrow keys for navigation and volume
- Auto-advance to next track on end; shuffle picks a random next track
- Custom `joeamp://` protocol for secure local file playback (no `webSecurity: false`)
- Icon generated with pure Node.js + macOS `iconutil` — no Xcode required
- macOS `.app` bundle via `electron-builder`
