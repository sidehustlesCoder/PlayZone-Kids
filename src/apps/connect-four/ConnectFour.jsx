import { useState, useEffect, useCallback } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const ROWS = 6, COLS = 7
const PLAYER_COLORS = { 1: 'var(--error)', 2: 'var(--warning)' }
const PLAYER_LABELS = { 1: '🔴 Red', 2: '🟡 Yellow' }

// AI logic functions
function getValidMoves(grid) {
  const moves = []
  for (let c = 0; c < COLS; c++) {
    if (grid[0][c] === 0) moves.push(c)
  }
  return moves
}

function getNextOpenRow(grid, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r][col] === 0) return r
  }
  return -1
}

function dropSimulate(grid, col, player) {
  const nextGrid = grid.map(row => [...row])
  const r = getNextOpenRow(nextGrid, col)
  if (r !== -1) {
    nextGrid[r][col] = player
  }
  return nextGrid
}

function checkWin(grid, player) {
  // horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (grid[r][c] === player && grid[r][c+1] === player && grid[r][c+2] === player && grid[r][c+3] === player) {
        return [[r,c], [r,c+1], [r,c+2], [r,c+3]]
      }
    }
  }
  // vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      if (grid[r][c] === player && grid[r+1][c] === player && grid[r+2][c] === player && grid[r+3][c] === player) {
        return [[r,c], [r+1,c], [r+2,c], [r+3,c]]
      }
    }
  }
  // positive diagonal
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (grid[r][c] === player && grid[r+1][c+1] === player && grid[r+2][c+2] === player && grid[r+3][c+3] === player) {
        return [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]]
      }
    }
  }
  // negative diagonal
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (grid[r][c] === player && grid[r-1][c+1] === player && grid[r-2][c+2] === player && grid[r-3][c+3] === player) {
        return [[r,c], [r-1,c+1], [r-2,c+2], [r-3,c+3]]
      }
    }
  }
  return null
}

function evaluateGrid(grid) {
  let score = 0
  for (let r = 0; r < ROWS; r++) {
    if (grid[r][3] === 2) score += 3
    else if (grid[r][3] === 1) score -= 3
  }
  
  const checkWindow = (w) => {
    let p2 = 0, p1 = 0
    w.forEach(cell => {
      if (cell === 2) p2++
      else if (cell === 1) p1++
    })
    if (p2 === 4) return 100
    if (p2 === 3 && p1 === 0) return 5
    if (p2 === 2 && p1 === 0) return 2
    if (p1 === 3 && p2 === 0) return -80
    return 0
  }
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += checkWindow([grid[r][c], grid[r][c+1], grid[r][c+2], grid[r][c+3]])
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      score += checkWindow([grid[r][c], grid[r+1][c], grid[r+2][c], grid[r+3][c]])
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += checkWindow([grid[r][c], grid[r+1][c+1], grid[r+2][c+2], grid[r+3][c+3]])
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += checkWindow([grid[r][c], grid[r-1][c+1], grid[r-2][c+2], grid[r-3][c+3]])
    }
  }
  return score
}

function minimax(grid, depth, isMaximizing, alpha, beta) {
  const moves = getValidMoves(grid)
  const isDraw = moves.length === 0
  const win1 = checkWin(grid, 1)
  const win2 = checkWin(grid, 2)
  
  if (win2) return 1000 + depth
  if (win1) return -1000 - depth
  if (isDraw || depth === 0) return evaluateGrid(grid)
  
  if (isMaximizing) {
    let maxEval = -Infinity
    for (const col of moves) {
      const nextGrid = dropSimulate(grid, col, 2)
      const ev = minimax(nextGrid, depth - 1, false, alpha, beta)
      maxEval = Math.max(maxEval, ev)
      alpha = Math.max(alpha, ev)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const col of moves) {
      const nextGrid = dropSimulate(grid, col, 1)
      const ev = minimax(nextGrid, depth - 1, true, alpha, beta)
      minEval = Math.min(minEval, ev)
      beta = Math.min(beta, ev)
      if (beta <= alpha) break
    }
    return minEval
  }
}

