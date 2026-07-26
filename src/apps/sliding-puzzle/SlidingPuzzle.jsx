import { useState, useEffect, useCallback } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import puzzleSource from './logic.py?raw'

const DIFFICULTIES = [
  { value: 'easy',   label: '😊 Easy (3×3)', size: 3 },
  { value: 'medium', label: '🤔 Medium (4×4)', size: 4 },
]

export default function SlidingPuzzle() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [elapsed, setElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Initialize Python logic on mount
  useEffect(() => {
    async function init() {
      try {
        await runPython(puzzleSource)
        setInitialized(true)
      } catch (err) {
        console.error('Failed to initialize sliding puzzle logic:', err)
      }
    }
    init()
  }, [runPython])

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

  const startGame = useCallback(async (diff = difficulty) => {
    setElapsed(0)
    setTimerActive(false)
    try {
      const code = `
import json
puzzle = SlidingPuzzle()
state = puzzle.generate({"difficulty": "${diff}"})
json.dumps(state)
`
      const result = await runPython(code)
      setGameState(JSON.parse(result))
      setTimerActive(true)
    } catch (e) {
      console.error(e)
    }
  }, [runPython, difficulty])

  const handleTileClick = useCallback(async (tileIdx) => {
    if (!gameState || gameState.complete) return
    try {
      const code = `
import json
state = puzzle.move_tile(${tileIdx})
json.dumps(state)
`
      const result = await runPython(code)
      const state = JSON.parse(result)
      setGameState(state)

      if (state.complete) {
        setTimerActive(false)
      }
    } catch (e) {
      console.error(e)
    }
  }, [runPython, gameState])

  if (!initialized) {
    return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>
  }

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

  const { tiles, n, blank_idx, moves, complete } = gameState

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
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gridTemplateRows: `repeat(${n}, 1fr)`,
          maxWidth: `${n * 80}px`,
          margin: '0 auto',
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
