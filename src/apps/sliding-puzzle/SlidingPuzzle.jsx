import { useState, useEffect, useCallback } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const DIFFICULTIES = [
  { value: 'easy',   label: '😊 Easy (3×3)', size: 3 },
  { value: 'medium', label: '🤔 Medium (4×4)', size: 4 },
]

function generatePuzzleData(size) {
  const total = size * size
  const tiles = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1))
  
  // Shuffle by making valid sliding moves from the goal state
  let blankIdx = total - 1
  for (let i = 0; i < 200; i++) {
    const validMoves = []
    const blankR = Math.floor(blankIdx / size)
    const blankC = blankIdx % size
    
    if (blankR > 0) validMoves.push(blankIdx - size)
    if (blankR < size - 1) validMoves.push(blankIdx + size)
    if (blankC > 0) validMoves.push(blankIdx - 1)
    if (blankC < size - 1) validMoves.push(blankIdx + 1)
    
    const move = validMoves[Math.floor(Math.random() * validMoves.length)]
    tiles[blankIdx] = tiles[move]
    tiles[move] = 0
    blankIdx = move
  }
  
  return {
    tiles,
    n: size,
    blank_idx: blankIdx,
    moves: 0,
    complete: false
  }
}

function checkSolved(tiles) {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false
  }
  return tiles[tiles.length - 1] === 0
}

export default function SlidingPuzzle() {
  const [gameState, setGameState] = useState(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [elapsed, setElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval = null
    if (timerActive) {
      interval = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  const startGame = useCallback((diff = difficulty) => {
    setElapsed(0)
    setTimerActive(false)
    const size = diff === 'easy' ? 3 : 4
    setGameState(generatePuzzleData(size))
    setTimerActive(true)
  }, [difficulty])

  const handleTileClick = useCallback((tileIdx) => {
    if (!gameState || gameState.complete) return
    const { tiles, n, blank_idx, moves } = gameState
    
    const clickR = Math.floor(tileIdx / n)
    const clickC = tileIdx % n
    const blankR = Math.floor(blank_idx / n)
    const blankC = blank_idx % n
    
    const dist = Math.abs(clickR - blankR) + Math.abs(clickC - blankC)
    
    if (dist === 1) {
      playSelectSound()
      const nextTiles = [...tiles]
      nextTiles[blank_idx] = tiles[tileIdx]
      nextTiles[tileIdx] = 0
      
      const isSolved = checkSolved(nextTiles)
      
      setGameState(prev => ({
        ...prev,
        tiles: nextTiles,
        blank_idx: tileIdx,
        moves: moves + 1,
        complete: isSolved
      }))
      
      if (isSolved) {
        setTimerActive(false)
        playWinSound()
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      }
    } else {
      playLoseSound()
    }
  }, [gameState])

  if (!gameState) {
    return (
      <div className="puzzle-setup">
        <h2 className="ttt-setup__title">🧩 Sliding Puzzle</h2>
        <p className="simon-setup__desc">Slide the tiles into the empty space to sort them in order from 1 to 8 or 15!</p>
        <div className="ttt-setup__group">
          <label>Size</label>
          <div className="ttt-setup__btns">
            {DIFFICULTIES.map(d => (
              <button key={d.value} className={`ttt-option-btn ${difficulty === d.value ? 'active' : ''}`} onClick={() => setDifficulty(d.value)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <button className="ttt-start-btn" onClick={() => startGame(difficulty)} style={{ marginTop: '1.5rem' }}>Start Game</button>
      </div>
    )
  }

  const { tiles, n, complete, moves } = gameState

  return (
    <div className="sliding-puzzle-app">
      <div className="maze-hud">
        <div className="maze-hud__stat">⏱ {elapsed}s</div>
        <div className="maze-hud__stat">🔄 {moves} moves</div>
        <button className="memory-hud__reset" onClick={() => setGameState(null)}>⚙</button>
      </div>

      {complete && (
        <div className="memory-celebration">
          <div className="memory-celebration__text">🎉 You Solved It!</div>
          <div className="memory-celebration__stats">{moves} moves • {elapsed}s</div>
          <div className="memory-celebration__actions">
            <button className="ttt-replay-btn" onClick={() => startGame()}>Play Again</button>
            <button className="ttt-back-btn" onClick={() => setGameState(null)}>Change Settings</button>
          </div>
        </div>
      )}

      <div 
        className="sliding-grid" 
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gridTemplateRows: `repeat(${n}, 1fr)`,
          maxWidth: `${n * 80}px`,
          margin: '0 auto',
          gap: '5px',
          background: 'rgba(255,255,255,0.05)',
          padding: '10px',
          borderRadius: '16px'
        }}
      >
        {tiles.map((val, idx) => {
          const isBlank = val === 0
          return (
            <button
              key={idx}
              id={`sliding-tile-${idx}`}
              className={`sliding-tile ${isBlank ? 'sliding-tile--blank' : ''}`}
              style={{
                width: '70px',
                height: '70px',
                fontSize: '1.5rem',
                border: 'none',
                borderRadius: '8px',
                background: isBlank ? 'transparent' : 'var(--primary-color)',
                color: '#fff',
                cursor: isBlank ? 'default' : 'pointer',
                boxShadow: isBlank ? 'none' : '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => handleTileClick(idx)}
              disabled={isBlank || complete}
              aria-label={isBlank ? 'Empty space' : `Tile ${val}`}
            >
              {!isBlank ? val : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
