import { useState, useEffect } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const SHAPES = [
  { id: 'circle', name: 'Circle', emoji: '🔴', color: '#ff4d4d' },
  { id: 'square', name: 'Square', emoji: '🟩', color: '#4caf50' },
  { id: 'triangle', name: 'Triangle', emoji: '🔺', color: '#ffeb3b' },
  { id: 'star', name: 'Star', emoji: '⭐', color: '#ff9800' }
]

export default function ShapeSorter() {
  const [selectedShape, setSelectedShape] = useState(null)
  const [placed, setPlaced] = useState({
    circle: false,
    square: false,
    triangle: false,
    star: false
  })
  const [message, setMessage] = useState('Tap a shape, then tap the right box! 🧩')
  const [isWon, setIsWon] = useState(false)

  const handleSelectShape = (shapeId) => {
    if (placed[shapeId] || isWon) return
    playSelectSound()
    setSelectedShape(shapeId)
    setMessage(`Where does the ${shapeId} go? 🤔`)
  }

  const handleDropSlot = (slotId) => {
    if (isWon || !selectedShape) return

    if (selectedShape === slotId) {
      const nextPlaced = { ...placed, [slotId]: true }
      setPlaced(nextPlaced)
      setSelectedShape(null)
      setMessage(`Yay! Correct match! 🎉`)
      
      const allDone = Object.values(nextPlaced).every(v => v === true)
      if (allDone) {
        setIsWon(true)
        setMessage('Great job! You sorted all shapes! ⭐')
        playWinSound()
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      } else {
        playSelectSound()
      }
    } else {
      playLoseSound()
      setMessage(`Oops! Try another box for the ${selectedShape}! 💖`)
    }
  }

  const handleReset = () => {
    setPlaced({
      circle: false,
      square: false,
      triangle: false,
      star: false
    })
    setSelectedShape(null)
    setIsWon(false)
    setMessage('Tap a shape, then tap the right box! 🧩')
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--text-color)' }}>🧩 Shape Sorter</h2>
      <p style={{ fontSize: '1.25rem', margin: '15px 0', minHeight: '30px' }}>{message}</p>

      {/* Slots to place shapes into */}
      <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0' }}>
        {SHAPES.map(shape => (
          <button
            key={shape.id}
            onClick={() => handleDropSlot(shape.id)}
            style={{
              width: '100px',
              height: '100px',
              border: placed[shape.id] ? `3px solid ${shape.color}` : '3px dashed #bbb',
              borderRadius: shape.id === 'circle' ? '50%' : shape.id === 'triangle' ? '0' : '16px',
              clipPath: shape.id === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
              background: placed[shape.id] ? `${shape.color}22` : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              cursor: placed[shape.id] ? 'default' : 'pointer',
              transition: 'all 0.2s',
              transform: selectedShape && !placed[shape.id] ? 'scale(1.05)' : 'none',
              outline: 'none'
            }}
            disabled={placed[shape.id]}
            title={`Slot for ${shape.name}`}
          >
            {placed[shape.id] ? shape.emoji : '?'}
          </button>
        ))}
      </div>

      {/* Shapes Palette */}
      <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', background: 'rgba(0,0,0,0.1)', padding: '20px', borderRadius: '16px' }}>
        {SHAPES.map(shape => {
          const isSelected = selectedShape === shape.id
          const isAlreadyPlaced = placed[shape.id]
          return (
            <button
              key={shape.id}
              onClick={() => handleSelectShape(shape.id)}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: isAlreadyPlaced ? '#444' : isSelected ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)',
                border: isSelected ? '3px solid #fff' : 'none',
                fontSize: '2.5rem',
                cursor: isAlreadyPlaced ? 'default' : 'pointer',
                opacity: isAlreadyPlaced ? 0.3 : 1,
                transform: isSelected ? 'scale(1.2)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.4)' : 'none'
              }}
              disabled={isAlreadyPlaced}
              title={shape.name}
            >
              {shape.emoji}
            </button>
          )
        })}
      </div>

      {isWon && (
        <button
          onClick={handleReset}
          className="ttt-replay-btn"
          style={{ marginTop: '20px', padding: '10px 24px', fontSize: '1.2rem' }}
        >
          🔄 Play Again
        </button>
      )}
    </div>
  )
}
