import { useEffect, useState } from 'react'

const COLORS = [
  '#FF6B9D','#FFD93D','#6BCB77','#4ECDC4','#FF8C42',
  '#C77DFF','#48CAE4','#F7B731','#FC5C65','#45B7D1',
]

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

export default function Confetti({ active, onDone }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) { setPieces([]); return }

    const shapes = ['■', '●', '▲', '★', '♦', '✦']
    const newPieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: randomBetween(5, 95),
      delay: randomBetween(0, 0.8),
      duration: randomBetween(1.5, 2.8),
      size: randomBetween(8, 18),
      color: COLORS[i % COLORS.length],
      rotation: randomBetween(0, 360),
      shape: shapes[i % shapes.length],
      drift: randomBetween(-60, 60),
    }))
    setPieces(newPieces)

    const timer = setTimeout(() => {
      setPieces([])
      onDone?.()
    }, 3500)

    return () => clearTimeout(timer)
  }, [active, onDone])

  if (!pieces.length) return null

  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            color: p.color,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rot': `${p.rotation}deg`,
          }}
        >
          {p.shape}
        </span>
      ))}
      <div className="confetti-message">🎉 Amazing! 🎉</div>
    </div>
  )
}
