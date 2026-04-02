import React, { useRef, useCallback } from 'react'

export default function VolumeSlider({ volume, onChange }) {
  const trackRef = useRef(null)

  const calcVolume = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return x / rect.width
  }, [])

  const onMouseDown = useCallback((e) => {
    onChange(calcVolume(e))
    const onMove = (me) => onChange(calcVolume(me))
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [calcVolume, onChange])

  return (
    <div className="slider-wrap">
      <div className="slider-label">VOL</div>
      <div className="slider-track" ref={trackRef} onMouseDown={onMouseDown}>
        <div className="slider-knob" style={{ left: `${volume * 100}%` }} />
      </div>
    </div>
  )
}
