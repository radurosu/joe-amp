import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import '../styles/playlist.css'

function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function totalTime(tracks) {
  const total = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
  return formatDuration(total)
}

function SortableTrack({ track, index, isActive, isSelected, onRowClick, onDoubleClick, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const label = track.artist !== 'Unknown Artist' ? `${track.artist} - ${track.title}` : track.title

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'playlist-track',
        isActive ? 'active' : '',
        isSelected ? 'selected' : '',
        isDragging ? 'dragging' : '',
      ].filter(Boolean).join(' ')}
      onClick={onRowClick}
      onDoubleClick={onDoubleClick}
    >
      <span {...attributes} {...listeners} className="drag-handle" title="Drag to reorder">⠿</span>
      <span className="track-index">{index + 1}.</span>
      <span className="track-title" title={label}>{label}</span>
      <span className="track-duration">{formatDuration(track.duration)}</span>
      <span
        className="track-remove"
        onClick={(e) => { e.stopPropagation(); onRemove(index) }}
        title="Remove"
      >✕</span>
    </div>
  )
}

export default function Playlist({ tracks, currentIndex, onTrackSelect, onAddFiles, onRemoveTrack, onRemoveTracks, onReorder, onClose }) {
  const [selected, setSelected] = useState(new Set())
  const lastClickedRef = useRef(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // Clear selection when tracks change (e.g. after removal)
  useEffect(() => setSelected(new Set()), [tracks.length])

  const deleteSelected = useCallback(() => {
    if (selected.size > 0) {
      onRemoveTracks([...selected])
    } else if (currentIndex >= 0) {
      onRemoveTrack(currentIndex)
    }
  }, [selected, currentIndex, onRemoveTracks, onRemoveTrack])

  // Delete / Backspace key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if not typing in an input
        if (e.target.tagName === 'INPUT') return
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSelected])

  const handleRowClick = useCallback((index, e) => {
    if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl+click: toggle
      setSelected(prev => {
        const next = new Set(prev)
        next.has(index) ? next.delete(index) : next.add(index)
        return next
      })
    } else if (e.shiftKey && lastClickedRef.current !== null) {
      // Shift+click: range select
      const from = Math.min(lastClickedRef.current, index)
      const to   = Math.max(lastClickedRef.current, index)
      setSelected(new Set(Array.from({ length: to - from + 1 }, (_, i) => from + i)))
    } else {
      // Plain click: select only this row
      setSelected(new Set([index]))
    }
    lastClickedRef.current = index
  }, [])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id)
      const newIndex = tracks.findIndex((t) => t.id === over.id)
      onReorder(arrayMove(tracks, oldIndex, newIndex))
    }
  }

  const selCount = selected.size

  return (
    <div className="playlist">
      <div className="playlist-header">
        <span className="playlist-header-label">PLAYLIST EDITOR</span>
        <button className="playlist-header-close" onClick={onClose}>x</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="playlist-tracks">
            {tracks.length === 0 && (
              <div style={{ color: '#004400', fontSize: '10px', padding: '10px', textAlign: 'center' }}>
                Drop files here or click ADD
              </div>
            )}
            {tracks.map((track, i) => (
              <SortableTrack
                key={track.id}
                track={track}
                index={i}
                isActive={i === currentIndex}
                isSelected={selected.has(i)}
                onRowClick={(e) => handleRowClick(i, e)}
                onDoubleClick={() => { onTrackSelect(i); setSelected(new Set()) }}
                onRemove={onRemoveTrack}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="playlist-toolbar">
        <button className="pl-btn" onClick={onAddFiles}>+ ADD</button>
        <button className="pl-btn" onClick={deleteSelected}>
          {selCount > 1 ? `- REM (${selCount})` : '- REM'}
        </button>
        <button className="pl-btn" onClick={() => onReorder([])}>CLR ALL</button>
        <button className="pl-btn" onClick={() => tracks.length > 0 && window.winampAPI.savePlaylist(tracks)}>SAVE</button>
      </div>

      <div className="playlist-status">
        <span>
          {selCount > 0
            ? `${selCount} selected / ${tracks.length} tracks`
            : `${tracks.length} track${tracks.length !== 1 ? 's' : ''}`}
        </span>
        <span>{totalTime(tracks)}</span>
      </div>
    </div>
  )
}
