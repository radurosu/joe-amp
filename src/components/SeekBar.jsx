import React, { useRef, useCallback } from 'react'

export default function SeekBar({ currentTime, duration, onSeek }) {
  const trackRef = useRef(null)
  const pct = duration > 0 ? Math.min(currentTime / duration, 1) : 0

  const calcSeek = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return (x / rect.width) * duration
  }, [duration])

  const onMouseDown = useCallback((e) => {
    if (!duration) return
    onSeek(calcSeek(e))

    const onMove = (me) => onSeek(calcSeek(me))
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [calcSeek, duration, onSeek])

  return (
    <div className="seek-bar-wrap" ref={trackRef} onMouseDown={onMouseDown}>
      <div className="seek-bar-fill" style={{ width: `${pct * 100}%` }}>
        {duration > 0 && <div className="seek-bar-knob" />}
      </div>
    </div>
  )
}
