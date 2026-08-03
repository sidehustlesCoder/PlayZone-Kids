import { useState, useEffect } from 'react'
import { playWinSound, playLoseSound, playSelectSound } from '../../shared/sounds'

const ANIMALS = [
  { id: 'dog', name: 'Dog', emoji: '🐶', sound: 'Woof Woof!', synthPitch: 180 },
  { id: 'cat', name: 'Cat', emoji: '🐱', sound: 'Meow!', synthPitch: 400 },
  { id: 'cow', name: 'Cow', emoji: '🐮', sound: 'Moo!', synthPitch: 100 },
  { id: 'frog', name: 'Frog', emoji: '🐸', sound: 'Ribbit!', synthPitch: 150 },
  { id: 'bird', name: 'Bird', emoji: '🐦', sound: 'Tweet Tweet!', synthPitch: 800 },
  { id: 'sheep', name: 'Sheep', emoji: '🐑', sound: 'Baa!', synthPitch: 220 },
  { id: 'pig', name: 'Pig', emoji: '🐷', sound: 'Oink!', synthPitch: 120 },
  { id: 'duck', name: 'Duck', emoji: '🦆', sound: 'Quack!', synthPitch: 250 },
]

export default function AnimalSoundMatch() {
  const [currentRound, setCurrentRound] = useState(0)
  const [targetAnimal, setTargetAnimal] = useState(null)
  const [choices, setChoices] = useState([])
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('')
  const [isWon, setIsWon] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const playAnimalSynth = (pitch) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(pitch, now)
      // Modulate frequency to make it sound like a call
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.2, now + 0.1)
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, now + 0.25)
      
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      
      osc.start(now)
      osc.stop(now + 0.3)
    } catch (e) {
      console.error(e)
    }
  }

  const nextRound = (currentScore = score, roundNum = currentRound) => {
    if (roundNum >= 5) {
      setIsWon(true)
      playWinSound()
      setMessage(`Fantastic! You matched all 5 animals! 🏆⭐`)
      window.dispatchEvent(new CustomEvent('game-win', { detail: { stars: 1 } }))
      return
    }

    const target = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    setTargetAnimal(target)
    
    // Choose 2 other random options
    const others = ANIMALS.filter(a => a.id !== target.id)
    const randomChoices = [target]
    while (randomChoices.length < 3) {
      const candidate = others[Math.floor(Math.random() * others.length)]
      if (!randomChoices.some(rc => rc.id === candidate.id)) {
        randomChoices.push(candidate)
      }
    }
    
    // Shuffle choices
    randomChoices.sort(() => Math.random() - 0.5)
    setChoices(randomChoices)
    
    setMessage(`Who says: "${target.sound}"? 🔊`)
    setCurrentRound(roundNum + 1)
  }

  const handleChoice = (animal) => {
    if (isWon || !targetAnimal) return

    if (animal.id === targetAnimal.id) {
      playAnimalSynth(animal.synthPitch)
      const nextScore = score + 1
      setScore(nextScore)
      setMessage(`Yes! The ${animal.name} says "${animal.sound}"! 🎉`)
      setTimeout(() => nextRound(nextScore, currentRound), 1500)
    } else {
      playLoseSound()
      setMessage(`Oops! That's the ${animal.name}! Try again! 💖`)
    }
  }

  const handleStart = () => {
    setGameStarted(true)
    setScore(0)
    setCurrentRound(0)
    setIsWon(false)
    nextRound(0, 0)
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto', userSelect: 'none' }}>
      <h2 style={{ color: 'var(--text-color)' }}>🔊 Animal Sound Match</h2>

      {!gameStarted ? (
        <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' }}>
          <p style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Can you match the animal sounds to the correct animals? 🐶🐱🐰</p>
          <button onClick={handleStart} className="ttt-start-btn" style={{ padding: '12px 30px', fontSize: '1.25rem' }}>
            🎮 Start Game
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text-muted)' }}>
            Round {currentRound} of 5 • Score: {score}
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '20px 0', minHeight: '40px', color: 'var(--text-color)' }}>
            {message}
          </p>

          {!isWon && targetAnimal && (
            <button 
              onClick={() => playAnimalSynth(targetAnimal.synthPitch)}
              style={{
                fontSize: '2.5rem',
                background: 'var(--primary-color)',
                border: 'none',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                cursor: 'pointer',
                marginBottom: '30px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite'
              }}
              title="Hear the animal noise!"
            >
              🔊
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
            {!isWon && choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                style={{
                  fontSize: '4.5rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  width: '120px',
                  height: '120px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                title={choice.name}
              >
                {choice.emoji}
              </button>
            ))}
          </div>

          {isWon && (
            <button
              onClick={handleStart}
              className="ttt-replay-btn"
              style={{ marginTop: '20px', padding: '10px 24px', fontSize: '1.2rem' }}
            >
              🔄 Play Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
