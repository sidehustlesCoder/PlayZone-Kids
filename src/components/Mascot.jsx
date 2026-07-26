import { useState } from 'react'

const MESSAGES = [
  "You're a SUPERSTAR! 🌟",
  "Keep playing, champ! 🏆",
  "Games make learning FUN! 🎮",
  "You can do it! 💪",
  "Every game makes you smarter! 🧠",
  "Adventure awaits! 🚀",
]

export default function Mascot() {
  const [msg, setMsg] = useState(MESSAGES[0])
  const [wink, setWink] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)

  const handleClick = () => {
    setWink(true)
    setTimeout(() => setWink(false), 400)
    const next = (msgIdx + 1) % MESSAGES.length
    setMsgIdx(next)
    setMsg(MESSAGES[next])
  }

  return (
    <div className="mascot" onClick={handleClick} title="Click me!" role="button" tabIndex={0}>
      <div className={`mascot__body ${wink ? 'mascot__body--wink' : ''}`}>
        <span className="mascot__rocket">🚀</span>
        <span className="mascot__stars">✨</span>
      </div>
      <div className="mascot__bubble">
        <span>{msg}</span>
      </div>
    </div>
  )
}
