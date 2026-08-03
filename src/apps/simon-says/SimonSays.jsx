import { useState, useEffect, useCallback, useRef } from 'react'
import { playWinSound, playLoseSound } from '../../shared/sounds'

const COLOR_CONFIG = {
  red:    { bg: '#FF4757', label: '🔴', sound: 261.63 },
  blue:   { bg: '#1E90FF', label: '🔵', sound: 329.63 },
  green:  { bg: '#2ED573', label: '🟢', sound: 392.00 },
  yellow: { bg: '#FFD700', label: '🟡', sound: 523.25 },
}
const COLORS = ['red', 'blue', 'green', 'yellow']
const BEST_KEY = 'codearcade-simon-best'

function playColorSound(freq) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {
    console.error(e)
  }
}

export default function SimonSays() {
  const [activeColor, setActiveColor] = useState(null)
  const [phase, setPhase] = useState('idle') // 'idle' | 'watching' | 'input' | 'gameover'
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
  })
  
  const [gameState, setGameState] = useState({
    sequence: [],
    player_input: [],
    round: 0,
    longest_streak: 0,
    game_over: false
  })

  const seqRef = useRef([])
  const inputIndexRef = useRef(0)

  // Speeds up per round: baseline 500ms, decreases by 40ms each round, min 180ms
  const getSpeed = (round) => {
    return Math.max(180, 500 - (round * 40))
  }

  const playSequence = useCallback(async (sequence, round) => {
    setPhase('watching')
    const speed = getSpeed(round)
    
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, speed * 0.7))
      setActiveColor(sequence[i])
      playColorSound(COLOR_CONFIG[sequence[i]].sound)
      await new Promise(r => setTimeout(r, speed))
      setActiveColor(null)
    }
    
    await new Promise(r => setTimeout(r, 300))
    setPhase('input')
    inputIndexRef.current = 0
    setGameState(prev => ({ ...prev, player_input: [] }))
  }, [])

  const startGame = useCallback(() => {
    const startSeq = [COLORS[Math.floor(Math.random() * COLORS.length)]]
    seqRef.current = startSeq
    
    const startState = {
      sequence: startSeq,
      player_input: [],
      round: 1,
      longest_streak: 0,
      game_over: false
    }
    
    setGameState(startState)
    playSequence(startSeq, 1)
  }, [playSequence])

  const handleColorPress = useCallback(async (color) => {
    if (phase !== 'input' || gameState.game_over) return

    setActiveColor(color)
    playColorSound(COLOR_CONFIG[color].sound)
    setTimeout(() => setActiveColor(null), 180)

    const expectedColor = seqRef.current[inputIndexRef.current]
    const nextPlayerInput = [...gameState.player_input, color]
    
    setGameState(prev => ({ ...prev, player_input: nextPlayerInput }))

    if (color === expectedColor) {
      // Correct input
      inputIndexRef.current += 1
      
      if (inputIndexRef.current === seqRef.current.length) {
        // Round cleared! Add a new color to sequence
        const nextSeq = [...seqRef.current, COLORS[Math.floor(Math.random() * COLORS.length)]]
        seqRef.current = nextSeq
        
        const nextRound = gameState.round + 1
        const currentStreak = gameState.round // Streak is number of colors correctly repeated
        const nextStreak = Math.max(gameState.longest_streak, currentStreak)
        
        setGameState(prev => ({
          ...prev,
          round: nextRound,
          longest_streak: nextStreak
        }))

        // Play win sound for round milestone (every 3 rounds) or standard select
        if (nextRound > 1 && (nextRound - 1) % 3 === 0) {
          playWinSound()
          // Dispatched star reward for progress milestone!
          window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
        }

        await new Promise(r => setTimeout(r, 600))
        playSequence(nextSeq, nextRound)
      }
    } else {
      // Wrong input - Game Over
      playLoseSound()
      const finalStreak = gameState.round - 1
      const isNewBest = finalStreak > best
      
      setGameState(prev => ({ ...prev, game_over: true, longest_streak: finalStreak }))
      setPhase('gameover')

      if (isNewBest) {
        setBest(finalStreak)
        localStorage.setItem(BEST_KEY, finalStreak.toString())
      }
    }
  }, [phase, gameState, best, playSequence])

  if (!gameState || phase === 'idle') {
    return (
      <div className="simon-setup">
        <h2 className="simon-setup__title">🎵 Simon Says</h2>
        <p className="simon-setup__desc">Watch the flashing colors, then repeat the sequence! The sequence gets longer and faster each round.</p>
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
        <p>You made it to round <strong>{gameState.round}</strong>!</p>
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
