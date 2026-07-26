import { useState, useEffect, useCallback } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import c4Source from './logic.py?raw'

const ROWS = 6, COLS = 7
const PLAYER_COLORS = { 1: 'var(--error)', 2: 'var(--warning)' }
const PLAYER_LABELS = { 1: '🔴 Red', 2: '🟡 Yellow' }

export default function ConnectFour() {
  const { runPython, loading } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [mode, setMode] = useState('vs_ai')
  const [hoverCol, setHoverCol] = useState(null)
  const [scores, setScores] = useState({ 1: 0, 2: 0, draw: 0 })

  useEffect(() => {
    runPython(c4Source).then(() => setInitialized(true))
  }, [runPython])

  const startGame = useCallback(async (m = mode) => {
    const raw = await runPython(`
import json
cf = ConnectFour()
state = cf.new_game({"mode": "${m}"})
json.dumps(state)
`)
    setGameState(JSON.parse(raw))
    setHoverCol(null)
  }, [runPython, mode])

  const dropPiece = useCallback(async (col) => {
    if (!gameState || gameState.game_over) return
    const raw = await runPython(`import json; state = cf.make_move(${col}); json.dumps(state)`)
    const state = JSON.parse(raw)
    setGameState(state)
    if (state.game_over) {
      setScores(s => ({ ...s, [state.winner]: (s[state.winner] || 0) + 1 }))
    }
  }, [runPython, gameState])

  if (!initialized) return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>

  if (!gameState) {
    return (
      <div className="c4-setup">
        <h2 className="ttt-setup__title">🔴 Connect Four</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Drop pieces to connect four in a row!</p>
        <div className="ttt-setup__group">
          <label>Mode</label>
          <div className="ttt-setup__btns">
            {[['vs_ai','🤖 vs AI'],['2player','👥 2 Players']].map(([v,l]) => (
              <button key={v} className={`ttt-option-btn ${mode===v?'active':''}`} onClick={() => setMode(v)}>{l}</button>
            ))}
          </div>
        </div>
        <button className="ttt-start-btn" onClick={() => startGame(mode)} style={{ marginTop: '1.5rem' }}>Start Game</button>
      </div>
    )
  }

  const { grid, current_player, game_over, winner, winning_cells } = gameState
  const winCellSet = new Set(winning_cells.map(([r,c]) => `${r}-${c}`))

  const statusMsg = game_over
    ? winner === 'draw' ? "It's a Draw!" : `${mode === 'vs_ai' && winner === 2 ? '🤖 AI' : PLAYER_LABELS[winner]} Wins!`
    : `${mode === 'vs_ai' && current_player === 2 ? '🤖 AI' : PLAYER_LABELS[current_player]}'s Turn`

  return (
    <div className="c4-app">
      {/* Scores */}
      <div className="ttt-scores">
        <div className="ttt-score-card"><span className="ttt-score-label" style={{ color: PLAYER_COLORS[1] }}>Red</span><span className="ttt-score-val">{scores[1]}</span></div>
        <div className="ttt-score-card ttt-score-card--draw"><span className="ttt-score-label">Draws</span><span className="ttt-score-val">{scores.draw || 0}</span></div>
        <div className="ttt-score-card"><span className="ttt-score-label" style={{ color: PLAYER_COLORS[2] }}>{mode === 'vs_ai' ? '🤖 AI' : 'Yellow'}</span><span className="ttt-score-val">{scores[2]}</span></div>
      </div>

      <p className="ttt-status">{statusMsg}</p>

      {/* Drop buttons */}
      <div className="c4-col-btns">
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            id={`c4-col-${c}`}
            className={`c4-drop-btn ${hoverCol === c ? 'c4-drop-btn--hover' : ''}`}
            onClick={() => dropPiece(c)}
            onMouseEnter={() => setHoverCol(c)}
            onMouseLeave={() => setHoverCol(null)}
            disabled={game_over || (mode === 'vs_ai' && current_player === 2)}
            aria-label={`Drop in column ${c + 1}`}
            style={{ color: current_player ? PLAYER_COLORS[current_player] : undefined }}
          >▼</button>
        ))}
      </div>

      {/* Grid */}
      <div className="c4-grid">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isWin = winCellSet.has(`${r}-${c}`)
            return (
              <div
                key={`${r}-${c}`}
                className={`c4-cell ${isWin ? 'c4-cell--win' : ''}`}
                style={cell ? { '--piece-color': PLAYER_COLORS[cell] } : undefined}
              >
                {cell && <div className={`c4-piece ${isWin ? 'c4-piece--win' : ''}`} style={{ background: PLAYER_COLORS[cell] }} />}
              </div>
            )
          })
        )}
      </div>

      <div className="ttt-actions">
        <button className="ttt-replay-btn" onClick={() => startGame()}>Play Again</button>
        <button className="ttt-back-btn" onClick={() => setGameState(null)}>⚙ Settings</button>
      </div>
    </div>
  )
}
