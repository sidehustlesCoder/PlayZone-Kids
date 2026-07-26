import { useState, useEffect, useCallback, useRef } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import memorySource from './logic.py?raw'

const BEST_SCORES_KEY = 'codearcade-memory-best'
const THEMES = ['animals', 'shapes', 'food']
const DIFFICULTIES = [
  { value: 'easy',   label: '😊 Easy',   sub: '8 cards' },
  { value: 'medium', label: '🤔 Medium', sub: '16 cards' },
  { value: 'hard',   label: '💀 Hard',   sub: '24 cards' },
]

function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_SCORES_KEY)) || {} } catch { return {} }
}

export default function MemoryMatch() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [theme, setTheme] = useState('animals')
  const [lockBoard, setLockBoard] = useState(false)
  const [bestScores, setBestScores] = useState(loadBest)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    runPython(memorySource).then(() => setInitialized(true))
  }, [runPython])

  useEffect(() => {
    if (gameState && !gameState.game_over) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [gameState?.game_over, !!gameState])

  const startGame = useCallback(async (diff = difficulty, th = theme) => {
    clearInterval(timerRef.current)
    setElapsed(0)
    setLockBoard(false)
    const code = `
import json
mm = MemoryMatch()
state = mm.new_game({"difficulty": "${diff}", "theme": "${th}"})
json.dumps(state)
`
    const raw = await runPython(code)
    setGameState(JSON.parse(raw))
  }, [runPython, difficulty, theme])

  const handleCardClick = useCallback(async (cardId) => {
    if (lockBoard || !gameState || gameState.game_over) return
    const card = gameState.cards[cardId]
    if (card.matched || card.flipped) return
    if (gameState.flipped_ids.length >= 2) return

    const code = `
import json
state = mm.make_move(${cardId})
json.dumps(state)
`
    const raw = await runPython(code)
    const state = JSON.parse(raw)
    setGameState(state)

    // If 2 cards are flipped but not matched, lock and reset after delay
    if (state.flipped_ids.length === 2) {
      const a = state.cards[state.flipped_ids[0]]
      const b = state.cards[state.flipped_ids[1]]
      if (a.emoji !== b.emoji) {
        setLockBoard(true)
        setTimeout(async () => {
          const resetCode = `import json; state = mm.reset_flipped(); json.dumps(state)`
          const raw2 = await runPython(resetCode)
          setGameState(JSON.parse(raw2))
          setLockBoard(false)
        }, 900)
      }
    }

    // Save best score
    if (state.game_over) {
      const key = `${diff}-${th}`
      const cur = bestScores[key]
      if (!cur || state.moves < cur.moves) {
        const updated = { ...bestScores, [key]: { moves: state.moves, time: elapsed } }
        setBestScores(updated)
        localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(updated))
      }
    }
  }, [lockBoard, gameState, runPython, elapsed, bestScores, difficulty, theme])

  if (!initialized) return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>

  if (!gameState) {
    return (
      <div className="memory-setup">
        <h2 className="memory-setup__title">🃏 Memory Match</h2>
        <p className="memory-setup__desc">Flip cards to find matching pairs!</p>
        <div className="memory-setup__group">
          <label>Difficulty</label>
          <div className="memory-setup__btns">
            {DIFFICULTIES.map(d => (
              <button key={d.value} className={`memory-diff-btn ${difficulty===d.value?'active':''}`} onClick={() => setDifficulty(d.value)}>
                {d.label} <span className="memory-diff-sub">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="memory-setup__group">
          <label>Theme</label>
          <div className="memory-setup__btns">
            {THEMES.map(t => (
              <button key={t} className={`memory-theme-btn ${theme===t?'active':''}`} onClick={() => setTheme(t)}>
                {t === 'animals' ? '🐶' : t === 'shapes' ? '⭐' : '🍎'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="ttt-start-btn" onClick={() => startGame(difficulty, theme)} style={{ marginTop: '1.5rem' }}>
          🎮 Start Game
        </button>
      </div>
    )
  }

  const { cards, moves, matches, num_pairs, game_over, flipped_ids } = gameState
  const cols = cards.length === 8 ? 4 : cards.length === 16 ? 4 : 6

  return (
    <div className="memory-app">
      <div className="memory-hud">
        <div className="memory-hud__stat">⏱ {elapsed}s</div>
        <div className="memory-hud__stat">🎯 {matches}/{num_pairs} pairs</div>
        <div className="memory-hud__stat">🔄 {moves} moves</div>
        <button className="memory-hud__reset" onClick={() => setGameState(null)}>⚙</button>
      </div>

      {game_over && (
        <div className="memory-celebration">
          <div className="memory-celebration__text">🎉 You did it!</div>
          <div className="memory-celebration__stats">{moves} moves • {elapsed}s</div>
          <div className="memory-celebration__actions">
            <button className="ttt-replay-btn" onClick={() => startGame()}>Play Again</button>
            <button className="ttt-back-btn" onClick={() => setGameState(null)}>Change Settings</button>
          </div>
        </div>
      )}

      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((card) => (
          <button
            key={card.id}
            id={`memory-card-${card.id}`}
            className={`memory-card ${card.flipped || card.matched ? 'memory-card--face-up' : ''} ${card.matched ? 'memory-card--matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || game_over}
            aria-label={card.flipped || card.matched ? `Card: ${card.emoji}` : 'Face-down card'}
          >
            <span className="memory-card__front">{card.emoji}</span>
            <span className="memory-card__back">❓</span>
          </button>
        ))}
      </div>
    </div>
  )
}
