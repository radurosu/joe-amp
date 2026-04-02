import { useEffect, useRef, useState, useCallback } from 'react'
import { Howl } from 'howler'

export function useAudioPlayer({ track, volume, onEnd }) {
  const howlRef = useRef(null)
  const rafRef = useRef(null)
  const isSeekingRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [status, setStatus] = useState('stopped')

  // Tear down previous Howl and build a new one when track changes
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.unload()
      howlRef.current = null
    }
    cancelAnimationFrame(rafRef.current)
    setCurrentTime(0)
    setDuration(0)
    setStatus('stopped')

    if (!track) return

    const howl = new Howl({
      src: [track.fileUrl],
      html5: true,
      volume,
      onload() {
        const d = howl.duration()
        setDuration(isFinite(d) && d > 0 ? d : (track.duration || 0))
      },
      onend() {
        setStatus('stopped')
        setCurrentTime(0)
        cancelAnimationFrame(rafRef.current)
        onEnd?.()
      },
      onplay() {
        setStatus('playing')
        const tick = () => {
          const node = howlRef.current?._sounds[0]?._node
          if (node) setCurrentTime(node.currentTime)
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      },
      onpause() {
        if (isSeekingRef.current) return
        setStatus('paused')
        cancelAnimationFrame(rafRef.current)
      },
      onstop() {
        setStatus('stopped')
        setCurrentTime(0)
        cancelAnimationFrame(rafRef.current)
      },
    })

    howlRef.current = howl

    return () => {
      cancelAnimationFrame(rafRef.current)
      howl.unload()
    }
  }, [track?.fileUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume changes without reloading
  useEffect(() => {
    if (howlRef.current) howlRef.current.volume(volume)
  }, [volume])

  const play = useCallback(() => howlRef.current?.play(), [])
  const pause = useCallback(() => howlRef.current?.pause(), [])
  const stop = useCallback(() => howlRef.current?.stop(), [])
  const seek = useCallback((seconds) => {
    if (!howlRef.current || !isFinite(seconds) || seconds < 0) return
    isSeekingRef.current = true
    const node = howlRef.current._sounds[0]?._node
    if (node) node.currentTime = seconds
    setCurrentTime(seconds)
    setTimeout(() => { isSeekingRef.current = false }, 100)
  }, [])

  return { play, pause, stop, seek, currentTime, duration, status }
}
