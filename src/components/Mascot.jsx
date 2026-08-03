import { useState } from 'react'

const MESSAGES = [
  "Hi! I'm Felix the Fox! 🦊",
  "Let's play some games! 🎮",
  "You are doing AMAZING! 🌟",
  "Wanna try another level? 🚀",
  "You're a super puzzle-solver! 🏆",
  "Don't give up! I believe in you! 💪"
]

export default function Mascot({ message, isStuck, onClick }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [localMessage, setLocalMessage] = useState(MESSAGES[0])
  const [isWinking, setIsWinking] = useState(false)

  const handleClick = () => {
    setIsWinking(true)
    setTimeout(() => setIsWinking(false), 500)
    
    if (onClick) {
      onClick()
      return
    }

    const next = (msgIdx + 1) % MESSAGES.length
    setMsgIdx(next)
    setLocalMessage(MESSAGES[next])
  }

  const displayedMessage = message || (isStuck ? "Need a hint? Click me! 💡" : localMessage)

  return (
    <div 
      className={`mascot-character ${isStuck ? 'mascot-stuck-wobble' : ''}`} 
      onClick={handleClick} 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        padding: '10px 16px',
        background: 'var(--card-bg, rgba(255, 255, 255, 0.8))',
        borderRadius: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '3px solid var(--primary-color)',
        transition: 'all 0.3s ease',
        userSelect: 'none'
      }}
      role="button"
      tabIndex={0}
      title="Click Felix for a tip!"
    >
      <div 
        className="mascot-face"
        style={{
          fontSize: '3rem',
          transform: isWinking ? 'scale(1.15) rotate(10deg)' : 'none',
          transition: 'transform 0.2s',
          animation: isStuck ? 'bounce 1s infinite alternate' : 'none'
        }}
      >
        {isWinking ? '😜' : '🦊'}
      </div>
      <div 
        className="mascot-bubble"
        style={{
          background: '#fff',
          padding: '8px 14px',
          borderRadius: '16px',
          border: '2px solid #ff9800',
          position: 'relative',
          fontSize: '0.95rem',
          color: '#333',
          fontWeight: 'bold'
        }}
      >
        <div style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          width: '12px',
          height: '12px',
          background: '#fff',
          borderLeft: '2px solid #ff9800',
          borderBottom: '2px solid #ff9800'
        }} />
        {displayedMessage}
      </div>
    </div>
  )
}
