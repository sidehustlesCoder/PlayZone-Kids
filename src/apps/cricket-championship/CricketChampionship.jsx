import { useEffect, useRef, useState } from 'react'

const getResultColor = (result) => {
  if (result.includes('SIX')) return 'text-yellow-400 animate-pulse'
  if (result.includes('FOUR')) return 'text-orange-400'
  if (result.includes('OUT')) return 'text-rose-400'
  return 'text-slate-300'
}

export default function CricketChampionship({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ runs: 0, wickets: 0, balls: 0, target: 0, phase: 'bat', ballResult: '' })

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

    // Game state
    let phase = 'bat' // 'bat' | 'bowl' | 'result'
    let playerRuns = 0, playerWickets = 0, playerBalls = 0
    let aiRuns = 0, target = 0
    let maxWickets = 10, maxBalls = 36 // 6 overs
    let ballInFlight = false, ballX = W / 2, ballY = H - 120
    let ballVX = 0, ballVY = 0
    let ballResult = '', resultTimer = 0
    let particles = []
    let shotPressed = false, shotPower = 0, charging = false
    let aimAngle = -Math.PI / 4
    let mouseX = W / 2, mouseY = H / 2
    let gameOver = false, score = 0
    let tick = 0

    // Positions
    const batsmanX = W / 2, batsmanY = H - 130
    const stumpsX = W / 2, stumpsY = H - 100
    const bowlerX = W / 2, bowlerY = 100

    // AI batting (first innings)
    const simulateAIInnings = () => {
      let runs = 0
      for (let b = 0; b < maxBalls; b++) {
        const r = Math.random()
        if (r < 0.1) break // wicket
        const outcomes = [0,0,1,1,1,2,2,4,4,6]
        runs += outcomes[Math.floor(Math.random() * outcomes.length)]
      }
      return Math.max(60, Math.min(180, runs + 80))
    }

    target = simulateAIInnings()

    const throwBall = () => {
      if (ballInFlight || gameOver) return
      ballX = bowlerX + (Math.random() - .5) * 30
      ballY = bowlerY + 30
      const spread = (Math.random() - .5) * 80
      ballVX = (stumpsX + spread - ballX) * 0.025
      ballVY = (stumpsY - ballY) * 0.022
      ballInFlight = true
      snd(200, 'square', 0.08)
    }

    const tryHit = () => {
      if (!ballInFlight || shotPressed) return
      shotPressed = true
      const dist = Math.hypot(ballX - batsmanX, ballY - batsmanY)
      if (dist < 70) {
        // Hit!
        const power = 8 + Math.random() * 10
        aimAngle = Math.atan2(mouseY - batsmanY, mouseX - batsmanX) - 0.5
        ballVX = Math.cos(aimAngle) * power
        ballVY = Math.sin(aimAngle) * power - 6
        // Determine runs
        const rand = Math.random()
        let runs = 0
        if (rand < 0.15) runs = 6
        else if (rand < 0.35) runs = 4
        else if (rand < 0.55) runs = 2
        else if (rand < 0.75) runs = 1
        playerRuns += runs
        playerBalls++
        score = playerRuns
        onScoreChange(score)
        ballResult = runs === 6 ? 'SIX! 🎉' : runs === 4 ? 'FOUR! 💥' : runs > 0 ? `${runs} Run${runs>1?'s':''}` : 'Dot'
        snd(runs >= 4 ? 700 : 440, 'sine', 0.2)
        for (let i = 0; i < (runs >= 4 ? 20 : 6); i++) particles.push({
          x: batsmanX, y: batsmanY, vx: (Math.random() - .5) * 10, vy: Math.random() * -8 - 2,
          color: runs >= 6 ? '#ffd700' : runs >= 4 ? '#ff9f0a' : '#32d74b', alpha: 1, size: 5,
        })
      } else {
        // Miss - wicket check
        if (Math.hypot(ballX - stumpsX, ballY - stumpsY) < 20) {
          playerWickets++; ballResult = 'OUT! 🏏'; snd(150, 'sawtooth', 0.3)
        } else { playerBalls++; ballResult = 'Miss' }
      }
      resultTimer = 90
      setHud({ runs: playerRuns, wickets: playerWickets, balls: playerBalls, target, phase, ballResult })
      if (playerWickets >= maxWickets || playerBalls >= maxBalls) {
        gameOver = true
        if (playerRuns > target) onVictory(score + 200)
        else onGameOver(score)
      }
    }

    // Every 2.5s throw a new ball
    const autoThrowInterval = setInterval(() => {
      if (!ballInFlight && !gameOver && !isPaused) throwBall()
    }, 2500)

    const onMM = (e) => {
      const r = canvas.getBoundingClientRect()
      mouseX = ((e.clientX - r.left) / r.width) * W
      mouseY = ((e.clientY - r.top) / r.height) * H
    }
    const onMD = () => tryHit()
    const onTM = (e) => {
      if (e.touches[0]) { const r = canvas.getBoundingClientRect(); mouseX = ((e.touches[0].clientX - r.left) / r.width) * W; mouseY = ((e.touches[0].clientY - r.top) / r.height) * H }
    }
    const onTE = () => tryHit()
    const onKD = (e) => { if (e.code === 'Space') { e.preventDefault(); tryHit() } }

    canvas.addEventListener('mousemove', onMM)
    canvas.addEventListener('mousedown', onMD)
    canvas.addEventListener('touchmove', onTM, { passive: true })
    canvas.addEventListener('touchend', onTE)
    window.addEventListener('keydown', onKD)

    const loop = () => {
      if (!isMounted) return
      tick++
      if (!isPaused && !gameOver) {
        if (ballInFlight) {
          ballX += ballVX; ballY += ballVY; ballVY += 0.3
          if (ballX < 0 || ballX > W || ballY > H + 20) { ballInFlight = false; shotPressed = false }
        }
        if (resultTimer > 0) resultTimer--
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.025 })
        particles = particles.filter(p => p.alpha > 0)
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a1628'); sky.addColorStop(1, '#0f2040')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

      // Pitch (oval)
      const oval = ctx.createRadialGradient(W/2, H/2, 80, W/2, H/2, 280)
      oval.addColorStop(0, '#1a4a1a'); oval.addColorStop(0.6, '#143d14'); oval.addColorStop(1, '#0d2b0d')
      ctx.fillStyle = oval; ctx.beginPath(); ctx.ellipse(W/2, H/2, 300, 230, 0, 0, Math.PI*2); ctx.fill()

      // Pitch strip
      ctx.fillStyle = '#d4b896'; ctx.fillRect(W/2 - 15, 80, 30, H - 170)

      // Crease lines
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(W/2-35, H-120); ctx.lineTo(W/2+35, H-120); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(W/2-35, 130); ctx.lineTo(W/2+35, 130); ctx.stroke()

      // Stumps
      ctx.fillStyle = '#d4a017'; ctx.lineWidth = 3
      [-10, 0, 10].forEach(offset => {
        ctx.beginPath(); ctx.moveTo(stumpsX + offset, stumpsY - 30); ctx.lineTo(stumpsX + offset, stumpsY); ctx.stroke()
      })
      ctx.fillStyle = '#d4a017'; ctx.fillRect(stumpsX - 15, stumpsY - 32, 30, 4)

      // Bowler
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 8; ctx.shadowColor = '#aaa'
      ctx.fillRect(bowlerX - 8, bowlerY - 20, 16, 24)
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(bowlerX, bowlerY - 26, 10, 0, Math.PI*2); ctx.fill()
      ctx.shadowBlur = 0

      // Batsman
      ctx.fillStyle = '#fbbf24'; ctx.shadowBlur = 10; ctx.shadowColor = '#fbbf24'
      ctx.fillRect(batsmanX - 10, batsmanY - 30, 20, 30)
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(batsmanX, batsmanY - 36, 12, 0, Math.PI*2); ctx.fill()
      // Bat
      ctx.fillStyle = '#d4a017'; ctx.fillRect(batsmanX + 8, batsmanY - 25, 6, 30)
      ctx.shadowBlur = 0

      // Ball
      if (ballInFlight) {
        ctx.fillStyle = '#dc2626'; ctx.shadowBlur = 12; ctx.shadowColor = '#dc2626'
        ctx.beginPath(); ctx.arc(ballX, ballY, 9, 0, Math.PI*2); ctx.fill()
        ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(ballX, ballY, 9, 0.2, Math.PI-0.2); ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Aim cursor
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4,4])
      ctx.beginPath(); ctx.moveTo(batsmanX, batsmanY); ctx.lineTo(mouseX, mouseY); ctx.stroke()
      ctx.setLineDash([])

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // Ball result popup
      if (resultTimer > 0) {
        const alpha = Math.min(1, resultTimer / 20)
        ctx.fillStyle = `rgba(255,215,0,${alpha})`; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center'
        ctx.shadowBlur = 20; ctx.shadowColor = '#ffd700'
        ctx.fillText(ballResult, W/2, H/2 - 30); ctx.shadowBlur = 0
      }

      // Scoreboard overlay
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 10, 160, 70)
      ctx.strokeStyle = '#334155'; ctx.strokeRect(10, 10, 160, 70)
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`Runs: ${playerRuns}/${playerWickets}`, 20, 32)
      ctx.fillText(`Balls: ${playerBalls}/${maxBalls}`, 20, 50)
      ctx.fillStyle = '#ffd700'; ctx.fillText(`Target: ${target}`, 20, 68)

      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W-170, 10, 160, 50)
      ctx.strokeStyle = '#334155'; ctx.strokeRect(W-170, 10, 160, 50)
      ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right'; ctx.font = '11px sans-serif'
      ctx.fillText('Need: ' + Math.max(0, target - playerRuns + 1) + ' more runs', W-20, 30)
      ctx.fillText('Click/Space when ball near!', W-20, 48)

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      isMounted = false; cancelAnimationFrame(animId); clearInterval(autoThrowInterval)
      canvas.removeEventListener('mousemove', onMM); canvas.removeEventListener('mousedown', onMD)
      canvas.removeEventListener('touchmove', onTM); canvas.removeEventListener('touchend', onTE)
      window.removeEventListener('keydown', onKD)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-3xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex gap-4">
          <span className="text-white font-mono">{hud.runs}/{hud.wickets}</span>
          <span className="text-slate-400">({hud.balls} balls)</span>
        </div>
        <span className={`font-bold text-sm ${getResultColor(hud.ballResult)}`}>{hud.ballResult}</span>
        <span className="text-yellow-400">🎯 Target: {hud.target}</span>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[520px] aspect-[7/5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl cursor-crosshair touch-none" />
      <div className="mt-2 text-center text-slate-400 text-xs flex gap-4">
        <span>🏏 <b>Click/Tap or Space</b> when ball is near to hit!</span><span>•</span><span>Aim with mouse</span>
      </div>
    </div>
  )
}
