import { useEffect, useRef, useState } from 'react'

export default function MonsterTruck({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ speed: 0, health: 100, nitro: 100, score: 0, crushed: 0, progress: 0 })

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
        g.gain.setValueAtTime((settings?.volume || 0.7) * 0.1, ac.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur)
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur)
      } catch {}
    }

    // ── PROCEDURAL ARENA COURSE ─────────────────────────────────────
    const COURSE_LENGTH = 140
    const STEP = 80
    const terrain = Array.from({ length: COURSE_LENGTH }, (_, i) => {
      const baseY = H * 0.7
      const hill = Math.sin(i * 0.15) * 60 + Math.sin(i * 0.08) * 40 + (i % 8 === 0 ? -50 : 0)
      return { x: i * STEP, y: baseY + hill }
    })

    const getGroundY = (wx) => {
      const idx = wx / STEP
      const i = Math.floor(idx)
      if (i < 0) return terrain[0].y
      if (i >= terrain.length - 1) return terrain[terrain.length - 1].y
      const t = idx - i
      return terrain[i].y + (terrain[i + 1].y - terrain[i].y) * t
    }

    const getGroundAngle = (wx) => {
      const y1 = getGroundY(wx - 8)
      const y2 = getGroundY(wx + 8)
      return Math.atan2(y2 - y1, 16)
    }

    // Obstacles to crush (cars, barrels)
    let obstacles = []
    for (let i = 4; i < COURSE_LENGTH - 4; i += 3 + Math.floor(Math.random() * 4)) {
      const ox = i * STEP
      obstacles.push({
        x: ox,
        y: getGroundY(ox) - 18,
        type: i % 2 === 0 ? 'car' : 'barrel',
        crushed: false,
        hp: i % 2 === 0 ? 2 : 1,
      })
    }

    // ── MONSTER TRUCK STATE ─────────────────────────────────────────
    const truck = {
      x: 180,
      worldX: 180,
      y: 200,
      vx: 0,
      vy: 0,
      angle: 0,
      angVel: 0,
      airborne: false,
      airTime: 0,
      health: 100,
      nitro: 100,
      wheelBounce: 0,
    }
    truck.y = getGroundY(truck.worldX) - 40

    let score = 0, crushedCount = 0, flips = 0
    let particles = [], tick = 0, gameOver = false, victory = false
    let bannerText = '', bannerTimer = 0

    const keys = {}
    const onKD = (e) => {
      keys[e.key] = true
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
    }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const loop = () => {
      if (!isMounted) return
      tick++

      if (!isPaused && !gameOver && !victory) {
        const gas = keys['ArrowRight'] || keys['d'] || keys['D']
        const brake = keys['ArrowLeft'] || keys['a'] || keys['A']
        const tiltBack = keys['ArrowUp'] || keys['w'] || keys['W']
        const tiltFwd = keys['ArrowDown'] || keys['s'] || keys['S']
        const nitroOn = (keys[' '] || keys['Shift']) && truck.nitro > 0

        // Acceleration
        let maxSpd = nitroOn ? 22 : 14
        let accel = nitroOn ? 0.6 : 0.3

        if (nitroOn && gas) {
          truck.nitro = Math.max(0, truck.nitro - 0.5)
          if (tick % 2 === 0) {
            particles.push({
              x: truck.x - 45,
              y: truck.y + 10,
              vx: -truck.vx * 0.4 - 3,
              vy: (Math.random() - 0.5) * 3,
              color: '#00f5ff',
              alpha: 1,
              size: 6,
            })
            snd(250, 'sawtooth', 0.05)
          }
        } else if (truck.nitro < 100) {
          truck.nitro += 0.1
        }

        if (gas) truck.vx = Math.min(maxSpd, truck.vx + accel)
        else if (brake) truck.vx = Math.max(-4, truck.vx - 0.5)
        else truck.vx *= 0.98

        // Air tilt & rotational physics
        if (truck.airborne) {
          truck.airTime++
          if (tiltBack) truck.angVel -= 0.07
          if (tiltFwd) truck.angVel += 0.07
          truck.angVel *= 0.96
          truck.angle += truck.angVel
        }

        // Apply movement
        truck.worldX += truck.vx
        const groundY = getGroundY(truck.worldX) - 38
        const gAngle = getGroundAngle(truck.worldX)

        if (truck.y < groundY - 5) {
          truck.vy += 0.65 // gravity
          truck.airborne = true
        } else {
          // Landing
          if (truck.airborne && truck.airTime > 15) {
            const rotCount = Math.round(truck.angle / (Math.PI * 2))
            if (rotCount !== 0) {
              const pts = Math.abs(rotCount) * 300
              score += pts
              onScoreChange(score)
              bannerText = `${Math.abs(rotCount)}x Stunt Flip! +${pts}`
              bannerTimer = 75
              snd(650, 'sine', 0.25)
            }
            // Harsh crash if upside down
            const normAng = Math.abs(truck.angle % (Math.PI * 2))
            if (normAng > Math.PI * 0.5 && normAng < Math.PI * 1.5) {
              truck.health -= 25
              snd(100, 'sawtooth', 0.3)
              bannerText = 'CRASH LANDING! -25 HP'
              bannerTimer = 60
            }
          }
          truck.airborne = false
          truck.airTime = 0
          truck.y = groundY
          truck.vy = 0
          truck.angle = truck.angle * 0.7 + gAngle * 0.3
          truck.angVel *= 0.3
        }

        truck.y += truck.vy

        // Obstacle crushing collision
        obstacles.forEach(obs => {
          if (!obs.crushed && Math.abs(truck.worldX - obs.x) < 45 && Math.abs(truck.y - obs.y) < 35) {
            obs.crushed = true
            crushedCount++
            const pts = obs.type === 'car' ? 150 : 80
            score += pts
            onScoreChange(score)
            snd(140, 'sawtooth', 0.2)
            bannerText = obs.type === 'car' ? 'CAR SMASH! +150' : 'BARREL EXPLOSION! +80'
            bannerTimer = 50

            for (let i = 0; i < 18; i++) {
              particles.push({
                x: obs.x - (truck.worldX - truck.x),
                y: obs.y,
                vx: (Math.random() - 0.5) * 10,
                vy: Math.random() * -8 - 2,
                color: obs.type === 'car' ? '#ff375f' : '#ff9f0a',
                alpha: 1,
                size: 5,
              })
            }
          }
        })

        // Particles decay
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.03
        })
        particles = particles.filter(p => p.alpha > 0)

        // Progress & victory/game over
        const progress = Math.min(100, Math.round((truck.worldX / ((COURSE_LENGTH - 5) * STEP)) * 100))
        if (progress >= 100) {
          victory = true
          onVictory(score + 500)
        }
        if (truck.health <= 0) {
          gameOver = true
          onGameOver(score)
        }

        if (bannerTimer > 0) bannerTimer--

        setHud({
          speed: Math.max(0, Math.round(truck.vx * 6)),
          health: Math.max(0, truck.health),
          nitro: Math.round(truck.nitro),
          score,
          crushed: crushedCount,
          progress,
        })
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Neon night stadium sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a0f1d')
      sky.addColorStop(0.6, '#18243d')
      sky.addColorStop(1, '#2c1938')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Stadium lights
      ctx.fillStyle = 'rgba(0, 245, 255, 0.08)'
      ctx.beginPath(); ctx.arc(150, 40, 100, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(W - 150, 40, 100, 0, Math.PI * 2); ctx.fill()

      // World camera offset
      const camOffset = truck.worldX - truck.x

      ctx.save()
      ctx.translate(-camOffset, 0)

      // Draw Terrain / Dirt Dirt
      ctx.fillStyle = '#261b14'
      ctx.beginPath()
      ctx.moveTo(camOffset - 100, H)
      for (let i = 0; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y)
      }
      ctx.lineTo(terrain[terrain.length - 1].x + 200, H)
      ctx.closePath()
      ctx.fill()

      // Track surface line
      ctx.strokeStyle = '#ff9f0a'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(terrain[0].x, terrain[0].y)
      for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y)
      }
      ctx.stroke()

      // Obstacles
      obstacles.forEach(obs => {
        if (obs.crushed) {
          ctx.fillStyle = '#334155'
          ctx.fillRect(obs.x - 20, obs.y + 12, 40, 8)
        } else if (obs.type === 'car') {
          // Parked car to smash
          ctx.fillStyle = '#ff375f'
          ctx.fillRect(obs.x - 20, obs.y, 40, 18)
          ctx.fillStyle = '#0f172a'
          ctx.fillRect(obs.x - 16, obs.y + 14, 8, 8)
          ctx.fillRect(obs.x + 8, obs.y + 14, 8, 8)
        } else {
          // Barrel
          ctx.fillStyle = '#ff9f0a'
          ctx.fillRect(obs.x - 10, obs.y - 4, 20, 22)
          ctx.fillStyle = '#ffd700'
          ctx.fillRect(obs.x - 10, obs.y + 2, 20, 4)
        }
      })

      // Finish line
      const finishX = (COURSE_LENGTH - 4) * STEP
      ctx.fillStyle = '#ffffff'
      for (let y = getGroundY(finishX) - 80; y < getGroundY(finishX); y += 12) {
        ctx.fillRect(finishX, y, 6, 6)
        ctx.fillRect(finishX + 6, y + 6, 6, 6)
      }

      ctx.restore()

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // ── TRUCK RENDERING (SCREEN SPACE) ────────────────────────────
      ctx.save()
      ctx.translate(truck.x, truck.y)
      ctx.rotate(truck.angle)

      // Huge Monster Wheels
      const drawWheel = (wx, wy) => {
        ctx.fillStyle = '#0f172a'
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 4
        ctx.beginPath(); ctx.arc(wx, wy, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        // Neon Rims
        ctx.fillStyle = '#00f5ff'
        ctx.beginPath(); ctx.arc(wx, wy, 8, 0, Math.PI * 2); ctx.fill()
      }
      drawWheel(-32, 22)
      drawWheel(32, 22)

      // Heavy Suspension Shocks
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(-32, 22); ctx.lineTo(-20, 0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(32, 22); ctx.lineTo(20, 0); ctx.stroke()

      // Chassis & Body
      ctx.fillStyle = '#ff375f'
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff375f'
      ctx.fillRect(-40, -16, 80, 22)
      // Cabin
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(-22, -32, 38, 18)
      // Windshield
      ctx.fillStyle = '#00f5ff'
      ctx.fillRect(-5, -28, 16, 12)
      // Roll cage / spoiler
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(-42, -26, 6, 18)
      ctx.shadowBlur = 0

      ctx.restore()

      // Banner Popup
      if (bannerTimer > 0) {
        ctx.fillStyle = `rgba(255, 215, 0, ${Math.min(1, bannerTimer / 20)})`
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700'
        ctx.fillText(bannerText, W / 2, 90)
        ctx.shadowBlur = 0
      }

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
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span>❤️</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${hud.health}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span>⚡ NITRO</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${hud.nitro}%` }} />
            </div>
          </div>
          <span className="text-yellow-400">💥 Smashed: {hud.crushed}</span>
        </div>
        <div className="text-emerald-400 font-mono">
          🏁 {hud.progress}% | {hud.speed} KM/H
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full max-h-[500px] aspect-[5/3] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none"
      />

      <div className="mt-2 text-center text-slate-400 text-xs flex flex-wrap gap-4 justify-center">
        <span>➡️ <b>Right/D</b> Gas</span>
        <span>•</span>
        <span>⬅️ <b>Left/A</b> Brake</span>
        <span>•</span>
        <span>⬆️⬇️ <b>Tilt</b> in air for flips</span>
        <span>•</span>
        <span>🚀 <b>Space</b> Nitro Boost</span>
      </div>
    </div>
  )
}
