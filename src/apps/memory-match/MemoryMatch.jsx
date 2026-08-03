import { useState, useEffect, useCallback, useRef } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const BEST_SCORES_KEY = 'codearcade-memory-best'
const THEMES = ['animals', 'shapes', 'space']
const DIFFICULTIES = [
  { value: 'easy',   label: '😊 Easy',   sub: '8 cards' },
  { value: 'medium', label: '🤔 Medium', sub: '16 cards' },
  { value: 'hard',   label: '💀 Hard',   sub: '24 cards' },
]

const EMOJI_SETS = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
  shapes: ['🔴', '🟩', '🔺', '⭐', '🌀', '🌙', '🔶', '🍩', '🧡', '🟦', '🛑', '🟣'],
  space: ['🚀', '🛸', '🌌', '🪐', '👽', '☀️', '🌍', '🌠', '🛰️', '☄️', '🔭', '🧑‍🚀']
}

function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_SCORES_KEY)) || {} } catch { return {} }
}

export default function MemoryMatch() {
  const [gameState, setGameState] = useState(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [theme, setTheme] = useState('animals')
  const [lockBoard, setLockBoard] = useState(false)
  const [bestScores, setBestScores] = useState(loadBest)
  const [elapsed, setElapsed] = useState(0)
  const [flippedIds, setFlippedIds] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (gameState && !gameState.game_over) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [gameState?.game_over, !!gameState])

  const startGame = useCallback((diff = difficulty, th = theme) => {
    clearInterval(timerRef.current)
    setElapsed(0)
    setLockBoard(false)
    setFlippedIds([])

    const numCards = diff === 'easy' ? 8 : diff === 'medium' ? 16 : 24
    const numPairs = numCards / 2
    
    // Slice emojis and double them
    const themeEmojis = EMOJI_SETS[th].slice(0, numPairs)
    const cardPool = [...themeEmojis, ...themeEmojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }))
      .sort(() => Math.random() - 0.5) // Shuffle

    setGameState({
      cards: cardPool,
      moves: 0,
      matches: 0,
      num_pairs: numPairs,
      game_over: false
    })
  }, [difficulty, theme])

  const handleCardClick = useCallback((cardId) => {
    if (lockBoard || !gameState || gameState.game_over) return
    
    const card = gameState.cards.find(c => c.id === cardId)
    if (card.matched || card.flipped || flippedIds.includes(cardId)) return
    if (flippedIds.length >= 2) return

    playSelectSound()

    // Flip card
    const nextCards = gameState.cards.map(c => c.id === cardId ? { ...c, flipped: true } : c)
    const nextFlipped = [...flippedIds, cardId]
    setFlippedIds(nextFlipped)

    let updatedGameState = {
      ...gameState,
      cards: nextCards,
      moves: gameState.moves + (nextFlipped.length === 2 ? 1 : 0)
    }

    if (nextFlipped.length === 2) {
      const firstCard = nextCards.find(c => c.id === nextFlipped[0])
      const secondCard = nextCards.find(c => c.id === nextFlipped[1])

      if (firstCard.emoji === secondCard.emoji) {
        // Matched
        const finalCards = nextCards.map(c => 
          c.id === firstCard.id || c.id === secondCard.id ? { ...c, matched: true } : c
        )
        const nextMatches = gameState.matches + 1
        const isOver = nextMatches === gameState.num_pairs

        updatedGameState = {
          ...updatedGameState,
          cards: finalCards,
          matches: nextMatches,
          game_over: isOver
        }

        setFlippedIds([])

        if (isOver) {
          playWinSound()
          const key = `${difficulty}-${theme}`
          const cur = bestScores[key]
          if (!cur || updatedGameState.moves < cur.moves) {
            const updated = { ...bestScores, [key]: { moves: updatedGameState.moves, time: elapsed } }
            setBestScores(updated)
            localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(updated))
          }
          window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
        }
      } else {
        // No match - reset after timeout
        setLockBoard(true)
        setTimeout(() => {
          playLoseSound()
          const finalCards = updatedGameState.cards.map(c => 
            c.id === firstCard.id || c.id === secondCard.id ? { ...c, flipped: false } : c
          )
          setGameState(prev => ({
            ...prev,
            cards: finalCards
          }))
          setFlippedIds([])
          setLockBoard(false)
        }, 1000)
      }
    }

    setGameState(updatedGameState)
  }, [lockBoard, gameState, flippedIds, elapsed, bestScores, difficulty, theme])

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
                {t === 'animals' ? '🐶' : t === 'shapes' ? '⭐' : '🚀'} {t.charAt(0).toUpperCase() + t.slice(1)}
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

  const { cards, moves, matches, num_pairs, game_over } = gameState
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
