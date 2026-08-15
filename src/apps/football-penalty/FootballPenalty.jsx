import { useEffect, useRef, useState } from 'react'

export default function FootballPenalty({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ scored: 0, missed: 0, round: 1, phase: 'aim', result: '' })

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

    // State
    let scored = 0, missed = 0, round = 1, maxRounds = 10
    let phase = 'aim' // aim | flying | result
    let aimX = W / 2, aimY = H - 150
    let ballX = W / 2, ballY = H - 150
    let ballVX = 0, ballVY = 0, ballScale = 1
    let goalkeeperX = W / 2, goalkeeperDir = 1, goalkeeperSpeed = 2.5
    let resultText = '', resultTimer = 0
    let particles = [], tick = 0
    let mouseX = W / 2, mouseY = H / 2
    let gameOver = false, score = 0

    // Goal dimensions
    const postLeft = W / 2 - 130, postRight = W / 2 + 130
    const crossbar = 130, postBottom = 220

    const shoot = () => {
      if (phase !== 'aim' || gameOver) return
      phase = 'flying'
      const targetX = mouseX + (Math.random() - .5) * 20
      const targetY = mouseY + (Math.random() - .5) * 15
      const dist = Math.hypot(targetX - ballX, targetY - ballY)
      ballVX = (targetX - ballX) / dist * 16
      ballVY = (targetY - ballY) / dist * 16
      snd(200, 'sine', 0.1)
    }

    const onMM = (e) => {
      const r = canvas.getBoundingClientRect()
      mouseX = ((e.clientX - r.left) / r.width) * W
      mouseY = ((e.clientY - r.top) / r.height) * H
    }
    const onMD = () => shoot()
    const onTE = (e) => {
      if (e.changedTouches[0]) {
        const r = canvas.getBoundingClientRect()
        mouseX = ((e.changedTouches[0].clientX - r.left) / r.width) * W
        mouseY = ((e.changedTouches[0].clientY - r.top) / r.height) * H
      }
      shoot()
    }
    const onKD = (e) => { if (e.code === 'Space') { e.preventDefault(); shoot() } }

    canvas.addEventListener('mousemove', onMM)
    canvas.addEventListener('mousedown', onMD)
    canvas.addEventListener('touchend', onTE)
    window.addEventListener('keydown', onKD)

    const loop = () => {
      if (!isMounted) return
      tick++
      if (!isPaused && !gameOver) {
        // Goalkeeper movement
        if (phase === 'aim') {
          goalkeeperX += goalkeeperDir * goalkeeperSpeed
          if (goalkeeperX > postRight - 30 || goalkeeperX < postLeft + 30) goalkeeperDir *= -1
        }

        if (phase === 'flying') {
          ballX += ballVX; ballY += ballVY; ballScale = Math.max(0.3, 1 - (H - 150 - ballY) / (H - crossbar) * 0.7)

          // Check if crossed goal line
          if (ballY <= crossbar + 20) {
            // Goal or save check
            const inGoal = ballX > postLeft + 20 && ballX < postRight - 20 && ballY < postBottom
            const goalkeeperSave = Math.abs(ballX - goalkeeperX) < 40 && Math.abs(ballY - (crossbar + 50)) < 60

            if (inGoal && !goalkeeperSave) {
              scored++; score += 100; onScoreChange(score); resultText = 'GOAL! ⚽'; snd(700, 'sine', 0.3)
              for (let i = 0; i < 25; i++) particles.push({ x: ballX, y: ballY, vx: (Math.random()-0.5)*12, vy: Math.random()*-8-2, color: '#32d74b', alpha: 1, size: 5 })
            } else {
              missed++; resultText = 'SAVED! 🧤'; snd(150, 'sawtooth', 0.2)
            }

            resultTimer = 80; phase = 'result'
            round++
            if (round > maxRounds) { setTimeout(() => { if (scored >= 7) onVictory(score + 200); else onGameOver(score) }, 1500); gameOver = true }
            setHud({ scored, missed, round: Math.min(round, maxRounds), phase, result: resultText })
          }
          if (ballY > H + 50) { phase = 'aim'; ballX = W / 2; ballY = H - 150 }
        }

        if (phase === 'result') {
          resultTimer--
          if (resultTimer <= 0) { phase = 'aim'; ballX = W / 2; ballY = H - 150; ballScale = 1 }
        }

        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.03 })
        particles = particles.filter(p => p.alpha > 0)
      }

      // ── RENDER ────────────────────────────────────────────────────
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#050f1a'); sky.addColorStop(1, '#0a1e3a')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

      // Stadium lights glow
      ctx.fillStyle = 'rgba(255,255,200,0.04)'
      ctx.beginPath(); ctx.arc(100, 50, 120, 0, Math.PI*2); ctx.fill()
      ctx.beginPath(); ctx.arc(W-100, 50, 120, 0, Math.PI*2); ctx.fill()

      // Pitch
      ctx.fillStyle = '#1a4d1a'; ctx.fillRect(0, H * 0.3, W, H)
      // Stripe pattern
      for (let i = 0; i < W; i += 80) {
        ctx.fillStyle = i % 160 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)'
        ctx.fillRect(i, H * 0.3, 80, H)
      }

      // Goal net
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
      // Posts
      ctx.fillStyle = '#ffffff'; ctx.lineWidth = 4
      ctx.strokeRect(postLeft, crossbar, postRight - postLeft, postBottom - crossbar)
      // Net lines
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1
      for (let x = postLeft; x <= postRight; x += 18) { ctx.beginPath(); ctx.moveTo(x, crossbar); ctx.lineTo(x, postBottom); ctx.stroke() }
      for (let y = crossbar; y <= postBottom; y += 14) { ctx.beginPath(); ctx.moveTo(postLeft, y); ctx.lineTo(postRight, y); ctx.stroke() }

      // Penalty spot
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W/2, H-155, 5, 0, Math.PI*2); ctx.fill()
      // Penalty arc
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(W/2, H-80, 80, Math.PI, 0); ctx.stroke()

      // Goalkeeper
      ctx.fillStyle = '#ff9f0a'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff9f0a'
      ctx.fillRect(goalkeeperX - 18, crossbar + 40, 36, 60)
      ctx.fillStyle = '#ff9f0a'; ctx.beginPath(); ctx.arc(goalkeeperX, crossbar + 30, 18, 0, Math.PI*2); ctx.fill()
      ctx.shadowBlur = 0
      // Goalkeeper gloves
      ctx.fillStyle = '#ffd700'; ctx.fillRect(goalkeeperX - 30, crossbar + 50, 14, 20); ctx.fillRect(goalkeeperX + 16, crossbar + 50, 14, 20)

      // Aim reticle
      if (phase === 'aim') {
        ctx.strokeStyle = 'rgba(255,0,0,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([4,4])
        ctx.beginPath(); ctx.arc(mouseX, mouseY, 20, 0, Math.PI*2); ctx.stroke()
        ctx.moveTo(mouseX-26, mouseY); ctx.lineTo(mouseX+26, mouseY)
        ctx.moveTo(mouseX, mouseY-26); ctx.lineTo(mouseX, mouseY+26); ctx.stroke()
        ctx.setLineDash([])
        // Trajectory dotted line
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.setLineDash([5,8])
        ctx.beginPath(); ctx.moveTo(W/2, H-150); ctx.lineTo(mouseX, mouseY); ctx.stroke()
        ctx.setLineDash([])
      }

      // Ball
      ctx.save()
      ctx.translate(ballX, ballY); ctx.scale(ballScale, ballScale)
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(255,255,255,0.5)'
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(0, 0); ctx.lineTo(6, -10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(0, 0); ctx.lineTo(10, 4); ctx.stroke()
      ctx.shadowBlur = 0; ctx.restore()

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // Result popup
      if (resultTimer > 0) {
        const alpha = Math.min(1, resultTimer / 20)
        ctx.fillStyle = resultText.includes('GOAL') ? `rgba(50,215,75,${alpha})` : `rgba(255,59,92,${alpha})`
        ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.shadowBlur = 20; ctx.shadowColor = ctx.fillStyle
        ctx.fillText(resultText, W/2, H/2); ctx.shadowBlur = 0
      }

      // Kick prompt
      if (phase === 'aim') {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('Aim & Click to shoot!', W/2, H - 30)
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      isMounted = false; cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMM); canvas.removeEventListener('mousedown', onMD)
      canvas.removeEventListener('touchend', onTE); window.removeEventListener('keydown', onKD)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-3xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex gap-4">
          <span className="text-emerald-400">⚽ Scored: {hud.scored}</span>
          <span className="text-rose-400">🧤 Missed: {hud.missed}</span>
        </div>
        <span className="text-yellow-400">Penalty {hud.round}/10</span>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[520px] aspect-[7/5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl cursor-crosshair touch-none" />
      <div className="mt-2 text-center text-slate-400 text-xs flex gap-4">
        <span>🖱️ <b>Aim with mouse</b> and <b>Click</b> to shoot</span><span>•</span><span>Score 7/10 to win!</span>
      </div>
    </div>
  )
}
