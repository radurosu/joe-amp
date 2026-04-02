import React from 'react'

export default function TitleBar() {
  return (
    <div className="title-bar">
      <span className="title-bar-label">JOEAMP</span>
      <div className="title-bar-buttons">
        <button className="title-btn" onClick={() => window.winampAPI?.minimizeWindow()}>_</button>
        <button className="title-btn" onClick={() => window.winampAPI?.closeWindow()}>x</button>
      </div>
    </div>
  )
}
