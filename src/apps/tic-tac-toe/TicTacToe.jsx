import { useState, useCallback } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

// Pure JS minimax (mirroring the Python logic) so we don't need Pyodide overhead
function checkWinner(board) {
  for (const [a,b,c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] }
    }
  }
  if (!board.includes(null)) return { winner: 'draw', line: null }
  return null
}

function minimax(board, isMax, alpha, beta) {
  const res = checkWinner(board)
  if (res) {
    if (res.winner === 'O') return 10
    if (res.winner === 'X') return -10
    return 0
  }
  const empty = board.map((v,i) => v === null ? i : -1).filter(i => i !== -1)
  if (isMax) {
    let best = -Infinity
    for (const pos of empty) {
      board[pos] = 'O'
      best = Math.max(best, minimax(board, false, alpha, beta))
      board[pos] = null
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const pos of empty) {
      board[pos] = 'X'
      best = Math.min(best, minimax(board, true, alpha, beta))
      board[pos] = null
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

function getAIMove(board, difficulty) {
  const empty = board.map((v,i) => v === null ? i : -1).filter(i => i !== -1)
  if (!empty.length) return null
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)]
  let bestScore = -Infinity, bestMove = null
  for (const pos of empty) {
    board[pos] = 'O'
    const score = minimax([...board], false, -Infinity, Infinity)
    board[pos] = null
    if (score > bestScore) { bestScore = score; bestMove = pos }
  }
  return bestMove
}

const SYMBOLS = { X: '✕', O: '○' }
const SYMBOL_COLORS = { X: 'var(--primary)', O: 'var(--secondary)' }

export default function TicTacToe() {
  const [mode, setMode] = useState('vs_ai')       // 'vs_ai' | '2player'
  const [difficulty, setDifficulty] = useState('hard')
  const [started, setStarted] = useState(false)
  const [board, setBoard] = useState(Array(9).fill(null))
  const [current, setCurrent] = useState('X')
  const [result, setResult] = useState(null)       // null | { winner, line }
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 })

  const startGame = () => {
    setBoard(Array(9).fill(null))
    setCurrent('X')
    setResult(null)
    setStarted(true)
  }

  const handleClick = useCallback((idx) => {
    if (result || board[idx] !== null) return
    playSelectSound()

    const newBoard = [...board]
    newBoard[idx] = current
    const res = checkWinner(newBoard)
    if (res) {
      setBoard(newBoard)
      setResult(res)
      setScores(s => ({ ...s, [res.winner]: (s[res.winner] || 0) + 1 }))
      if (res.winner === 'X') {
        playWinSound()
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      } else if (res.winner === 'draw') {
        playLoseSound()
      } else {
        playLoseSound()
      }
      return
    }

    // Switch player
    const nextPlayer = current === 'X' ? 'O' : 'X'

    if (mode === 'vs_ai' && nextPlayer === 'O') {
      const aiIdx = getAIMove([...newBoard], difficulty)
      if (aiIdx !== null) {
        newBoard[aiIdx] = 'O'
        const aiRes = checkWinner(newBoard)
        setBoard([...newBoard])
        if (aiRes) {
          setResult(aiRes)
          setScores(s => ({ ...s, [aiRes.winner]: (s[aiRes.winner] || 0) + 1 }))
          if (aiRes.winner === 'O') playLoseSound()
          else if (aiRes.winner === 'draw') playLoseSound()
        } else {
          setCurrent('X')
        }
      }
    } else {
      setBoard(newBoard)
      setCurrent(nextPlayer)
    }
  }, [board, current, result, mode, difficulty])

  if (!started) {
    return (
      <div className="ttt-setup">
        <h2 className="ttt-setup__title">🎮 Tic-Tac-Toe!</h2>
        <div className="ttt-setup__options">
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
              <label>Difficulty</label>
              <div className="ttt-setup__btns">
                {[['easy','😊 Easy'],['hard','🧠 Hard (Unbeatable)']].map(([v,l]) => (
                  <button key={v} className={`ttt-option-btn ${difficulty===v?'active':''}`} onClick={() => setDifficulty(v)}>{l}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="ttt-start-btn" onClick={startGame}>Start Game</button>
      </div>
    )
  }

  const winnerLabel = result?.winner === 'draw' ? "What a close game! 🤝 It's a Draw!" :
    result?.winner === 'X' ? '🎉 Woohoo! You won! Amazing job!' :
    result?.winner ? `${mode === 'vs_ai' ? '🤖 The AI won this time... Try again!' : `🌟 Player ${result.winner} Wins!`}` : null

  return (
    <div className="ttt-app">
      {/* Scoreboard */}
      <div className="ttt-scores">
        <div className="ttt-score-card">
          <span className="ttt-score-label" style={{ color: SYMBOL_COLORS.X }}>Player X</span>
          <span className="ttt-score-val">{scores.X}</span>
        </div>
        <div className="ttt-score-card ttt-score-card--draw">
          <span className="ttt-score-label">Draws</span>
          <span className="ttt-score-val">{scores.draw}</span>
        </div>
        <div className="ttt-score-card">
          <span className="ttt-score-label" style={{ color: SYMBOL_COLORS.O }}>{mode === 'vs_ai' ? '🤖 AI' : 'Player O'}</span>
          <span className="ttt-score-val">{scores.O}</span>
        </div>
      </div>

      {/* Status */}
      {!result ? (
        <p className="ttt-status">
          <span style={{ color: SYMBOL_COLORS[current] }}>{SYMBOLS[current]}</span>
          {' '}{current === 'X' ? '🤩 Your turn — make it count!' : mode === 'vs_ai' ? '🤖 AI is thinking...' : "🌀 Player O's turn!"}
        </p>
      ) : (
        <p className="ttt-status ttt-status--result">{winnerLabel}</p>
      )}

      {/* Board */}
      <div className="ttt-board">
        {board.map((cell, i) => {
          const isWinCell = result?.line?.includes(i)
          return (
            <button
              key={i}
              id={`ttt-cell-${i}`}
              className={`ttt-cell ${cell ? 'ttt-cell--filled' : ''} ${isWinCell ? 'ttt-cell--win' : ''}`}
              onClick={() => handleClick(i)}
              aria-label={`Cell ${i}, ${cell || 'empty'}`}
              disabled={!!result || cell !== null}
            >
              {cell && (
                <span style={{ color: SYMBOL_COLORS[cell] }}>{SYMBOLS[cell]}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="ttt-actions">
        <button className="ttt-replay-btn" onClick={startGame}>🔄 Play Again!</button>
        <button className="ttt-back-btn" onClick={() => setStarted(false)}>⚙ Settings</button>
      </div>
    </div>
  )
}
