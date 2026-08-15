import { useEffect, useRef, useState } from 'react'

const MOVES = ['rock', 'paper', 'scissors', 'lizard', 'spock']
const MOVE_ICONS = { rock: '✊', paper: '✋', scissors: '✌️', lizard: '🦎', spock: '🖖' }
const MOVE_COLORS = { rock: '#94a3b8', paper: '#60a5fa', scissors: '#f87171', lizard: '#4ade80', spock: '#c084fc' }

// Beats: what does this move beat?
const BEATS = {
  rock: ['scissors', 'lizard'],
  paper: ['rock', 'spock'],
  scissors: ['paper', 'lizard'],
  lizard: ['paper', 'spock'],
  spock: ['rock', 'scissors'],
}

export default function RobotBattle({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('choose') // 'choose' | 'fight' | 'result'
  const [playerMove, setPlayerMove] = useState(null)
  const [aiMove, setAiMove] = useState(null)
  const [hud, setHud] = useState({ playerHP: 100, aiHP: 100, round: 1, score: 0, result: '' })
  const [tick, setTick] = useState(0)
  const gameRef = useRef({ playerHP: 100, aiHP: 100, round: 1, score: 0 })

  const snd = (freq, type = 'square', dur = 0.12) => {
    if (!settings?.soundEnabled) return
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime)
      g.gain.setValueAtTime((settings?.volume || 0.7) * 0.12, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur)
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur)
    } catch {}
  }

  const fight = (chosen) => {
    if (phase !== 'choose' || isPaused) return
    const ai = MOVES[Math.floor(Math.random() * MOVES.length)]
    setPlayerMove(chosen); setAiMove(ai); setPhase('fight')

    const g = gameRef.current
    let result = ''
    let playerDmg = 0, aiDmg = 0

    if (BEATS[chosen].includes(ai)) {
      result = 'WIN'; aiDmg = 25 + Math.floor(Math.random() * 15); snd(600, 'sine', 0.2)
    } else if (BEATS[ai].includes(chosen)) {
      result = 'LOSE'; playerDmg = 25 + Math.floor(Math.random() * 15); snd(200, 'sawtooth', 0.2)
    } else {
      result = 'DRAW'; playerDmg = 8; aiDmg = 8; snd(440, 'triangle', 0.1)
    }

    g.playerHP = Math.max(0, g.playerHP - playerDmg)
    g.aiHP = Math.max(0, g.aiHP - aiDmg)
    g.score += result === 'WIN' ? 100 : result === 'DRAW' ? 20 : 0
    g.round++
    onScoreChange(g.score)

    setHud({ playerHP: g.playerHP, aiHP: g.aiHP, round: g.round, score: g.score, result })
    setPhase('result')

    setTimeout(() => {
      if (g.aiHP <= 0) { onVictory(g.score + 200) }
      else if (g.playerHP <= 0) { onGameOver(g.score) }
      else { setPhase('choose'); setPlayerMove(null); setAiMove(null) }
    }, 1800)
  }

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true, t = 0

    canvas.width = 800; canvas.height = 360

    const drawRobot = (x, y, color, hp, maxHp, facing, move, isPlayer) => {
      ctx.save()
      if (!facing) ctx.scale(-1, 1)

      const bx = facing ? x : -x
      const shake = (phase === 'fight' || phase === 'result') ? (Math.random() - 0.5) * 3 : 0

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.beginPath(); ctx.ellipse(bx + shake, y + 100, 50, 10, 0, 0, Math.PI * 2); ctx.fill()

      // Legs
      ctx.fillStyle = color
      ctx.fillRect(bx - 20 + shake, y + 60, 16, 36)
      ctx.fillRect(bx + 4 + shake, y + 60, 16, 36)

      // Body
      const bodyGrad = ctx.createLinearGradient(bx - 36 + shake, y, bx + 36 + shake, y + 65)
      bodyGrad.addColorStop(0, color); bodyGrad.addColorStop(1, '#0f172a')
      ctx.fillStyle = bodyGrad
      ctx.shadowBlur = 15; ctx.shadowColor = color
      ctx.fillRect(bx - 36 + shake, y, 72, 62)

      // Chest detail
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(bx - 20 + shake, y + 10, 40, 20)
      ctx.fillStyle = color; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(bx + shake, y + 20, 8, 0, Math.PI * 2); ctx.fill()

      // Arms
      const armSwing = Math.sin(t * 0.05) * (phase === 'fight' ? 20 : 5)
      ctx.fillStyle = color; ctx.shadowBlur = 8
      ctx.fillRect(bx - 55 + shake, y + armSwing, 18, 14)
      ctx.fillRect(bx + 36 + shake, y - armSwing, 18, 14)

      // Head
      ctx.fillStyle = '#1e293b'; ctx.shadowBlur = 0
      ctx.fillRect(bx - 28 + shake, y - 50, 56, 52)
      ctx.fillStyle = color; ctx.shadowBlur = 20
      // Visor eyes
      ctx.fillRect(bx - 20 + shake, y - 38, 14, 8)
      ctx.fillRect(bx + 6 + shake, y - 38, 14, 8)

      // Move icon above head
      if (move && (phase === 'fight' || phase === 'result')) {
        ctx.shadowBlur = 0
        ctx.font = '28px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(MOVE_ICONS[move], bx + shake, y - 70)
      }
      ctx.shadowBlur = 0
      ctx.restore()

      // HP bar (always in screen space, not flipped)
      const barX = facing ? x - 60 : x - 60
      const barY = y - 80
      ctx.fillStyle = '#0f172a'; ctx.fillRect(barX - 60, barY, 120, 10)
      const hpColor = hp > 50 ? '#32d74b' : hp > 25 ? '#ff9f0a' : '#ff375f'
      ctx.fillStyle = hpColor; ctx.fillRect(barX - 60, barY, 120 * (hp / maxHp), 10)
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.strokeRect(barX - 60, barY, 120, 10)
    }

    const loop = () => {
      if (!isMounted) return
      t++

      ctx.fillStyle = '#060b18'; ctx.fillRect(0, 0, 800, 360)

      // Arena floor
      const fl = ctx.createLinearGradient(0, 270, 0, 360)
      fl.addColorStop(0, '#1e293b'); fl.addColorStop(1, '#0f172a')
      ctx.fillStyle = fl; ctx.fillRect(0, 270, 800, 90)
      // Neon lines
      ctx.strokeStyle = 'rgba(0,245,255,0.15)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, 272); ctx.lineTo(800, 272); ctx.stroke()

      // Background glow orbs
      const grd = ctx.createRadialGradient(200, 180, 20, 200, 180, 180)
      grd.addColorStop(0, 'rgba(0,245,255,0.05)'); grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 800, 360)
      const grd2 = ctx.createRadialGradient(600, 180, 20, 600, 180, 180)
      grd2.addColorStop(0, 'rgba(255,59,92,0.05)'); grd2.addColorStop(1, 'transparent')
      ctx.fillStyle = grd2; ctx.fillRect(0, 0, 800, 360)

      drawRobot(200, 175, '#00f5ff', hud.playerHP, 100, true, playerMove, true)
      drawRobot(600, 175, '#ff375f', hud.aiHP, 100, false, aiMove, false)

      // VS text
      ctx.fillStyle = phase === 'result' ? (hud.result === 'WIN' ? '#32d74b' : hud.result === 'LOSE' ? '#ff375f' : '#ffd700') : '#ffffff'
      ctx.font = `bold ${phase === 'result' ? 32 : 22}px sans-serif`
      ctx.textAlign = 'center'
      ctx.shadowBlur = phase === 'result' ? 20 : 0; ctx.shadowColor = ctx.fillStyle
      ctx.fillText(phase === 'result' ? hud.result : 'VS', 400, 200)
      ctx.shadowBlur = 0

      // Labels
      ctx.font = 'bold 12px sans-serif'
      ctx.fillStyle = '#00f5ff'; ctx.textAlign = 'left'; ctx.fillText('YOU', 148, 96)
      ctx.fillStyle = '#ff375f'; ctx.textAlign = 'right'; ctx.fillText('AI BOT', 652, 96)

      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => { isMounted = false; cancelAnimationFrame(animId) }
  }, [phase, playerMove, aiMove, hud])

  return (
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <span className="text-cyan-400">🤖 HP: <span className="font-mono">{hud.playerHP}</span></span>
          <span className="text-rose-400">🔴 AI HP: <span className="font-mono">{hud.aiHP}</span></span>
        </div>
        <span className="text-yellow-400">Round {hud.round} • Score: {hud.score}</span>
      </div>

      <canvas ref={canvasRef} className="w-full border border-slate-800 shadow-2xl" />

      {/* Move picker */}
      <div className="w-full bg-slate-900/95 border border-t-0 border-slate-800 rounded-b-2xl p-4">
        <p className="text-center text-xs text-slate-400 mb-3 uppercase tracking-wider font-bold">
          {phase === 'choose' ? 'Choose your move!' : phase === 'fight' ? 'Battle in progress...' : hud.result === 'WIN' ? '✅ You won this round!' : hud.result === 'LOSE' ? '❌ You lost this round!' : '🤝 Draw!'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {MOVES.map(m => (
            <button
              key={m}
              disabled={phase !== 'choose'}
              onClick={() => fight(m)}
              style={{ borderColor: playerMove === m ? MOVE_COLORS[m] : 'transparent', background: playerMove === m ? `${MOVE_COLORS[m]}22` : '' }}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-slate-800 border-2 transition-all text-xs font-bold uppercase ${phase === 'choose' ? 'hover:scale-110 hover:bg-slate-700 cursor-pointer' : 'opacity-60 cursor-default'}`}
            >
              <span className="text-2xl">{MOVE_ICONS[m]}</span>
              <span className="text-slate-300">{m}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-600 text-[10px] mt-3">Rock beats Scissors+Lizard • Paper beats Rock+Spock • Scissors beats Paper+Lizard • Lizard beats Paper+Spock • Spock beats Rock+Scissors</p>
      </div>
    </div>
  )
}
