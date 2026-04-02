import React from 'react'
import '../styles/main-player.css'
import TitleBar from './TitleBar.jsx'
import LCD from './LCD.jsx'
import SeekBar from './SeekBar.jsx'
import Controls from './Controls.jsx'
import VolumeSlider from './VolumeSlider.jsx'
import ToggleButtons from './ToggleButtons.jsx'

export default function MainPlayer({
  status, currentTime, duration, volume, currentTrack,
  isShuffle, isRepeat, showPlaylist,
  onPlay, onPause, onStop, onNext, onPrev,
  onSeek, onVolumeChange,
  onToggleShuffle, onToggleRepeat, onTogglePlaylist,
  onOpenFiles,
}) {
  return (
    <div className="main-player">
      <TitleBar />
      <LCD
        currentTrack={currentTrack}
        currentTime={currentTime}
        duration={duration}
        status={status}
      />
      <SeekBar currentTime={currentTime} duration={duration} onSeek={onSeek} />
      <div className="sliders-row">
        <VolumeSlider volume={volume} onChange={onVolumeChange} />
      </div>
      <Controls
        status={status}
        onPlay={onPlay}
        onPause={onPause}
        onStop={onStop}
        onPrev={onPrev}
        onNext={onNext}
        onOpenFiles={onOpenFiles}
      />
      <ToggleButtons
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        showPlaylist={showPlaylist}
        onToggleShuffle={onToggleShuffle}
        onToggleRepeat={onToggleRepeat}
        onTogglePlaylist={onTogglePlaylist}
      />
    </div>
  )
}
