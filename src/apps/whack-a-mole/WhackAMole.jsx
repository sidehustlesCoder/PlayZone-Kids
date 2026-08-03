import { useState, useEffect, useRef } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const GAME_DURATION = 30 // seconds
const BEST_KEY = 'codearcade-whack-best'

export default function WhackAMole() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeHole, setActiveHole] = useState(null)
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
  })
  
  const timerRef = useRef(null)
  const moleTimerRef = useRef(null)
  const activeDurationRef = useRef(1000) // starts at 1s, speeds up

  const popMole = () => {
    if (!isPlaying) return
    const randomHole = Math.floor(Math.random() * 9)
    setActiveHole(randomHole)

    // Calculate mole active duration based on score
    const duration = Math.max(450, 1000 - score * 25)
    activeDurationRef.current = duration

    moleTimerRef.current = setTimeout(() => {
      setActiveHole(null)
      // Small pause before popping next mole
      setTimeout(popMole, Math.random() * 400 + 200)
    }, duration)
  }

  const handleWhack = (holeIndex) => {
    if (!isPlaying || holeIndex !== activeHole) return
    
    playSelectSound()
    setScore(s => s + 1)
    setActiveHole(null)
    clearTimeout(moleTimerRef.current)
    
    // Immediately trigger next mole
    setTimeout(popMole, 100)
  }

  const startGame = () => {
    setIsPlaying(true)
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setActiveHole(null)
    activeDurationRef.current = 1000

    // Main game countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)

    // Start popping moles
    setTimeout(popMole, 500)
  }

  // Handle Game Over
  useEffect(() => {
    if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false)
      clearTimeout(moleTimerRef.current)
      setActiveHole(null)
      playWinSound()
      
      const isNewBest = score > best
      if (isNewBest) {
        setBest(score)
        localStorage.setItem(BEST_KEY, score.toString())
      }
      
      // Hook completion into reward system
      window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
    }
  }, [timeLeft, isPlaying, score, best])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(moleTimerRef.current)
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto', userSelect: 'none' }}>
      <h2 style={{ color: 'var(--text-color)' }}>🔨 Whack-a-Mole</h2>

      {!isPlaying && timeLeft === GAME_DURATION ? (
        <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' }}>
          <p style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Tap the moles as fast as you can before they hide! 🦫</p>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>🏆 Best Score: <strong>{best}</strong></div>
          <button onClick={startGame} className="ttt-start-btn" style={{ padding: '12px 30px', fontSize: '1.25rem' }}>
            🎮 Start Game
          </button>
        </div>
      ) : !isPlaying && timeLeft === 0 ? (
        <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎉</div>
          <h2>Great Job!</h2>
          <p style={{ fontSize: '1.3rem' }}>You whacked <strong>{score}</strong> moles!</p>
          {score >= best && <p style={{ color: '#4caf50', fontWeight: 'bold' }}>🏆 New Personal Best!</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
            <button onClick={startGame} className="ttt-replay-btn">Play Again</button>
            <button onClick={() => setTimeLeft(GAME_DURATION)} className="ttt-back-btn">Main Menu</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '1.3rem', marginBottom: '20px', fontWeight: 'bold' }}>
            <div>⏱ Time: {timeLeft}s</div>
            <div>🎯 Score: {score}</div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px',
            background: '#8d6e63',
            padding: '20px',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            {Array.from({ length: 9 }).map((_, index) => {
              const isActive = activeHole === index
              return (
                <button
                  key={index}
                  onClick={() => handleWhack(index)}
                  style={{
                    height: '110px',
                    borderRadius: '50% 50% 16px 16px',
                    background: '#4e342e',
                    border: '4px solid #3e2723',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isActive ? 'pointer' : 'default',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Whack slot"
                >
                  <div style={{
                    width: '70px',
                    height: '70px',
                    background: '#8d6e63',
                    borderRadius: '50%',
                    position: 'absolute',
                    bottom: '-35px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }} />
                  {isActive && (
                    <div style={{
                      fontSize: '3.5rem',
                      position: 'absolute',
                      bottom: '10px',
                      zIndex: 2,
                      animation: 'bounce 0.15s ease-out'
                    }}>
                      🦫
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
