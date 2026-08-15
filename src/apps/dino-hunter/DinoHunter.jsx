import { useEffect, useRef, useState } from 'react'

const DINO_SPECIES = [
  { id: 'raptor', name: 'Velociraptor', emoji: '🦖', color: '#ff9f0a', hp: 30, pts: 150, speed: 3.5, size: 28 },
  { id: 'ptero', name: 'Pterodactyl', emoji: '🦅', color: '#bf5af2', hp: 20, pts: 120, speed: 4.2, size: 24, flying: true },
  { id: 'stego', name: 'Stegosaurus', emoji: '🦕', color: '#32d74b', hp: 60, pts: 250, speed: 1.6, size: 38 },
  { id: 'trex', name: 'T-Rex', emoji: '👑', color: '#ff375f', hp: 120, pts: 600, speed: 2.4, size: 48, boss: true },
]

export default function DinoHunter({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ darts: 10, captured: 0, score: 0, targetText: '3 Raptors, 2 Pterodactyls, 1 T-Rex' })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 800, H = 500
    canvas.width = W; canvas.height = H

    const snd = (freq, type = 'sine', dur = 0.12) => {
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

    // ── HUNTER JEEP / EXPEDITION STATE ──────────────────────────────
    const hunter = {
      x: 100,
      y: 400,
      darts: 15,
      maxDarts: 15,
      reloading: 0,
    }

    let score = 0, totalCaptured = 0
    let dinos = [], darts = [], particles = []
    let mouseX = W / 2, mouseY = H / 2
    let tick = 0, gameOver = false, victory = false

    // Mission goals
    const mission = { raptor: 3, ptero: 2, stego: 2, trex: 1 }
    const progress = { raptor: 0, ptero: 0, stego: 0, trex: 0 }

    const spawnDino = () => {
      const type =
        progress.trex < mission.trex && Math.random() < 0.2
          ? DINO_SPECIES[3]
          : DINO_SPECIES[Math.floor(Math.random() * 3)]

      const side = Math.random() < 0.5 ? -1 : 1
      const isFlyer = type.flying
      dinos.push({
        x: side < 0 ? -40 : W + 40,
        y: isFlyer ? 80 + Math.random() * 140 : 360 + (Math.random() - 0.5) * 40,
        vx: (type.speed + Math.random() * 0.5) * (side < 0 ? 1 : -1),
        type,
        hp: type.hp,
        maxHp: type.hp,
        tranquilized: false,
        pulse: 0,
      })
    }

    // Initial spawns
    for (let i = 0; i < 4; i++) spawnDino()

    const onMM = (e) => {
      const r = canvas.getBoundingClientRect()
      mouseX = ((e.clientX - r.left) / r.width) * W
      mouseY = ((e.clientY - r.top) / r.height) * H
    }

    const fireDart = () => {
      if (hunter.darts <= 0 || hunter.reloading > 0 || gameOver || victory) return
      hunter.darts--
      snd(600, 'triangle', 0.08)

      const ang = Math.atan2(mouseY - hunter.y, mouseX - hunter.x)
      darts.push({
        x: hunter.x,
        y: hunter.y - 20,
        vx: Math.cos(ang) * 18,
        vy: Math.sin(ang) * 18,
      })

      if (hunter.darts === 0) {
        hunter.reloading = 75
        snd(250, 'sawtooth', 0.2)
      }
    }

    const onMD = () => fireDart()
    const onTE = (e) => {
      if (e.changedTouches[0]) {
        const r = canvas.getBoundingClientRect()
        mouseX = ((e.changedTouches[0].clientX - r.left) / r.width) * W
        mouseY = ((e.changedTouches[0].clientY - r.top) / r.height) * H
      }
      fireDart()
    }

    canvas.addEventListener('mousemove', onMM)
    canvas.addEventListener('mousedown', onMD)
    canvas.addEventListener('touchend', onTE)

    const loop = () => {
      if (!isMounted) return
      tick++

      if (!isPaused && !gameOver && !victory) {
        // Auto reload timer
        if (hunter.reloading > 0) {
          hunter.reloading--
          if (hunter.reloading === 0) {
            hunter.darts = hunter.maxDarts
            snd(700, 'sine', 0.15)
          }
        }

        // Spawn dinosaurs
        if (tick % 110 === 0 && dinos.length < 6) {
          spawnDino()
        }

        // Darts physics
        darts.forEach(d => {
          d.x += d.vx; d.y += d.vy; d.vy += 0.1
        })

        // Dino movement & dart hit detection
        dinos.forEach(dino => {
          dino.x += dino.vx
          dino.pulse += 0.05

          darts.forEach(dart => {
            if (Math.hypot(dart.x - dino.x, dart.y - dino.y) < dino.type.size) {
              dino.hp -= 20
              dart.dead = true
              snd(400, 'sine', 0.1)

              for (let i = 0; i < 8; i++) {
                particles.push({
                  x: dino.x,
                  y: dino.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#00f5ff',
                  alpha: 1,
                  size: 3,
                })
              }
            }
          })
        })

        darts = darts.filter(d => !d.dead && d.x > 0 && d.x < W && d.y > 0 && d.y < H)

        // Capture check
        dinos = dinos.filter(dino => {
          if (dino.hp <= 0) {
            progress[dino.type.id] = (progress[dino.type.id] || 0) + 1
            totalCaptured++
            score += dino.type.pts
            onScoreChange(score)
            snd(800, 'sine', 0.25)

            for (let i = 0; i < 20; i++) {
              particles.push({
                x: dino.x,
                y: dino.y,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -6 - 2,
                color: '#32d74b',
                alpha: 1,
                size: 5,
              })
            }
            return false
          }
          return dino.x > -80 && dino.x < W + 80
        })

        // Particles
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.alpha -= 0.03
        })
        particles = particles.filter(p => p.alpha > 0)

        // Check mission victory
        if (
          progress.raptor >= mission.raptor &&
          progress.ptero >= mission.ptero &&
          progress.stego >= mission.stego &&
          progress.trex >= mission.trex
        ) {
          victory = true
          onVictory(score + 1000)
        }

        setHud({
          darts: hunter.darts,
          captured: totalCaptured,
          score,
          targetText: `🦖 ${progress.raptor}/${mission.raptor} | 🦅 ${progress.ptero}/${mission.ptero} | 🦕 ${progress.stego}/${mission.stego} | 👑 ${progress.trex}/${mission.trex}`,
        })
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Prehistoric Sunset Volcano Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#1a0b22')
      sky.addColorStop(0.5, '#44142b')
      sky.addColorStop(1, '#852828')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Volcano in background
      ctx.fillStyle = '#220d18'
      ctx.beginPath()
      ctx.moveTo(W / 2 - 120, H * 0.7)
      ctx.lineTo(W / 2, H * 0.3)
      ctx.lineTo(W / 2 + 120, H * 0.7)
      ctx.closePath()
      ctx.fill()
      // Lava glow
      ctx.fillStyle = '#ff375f'
      ctx.shadowBlur = 25; ctx.shadowColor = '#ff375f'
      ctx.beginPath(); ctx.arc(W / 2, H * 0.3, 14, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0

      // Jungle Trees Silhouettes
      ctx.fillStyle = '#142211'
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(i * 95 - 20, 180, 24, 250)
        ctx.beginPath(); ctx.arc(i * 95 - 8, 180, 50, 0, Math.PI * 2); ctx.fill()
      }

      // Jungle Grass Floor
      ctx.fillStyle = '#1e3818'
      ctx.fillRect(0, 380, W, H - 380)
      ctx.fillStyle = '#32d74b'
      ctx.fillRect(0, 380, W, 4)

      // Dinosaurs
      dinos.forEach(dino => {
        ctx.save()
        ctx.translate(dino.x, dino.y)
        if (dino.vx < 0) ctx.scale(-1, 1)

        // Health Bar
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-dino.type.size, -dino.type.size - 12, dino.type.size * 2, 5)
        ctx.fillStyle = dino.type.color
        ctx.fillRect(
          -dino.type.size,
          -dino.type.size - 12,
          dino.type.size * 2 * (dino.hp / dino.maxHp),
          5
        )

        // Dino Body
        ctx.fillStyle = dino.type.color
        ctx.shadowBlur = 12; ctx.shadowColor = dino.type.color
        ctx.beginPath()
        ctx.ellipse(0, 0, dino.type.size, dino.type.size * 0.65, 0, 0, Math.PI * 2)
        ctx.fill()

        // Head
        ctx.beginPath()
        ctx.arc(dino.type.size * 0.7, -dino.type.size * 0.4, dino.type.size * 0.4, 0, Math.PI * 2)
        ctx.fill()

        // Eye
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(dino.type.size * 0.8, -dino.type.size * 0.45, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.restore()
      })

      // Darts
      darts.forEach(d => {
        ctx.fillStyle = '#00f5ff'
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f5ff'
        ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      })

      // Hunter Jeep at bottom left
      ctx.fillStyle = '#475569'
      ctx.fillRect(hunter.x - 30, hunter.y - 20, 60, 24)
      ctx.fillStyle = '#000'
      ctx.beginPath(); ctx.arc(hunter.x - 18, hunter.y + 6, 10, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(hunter.x + 18, hunter.y + 6, 10, 0, Math.PI * 2); ctx.fill()

      // Crosshair Target Aim
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.75)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(mouseX, mouseY, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(mouseX - 24, mouseY); ctx.lineTo(mouseX + 24, mouseY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(mouseX, mouseY - 24); ctx.lineTo(mouseX, mouseY + 24); ctx.stroke()

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
      canvas.removeEventListener('mousemove', onMM)
      canvas.removeEventListener('mousedown', onMD)
      canvas.removeEventListener('touchend', onTE)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <span className="text-cyan-400">💉 DARTS: {hud.darts}</span>
          <span className="text-emerald-400">🎯 MISSION: {hud.targetText}</span>
        </div>
        <div className="text-yellow-400 font-mono">{hud.score} PTS</div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full max-h-[500px] aspect-[8/5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none cursor-none"
      />

      <div className="mt-2 text-center text-slate-400 text-xs flex flex-wrap gap-4 justify-center">
        <span>🎯 <b>Aim with Mouse</b></span>
        <span>•</span>
        <span>💉 <b>Click</b> to fire tranquilizer darts</span>
        <span>•</span>
        <span>Capture all required species to complete expedition!</span>
      </div>
    </div>
  )
}