function getBestMove(grid, difficulty) {
  const possibleMoves = getValidMoves(grid)
  if (possibleMoves.length === 0) return -1
  
  if (difficulty === 'easy') {
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
  }
  
  // Instant wins
  for (const col of possibleMoves) {
    const tempGrid = dropSimulate(grid, col, 2)
    if (checkWin(tempGrid, 2)) return col
  }
  
  // Instant blocks
  for (const col of possibleMoves) {
    const tempGrid = dropSimulate(grid, col, 1)
    if (checkWin(tempGrid, 1)) return col
  }
  
  if (difficulty === 'medium') {
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
  }
  
  // Hard - minimax depth 4
  let bestScore = -Infinity
  let bestMove = possibleMoves[0]
  
  for (const col of possibleMoves) {
    const tempGrid = dropSimulate(grid, col, 2)
    const score = minimax(tempGrid, 4, false, -Infinity, Infinity)
    if (score > bestScore) {
      bestScore = score
      bestMove = col
    }
  }
  return bestMove
}

export default function ConnectFour() {
  const [gameState, setGameState] = useState(null)
  const [mode, setMode] = useState('vs_ai')
  const [difficulty, setDifficulty] = useState('medium')
  const [hoverCol, setHoverCol] = useState(null)
  const [scores, setScores] = useState({ 1: 0, 2: 0, draw: 0 })

  const startGame = useCallback((m = mode, diff = difficulty) => {
    const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
    setGameState({
      grid,
      current_player: 1,
      game_over: false,
      winner: null,
      winning_cells: []
    })
    setHoverCol(null)
  }, [mode, difficulty])

  const dropPiece = useCallback((col) => {
    if (!gameState || gameState.game_over) return
    const { grid, current_player } = gameState
    
    const r = getNextOpenRow(grid, col)
    if (r === -1) return // Column full

    playSelectSound()
    const nextGrid = grid.map(row => [...row])
    nextGrid[r][col] = current_player

    const winCells = checkWin(nextGrid, current_player)
    
    let isGameOver = false
    let winningWinner = null
    let cells = []

    if (winCells) {
      isGameOver = true
      winningWinner = current_player
      cells = winCells
      
      setScores(s => ({ ...s, [current_player]: s[current_player] + 1 }))
      if (mode === 'vs_ai' && current_player === 1) {
        playWinSound()
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      } else if (mode === 'vs_ai' && current_player === 2) {
        playLoseSound()
      } else {
        playWinSound()
      }
    } else if (getValidMoves(nextGrid).length === 0) {
      isGameOver = true
      winningWinner = 'draw'
      setScores(s => ({ ...s, draw: s.draw + 1 }))
      playLoseSound()
    }

    const nextPlayer = current_player === 1 ? 2 : 1
    
    setGameState({
      grid: nextGrid,
      current_player: nextPlayer,
      game_over: isGameOver,
      winner: winningWinner,
      winning_cells: cells
    })
  }, [gameState, mode])

  // AI Turn
  useEffect(() => {
    if (!gameState || gameState.game_over || mode !== 'vs_ai' || gameState.current_player !== 2) return
    
    const aiTimer = setTimeout(() => {
      const aiMove = getBestMove(gameState.grid, difficulty)
      if (aiMove !== -1) {
        dropPiece(aiMove)
      }
    }, 600)

    return () => clearTimeout(aiTimer)
  }, [gameState, mode, difficulty, dropPiece])

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
        {mode === 'vs_ai' && (
          <div className="ttt-setup__group">
            <label>AI Difficulty</label>
            <div className="ttt-setup__btns">
              {[['easy','😊 Easy'],['medium','🤔 Medium'],['hard','🔥 Hard']].map(([v,l]) => (
                <button key={v} className={`ttt-option-btn ${difficulty===v?'active':''}`} onClick={() => setDifficulty(v)}>{l}</button>
              ))}
            </div>
          </div>
        )}
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
