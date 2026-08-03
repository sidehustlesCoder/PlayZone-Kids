import { useState, useEffect } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const COLORS = [
  { id: 'red', name: 'Red', emoji: '🎈', hex: '#ff4d4d' },
  { id: 'blue', name: 'Blue', emoji: '🎈', hex: '#2196f3' },
  { id: 'green', name: 'Green', emoji: '🎈', hex: '#4caf50' },
  { id: 'yellow', name: 'Yellow', emoji: '🎈', hex: '#ffeb3b' }
]

const ANIMAL_REVEALS = ['🦁', '🐯', '🦒', '🐘', '🐼', '🐨', '🦄', '🐰']

export default function ColorSplash() {
  const [targetColor, setTargetColor] = useState(COLORS[0])
  const [balloons, setBalloons] = useState([])
  const [score, setScore] = useState(0)
  const [targetTotal, setTargetTotal] = useState(0)
  const [revealedAnimal, setRevealedAnimal] = useState('')
  const [message, setMessage] = useState('')
  const [isWon, setIsWon] = useState(false)

  const setupGame = () => {
    // Pick a random target color
    const target = COLORS[Math.floor(Math.random() * COLORS.length)]
    setTargetColor(target)

    // Generate 12 balloons, guaranteeing at least 3-4 target colors
    const list = []
    let count = 0
    for (let i = 0; i < 12; i++) {
      const isTarget = Math.random() > 0.6 || (i < 3) // Make sure we have enough targets
      const color = isTarget ? target : COLORS.filter(c => c.id !== target.id)[Math.floor(Math.random() * (COLORS.length - 1))]
      if (color.id === target.id) count++
      list.push({
        id: i,
        color: color,
        popped: false,
        x: Math.random() * 80 + 10, // Percent x position
        y: Math.random() * 60 + 20, // Percent y position
      })
    }

    setBalloons(list)
    setTargetTotal(count)
    setScore(0)
    setRevealedAnimal(ANIMAL_REVEALS[Math.floor(Math.random() * ANIMAL_REVEALS.length)])
    setIsWon(false)
    setMessage(`Find and pop all the ${target.name} balloons! 🎈`)
  }

  useEffect(() => {
    setupGame()
  }, [])

  const handlePop = (balloon) => {
    if (balloon.popped || isWon) return

    if (balloon.color.id === targetColor.id) {
      playSelectSound()
      const updatedBalloons = balloons.map(b => b.id === balloon.id ? { ...b, popped: true } : b)
      setBalloons(updatedBalloons)
      
      const newScore = score + 1
      setScore(newScore)

      if (newScore >= targetTotal) {
        setIsWon(true)
        playWinSound()
        setMessage(`Wow! You revealed a ${revealedAnimal}! Awesome job! ⭐`)
        window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      } else {
        setMessage(`Nice! You found ${newScore} of ${targetTotal}! Keep going! 🌟`)
      }
    } else {
      playLoseSound()
      setMessage(`Oops! That balloon is ${balloon.color.name}! Find the ${targetColor.name} ones! 💖`)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto', userSelect: 'none' }}>
      <h2 style={{ color: 'var(--text-color)' }}>🎈 Color Splash</h2>
      <p style={{ fontSize: '1.25rem', margin: '15px 0', minHeight: '30px', color: isWon ? '#4caf50' : 'var(--text-color)' }}>
        {message}
      </p>

      {/* Game board / Sky */}
      <div style={{
        height: '350px',
        background: isWon ? 'radial-gradient(circle, #fff9c4, #b3e5fc)' : 'linear-gradient(to bottom, #81d4fa, #b3e5fc)',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden',
        border: '4px solid #fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        {isWon && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1.5)',
            fontSize: '5rem',
            animation: 'bounce 1s infinite alternate',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {revealedAnimal}
          </div>
        )}

        {!isWon && balloons.map(b => (
          <button
            key={b.id}
            onClick={() => handlePop(b)}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '50px',
              height: '60px',
              borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              background: b.popped ? 'transparent' : b.color.hex,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: b.popped ? '1.5rem' : '0rem',
              transition: 'all 0.15s ease-out',
              boxShadow: b.popped ? 'none' : 'inset -4px -6px 10px rgba(0,0,0,0.2)',
              outline: 'none',
            }}
            title={`${b.color.name} Balloon`}
          >
            {b.popped ? '💥' : ''}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={setupGame}
          className="ttt-replay-btn"
          style={{ padding: '10px 24px', fontSize: '1.2rem' }}
        >
          {isWon ? '🎉 Play Again' : '🔄 Restart'}
        </button>
      </div>
    </div>
  )
}
