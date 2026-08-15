import { useEffect, useRef, useState } from 'react'

export default function BasketballStars({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ playerScore: 0, aiScore: 0, time: 60, quarter: 1, result: '' })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 700, H = 500
    canvas.width = W; canvas.height = H

    const snd = (freq, type = 'sine', dur = 0.15) => {
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

    let playerScore = 0, aiScore = 0, timeLeft = 60, quarter = 1, gameOver = false
    let ballX = W / 2, ballY = H / 2, ballVX = 0, ballVY = 0
    let ballInAir = false, shotFrom = null
    let particles = [], resultText = '', resultTimer = 0
    let tick = 0, clockTick = 0, score = 0

    // Player (you control this)
    const player = { x: W * 0.25, y: H / 2, speed: 3.2, hasBall: true }
    // AI opponent
    const ai = { x: W * 0.75, y: H / 2, speed: 2.5 }

    const hoopLeft = { x: 60, y: 200, r: 25 }
    const hoopRight = { x: W - 60, y: 200, r: 25 }

    const keys = {}
    const onKD = (e) => {
      keys[e.key] = true
      if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      // Shoot towards left hoop (player's hoop is right side, defending left)
      if ((e.code === 'Space' || e.key === 'z' || e.key === 'Z') && player.hasBall && !ballInAir) {
        const hoop = hoopRight // shoot to right hoop
        const dist = Math.hypot(player.x - hoop.x, player.y - hoop.y)
        const accuracy = Math.max(0.4, 1 - dist / 600)
        ballX = player.x; ballY = player.y
        ballVX = (hoop.x - player.x) * 0.04; ballVY = -12
        ballInAir = true; player.hasBall = false; shotFrom = 'player'
        snd(400, 'sine', 0.1)
      }
    }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const loop = () => {
      if (!isMounted) return
      tick++
      if (!isPaused && !gameOver) {
        // Clock
        clockTick++
        if (clockTick % 60 === 0 && timeLeft > 0) {
          timeLeft--
          if (timeLeft <= 0) {
            if (quarter < 4) { quarter++; timeLeft = 60 }
            else { gameOver = true; if (playerScore > aiScore) onVictory(score + 200); else onGameOver(score) }
          }
        }

        // AI shoots periodically
        if (!ballInAir && !player.hasBall && tick % 120 === 0) {
          ballX = ai.x; ballY = ai.y
          ballVX = (hoopLeft.x - ai.x) * 0.04; ballVY = -11
          ballInAir = true; shotFrom = 'ai'
        }

        if (!ballInAir && !player.hasBall) { player.hasBall = true } // simple repossess

        // Player movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x = Math.max(40, player.x - player.speed)
        if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x = Math.min(W - 40, player.x + player.speed)
        if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y = Math.max(50, player.y - player.speed)
        if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y = Math.min(H - 50, player.y + player.speed)

        // AI basic movement
        const aiTarget = player.hasBall ? player : { x: hoopLeft.x, y: hoopLeft.y }
        const adx = aiTarget.x - ai.x, ady = aiTarget.y - ai.y
        const alen = Math.hypot(adx, ady) || 1
        if (alen > 30) { ai.x += (adx / alen) * ai.speed; ai.y += (ady / alen) * ai.speed }

        // Ball physics
        if (ballInAir) {
          ballX += ballVX; ballY += ballVY; ballVY += 0.45
          // Check hoop collision
          const checkHoop = (hoop, scorer) => {
            if (Math.hypot(ballX - hoop.x, ballY - hoop.y) < hoop.r + 8 && ballY < hoop.y + 20) {
              const is3pt = shotFrom === 'player' && Math.hypot(player.x - hoop.x, player.y - hoop.y) > 250
              const pts = is3pt ? 3 : 2
              if (scorer === 'player') { playerScore += pts; score += pts * 100; onScoreChange(score); resultText = is3pt ? '3-Pointer! 🏀' : 'Basket! 🏀' }
              else { aiScore += pts; resultText = 'AI scores!' }
              snd(600, 'sine', 0.2); resultTimer = 60
              for (let i = 0; i < 15; i++) particles.push({ x: hoop.x, y: hoop.y, vx: (Math.random()-0.5)*8, vy: Math.random()*-6-2, color: scorer==='player'?'#ff9f0a':'#ff375f', alpha:1, size:4 })
              ballInAir = false; ballX = W/2; ballY = H/2; player.hasBall = true
              setHud({ playerScore, aiScore, time: timeLeft, quarter, result: resultText })
            }
          }
          if (shotFrom === 'player') checkHoop(hoopRight, 'player')
          else checkHoop(hoopLeft, 'ai')
          if (ballY > H + 30) { ballInAir = false; player.hasBall = true }
        }

        if (resultTimer > 0) resultTimer--
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.03 })
        particles = particles.filter(p => p.alpha > 0)
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Court background
      ctx.fillStyle = '#8b4513'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#a0522d'
      for (let x = 0; x < W; x += 4) { ctx.fillRect(x, 0, 2, H) }

      // Court markings
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
      // Center circle
      ctx.beginPath(); ctx.arc(W/2, H/2, 70, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke()
      // 3-point arcs
      ctx.beginPath(); ctx.arc(90, H/2, 170, -Math.PI/2, Math.PI/2); ctx.stroke()
      ctx.beginPath(); ctx.arc(W-90, H/2, 170, Math.PI/2, -Math.PI/2); ctx.stroke()
      // Key areas
      ctx.strokeRect(0, H/2-80, 140, 160)
      ctx.strokeRect(W-140, H/2-80, 140, 160)

      // Hoops
      const drawHoop = (hoop) => {
        ctx.strokeStyle = '#ff6b00'; ctx.lineWidth = 4; ctx.shadowBlur = 8; ctx.shadowColor = '#ff6b00'
        ctx.beginPath(); ctx.arc(hoop.x, hoop.y, hoop.r, 0, Math.PI*2); ctx.stroke()
        // Backboard
        ctx.fillStyle = '#ffffff80'; ctx.fillRect(hoop.x - 5, hoop.y - 50, 10, 40)
        // Net lines
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          ctx.beginPath(); ctx.moveTo(hoop.x + Math.cos(angle) * hoop.r, hoop.y + Math.sin(angle) * hoop.r)
          ctx.lineTo(hoop.x, hoop.y + 25); ctx.stroke()
        }
        ctx.shadowBlur = 0
      }
      drawHoop(hoopLeft); drawHoop(hoopRight)

      // Players
      // Player (blue)
      ctx.fillStyle = '#3b82f6'; ctx.shadowBlur = 10; ctx.shadowColor = '#3b82f6'
      ctx.beginPath(); ctx.arc(player.x, player.y, 18, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('YOU', player.x, player.y); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic'
      // AI (red)
      ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444'
      ctx.beginPath(); ctx.arc(ai.x, ai.y, 18, 0, Math.PI*2); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
      ctx.fillText('AI', ai.x, ai.y); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic'

      // Ball
      if (player.hasBall) {
        ctx.fillStyle = '#ff6b00'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff6b00'
        ctx.beginPath(); ctx.arc(player.x + 20, player.y, 10, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0
      } else if (ballInAir) {
        ctx.fillStyle = '#ff6b00'; ctx.shadowBlur = 12; ctx.shadowColor = '#ff6b00'
        ctx.beginPath(); ctx.arc(ballX, ballY, 12, 0, Math.PI*2); ctx.fill()
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(ballX - 6, ballY); ctx.lineTo(ballX + 6, ballY); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ballX, ballY - 6); ctx.lineTo(ballX, ballY + 6); ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // Score banner
      if (resultTimer > 0) {
        ctx.fillStyle = 'rgba(255,215,0,0.85)'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700'; ctx.fillText(resultText, W/2, 80); ctx.shadowBlur = 0
      }

      // Controls hint
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('WASD/Arrows = Move  •  Space/Z = Shoot', W/2, H - 8)

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      isMounted = false; cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKD)
      window.removeEventListener('keyup', onKU)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-3xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <span className="text-blue-400 text-base">YOU: {hud.playerScore}</span>
        <div className="text-center">
          <div className="text-yellow-400">Q{hud.quarter} • ⏱{hud.time}s</div>
        </div>
        <span className="text-rose-400 text-base">AI: {hud.aiScore}</span>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[520px] aspect-[7/5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none" />
      <div className="mt-2 text-center text-slate-400 text-xs flex gap-4">
        <span>🎮 <b>WASD/Arrows</b> Move</span><span>•</span><span>🏀 <b>Space/Z</b> Shoot to right hoop</span>
      </div>
    </div>
  )
}
