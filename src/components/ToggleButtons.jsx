import React from 'react'

export default function ToggleButtons({ isShuffle, isRepeat, showPlaylist, onToggleShuffle, onToggleRepeat, onTogglePlaylist }) {
  return (
    <div className="toggle-row">
      <div className="toggle-row-inner">
        <button className={`toggle-btn${isShuffle ? ' on' : ''}`} onClick={onToggleShuffle} title="Shuffle">SHF</button>
        <button className={`toggle-btn${isRepeat ? ' on' : ''}`} onClick={onToggleRepeat} title="Repeat">RPT</button>
      </div>
      <div className="toggle-row-inner">
        <button className={`toggle-btn${showPlaylist ? ' on' : ''}`} onClick={onTogglePlaylist} title="Playlist">PL</button>
      </div>
    </div>
  )
}
