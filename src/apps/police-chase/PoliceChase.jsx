import { useEffect, useRef, useState } from 'react'

export default function PoliceChase({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ speed: 0, health: 100, wanted: 3, distance: 0, score: 0, nitro: 100 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 700, H = 550
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

    const ROAD_LEFT = 140
    const ROAD_RIGHT = W - 140
    const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT

    // ── PLAYER CAR ──────────────────────────────────────────────────
    const player = {
      x: W / 2,
      y: H - 120,
      w: 34,
      h: 60,
      vx: 0,
      vy: 0,
      speed: 12,
      maxSpeed: 20,
      health: 100,
      nitro: 100,
      invulnerable: 0,
    }

    let roadOffset = 0
    let score = 0, distance = 0, copsWrecked = 0
    let traffic = [], cops = [], items = [], particles = []
    let tick = 0, gameOver = false, victory = false
    let sirenTick = 0

    const keys = {}
    const onKD = (e) => {
      keys[e.key] = true
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
    }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const spawnTraffic = () => {
      const laneX = ROAD_LEFT + 35 + Math.floor(Math.random() * 4) * 85
      traffic.push({
        x: laneX,
        y: -100,
        w: 32,
        h: 56,
        speed: 5 + Math.random() * 4,
        color: ['#0a84ff', '#32d74b', '#ff9f0a', '#94a3b8'][Math.floor(Math.random() * 4)],
      })
    }

    const spawnCop = () => {
      cops.push({
        x: ROAD_LEFT + 40 + Math.random() * (ROAD_WIDTH - 80),
        y: H + 80,
        w: 36,
        h: 62,
        speed: 14 + Math.random() * 3,
        flash: 0,
        ramCooldown: 0,
      })
      snd(350, 'square', 0.15)
    }

    const spawnItem = () => {
      const isNitro = Math.random() < 0.5
      items.push({
        x: ROAD_LEFT + 40 + Math.random() * (ROAD_WIDTH - 80),
        y: -50,
        type: isNitro ? 'nitro' : 'repair',
      })
    }

    const loop = () => {
      if (!isMounted) return
      tick++
      sirenTick++

      if (!isPaused && !gameOver && !victory) {
        // Player Inputs
        const left = keys['ArrowLeft'] || keys['a'] || keys['A']
        const right = keys['ArrowRight'] || keys['d'] || keys['D']
        const up = keys['ArrowUp'] || keys['w'] || keys['W']
        const down = keys['ArrowDown'] || keys['s'] || keys['S']
        const nitroActive = (keys[' '] || keys['Shift']) && player.nitro > 0

        if (nitroActive) {
          player.speed = 22
          player.nitro = Math.max(0, player.nitro - 0.6)
          if (tick % 2 === 0) {
            particles.push({
              x: player.x,
              y: player.y + 32,
              vx: (Math.random() - 0.5) * 2,
              vy: 6,
              color: '#00f5ff',
              alpha: 1,
              size: 5,
            })
          }
        } else {
          player.speed = up ? 16 : down ? 8 : 12
          if (player.nitro < 100) player.nitro += 0.08
        }

        // Steer
        if (left) player.x = Math.max(ROAD_LEFT + 20, player.x - 7)
        if (right) player.x = Math.min(ROAD_RIGHT - 20, player.x + 7)

        // Road scroll
        roadOffset = (roadOffset + player.speed) % 80
        distance += player.speed * 0.05
        score = Math.round(distance * 10) + copsWrecked * 250
        onScoreChange(score)

        if (player.invulnerable > 0) player.invulnerable--

        // Spawners
        if (tick % 75 === 0) spawnTraffic()
        if (tick % 160 === 0 && cops.length < 3) spawnCop()
        if (tick % 220 === 0) spawnItem()

        // Traffic Movement & Collision
        traffic.forEach(t => {
          t.y += player.speed - t.speed
          // Collision with player
          if (
            player.invulnerable <= 0 &&
            Math.abs(t.x - player.x) < 30 &&
            Math.abs(t.y - player.y) < 55
          ) {
            player.health -= 15
            player.invulnerable = 30
            snd(120, 'sawtooth', 0.2)
            t.y -= 30
            for (let i = 0; i < 10; i++) {
              particles.push({
                x: t.x,
                y: t.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#ff375f',
                alpha: 1,
                size: 4,
              })
            }
          }
        })
        traffic = traffic.filter(t => t.y < H + 120 && t.y > -200)

        // Cop AI Movement & Collision
        cops.forEach(cop => {
          cop.flash++
          // Chase player X
          if (cop.x < player.x - 10) cop.x += 1.8
          else if (cop.x > player.x + 10) cop.x -= 1.8

          cop.y += player.speed - cop.speed

          // Cop ramming player
          if (
            player.invulnerable <= 0 &&
            Math.abs(cop.x - player.x) < 32 &&
            Math.abs(cop.y - player.y) < 58
          ) {
            player.health -= 18
            player.invulnerable = 35
            snd(110, 'sawtooth', 0.25)
            // Push apart
            cop.y += 40
            cop.ramCooldown = 40
          }

          // Cops crashing into civilian traffic
          traffic.forEach(t => {
            if (Math.abs(cop.x - t.x) < 30 && Math.abs(cop.y - t.y) < 50) {
              cop.dead = true
              copsWrecked++
              snd(550, 'sine', 0.3)
              for (let i = 0; i < 20; i++) {
                particles.push({
                  x: cop.x,
                  y: cop.y,
                  vx: (Math.random() - 0.5) * 12,
                  vy: (Math.random() - 0.5) * 12,
                  color: '#ffd700',
                  alpha: 1,
                  size: 5,
                })
              }
            }
          })
        })
        cops = cops.filter(c => !c.dead && c.y > -150 && c.y < H + 200)

        // Items Pickup
        items.forEach(it => {
          it.y += player.speed
          if (Math.abs(it.x - player.x) < 30 && Math.abs(it.y - player.y) < 35) {
            it.picked = true
            if (it.type === 'nitro') {
              player.nitro = 100
              snd(650, 'sine', 0.2)
            } else {
              player.health = Math.min(100, player.health + 30)
              snd(750, 'sine', 0.2)
            }
          }
        })
        items = items.filter(it => !it.picked && it.y < H + 50)

        // Particles
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.alpha -= 0.04
        })
        particles = particles.filter(p => p.alpha > 0)

        // Win / Game Over
        if (distance >= 500) {
          victory = true
          onVictory(score + 1000)
        }
        if (player.health <= 0) {
          gameOver = true
          onGameOver(score)
        }

        setHud({
          speed: Math.round(player.speed * 8),
          health: Math.max(0, player.health),
          wanted: 3 + Math.min(2, Math.floor(distance / 150)),
          distance: Math.round(distance),
          score,
          nitro: Math.round(player.nitro),
        })
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Dark ground
      ctx.fillStyle = '#060d17'
      ctx.fillRect(0, 0, W, H)

      // Road Asphalt
      ctx.fillStyle = '#171f2c'
      ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, H)

      // Guardrails
      ctx.fillStyle = '#334155'
      ctx.fillRect(ROAD_LEFT - 10, 0, 10, H)
      ctx.fillRect(ROAD_RIGHT, 0, 10, H)

      // Neon road borders
      ctx.fillStyle = '#ff375f'
      ctx.shadowBlur = 10; ctx.shadowColor = '#ff375f'
      ctx.fillRect(ROAD_LEFT, 0, 3, H)
      ctx.fillRect(ROAD_RIGHT - 3, 0, 3, H)
      ctx.shadowBlur = 0

      // Dashed lane lines
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 3
      ctx.setLineDash([30, 30])
      ctx.lineDashOffset = -roadOffset
      for (let i = 1; i <= 3; i++) {
        const lx = ROAD_LEFT + (ROAD_WIDTH / 4) * i
        ctx.beginPath()
        ctx.moveTo(lx, -40)
        ctx.lineTo(lx, H + 40)
        ctx.stroke()
      }
      ctx.setLineDash([])

      // Pickups
      items.forEach(it => {
        ctx.save()
        ctx.translate(it.x, it.y)
        ctx.shadowBlur = 15
        ctx.shadowColor = it.type === 'nitro' ? '#00f5ff' : '#32d74b'
        ctx.fillStyle = it.type === 'nitro' ? '#00f5ff' : '#32d74b'
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(it.type === 'nitro' ? '⚡' : '🔧', 0, 4)
        ctx.shadowBlur = 0
        ctx.restore()
      })

      // Traffic Cars
      traffic.forEach(t => {
        ctx.fillStyle = t.color
        ctx.shadowBlur = 8; ctx.shadowColor = t.color
        ctx.fillRect(t.x - t.w / 2, t.y - t.h / 2, t.w, t.h)
        // Windshield
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(t.x - t.w / 2 + 4, t.y - t.h / 2 + 8, t.w - 8, 12)
        // Tail lights
        ctx.fillStyle = '#ff375f'
        ctx.fillRect(t.x - t.w / 2 + 2, t.y + t.h / 2 - 4, 6, 3)
        ctx.fillRect(t.x + t.w / 2 - 8, t.y + t.h / 2 - 4, 6, 3)
        ctx.shadowBlur = 0
      })

      // Police Cars
      cops.forEach(cop => {
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 10; ctx.shadowColor = '#fff'
        ctx.fillRect(cop.x - cop.w / 2, cop.y - cop.h / 2, cop.w, cop.h)
        ctx.fillStyle = '#0a84ff'
        ctx.fillRect(cop.x - cop.w / 2, cop.y - 6, cop.w, 14)
        // Flashing Siren Bar
        const isRed = Math.floor(cop.flash / 6) % 2 === 0
        ctx.fillStyle = isRed ? '#ff375f' : '#0a84ff'
        ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle
        ctx.fillRect(cop.x - 12, cop.y - 12, 24, 6)
        ctx.shadowBlur = 0
      })

      // Player Getaway Car
      const isBlink = player.invulnerable > 0 && Math.floor(player.invulnerable / 3) % 2 === 0
      if (!isBlink) {
        ctx.save()
        ctx.translate(player.x, player.y)
        // Red Hot Sports Car
        ctx.fillStyle = '#ffd700'
        ctx.shadowBlur = 18; ctx.shadowColor = '#ffd700'
        ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h)
        // Cabin
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-player.w / 2 + 4, -player.h / 2 + 12, player.w - 8, 20)
        // Front Headlights
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff'
        ctx.fillRect(-player.w / 2 + 3, -player.h / 2, 6, 4)
        ctx.fillRect(player.w / 2 - 9, -player.h / 2, 6, 4)
        ctx.shadowBlur = 0
        ctx.restore()
      }

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      })

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
          <span className="text-yellow-400">⭐ {'★'.repeat(hud.wanted)}</span>
        </div>
        <div className="text-emerald-400 font-mono">
          🚨 {hud.distance}m / 500m | {hud.speed} KM/H
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full max-h-[550px] aspect-[7/5.5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none cursor-crosshair"
      />

      <div className="mt-2 text-center text-slate-400 text-xs flex flex-wrap gap-4 justify-center">
        <span>🎮 <b>WASD/Arrows</b> Steer & Accelerate</span>
        <span>•</span>
        <span>🚀 <b>Space</b> Nitro Boost</span>
        <span>•</span>
        <span>💥 Bait cop cars into traffic!</span>
      </div>
    </div>
  )
}
