import { useState, useEffect, useCallback, useRef } from 'react'
import { usePyodide } from '../../shared/usePyodide'
import mazeSource from './logic.py?raw'

const DIFFICULTIES = [
  { value: 'easy',   label: '😊 Easy',   sub: '7×7' },
  { value: 'medium', label: '🤔 Medium', sub: '11×11' },
  { value: 'hard',   label: '💀 Hard',   sub: '15×15' },
]

export default function MazeRunner() {
  const { runPython } = usePyodide()
  const [initialized, setInitialized] = useState(false)
  const [mazeState, setMazeState] = useState(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    runPython(mazeSource).then(() => setInitialized(true))
  }, [runPython])

  useEffect(() => {
    if (mazeState && !mazeState.complete) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [mazeState?.complete, !!mazeState])

  const generateMaze = useCallback(async (diff = difficulty) => {
    clearInterval(timerRef.current)
    setElapsed(0)
    const raw = await runPython(`
import json
maze = MazeRunner()
state = maze.generate({"difficulty": "${diff}"})
json.dumps(state)
`)
    setMazeState(JSON.parse(raw))
    setTimeout(() => appRef.current?.focus(), 100)
  }, [runPython, difficulty])

  const move = useCallback(async (dir) => {
    if (!mazeState || mazeState.complete) return
    const raw = await runPython(`import json; state = maze.move("${dir}"); json.dumps(state)`)
    setMazeState(JSON.parse(raw))
  }, [runPython, mazeState])

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      const map = { ArrowUp: 'N', ArrowDown: 'S', ArrowRight: 'E', ArrowLeft: 'W',
                    w: 'N', s: 'S', d: 'E', a: 'W' }
      if (map[e.key]) { e.preventDefault(); move(map[e.key]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [move])

  if (!initialized) return <div className="calculator-app__status">⚡ Initializing Pyodide Python WASM Engine...</div>

  if (!mazeState) {
    return (
      <div className="maze-setup">
        <h2 className="ttt-setup__title">🌀 Maze Runner</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Navigate from 🟢 start to 🏁 finish! Use arrow keys or the D-pad below.</p>
        <div className="ttt-setup__group">
          <label>Size</label>
          <div className="ttt-setup__btns">
            {DIFFICULTIES.map(d => (
              <button key={d.value} className={`ttt-option-btn ${difficulty===d.value?'active':''}`} onClick={() => setDifficulty(d.value)}>
                {d.label} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{d.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="ttt-start-btn" onClick={() => generateMaze(difficulty)} style={{ marginTop: '1.5rem' }}>Generate Maze</button>
      </div>
    )
  }

  const { cells, rows, cols, player_row, player_col, complete } = mazeState
  const CELL_SIZE = Math.min(32, Math.floor(340 / cols))

  return (
    <div className="maze-app" ref={appRef} tabIndex={-1} style={{ outline: 'none' }}>
      <div className="maze-hud">
        <div className="maze-hud__stat">⏱ {elapsed}s</div>
        <div className="maze-hud__stat">🎯 {difficulty}</div>
        <button className="memory-hud__reset" onClick={() => setMazeState(null)}>⚙</button>
      </div>

      {complete && (
        <div className="memory-celebration">
          <div className="memory-celebration__text">🎉 You did it!</div>
          <div className="memory-celebration__stats">{elapsed}s • {difficulty}</div>
          <div className="memory-celebration__actions">
            <button className="ttt-replay-btn" onClick={() => generateMaze()}>New Maze</button>
            <button className="ttt-back-btn" onClick={() => setMazeState(null)}>Change Size</button>
          </div>
        </div>
      )}

      {/* Maze Grid */}
      <div className="maze-grid-wrap">
        <div className="maze-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)` }}>
          {cells.map((row, r) => row.map((cell, c) => {
            const isPlayer = r === player_row && c === player_col
            const isStart = r === 0 && c === 0
            const isEnd = r === rows - 1 && c === cols - 1
            return (
              <div
                key={`${r}-${c}`}
                className="maze-cell"
                style={{
                  width: CELL_SIZE, height: CELL_SIZE,
                  borderTop: cell.N ? '2px solid var(--border)' : '2px solid transparent',
                  borderBottom: cell.S ? '2px solid var(--border)' : '2px solid transparent',
                  borderLeft: cell.W ? '2px solid var(--border)' : '2px solid transparent',
                  borderRight: cell.E ? '2px solid var(--border)' : '2px solid transparent',
                  background: isPlayer ? 'var(--primary)' : isEnd ? 'var(--secondary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: CELL_SIZE * 0.55,
                }}
              >
                {isPlayer ? '😊' : isEnd && !complete ? '🏁' : ''}
              </div>
            )
          }))}
        </div>
      </div>

      {/* D-Pad */}
      {!complete && (
        <div className="maze-dpad">
          <div className="maze-dpad__row">
            <button className="maze-dpad__btn" onClick={() => move('N')} id="maze-up" aria-label="Move up">▲</button>
          </div>
          <div className="maze-dpad__row">
            <button className="maze-dpad__btn" onClick={() => move('W')} id="maze-left" aria-label="Move left">◀</button>
            <div className="maze-dpad__center">😊</div>
            <button className="maze-dpad__btn" onClick={() => move('E')} id="maze-right" aria-label="Move right">▶</button>
          </div>
          <div className="maze-dpad__row">
            <button className="maze-dpad__btn" onClick={() => move('S')} id="maze-down" aria-label="Move down">▼</button>
          </div>
        </div>
      )}
    </div>
  )
}
