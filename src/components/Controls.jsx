import React from 'react'

export default function Controls({ status, onPlay, onPause, onStop, onPrev, onNext, onOpenFiles }) {
  return (
    <div className="controls-row">
      <button className="ctrl-btn prev" onClick={onPrev} title="Previous">⏮</button>
      {status === 'playing'
        ? <button className="ctrl-btn pause" onClick={onPause} title="Pause">⏸</button>
        : <button className="ctrl-btn play" onClick={onPlay} title="Play">▶</button>
      }
      <button className="ctrl-btn stop" onClick={onStop} title="Stop">■</button>
      <button className="ctrl-btn next" onClick={onNext} title="Next">⏭</button>
      <button className="ctrl-btn open" onClick={onOpenFiles} title="Open files">▲</button>
    </div>
  )
}
