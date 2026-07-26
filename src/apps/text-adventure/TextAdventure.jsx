import { useState, useEffect } from 'react'
import storyData from './story.json'

const STORAGE_KEY = 'codearcade-adventure-save'

function loadSave() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export default function TextAdventure() {
  const [nodeId, setNodeId] = useState(null)
  const [history, setHistory] = useState([])  // array of { nodeId, choiceLabel }
  const [hasSave, setHasSave] = useState(!!loadSave())
  const [showConfirm, setShowConfirm] = useState(false)

  const node = nodeId ? storyData[nodeId] : null

  const navigate = (id, choiceLabel) => {
    const newHistory = [...history, { nodeId, choiceLabel }]
    setHistory(newHistory)
    setNodeId(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodeId: id, history: newHistory }))
    setHasSave(true)
  }

  const startNew = () => {
    setHistory([])
    setNodeId('start')
    setShowConfirm(false)
  }

  const resumeGame = () => {
    const save = loadSave()
    if (save) {
      setNodeId(save.nodeId)
      setHistory(save.history || [])
    }
    setShowConfirm(false)
  }

  const resetSave = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHasSave(false)
    setNodeId(null)
    setHistory([])
  }

  // Title screen
  if (!nodeId) {
    return (
      <div className="adventure-app">
        <div className="adventure-title-screen">
          <div className="adventure-title-screen__deco">🌲 🌿 🍄</div>
          <h2 className="adventure-title-screen__name">The Whispering Forest</h2>
          <p className="adventure-title-screen__tagline">An interactive story with many paths and endings</p>
          <div className="adventure-title-screen__actions">
            {hasSave && (
              <button className="adventure-btn adventure-btn--primary" onClick={resumeGame} id="adventure-resume-btn">
                📂 Resume Adventure
              </button>
            )}
            {hasSave ? (
              <button className="adventure-btn adventure-btn--secondary" onClick={() => setShowConfirm(true)} id="adventure-new-btn">
                ✨ Start Fresh
              </button>
            ) : (
              <button className="adventure-btn adventure-btn--primary" onClick={startNew} id="adventure-start-btn">
                ✨ Begin Adventure
              </button>
            )}
          </div>
          {showConfirm && (
            <div className="adventure-confirm">
              <p>⚠️ This will erase your saved progress. Are you sure?</p>
              <button className="adventure-btn adventure-btn--danger" onClick={startNew}>Yes, start over</button>
              <button className="adventure-btn adventure-btn--secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Ending screen
  if (node?.ending) {
    return (
      <div className="adventure-app">
        <div className="adventure-ending">
          <div className="adventure-ending__badge">{node.ending_title}</div>
          <div className="adventure-story-box">
            <p className="adventure-story-text">{node.text}</p>
          </div>
          <p className="adventure-ending__summary">
            You made {history.length} choice{history.length !== 1 ? 's' : ''} on this journey.
          </p>
          <div className="adventure-actions">
            <button className="adventure-btn adventure-btn--primary" onClick={startNew} id="adventure-play-again-btn">
              🔄 Play Again
            </button>
            <button className="adventure-btn adventure-btn--secondary" onClick={resetSave}>
              🗑 Clear Save & Return
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="adventure-app">
      {/* Breadcrumb path */}
      {history.length > 0 && (
        <div className="adventure-breadcrumb">
          {history.slice(-3).map((h, i) => (
            <span key={i} className="adventure-breadcrumb__item">
              {h.choiceLabel || '…'}
            </span>
          ))}
          <span className="adventure-breadcrumb__now">You are here</span>
        </div>
      )}

      {/* Story text */}
      <div className="adventure-story-box">
        <p className="adventure-story-text">{node?.text}</p>
      </div>

      {/* Choices */}
      <div className="adventure-choices">
        {node?.choices?.map((choice, i) => (
          <button
            key={i}
            id={`adventure-choice-${i}`}
            className="adventure-choice-btn"
            onClick={() => navigate(choice.next, choice.label)}
          >
            <span className="adventure-choice-btn__arrow">›</span>
            {choice.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="adventure-controls">
        <button className="adventure-ctrl-btn" onClick={() => setNodeId(null)}>📖 Title Screen</button>
        {history.length > 0 && (
          <button className="adventure-ctrl-btn" onClick={() => {
            const prev = history[history.length - 1]
            const newHist = history.slice(0, -1)
            setHistory(newHist)
            setNodeId(prev.nodeId)
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodeId: prev.nodeId, history: newHist }))
          }}>← Back</button>
        )}
        <span className="adventure-ctrl-progress">Choices made: {history.length}</span>
      </div>
    </div>
  )
}
