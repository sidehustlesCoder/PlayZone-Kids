import { useEffect, useRef, useState } from 'react'

export default function MotoX({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ speed: 0, score: 0, distance: 0, laps: 0, stunts: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 800, H = 480
    canvas.width = W; canvas.height = H

    const snd = (freq, type = 'sawtooth', dur = 0.1) => {
      if (!settings?.soundEnabled) return
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)()
        const o = ac.createOscillator(), g = ac.createGain()
        o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime)
        g.gain.setValueAtTime((settings?.volume || 0.7) * 0.08, ac.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur)
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur)
      } catch {}
    }

    // Track hills defined as {x, height} control points
    const TRACK_POINTS = 120
    const TRACK_SCALE = 80
    const track = Array.from({ length: TRACK_POINTS + 10 }, (_, i) => {
      const base = H * 0.65
      const hill = Math.sin(i * 0.18) * 80 + Math.sin(i * 0.07) * 40 + Math.sin(i * 0.35) * 20
      return { x: i * TRACK_SCALE, y: base - hill }
    })
    const getTrackY = (worldX) => {
      const idx = worldX / TRACK_SCALE
      const i = Math.floor(idx) % (TRACK_POINTS)
      const t = idx - Math.floor(idx)
      const a = track[Math.max(0, i)].y
      const b = track[Math.min(track.length - 1, i + 1)].y
      return a + (b - a) * t
    }
    const getTrackAngle = (worldX) => {
      const y1 = getTrackY(worldX - 5)
      const y2 = getTrackY(worldX + 5)
      return Math.atan2(y2 - y1, 10)
    }

    // Bike
    const bike = {
      worldX: 200, worldY: 0, vx: 0, vy: 0,
      angle: 0, angularVel: 0, airborne: false,
      wheelie: 0, airTime: 0,
    }
    bike.worldY = getTrackY(bike.worldX) - 30

    let score = 0, distance = 0, laps = 0, stuntScore = 0
    let totalStunts = 0, stuntText = '', stuntTimer = 0
    let particles = [], tick = 0, gameOver = false

    const keys = {}
    const onKD = (e) => { keys[e.key] = true; if ([' '].includes(e.key)) e.preventDefault() }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const loop = () => {
      if (!isMounted) return
      tick++
      if (!isPaused && !gameOver) {
        // Throttle / brake
        const throttle = keys['ArrowRight'] || keys['d'] || keys['D']
        const brake = keys['ArrowLeft'] || keys['a'] || keys['A']
        const leanBack = keys['ArrowUp'] || keys['w'] || keys['W']
        const leanFwd = keys['ArrowDown'] || keys['s'] || keys['S']

        if (throttle) bike.vx = Math.min(18, bike.vx + 0.4)
        else if (brake) bike.vx = Math.max(0, bike.vx - 0.4)
        else bike.vx = Math.max(0, bike.vx - 0.08)

        if (bike.airborne) {
          if (leanBack) bike.angularVel -= 0.08
          if (leanFwd) bike.angularVel += 0.08
          bike.angularVel *= 0.96
          bike.angle += bike.angularVel
          bike.airTime++
        }

        bike.worldX += bike.vx
        const groundY = getTrackY(bike.worldX) - 32
        const trackAngle = getTrackAngle(bike.worldX)

        if (bike.worldY < groundY) {
          bike.vy += 0.6
        } else {
          if (bike.airborne && bike.airTime > 10) {
            // Landing
            const flip = Math.round(bike.angle / (Math.PI * 2))
            if (flip >= 1) {
              stuntText = `${flip}x Backflip! 🤸`; stuntScore = flip * 200; totalStunts++
              score += stuntScore; onScoreChange(score); snd(700, 'sine', 0.3); stuntTimer = 90
              for (let i = 0; i < 15; i++) particles.push({ x: bike.worldX - (bike.worldX - 300), y: bike.worldY + 32, vx: (Math.random()-0.5)*8, vy: Math.random()*-6-2, color: '#ffd700', alpha: 1, size: 5 })
            }
          }
          bike.airborne = false; bike.airTime = 0
          bike.worldY = groundY; bike.vy = 0
          bike.angle = trackAngle * 0.3
          bike.angularVel *= 0.5
        }

        bike.worldY += bike.vy
        if (bike.worldY < groundY - 20) bike.airborne = true

        // Exhaust particles
        if (throttle && tick % 3 === 0) {
          const camX = 300
          particles.push({ x: camX - 30, y: bike.worldY + 20, vx: -bike.vx * 0.3 - 1, vy: (Math.random()-0.5)*2, color: '#94a3b8', alpha: 0.7, size: 3 })
        }

        // Progress
        distance += bike.vx * 0.01
        score = Math.round(distance * 10) + stuntScore
        onScoreChange(score)

        if (distance >= 100) { onVictory(score + 500); gameOver = true }
        if (bike.worldY > H + 100) { onGameOver(score); gameOver = true }

        if (stuntTimer > 0) stuntTimer--
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.alpha -= 0.025 })
        particles = particles.filter(p => p.alpha > 0)

        setHud({ speed: Math.round(bike.vx * 8), score, distance: Math.round(distance), laps, stunts: totalStunts })
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a1628'); sky.addColorStop(0.6, '#1a3350'); sky.addColorStop(1, '#2a1a3a')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

      // Stars
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137.5 - (bike.worldX * 0.02)) % W
        const sy = (i * 73) % (H * 0.5)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(((sx % W) + W) % W, sy, 2, 2)
      }

      // Camera offset (keep bike at x=300)
      const camOffset = bike.worldX - 300

      ctx.save()
      ctx.translate(-camOffset, 0)

      // Track (filled polygon)
      ctx.fillStyle = '#2d4a1e'
      ctx.beginPath(); ctx.moveTo(camOffset, H)
      for (let i = 0; i < track.length; i++) {
        ctx.lineTo(track[i].x, track[i].y)
      }
      ctx.lineTo(track[track.length - 1].x, H); ctx.closePath(); ctx.fill()

      // Track surface line
      ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(track[0].x, track[0].y)
      for (let i = 1; i < track.length; i++) ctx.lineTo(track[i].x, track[i].y)
      ctx.stroke()

      // Progress markers
      for (let m = 0; m <= 100; m += 10) {
        const mx = (m / 100) * (TRACK_POINTS * TRACK_SCALE)
        const my = getTrackY(mx)
        ctx.fillStyle = m === 0 ? '#32d74b' : m === 100 ? '#ffd700' : '#94a3b8'
        ctx.fillRect(mx - 3, my - 20, 6, 20)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(m === 100 ? '🏁' : `${m}%`, mx, my - 24)
      }

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x + camOffset, p.y, p.size, 0, Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // Bike
      ctx.save()
      ctx.translate(300, bike.worldY)
      ctx.rotate(bike.angle)

      // Wheels
      ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(-26, 20, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(26, 20, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke()
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2
      for (let a = 0; a < Math.PI*2; a += Math.PI/3) {
        ctx.beginPath(); ctx.moveTo(-26+Math.cos(a)*8, 20+Math.sin(a)*8); ctx.lineTo(-26+Math.cos(a)*16, 20+Math.sin(a)*16); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(26+Math.cos(a)*8, 20+Math.sin(a)*8); ctx.lineTo(26+Math.cos(a)*16, 20+Math.sin(a)*16); ctx.stroke()
      }

      // Frame
      ctx.fillStyle = '#ff375f'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff375f'
      ctx.fillRect(-30, -5, 60, 20); ctx.shadowBlur = 0
      // Engine
      ctx.fillStyle = '#334155'; ctx.fillRect(-10, -2, 20, 18)
      // Fork
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(26, 20); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-26, 20); ctx.stroke()
      // Handlebars
      ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(20, -15); ctx.stroke()
      // Rider
      ctx.fillStyle = '#00f5ff'; ctx.fillRect(-8, -30, 18, 22); ctx.shadowBlur = 8; ctx.shadowColor = '#00f5ff'
      ctx.fillStyle = '#0a0a14'; ctx.beginPath(); ctx.arc(5, -36, 10, 0, Math.PI*2); ctx.fill()
      ctx.shadowBlur = 0

      ctx.restore()
      ctx.restore() // cam

      // HUD overlays
      const speedPct = Math.min(1, bike.vx / 18)
      ctx.fillStyle = '#0f172a'; ctx.fillRect(10, H-45, 120, 30)
      ctx.fillStyle = speedPct > 0.8 ? '#ff375f' : speedPct > 0.5 ? '#ff9f0a' : '#32d74b'
      ctx.fillRect(10, H-45, 120 * speedPct, 30)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(`${Math.round(bike.vx * 8)} km/h`, 18, H-24)

      // Distance progress
      ctx.fillStyle = '#0f172a'; ctx.fillRect(W/2-80, H-18, 160, 10)
      ctx.fillStyle = '#32d74b'; ctx.fillRect(W/2-80, H-18, 160*(distance/100), 10)
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`${Math.round(distance)}% to finish`, W/2, H-22)

      // Stunt popup
      if (stuntTimer > 0) {
        ctx.fillStyle = `rgba(255,215,0,${stuntTimer/90})`; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700'
        ctx.fillText(stuntText, W/2, H/2 - 40); ctx.shadowBlur = 0
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      isMounted = false; cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKD); window.removeEventListener('keyup', onKU)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex gap-4">
          <span className="text-cyan-400">🏍️ {hud.speed} km/h</span>
          <span className="text-yellow-400">🤸 Stunts: {hud.stunts}</span>
        </div>
        <div className="text-emerald-400">Score: {hud.score}</div>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[500px] aspect-[5/3] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none" />
      <div className="mt-2 text-center text-slate-400 text-xs flex gap-4">
        <span>➡️ <b>Right/D</b> Throttle</span><span>•</span>
        <span>⬅️ <b>Left/A</b> Brake</span><span>•</span>
        <span>⬆️⬇️ <b>Lean</b> in air for backflips</span><span>•</span>
        <span>Reach 100% to win!</span>
      </div>
    </div>
  )
}
