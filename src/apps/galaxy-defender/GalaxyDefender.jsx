import { useEffect, useRef, useState } from 'react'
import { Shield } from 'lucide-react'

export default function GalaxyDefender({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hudStats, setHudStats] = useState({ score: 0, health: 100, shield: 100, wave: 1, bossHealth: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let isMounted = true

    // Game Dimensions
    const width = 800
    const height = 600
    canvas.width = width
    canvas.height = height

    // Sounds
    const playSound = (freq, type = 'square', dur = 0.1) => {
      if (!settings?.soundEnabled) return
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
        gain.gain.setValueAtTime((settings?.volume || 0.7) * 0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + dur)
      } catch {}
    }

    // Stars Parallax Background
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 2 + 0.8,
      color: ['#ffffff', '#00f5ff', '#bf5af2', '#ffdd00'][Math.floor(Math.random() * 4)],
    }))

    // Game Entities
    const player = {
      x: width / 2,
      y: height - 80,
      width: 44,
      height: 44,
      speed: 6.5,
      health: 100,
      maxHealth: 100,
      shield: 100,
      tripleShot: false,
      tripleShotTimer: 0,
      lastFired: 0,
      fireRate: 140, // ms
    }

    let score = 0
    let wave = 1
    let enemies = []
    let bullets = []
    let enemyBullets = []
    let particles = []
    let powerups = []
    let boss = null
    let waveEnemiesSpawned = 0
    let waveMaxEnemies = 15
    let lastSpawn = 0
    let isGameOver = false
    let isVictorious = false

    // Controls
    const keys = {}
    let mouseX = player.x
    let mouseY = player.y
    let isMouseDown = false

    const onKeyDown = (e) => { keys[e.key] = true; if (e.code === 'Space') e.preventDefault() }
    const onKeyUp = (e) => { keys[e.key] = false }
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / rect.width) * width
      mouseY = ((e.clientY - rect.top) / rect.height) * height
    }
    const onMouseDown = () => { isMouseDown = true }
    const onMouseUp = () => { isMouseDown = false }
    const onTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * width
        mouseY = ((e.touches[0].clientY - rect.top) / rect.height) * height
        isMouseDown = true
      }
    }
    const onTouchEnd = () => { isMouseDown = false }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    // Particle Explosion helper
    const createExplosion = (x, y, count = 18, color = '#ff9f0a') => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const spd = Math.random() * 5 + 1
        particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 3 + 2,
          color,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
        })
      }
      playSound(180, 'sawtooth', 0.2)
    }

    // Spawn Enemy
    const spawnEnemy = () => {
      if (boss) return
      const types = [
        { type: 'scout', hp: 20, w: 32, h: 32, speed: 3.5, color: '#00f5ff', scoreVal: 20 },
        { type: 'fighter', hp: 40, w: 40, h: 40, speed: 2.2, color: '#ff375f', scoreVal: 40 },
        { type: 'asteroid', hp: 60, w: 48, h: 48, speed: 1.5, color: '#a0a0b0', scoreVal: 30 },
      ]
      const t = types[Math.floor(Math.random() * (wave > 2 ? 3 : 2))]
      enemies.push({
        ...t,
        x: Math.random() * (width - 60) + 30,
        y: -40,
        lastShot: 0,
      })
      waveEnemiesSpawned++
    }

    // Spawn Boss
    const spawnBoss = () => {
      boss = {
        x: width / 2,
        y: -100,
        targetY: 100,
        width: 140,
        height: 80,
        hp: 500,
        maxHp: 500,
        speed: 2,
        dir: 1,
        lastShot: 0,
      }
      playSound(90, 'sawtooth', 0.6)
    }

    // Game loop
    let lastTime = performance.now()

    const gameLoop = (currentTime) => {
      if (!isMounted) return
      const dt = currentTime - lastTime
      lastTime = currentTime

      if (!isPaused && !isGameOver && !isVictorious) {
        // ── UPDATE PLAYER ──────────────────────
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed
        if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed
        if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= player.speed
        if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += player.speed

        // Smooth follow mouse if held
        if (isMouseDown) {
          player.x += (mouseX - player.x) * 0.15
          player.y += (mouseY - player.y) * 0.15
        }

        // Clamp player bounds
        player.x = Math.max(player.width / 2, Math.min(width - player.width / 2, player.x))
        player.y = Math.max(height * 0.4, Math.min(height - player.height / 2, player.y))

        // Shield regen
        if (player.shield < 100) player.shield += 0.05

        // Power-up timer
        if (player.tripleShotTimer > 0) {
          player.tripleShotTimer -= dt
          if (player.tripleShotTimer <= 0) player.tripleShot = false
        }

        // Auto Fire
        const shouldFire = keys[' '] || isMouseDown || keys['Enter']
        if (shouldFire && currentTime - player.lastFired > player.fireRate) {
          player.lastFired = currentTime
          playSound(440, 'triangle', 0.08)
          if (player.tripleShot) {
            bullets.push({ x: player.x, y: player.y - 20, vx: 0, vy: -12, color: '#00f5ff' })
            bullets.push({ x: player.x - 14, y: player.y - 10, vx: -3, vy: -11, color: '#00f5ff' })
            bullets.push({ x: player.x + 14, y: player.y - 10, vx: 3, vy: -11, color: '#00f5ff' })
          } else {
            bullets.push({ x: player.x - 10, y: player.y - 18, vx: 0, vy: -12, color: '#00f5ff' })
            bullets.push({ x: player.x + 10, y: player.y - 18, vx: 0, vy: -12, color: '#00f5ff' })
          }
        }

        // ── UPDATE BULLETS ─────────────────────
        bullets.forEach((b) => {
          b.x += b.vx || 0
          b.y += b.vy
        })
        bullets = bullets.filter(b => b.y > -20 && b.x > 0 && b.x < width)

        enemyBullets.forEach(b => {
          b.x += b.vx || 0
          b.y += b.vy
        })
        enemyBullets = enemyBullets.filter(b => b.y < height + 20)

        // ── SPAWNING LOGIC ─────────────────────
        if (!boss && waveEnemiesSpawned < waveMaxEnemies && currentTime - lastSpawn > 1100 - wave * 100) {
          spawnEnemy()
          lastSpawn = currentTime
        } else if (!boss && waveEnemiesSpawned >= waveMaxEnemies && enemies.length === 0) {
          if (wave === 3) {
            spawnBoss()
          } else {
            wave++
            waveEnemiesSpawned = 0
            waveMaxEnemies += 5
          }
        }

        // ── UPDATE ENEMIES ─────────────────────
        enemies.forEach(e => {
          e.y += e.speed
          // Fighter shooting
          if (e.type === 'fighter' && currentTime - e.lastShot > 1400) {
            e.lastShot = currentTime
            enemyBullets.push({ x: e.x, y: e.y + 15, vx: 0, vy: 5, color: '#ff375f' })
          }

          // Check collision with player
          const dist = Math.hypot(e.x - player.x, e.y - player.y)
          if (dist < (player.width + e.w) / 2.5) {
            createExplosion(e.x, e.y, 15, e.color)
            if (player.shield > 30) player.shield -= 30
            else player.health -= 25
            e.hp = 0
          }
        })

        // Remove offscreen or dead enemies
        enemies = enemies.filter(e => {
          if (e.y > height + 50) return false
          if (e.hp <= 0) {
            createExplosion(e.x, e.y, 20, e.color)
            score += e.scoreVal
            onScoreChange(score)
            // Powerup drop chance
            if (Math.random() < 0.2) {
              powerups.push({
                x: e.x,
                y: e.y,
                type: Math.random() < 0.5 ? 'triple' : 'heal',
                vy: 2,
              })
            }
            return false
          }
          return true
        })

        // ── UPDATE BOSS ────────────────────────
        if (boss) {
          if (boss.y < boss.targetY) boss.y += 1.5
          else {
            boss.x += boss.speed * boss.dir
            if (boss.x > width - 100 || boss.x < 100) boss.dir *= -1
            if (currentTime - boss.lastShot > 800) {
              boss.lastShot = currentTime
              enemyBullets.push({ x: boss.x - 30, y: boss.y + 40, vx: -2, vy: 6, color: '#ff0055' })
              enemyBullets.push({ x: boss.x, y: boss.y + 40, vx: 0, vy: 6, color: '#ff0055' })
              enemyBullets.push({ x: boss.x + 30, y: boss.y + 40, vx: 2, vy: 6, color: '#ff0055' })
            }
          }

          if (boss.hp <= 0) {
            createExplosion(boss.x, boss.y, 60, '#ffdd00')
            score += 1000
            onScoreChange(score)
            boss = null
            isVictorious = true
            onVictory(score)
          }
        }

        // ── UPDATE POWERUPS ────────────────────
        powerups.forEach(p => {
          p.y += p.vy
          const dist = Math.hypot(p.x - player.x, p.y - player.y)
          if (dist < 35) {
            if (p.type === 'triple') {
              player.tripleShot = true
              player.tripleShotTimer = 8000
            } else {
              player.health = Math.min(100, player.health + 35)
              player.shield = 100
            }
            playSound(600, 'sine', 0.2)
            p.collected = true
          }
        })
        powerups = powerups.filter(p => !p.collected && p.y < height + 30)

        // ── BULLET-ENEMY COLLISIONS ───────────
        bullets.forEach(b => {
          enemies.forEach(e => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.w / 2 + 6) {
              e.hp -= 20
              b.hit = true
            }
          })
          if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.width / 2) {
            boss.hp -= 15
            b.hit = true
          }
        })
        bullets = bullets.filter(b => !b.hit)

        // ── ENEMY BULLET-PLAYER COLLISIONS ─────
        enemyBullets.forEach(b => {
          if (Math.hypot(b.x - player.x, b.y - player.y) < player.width / 2.5) {
            if (player.shield > 15) player.shield -= 15
            else player.health -= 12
            b.hit = true
            createExplosion(player.x, player.y, 6, '#00f5ff')
          }
        })
        enemyBullets = enemyBullets.filter(b => !b.hit)

        // Check Player Death
        if (player.health <= 0) {
          isGameOver = true
          createExplosion(player.x, player.y, 40, '#00f5ff')
          onGameOver(score)
        }

        // Update Particles
        particles.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          p.alpha -= p.decay
        })
        particles = particles.filter(p => p.alpha > 0)

        // Sync React HUD state
        setHudStats({
          score,
          health: Math.max(0, Math.round(player.health)),
          shield: Math.round(player.shield),
          wave,
          bossHealth: boss ? Math.round((boss.hp / boss.maxHp) * 100) : null,
        })
      }

      // ── RENDER SCENE ─────────────────────────
      ctx.fillStyle = '#050716'
      ctx.fillRect(0, 0, width, height)

      // Render Stars
      stars.forEach(s => {
        if (!isPaused) {
          s.y += s.speed
          if (s.y > height) { s.y = 0; s.x = Math.random() * width }
        }
        ctx.fillStyle = s.color
        ctx.fillRect(s.x, s.y, s.size, s.size)
      })

      // Render Player Bullets
      bullets.forEach(b => {
        ctx.fillStyle = b.color
        ctx.shadowBlur = 8
        ctx.shadowColor = b.color
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16)
        ctx.shadowBlur = 0
      })

      // Render Enemy Bullets
      enemyBullets.forEach(b => {
        ctx.fillStyle = b.color
        ctx.shadowBlur = 8
        ctx.shadowColor = b.color
        ctx.beginPath()
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Render Powerups
      powerups.forEach(p => {
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.type === 'triple' ? '⚡' : '💚', p.x, p.y)
      })

      // Render Enemies
      enemies.forEach(e => {
        ctx.save()
        ctx.translate(e.x, e.y)
        ctx.fillStyle = e.color
        if (e.type === 'scout') {
          ctx.beginPath()
          ctx.moveTo(0, 16)
          ctx.lineTo(-14, -14)
          ctx.lineTo(0, -6)
          ctx.lineTo(14, -14)
          ctx.closePath()
          ctx.fill()
        } else if (e.type === 'fighter') {
          ctx.beginPath()
          ctx.moveTo(0, 18)
          ctx.lineTo(-18, -10)
          ctx.lineTo(0, -4)
          ctx.lineTo(18, -10)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })

      // Render Boss
      if (boss) {
        ctx.save()
        ctx.translate(boss.x, boss.y)
        ctx.fillStyle = '#ff0055'
        ctx.shadowBlur = 15
        ctx.shadowColor = '#ff0055'
        ctx.beginPath()
        ctx.moveTo(0, 45)
        ctx.lineTo(-65, -35)
        ctx.lineTo(0, -15)
        ctx.lineTo(65, -35)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()
      }

      // Render Player Ship
      if (player.health > 0) {
        ctx.save()
        ctx.translate(player.x, player.y)

        // Engine Thruster Flame
        ctx.fillStyle = '#00f5ff'
        ctx.shadowBlur = 10
        ctx.shadowColor = '#00f5ff'
        ctx.beginPath()
        ctx.moveTo(-6, 20)
        ctx.lineTo(0, 20 + Math.random() * 12 + 6)
        ctx.lineTo(6, 20)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0

        // Ship Body
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(0, -22)
        ctx.lineTo(-20, 18)
        ctx.lineTo(0, 8)
        ctx.lineTo(20, 18)
        ctx.closePath()
        ctx.fill()

        // Cockpit Glow
        ctx.fillStyle = '#00f5ff'
        ctx.beginPath()
        ctx.arc(0, -4, 5, 0, Math.PI * 2)
        ctx.fill()

        // Energy Shield Dome
        if (player.shield > 20) {
          ctx.strokeStyle = `rgba(0, 245, 255, ${player.shield / 150})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(0, 0, 28, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.restore()
      }

      // Render Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      isMounted = false
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto select-none">
      {/* Canvas HUD Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>❤️</span> {hudStats.health}%
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Shield size={14} /> {hudStats.shield}%
          </div>
          <div className="text-purple-400 uppercase tracking-wider">
            Wave {hudStats.wave}/3
          </div>
        </div>

        {hudStats.bossHealth !== null && (
          <div className="flex items-center gap-2">
            <span className="text-rose-500 font-bold uppercase animate-pulse">Boss:</span>
            <div className="w-32 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-rose-500/40">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${hudStats.bossHealth}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full max-h-[580px] aspect-[4/3] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl cursor-crosshair touch-none"
      />

      {/* Controls Hint */}
      <div className="mt-2 text-center text-slate-400 text-xs flex items-center gap-4">
        <span>🎮 Controls: <b>WASD / Arrow Keys</b> or <b>Mouse & Touch</b></span>
        <span>•</span>
        <span>💥 <b>Spacebar / Click</b> to Fire</span>
      </div>
    </div>
  )
}
