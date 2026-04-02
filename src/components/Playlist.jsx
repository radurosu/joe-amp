import React from 'react'
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

function SortableTrack({ track, index, isActive, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`playlist-track${isActive ? ' active' : ''}${isDragging ? ' dragging' : ''}`}
      onDoubleClick={() => onSelect(index)}
    >
      <span {...attributes} {...listeners} className="drag-handle" title="Drag to reorder">⠿</span>
      <span className="track-index">{index + 1}.</span>
      <span className="track-title" onClick={() => onSelect(index)} title={track.title}>
        {track.artist !== 'Unknown Artist' ? `${track.artist} - ${track.title}` : track.title}
      </span>
      <span className="track-duration">{formatDuration(track.duration)}</span>
      <span
        style={{ color: '#333', cursor: 'pointer', fontSize: '9px', paddingLeft: '4px' }}
        onClick={(e) => { e.stopPropagation(); onRemove(index) }}
        title="Remove"
      >✕</span>
    </div>
  )
}

export default function Playlist({ tracks, currentIndex, onTrackSelect, onAddFiles, onRemoveTrack, onReorder, onClose }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id)
      const newIndex = tracks.findIndex((t) => t.id === over.id)
      onReorder(arrayMove(tracks, oldIndex, newIndex))
    }
  }

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
                onSelect={onTrackSelect}
                onRemove={onRemoveTrack}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="playlist-toolbar">
        <button className="pl-btn" onClick={onAddFiles}>+ ADD</button>
        <button className="pl-btn" onClick={() => tracks.length > 0 && onRemoveTrack(currentIndex >= 0 ? currentIndex : tracks.length - 1)}>- REM</button>
        <button className="pl-btn" onClick={() => onReorder([])}>CLR</button>
        <button className="pl-btn" onClick={() => tracks.length > 0 && window.winampAPI.savePlaylist(tracks)}>SAVE</button>
      </div>

      <div className="playlist-status">
        <span>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
        <span>{totalTime(tracks)}</span>
      </div>
    </div>
  )
}
