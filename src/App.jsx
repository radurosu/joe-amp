import React, { useReducer, useCallback } from 'react'
import { useAudioPlayer } from './hooks/useAudioPlayer.js'
import MainPlayer from './components/MainPlayer.jsx'
import Playlist from './components/Playlist.jsx'

// --- State ---
const initialState = {
  playlist: [],
  currentIndex: -1,
  volume: 0.8,
  isShuffle: false,
  isRepeat: false,
  showPlaylist: true,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TRACKS': {
      const existing = new Set(state.playlist.map((t) => t.path))
      const newTracks = action.tracks.filter((t) => !existing.has(t.path))
      const playlist = [...state.playlist, ...newTracks]
      const currentIndex = state.currentIndex === -1 && playlist.length > 0 ? 0 : state.currentIndex
      return { ...state, playlist, currentIndex }
    }
    case 'REMOVE_TRACK': {
      const playlist = state.playlist.filter((_, i) => i !== action.index)
      let currentIndex = state.currentIndex
      if (action.index === currentIndex) currentIndex = playlist.length > 0 ? Math.min(currentIndex, playlist.length - 1) : -1
      else if (action.index < currentIndex) currentIndex--
      return { ...state, playlist, currentIndex }
    }
    case 'REORDER_TRACKS':
      return { ...state, playlist: action.playlist }
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.index }
    case 'SET_VOLUME':
      return { ...state, volume: action.volume }
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffle: !state.isShuffle }
    case 'TOGGLE_REPEAT':
      return { ...state, isRepeat: !state.isRepeat }
    case 'TOGGLE_PLAYLIST':
      return { ...state, showPlaylist: !state.showPlaylist }
    default:
      return state
  }
}

// --- Helpers ---
function buildTrack(filePath, meta) {
  return {
    id: `${filePath}-${Date.now()}-${Math.random()}`,
    path: filePath,
    fileUrl: 'joeamp://local/' + encodeURIComponent(filePath),
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    duration: meta.duration,
  }
}

async function loadFiles(filePaths) {
  const metaList = await window.winampAPI.readMetadataBatch(filePaths)
  return filePaths.map((fp, i) => buildTrack(fp, metaList[i]))
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { playlist, currentIndex, volume, isShuffle, isRepeat, showPlaylist } = state
  const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null

  const handleEnd = useCallback(() => {
    if (isRepeat) {
      // handled by re-playing same track via status reset in hook — just re-trigger play
      dispatch({ type: 'SET_CURRENT_INDEX', index: currentIndex })
    } else if (isShuffle) {
      const next = Math.floor(Math.random() * playlist.length)
      dispatch({ type: 'SET_CURRENT_INDEX', index: next })
    } else if (currentIndex < playlist.length - 1) {
      dispatch({ type: 'SET_CURRENT_INDEX', index: currentIndex + 1 })
    }
  }, [currentIndex, playlist.length, isShuffle, isRepeat])

  const audio = useAudioPlayer({ track: currentTrack, volume, onEnd: handleEnd })

  // Auto-play when track changes (but not on first mount with no track)
  const prevIndexRef = React.useRef(currentIndex)
  React.useEffect(() => {
    if (currentIndex !== prevIndexRef.current && currentIndex >= 0) {
      audio.play()
    }
    prevIndexRef.current = currentIndex
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // File loading
  const addFilePaths = useCallback(async (filePaths) => {
    if (!filePaths.length) return
    const tracks = await loadFiles(filePaths)
    dispatch({ type: 'ADD_TRACKS', tracks })
  }, [])

  const handleOpenFiles = useCallback(async () => {
    const filePaths = await window.winampAPI.openFiles()
    await addFilePaths(filePaths)
  }, [addFilePaths])

  // Document-level drag & drop — more reliable in Electron than React synthetic events
  React.useEffect(() => {
    const onDragEnter = (e) => e.preventDefault()
    const onDragOver = (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
    const onDrop = async (e) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      const rawPaths = files.map((f) => window.winampAPI.getPathForFile(f)).filter(Boolean)
      const filePaths = await window.winampAPI.resolveDropped(rawPaths)
      await addFilePaths(filePaths)
    }
    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [addFilePaths])

  // Controls
  const handlePrev = useCallback(() => {
    if (playlist.length === 0) return
    const idx = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    dispatch({ type: 'SET_CURRENT_INDEX', index: idx })
  }, [currentIndex, playlist.length])

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return
    const idx = isShuffle
      ? Math.floor(Math.random() * playlist.length)
      : (currentIndex + 1) % playlist.length
    dispatch({ type: 'SET_CURRENT_INDEX', index: idx })
  }, [currentIndex, playlist.length, isShuffle])

  const handlePlay = useCallback(() => {
    if (currentIndex === -1 && playlist.length > 0) {
      dispatch({ type: 'SET_CURRENT_INDEX', index: 0 })
    } else {
      audio.play()
    }
  }, [audio, currentIndex, playlist.length])

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); audio.status === 'playing' ? audio.pause() : handlePlay() }
      if (e.code === 'ArrowRight') handleNext()
      if (e.code === 'ArrowLeft') handlePrev()
      if (e.code === 'ArrowUp') dispatch({ type: 'SET_VOLUME', volume: Math.min(1, volume + 0.05) })
      if (e.code === 'ArrowDown') dispatch({ type: 'SET_VOLUME', volume: Math.max(0, volume - 0.05) })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [audio, handlePlay, handleNext, handlePrev, volume])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '275px' }}>
      <MainPlayer
        status={audio.status}
        currentTime={audio.currentTime}
        duration={audio.duration}
        volume={volume}
        currentTrack={currentTrack}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        showPlaylist={showPlaylist}
        onPlay={handlePlay}
        onPause={audio.pause}
        onStop={audio.stop}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={audio.seek}
        onVolumeChange={(v) => dispatch({ type: 'SET_VOLUME', volume: v })}
        onToggleShuffle={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
        onToggleRepeat={() => dispatch({ type: 'TOGGLE_REPEAT' })}
        onTogglePlaylist={() => dispatch({ type: 'TOGGLE_PLAYLIST' })}
        onOpenFiles={handleOpenFiles}
      />
      {showPlaylist && (
        <Playlist
          tracks={playlist}
          currentIndex={currentIndex}
          onTrackSelect={(i) => dispatch({ type: 'SET_CURRENT_INDEX', index: i })}
          onAddFiles={handleOpenFiles}
          onRemoveTrack={(i) => dispatch({ type: 'REMOVE_TRACK', index: i })}
          onReorder={(pl) => dispatch({ type: 'REORDER_TRACKS', playlist: pl })}
          onClose={() => dispatch({ type: 'TOGGLE_PLAYLIST' })}
        />
      )}
    </div>
  )
}
