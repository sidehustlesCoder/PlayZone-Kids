import { useState, useEffect, useCallback, useRef } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const DIFFICULTIES = [
  { value: 'easy',   label: '😊 Easy',   sub: '7×7' },
  { value: 'medium', label: '🤔 Medium', sub: '11×11' },
  { value: 'hard',   label: '💀 Hard',   sub: '15×15' },
]

function generateMazeData(rows, cols) {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({
    N: true, S: true, E: true, W: true, visited: false
  })))

  const stack = []
  let current = [0, 0]
  grid[0][0].visited = true

  const getNeighbors = (r, c) => {
    const list = []
    if (r > 0 && !grid[r - 1][c].visited) list.push([r - 1, c, 'N', 'S'])
    if (r < rows - 1 && !grid[r + 1][c].visited) list.push([r + 1, c, 'S', 'N'])
    if (c > 0 && !grid[r][c - 1].visited) list.push([r, c - 1, 'W', 'E'])
    if (c < cols - 1 && !grid[r][c + 1].visited) list.push([r, c + 1, 'E', 'W'])
    return list
  }

  let unvisitedCount = rows * cols - 1
  while (unvisitedCount > 0) {
    const [cr, cc] = current
    const neighbors = getNeighbors(cr, cc)
    if (neighbors.length > 0) {
      const [nr, nc, currentWall, neighborWall] = neighbors[Math.floor(Math.random() * neighbors.length)]
      grid[cr][cc][currentWall] = false
      grid[nr][nc][neighborWall] = false
      grid[nr][nc].visited = true
      stack.push(current)
      current = [nr, nc]
      unvisitedCount--
    } else if (stack.length > 0) {
      current = stack.pop()
    } else {
      break
    }
  }

  return grid
}

export default function MazeRunner() {
  const [mazeState, setMazeState] = useState(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    if (mazeState && !mazeState.complete) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [mazeState?.complete, !!mazeState])

  const generateMaze = useCallback((diff = difficulty) => {
    clearInterval(timerRef.current)
    setElapsed(0)
    
    const size = diff === 'easy' ? 7 : diff === 'medium' ? 11 : 15
    const cells = generateMazeData(size, size)
    
    setMazeState({
      cells,
      rows: size,
      cols: size,
      player_row: 0,
      player_col: 0,
      complete: false
    })
    
    setTimeout(() => appRef.current?.focus(), 100)
  }, [difficulty])

  const move = useCallback((dir) => {
    if (!mazeState || mazeState.complete) return
    const { cells, player_row, player_col, rows, cols } = mazeState
    
    const currentCell = cells[player_row][player_col]
    let nextRow = player_row
    let nextCol = player_col
    
    // Check if the wall is blocked (true) or open (false)
    if (dir === 'N' && !currentCell.N) nextRow--
    else if (dir === 'S' && !currentCell.S) nextRow++
    else if (dir === 'E' && !currentCell.E) nextCol++
    else if (dir === 'W' && !currentCell.W) nextCol--
    
    if (nextRow !== player_row || nextCol !== player_col) {
      playSelectSound()
      const isComplete = nextRow === rows - 1 && nextCol === cols - 1
      
      setMazeState(prev => ({
        ...prev,
        player_row: nextRow,
        player_col: nextCol,
        complete: isComplete
      }))

      if (isComplete) {
        playWinSound()
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      }
    } else {
      playLoseSound()
    }
  }, [mazeState])

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      const map = { 
        ArrowUp: 'N', ArrowDown: 'S', ArrowRight: 'E', ArrowLeft: 'W',
        w: 'N', s: 'S', d: 'E', a: 'W' 
      }
      if (map[e.key]) { 
        e.preventDefault()
        move(map[e.key]) 
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [move])

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
                  background: isPlayer ? 'var(--primary-color)' : isEnd ? 'var(--secondary-color)' : 'transparent',
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
