import { useEffect, useRef, useState } from 'react'

export default function FruitSlice({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ score: 0, lives: 3, combo: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 700, H = 550
    canvas.width = W; canvas.height = H

    const snd = (freq, type = 'sine', dur = 0.1) => {
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

    const FRUITS = [
      { emoji: '🍉', color: '#ff375f', score: 20 },
      { emoji: '🍊', color: '#ff9f0a', score: 15 },
      { emoji: '🍋', color: '#ffd700', score: 15 },
      { emoji: '🍇', color: '#bf5af2', score: 25 },
      { emoji: '🍓', color: '#ff375f', score: 20 },
      { emoji: '🍑', color: '#ff9f0a', score: 15 },
      { emoji: '🥝', color: '#32d74b', score: 25 },
      { emoji: '🍒', color: '#ef4444', score: 30 },
    ]

    let score = 0, lives = 3, combo = 1, comboTimer = 0
    let fruits = [], particles = [], slashTrail = []
    let lastSpawn = 0, spawnInterval = 90
    let gameOver = false, victory = false
    let totalSliced = 0
    let mouseDown = false, lastMX = -1, lastMY = -1

    const onMM = (e) => {
      const r = canvas.getBoundingClientRect()
      const mx = ((e.clientX - r.left) / r.width) * W
      const my = ((e.clientY - r.top) / r.height) * H
      if (mouseDown) {
        slashTrail.push({ x: mx, y: my, alpha: 1 })
        if (slashTrail.length > 18) slashTrail.shift()
        // Check fruit slice
        fruits.forEach(f => {
          if (!f.sliced && Math.hypot(mx - f.x, my - f.y) < f.r + 8) {
            f.sliced = true; combo++; comboTimer = 60
            score += f.scoreVal * Math.max(1, Math.floor(combo / 2))
            onScoreChange(score); totalSliced++; snd(500 + f.scoreVal * 5, 'sine', 0.12)
            for (let i = 0; i < 14; i++) particles.push({
              x: f.x, y: f.y, vx: (Math.random() - .5) * 9, vy: Math.random() * -7 - 2,
              color: f.color, alpha: 1, size: 4 + Math.random() * 4,
            })
          }
        })
      }
      lastMX = mx; lastMY = my
    }
    const onTM = (e) => {
      e.preventDefault()
      if (e.touches[0]) {
        const r = canvas.getBoundingClientRect()
        const mx = ((e.touches[0].clientX - r.left) / r.width) * W
        const my = ((e.touches[0].clientY - r.top) / r.height) * H
        mouseDown = true; lastMX = mx; lastMY = my
        slashTrail.push({ x: mx, y: my, alpha: 1 })
        fruits.forEach(f => {
          if (!f.sliced && Math.hypot(mx - f.x, my - f.y) < f.r + 10) {
            f.sliced = true; combo++; comboTimer = 60
            score += f.scoreVal * Math.max(1, Math.floor(combo / 2)); onScoreChange(score); totalSliced++
            snd(500, 'sine', 0.12)
            for (let i = 0; i < 14; i++) particles.push({ x: f.x, y: f.y, vx: (Math.random() - .5) * 9, vy: Math.random() * -7 - 2, color: f.color, alpha: 1, size: 5 })
          }
        })
      }
    }
    canvas.addEventListener('mousemove', onMM)
    canvas.addEventListener('mousedown', () => { mouseDown = true })
    canvas.addEventListener('mouseup', () => { mouseDown = false })
    canvas.addEventListener('touchmove', onTM, { passive: false })
    canvas.addEventListener('touchend', () => { mouseDown = false })

    let tick = 0
    const loop = () => {
      if (!isMounted) return
      tick++
      if (!isPaused && !gameOver && !victory) {
        // Spawn
        if (tick - lastSpawn > spawnInterval) {
          lastSpawn = tick
          spawnInterval = Math.max(45, 90 - Math.floor(totalSliced / 5) * 5)
          const isBomb = Math.random() < 0.15
          const fType = FRUITS[Math.floor(Math.random() * FRUITS.length)]
          const side = Math.random() < 0.5 ? -1 : 1
          fruits.push({
            x: side < 0 ? -20 : W + 20,
            y: H / 2 + (Math.random() - 0.5) * 200,
            vx: (Math.random() * 4 + 3) * (side < 0 ? 1 : -1),
            vy: -(Math.random() * 8 + 10),
            r: isBomb ? 24 : 28,
            emoji: isBomb ? '💣' : fType.emoji,
            color: isBomb ? '#1e293b' : fType.color,
            scoreVal: fType.score,
            isBomb, sliced: false, rot: 0, rotSpeed: (Math.random() - .5) * 0.1,
          })
        }

        // Update fruits
        fruits.forEach(f => {
          f.x += f.vx; f.y += f.vy; f.vy += 0.35; f.rot += f.rotSpeed
        })

        // Check missed (bottom)
        fruits = fruits.filter(f => {
          if (f.y > H + 60) {
            if (!f.sliced && !f.isBomb) { lives--; combo = 1; snd(150, 'sawtooth', 0.2) }
            return false
          }
          if (f.sliced && f.isBomb) {
            // Bomb sliced → lose life
            lives--; combo = 1; snd(100, 'sawtooth', 0.3)
            for (let i = 0; i < 20; i++) particles.push({ x: f.x, y: f.y, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12, color: '#ff9f0a', alpha: 1, size: 5 })
            return false
          }
          if (f.sliced) return false
          return true
        })

        // Combo decay
        if (comboTimer > 0) comboTimer--
        else combo = 1

        // Slash trail fade
        slashTrail.forEach(s => { s.alpha -= 0.07 })
        slashTrail.filter(s => s.alpha > 0)

        // Particles
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.03 })
        particles = particles.filter(p => p.alpha > 0)

        if (lives <= 0) { gameOver = true; onGameOver(score) }
        if (totalSliced >= 40) { victory = true; onVictory(score + 300) }

        setHud({ score, lives, combo })
      }

      // ── RENDER ────────────────────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0f0a1e'); bg.addColorStop(1, '#0a0f1a')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // Slash trail
      if (slashTrail.length > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 4; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(slashTrail[0].x, slashTrail[0].y)
        slashTrail.forEach((s, i) => { if (i > 0) { ctx.globalAlpha = s.alpha; ctx.lineTo(s.x, s.y) } })
        ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1
      }

      // Fruits
      fruits.forEach(f => {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot)
        ctx.font = `${f.r * 1.6}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        if (!f.sliced) {
          ctx.shadowBlur = 12; ctx.shadowColor = f.color
          ctx.fillText(f.emoji, 0, 0)
          ctx.shadowBlur = 0
        }
        ctx.restore()
      })

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // Combo display
      if (combo > 2) {
        ctx.fillStyle = '#ffd700'; ctx.font = `bold ${28 + combo * 2}px sans-serif`; ctx.textAlign = 'center'
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700'
        ctx.fillText(`${combo}x COMBO!`, W / 2, 80)
        ctx.shadowBlur = 0
      }

      // Progress bar
      ctx.fillStyle = '#1e293b'; ctx.fillRect(10, H - 20, W - 20, 8)
      ctx.fillStyle = '#32d74b'; ctx.fillRect(10, H - 20, (W - 20) * (totalSliced / 40), 8)

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      isMounted = false; cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMM)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-3xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex gap-3">
          <span className="text-rose-400">{'❤️'.repeat(hud.lives)}{'🖤'.repeat(Math.max(0, 3 - hud.lives))}</span>
          {hud.combo > 1 && <span className="text-yellow-400">🔥 {hud.combo}x</span>}
        </div>
        <div className="text-emerald-400">Sliced: {Math.min(40, hud.score > 0 ? Math.floor(hud.score / 15) : 0)}/40</div>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[560px] aspect-[7/5.5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl cursor-crosshair touch-none" />
      <div className="mt-2 text-center text-slate-400 text-xs flex gap-4">
        <span>🖱️ <b>Swipe/Drag</b> to slice fruits</span><span>•</span><span>💣 Avoid bombs!</span><span>•</span><span>Slice 40 fruits to win</span>
      </div>
    </div>
  )
}
