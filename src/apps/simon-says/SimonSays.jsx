import { useState, useEffect, useCallback, useRef } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import simonSource from './logic.py?raw'

const COLOR_CONFIG = {
  red:    { bg: '#FF4757', label: '🔴', sound: 261 },
  blue:   { bg: '#1E90FF', label: '🔵', sound: 329 },
  green:  { bg: '#2ED573', label: '🟢', sound: 392 },
  yellow: { bg: '#FFD700', label: '🟡', sound: 523 },
}
const COLORS = ['red', 'blue', 'green', 'yellow']
const BEST_KEY = 'codearcade-simon-best'

export default function SimonSays() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [activeColor, setActiveColor] = useState(null) // flashing color during watch phase
  const [phase, setPhase] = useState('idle') // 'idle'|'watching'|'input'|'gameover'
  const [best, setBest] = useState(() => { try { return parseInt(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 } })
  const seqRef = useRef([])

  useEffect(() => {
    runPython(simonSource).then(() => setInitialized(true))
  }, [runPython])

  const playSequence = useCallback(async (sequence) => {
    setPhase('watching')
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 400))
      setActiveColor(sequence[i])
      await new Promise(r => setTimeout(r, 600))
      setActiveColor(null)
    }
    await new Promise(r => setTimeout(r, 300))
    // Switch to input phase
    const raw = await runPython(`import json; state = simon.start_input_phase(); json.dumps(state)`)
    const state = JSON.parse(raw)
    setGameState(state)
    setPhase('input')
  }, [runPython])

  const startGame = useCallback(async () => {
    const raw = await runPython(`
import json
simon = SimonSays()
state = simon.new_game()
json.dumps(state)
`)
    const state = JSON.parse(raw)
    seqRef.current = state.sequence
    setGameState(state)
    playSequence(state.sequence)
  }, [runPython, playSequence])

  const handleColorPress = useCallback(async (color) => {
    if (phase !== 'input' || !gameState) return
    setActiveColor(color)
    setTimeout(() => setActiveColor(null), 200)

    const raw = await runPython(`import json; state = simon.make_move("${color}"); json.dumps(state)`)
    const state = JSON.parse(raw)
    setGameState(state)

    if (state.game_over) {
      setPhase('gameover')
      if (state.longest_streak > best) {
        setBest(state.longest_streak)
        localStorage.setItem(BEST_KEY, state.longest_streak)
      }
    } else if (state.sequence.length > seqRef.current.length) {
      // New step added — play the extended sequence
      seqRef.current = state.sequence
      await new Promise(r => setTimeout(r, 500))
      playSequence(state.sequence)
    }
  }, [phase, gameState, runPython, playSequence, best])

  if (!initialized) return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>

  if (!gameState || phase === 'idle') {
    return (
      <div className="simon-setup">
        <h2 className="simon-setup__title">🎵 Simon Says</h2>
        <p className="simon-setup__desc">Watch the flashing colors, then repeat the sequence! The sequence gets longer each round.</p>
        <div className="simon-preview">
          {COLORS.map(c => (
            <div key={c} className="simon-preview-dot" style={{ background: COLOR_CONFIG[c].bg }} />
          ))}
        </div>
        <div className="simon-best">🏆 Best streak: <strong>{best}</strong></div>
        <button className="ttt-start-btn" onClick={startGame} style={{ marginTop: '1.5rem' }}>🎮 Start Playing</button>
      </div>
    )
  }

  if (phase === 'gameover') {
    return (
      <div className="simon-gameover">
        <div className="simon-gameover__icon">💫</div>
        <h2>Great try!</h2>
        <p>You made it to round <strong>{gameState.round - 1}</strong>!</p>
        {gameState.longest_streak >= best && <p className="simon-new-best">🏆 New Personal Best: {gameState.longest_streak}!</p>}
        <div className="hangman-actions">
          <button className="ttt-replay-btn" onClick={startGame}>Play Again</button>
          <button className="ttt-back-btn" onClick={() => { setGameState(null); setPhase('idle') }}>Main Menu</button>
        </div>
      </div>
    )
  }

  return (
    <div className="simon-app">
      <div className="simon-hud">
        <div className="simon-hud__stat">Round <strong>{gameState?.round}</strong></div>
        <div className="simon-hud__stat">Best <strong>{best}</strong></div>
        <div className={`simon-hud__phase ${phase === 'watching' ? 'simon-hud__phase--watch' : 'simon-hud__phase--input'}`}>
          {phase === 'watching' ? '👁 Watch...' : '👆 Your turn!'}
        </div>
      </div>

      <div className="simon-grid">
        {COLORS.map(color => (
          <button
            key={color}
            id={`simon-btn-${color}`}
            className={`simon-btn simon-btn--${color} ${activeColor === color ? 'simon-btn--active' : ''}`}
            style={{ '--simon-color': COLOR_CONFIG[color].bg }}
            onClick={() => handleColorPress(color)}
            disabled={phase !== 'input'}
            aria-label={`Simon ${color} button`}
          >
            <span className="simon-btn__label">{COLOR_CONFIG[color].label}</span>
          </button>
        ))}
      </div>

      <p className="simon-progress-label">
        {phase === 'watching' ? `Showing sequence (${gameState?.sequence?.length} steps)` :
         gameState?.player_input?.length !== undefined ? `${gameState.player_input.length} / ${gameState.sequence?.length} tapped` : ''}
      </p>
    </div>
  )
}
