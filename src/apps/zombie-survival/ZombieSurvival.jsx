import { useEffect, useRef, useState } from 'react'

export default function ZombieSurvival({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ score: 0, health: 100, wave: 1, ammo: 30, kills: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 800, H = 600
    canvas.width = W; canvas.height = H

    const snd = (freq, type = 'square', dur = 0.1) => {
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

    // Player
    const player = {
      x: W / 2, y: H / 2, r: 16, speed: 3.8,
      health: 100, maxHealth: 100,
      ammo: 30, maxAmmo: 30, reloadTimer: 0,
      shootCooldown: 0, angle: 0,
    }
    let score = 0, kills = 0, wave = 1
    let zombies = [], bullets = [], particles = [], ammoPickups = []
    let waveTimer = 0, waveDelay = 180
    let betweenWaves = false, gameOver = false

    const spawnWave = (w) => {
      const count = 4 + w * 3
      for (let i = 0; i < count; i++) {
        const side = Math.floor(Math.random() * 4)
        let x, y
        if (side === 0) { x = Math.random() * W; y = -30 }
        else if (side === 1) { x = W + 30; y = Math.random() * H }
        else if (side === 2) { x = Math.random() * W; y = H + 30 }
        else { x = -30; y = Math.random() * H }
        zombies.push({
          x, y, r: 14,
          speed: 1.1 + w * 0.2 + Math.random() * 0.5,
          health: 30 + w * 15,
          maxHealth: 30 + w * 15,
          type: w > 2 && i % 5 === 0 ? 'fat' : 'grunt',
          attackCooldown: 0, flash: 0,
        })
      }
    }

    spawnWave(1)

    // Aim
    let mouseX = W / 2, mouseY = H / 2
    const onMM = (e) => {
      const r = canvas.getBoundingClientRect()
      mouseX = ((e.clientX - r.left) / r.width) * W
      mouseY = ((e.clientY - r.top) / r.height) * H
    }
    const onMD = () => {
      if (player.ammo <= 0 || player.shootCooldown > 0 || player.reloadTimer > 0) return
      const ang = Math.atan2(mouseY - player.y, mouseX - player.x)
      for (let s = 0; s < 1; s++) {
        const spread = (Math.random() - 0.5) * 0.12
        bullets.push({ x: player.x, y: player.y, vx: Math.cos(ang + spread) * 16, vy: Math.sin(ang + spread) * 16, life: 50 })
      }
      player.ammo--; player.shootCooldown = 12
      snd(600, 'square', 0.05)
      particles.push({ x: player.x + Math.cos(ang) * 20, y: player.y + Math.sin(ang) * 20, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3, color: '#ffd700', alpha: 1, size: 5 })
    }
    const onTM = (e) => { if (e.touches[0]) { const r = canvas.getBoundingClientRect(); mouseX = ((e.touches[0].clientX - r.left) / r.width) * W; mouseY = ((e.touches[0].clientY - r.top) / r.height) * H } }
    const onTE = () => onMD()

    canvas.addEventListener('mousemove', onMM)
    canvas.addEventListener('mousedown', onMD)
    canvas.addEventListener('touchmove', onTM, { passive: true })
    canvas.addEventListener('touchend', onTE)

    // WASD
    const keys = {}
    const onKD = (e) => { keys[e.key] = true }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const loop = () => {
      if (!isMounted) return
      if (!isPaused && !gameOver) {
        // Player move
        let dx = 0, dy = 0
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1
        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1
        const len = Math.hypot(dx, dy) || 1
        player.x = Math.max(player.r, Math.min(W - player.r, player.x + (dx / len) * player.speed))
        player.y = Math.max(player.r, Math.min(H - player.r, player.y + (dy / len) * player.speed))
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x)
        if (player.shootCooldown > 0) player.shootCooldown--
        if (player.ammo <= 0 && player.reloadTimer <= 0) { player.reloadTimer = 90; snd(200, 'sine', 0.2) }
        if (player.reloadTimer > 0) { player.reloadTimer--; if (player.reloadTimer <= 0) { player.ammo = player.maxAmmo; snd(500, 'sine', 0.15) } }

        // Bullets
        bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life-- })
        bullets = bullets.filter(b => b.life > 0 && b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10)

        // Zombies
        zombies.forEach(z => {
          const ang = Math.atan2(player.y - z.y, player.x - z.x)
          z.x += Math.cos(ang) * z.speed
          z.y += Math.sin(ang) * z.speed
          if (z.flash > 0) z.flash--
          if (z.attackCooldown > 0) z.attackCooldown--
          if (Math.hypot(z.x - player.x, z.y - player.y) < z.r + player.r && z.attackCooldown <= 0) {
            player.health -= z.type === 'fat' ? 20 : 12
            z.attackCooldown = 45; snd(100, 'sawtooth', 0.15)
          }
        })

        // Bullet-zombie collision
        bullets.forEach(b => {
          zombies.forEach(z => {
            if (Math.hypot(b.x - z.x, b.y - z.y) < z.r + 6) {
              z.health -= 25; z.flash = 8; b.life = 0
              for (let i = 0; i < 6; i++) particles.push({ x: z.x, y: z.y, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, color: '#32d74b', alpha: 1, size: 3 })
            }
          })
        })

        // Kill zombies
        zombies = zombies.filter(z => {
          if (z.health <= 0) {
            kills++; score += z.type === 'fat' ? 80 : 40; onScoreChange(score)
            snd(150, 'sawtooth', 0.2)
            for (let i = 0; i < 12; i++) particles.push({ x: z.x, y: z.y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, color: '#32d74b', alpha: 1, size: 4 })
            if (Math.random() < 0.2) ammoPickups.push({ x: z.x, y: z.y, pulse: 0 })
            return false
          }
          return true
        })

        // Ammo pickups
        ammoPickups.forEach(a => {
          a.pulse = (a.pulse + 0.1) % (Math.PI * 2)
          if (Math.hypot(a.x - player.x, a.y - player.y) < 22) {
            player.ammo = Math.min(player.maxAmmo, player.ammo + 10); a.taken = true; snd(700, 'sine', 0.12)
          }
        })
        ammoPickups = ammoPickups.filter(a => !a.taken)

        // Particles
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.alpha -= 0.04 })
        particles = particles.filter(p => p.alpha > 0)

        // Wave management
        if (zombies.length === 0 && !betweenWaves) {
          if (wave >= 5) { onVictory(score + 500); return }
          betweenWaves = true; waveTimer = waveDelay; score += 200; onScoreChange(score); snd(880, 'sine', 0.3)
        }
        if (betweenWaves) {
          waveTimer--
          if (waveTimer <= 0) { wave++; spawnWave(wave); betweenWaves = false; snd(300, 'sawtooth', 0.3) }
        }
        if (player.health <= 0) { gameOver = true; onGameOver(score) }

        setHud({ score, health: Math.max(0, Math.round(player.health)), wave, ammo: player.ammo, kills })
      }

      // ── RENDER ────────────────────────────────────────────────────
      // Ground grid
      ctx.fillStyle = '#0a0f1a'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Ammo pickups
      ammoPickups.forEach(a => {
        const s = 1 + Math.sin(a.pulse) * 0.15
        ctx.save(); ctx.translate(a.x, a.y); ctx.scale(s, s)
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 12; ctx.shadowColor = '#ffd700'
        ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔶', 0, 6)
        ctx.shadowBlur = 0; ctx.restore()
      })

      // Zombies
      zombies.forEach(z => {
        const isFlash = z.flash > 0
        ctx.fillStyle = isFlash ? '#ffffff' : (z.type === 'fat' ? '#7c3aed' : '#32d74b')
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill()
        // Eyes
        ctx.fillStyle = '#ff375f'; ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(z.x - 5, z.y - 3, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(z.x + 5, z.y - 3, 3, 0, Math.PI * 2); ctx.fill()
        // Health bar
        ctx.fillStyle = '#0f172a'; ctx.fillRect(z.x - z.r, z.y - z.r - 8, z.r * 2, 4)
        ctx.fillStyle = '#32d74b'; ctx.fillRect(z.x - z.r, z.y - z.r - 8, z.r * 2 * (z.health / z.maxHealth), 4)
        ctx.shadowBlur = 0
      })

      // Bullets
      bullets.forEach(b => {
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffd700'
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
      })

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      })

      // Player
      ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle)
      ctx.shadowBlur = 18; ctx.shadowColor = '#00f5ff'
      ctx.fillStyle = '#00f5ff'; ctx.beginPath(); ctx.arc(0, 0, player.r, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#0a0a14'; ctx.beginPath(); ctx.arc(0, 0, player.r - 5, 0, Math.PI * 2); ctx.fill()
      // Gun barrel
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0; ctx.fillRect(10, -3, 18, 6); ctx.restore()

      // Reload bar
      if (player.reloadTimer > 0) {
        const pct = 1 - player.reloadTimer / 90
        ctx.fillStyle = '#1e293b'; ctx.fillRect(player.x - 22, player.y - 28, 44, 6)
        ctx.fillStyle = '#ff9f0a'; ctx.fillRect(player.x - 22, player.y - 28, 44 * pct, 6)
        ctx.fillStyle = '#ffd700'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RELOAD', player.x, player.y - 30)
      }

      // Wave announcement
      if (betweenWaves) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W / 2 - 100, H / 2 - 30, 200, 50)
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`Wave ${wave + 1} incoming...`, W / 2, H / 2 + 5)
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      isMounted = false; cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMM); canvas.removeEventListener('mousedown', onMD)
      canvas.removeEventListener('touchmove', onTM); canvas.removeEventListener('touchend', onTE)
      window.removeEventListener('keydown', onKD); window.removeEventListener('keyup', onKU)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400"><span>❤️</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-rose-500 transition-all rounded-full" style={{ width: `${hud.health}%` }} /></div>
          </div>
          <div className="text-yellow-400">🔶 Ammo: <span className="font-mono">{hud.ammo}</span></div>
          <div className="text-emerald-400">💀 Kills: <span className="font-mono">{hud.kills}</span></div>
        </div>
        <div className="text-red-400 uppercase animate-pulse">Wave {hud.wave}/5</div>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[560px] aspect-[4/3] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl cursor-crosshair touch-none" />
      <div className="mt-2 text-center text-slate-400 text-xs flex gap-4">
        <span>🎮 <b>WASD</b> Move</span><span>•</span><span>🖱️ <b>Aim & Click</b> Shoot</span><span>•</span><span>Survive 5 waves!</span>
      </div>
    </div>
  )
}
