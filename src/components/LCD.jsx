import React, { useRef, useEffect, useState } from 'react'

function formatTime(seconds, showRemaining, duration) {
  const s = showRemaining ? -(duration - seconds) : seconds
  const abs = Math.abs(s)
  const m = Math.floor(abs / 60)
  const sec = Math.floor(abs % 60)
  const sign = s < 0 ? '-' : ' '
  return `${sign}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function LCD({ currentTrack, currentTime, duration, status }) {
  const [showRemaining, setShowRemaining] = useState(false)
  const titleRef = useRef(null)
  const wrapRef = useRef(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)

  const title = currentTrack
    ? (currentTrack.artist !== 'Unknown Artist' ? `${currentTrack.artist} - ${currentTrack.title}` : currentTrack.title)
    : 'WINAMP'

  useEffect(() => {
    if (titleRef.current && wrapRef.current) {
      setNeedsMarquee(titleRef.current.scrollWidth > wrapRef.current.clientWidth)
    }
  }, [title])

  const timeStr = duration > 0
    ? formatTime(currentTime, showRemaining, duration)
    : ' 00:00'

  const statusLabel = status === 'playing' ? '▶' : status === 'paused' ? '⏸' : '■'

  return (
    <div className="lcd-panel">
      <div className="lcd-title-wrap" ref={wrapRef}>
        <span
          ref={titleRef}
          className={`lcd-title${needsMarquee ? ' marquee' : ''}`}
          style={needsMarquee ? { paddingLeft: '4px' } : { paddingLeft: '4px' }}
        >
          {needsMarquee ? `${title}     ${title}` : title}
        </span>
      </div>
      <div className="lcd-time-row">
        <span
          className="lcd-time"
          onClick={() => setShowRemaining((r) => !r)}
          title={showRemaining ? 'Show elapsed' : 'Show remaining'}
        >
          {timeStr}
        </span>
        <span className={`lcd-status${status !== 'stopped' ? ' active' : ''}`}>
          {statusLabel}
        </span>
      </div>
    </div>
  )
}
