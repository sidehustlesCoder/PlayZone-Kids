import { useEffect, useRef, useState } from 'react'

export default function AlienAttack({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ health: 100, shield: 100, wave: 1, score: 0, bombs: 2, bossHp: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, isMounted = true

    const W = 700, H = 550
    canvas.width = W; canvas.height = H

    const snd = (freq, type = 'square', dur = 0.08) => {
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

    // ── PLAYER SHIP ─────────────────────────────────────────────────
    const ship = {
      x: W / 2,
      y: H - 80,
      w: 32,
      h: 36,
      speed: 6.5,
      health: 100,
      shield: 100,
      bombs: 2,
      fireTimer: 0,
      weaponLevel: 1,
      invuln: 0,
    }

    let score = 0, wave = 1
    let bullets = [], alienBullets = [], enemies = [], powerups = [], particles = []
    let stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: Math.random() * 2 + 1,
      size: Math.random() * 2 + 1,
    }))
    let tick = 0, gameOver = false, victory = false

    const spawnWave = (w) => {
      enemies = []
      if (w === 4) {
        // BOSS WAVE
        enemies.push({
          x: W / 2,
          y: 90,
          w: 80,
          h: 60,
          hp: 600,
          maxHp: 600,
          type: 'boss',
          vx: 2.2,
          shootTimer: 35,
        })
        snd(200, 'sawtooth', 0.4)
        return
      }

      // Fleet formation
      const cols = 7
      const rows = 2 + w
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const type = r === 0 ? 'heavy' : r === 1 ? 'shooter' : 'scout'
          enemies.push({
            x: 90 + c * 80,
            y: 50 + r * 45,
            baseX: 90 + c * 80,
            w: 28,
            h: 24,
            hp: type === 'heavy' ? 40 : type === 'shooter' ? 25 : 15,
            maxHp: type === 'heavy' ? 40 : type === 'shooter' ? 25 : 15,
            type,
            shootTimer: 60 + Math.random() * 120,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
      snd(600, 'sine', 0.25)
    }

    spawnWave(1)

    const keys = {}
    const onKD = (e) => {
      keys[e.key] = true
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      // EMP Bomb
      if ((e.key === 'x' || e.key === 'X' || e.key === 'b' || e.key === 'B') && ship.bombs > 0) {
        ship.bombs--
        snd(150, 'sawtooth', 0.5)
        alienBullets = []
        enemies.forEach(en => {
          en.hp -= 150
          for (let i = 0; i < 15; i++) {
            particles.push({
              x: en.x,
              y: en.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              color: '#00f5ff',
              alpha: 1,
              size: 4,
            })
          }
        })
      }
    }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const loop = () => {
      if (!isMounted) return
      tick++

      if (!isPaused && !gameOver && !victory) {
        // Player Movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) ship.x = Math.max(30, ship.x - ship.speed)
        if (keys['ArrowRight'] || keys['d'] || keys['D']) ship.x = Math.min(W - 30, ship.x + ship.speed)
        if (keys['ArrowUp'] || keys['w'] || keys['W']) ship.y = Math.max(80, ship.y - ship.speed)
        if (keys['ArrowDown'] || keys['s'] || keys['S']) ship.y = Math.min(H - 30, ship.y + ship.speed)

        // Continuous Laser Fire
        if ((keys[' '] || keys['z'] || keys['Z']) && ship.fireTimer <= 0) {
          ship.fireTimer = 8
          if (ship.weaponLevel === 1) {
            bullets.push({ x: ship.x, y: ship.y - 18, vx: 0, vy: -15, color: '#00f5ff' })
          } else if (ship.weaponLevel === 2) {
            bullets.push({ x: ship.x - 10, y: ship.y - 14, vx: 0, vy: -15, color: '#00f5ff' })
            bullets.push({ x: ship.x + 10, y: ship.y - 14, vx: 0, vy: -15, color: '#00f5ff' })
          } else {
            bullets.push({ x: ship.x, y: ship.y - 18, vx: 0, vy: -16, color: '#ffd700' })
            bullets.push({ x: ship.x - 12, y: ship.y - 12, vx: -3, vy: -15, color: '#00f5ff' })
            bullets.push({ x: ship.x + 12, y: ship.y - 12, vx: 3, vy: -15, color: '#00f5ff' })
          }
          snd(500, 'square', 0.05)
        }
        if (ship.fireTimer > 0) ship.fireTimer--
        if (ship.invuln > 0) ship.invuln--

        // Shields auto regen slowly
        if (ship.shield < 100 && tick % 6 === 0) ship.shield += 1

        // Stars parallax
        stars.forEach(s => {
          s.y += s.speed
          if (s.y > H) { s.y = 0; s.x = Math.random() * W }
        })

        // Bullets update
        bullets.forEach(b => { b.x += b.vx; b.y += b.vy })
        bullets = bullets.filter(b => b.y > -20 && b.y < H + 20 && b.x > 0 && b.x < W)

        // Alien Bullets
        alienBullets.forEach(ab => { ab.x += ab.vx; ab.y += ab.vy })
        alienBullets = alienBullets.filter(ab => {
          // Player hit check
          if (ship.invuln <= 0 && Math.hypot(ab.x - ship.x, ab.y - ship.y) < 18) {
            if (ship.shield > 0) {
              ship.shield = Math.max(0, ship.shield - 20)
            } else {
              ship.health -= 20
            }
            ship.invuln = 25
            snd(140, 'sawtooth', 0.15)
            for (let i = 0; i < 8; i++) {
              particles.push({
                x: ship.x,
                y: ship.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#ff375f',
                alpha: 1,
                size: 3,
              })
            }
            return false
          }
          return ab.y < H + 30 && ab.y > -30
        })

        // Enemies update & shooting
        enemies.forEach(en => {
          if (en.type === 'boss') {
            en.x += en.vx
            if (en.x < 100 || en.x > W - 100) en.vx *= -1
            en.shootTimer--
            if (en.shootTimer <= 0) {
              en.shootTimer = 40
              // Spread shots
              for (let a = -0.5; a <= 0.5; a += 0.25) {
                alienBullets.push({
                  x: en.x,
                  y: en.y + 25,
                  vx: Math.sin(a) * 6,
                  vy: Math.cos(a) * 6,
                  color: '#bf5af2',
                })
              }
              snd(300, 'sawtooth', 0.1)
            }
          } else {
            // Sway
            en.phase += 0.04
            en.x = en.baseX + Math.sin(en.phase) * 20
            en.shootTimer--
            if (en.shootTimer <= 0) {
              en.shootTimer = 90 + Math.random() * 100
              alienBullets.push({
                x: en.x,
                y: en.y + 12,
                vx: (Math.random() - 0.5) * 2,
                vy: 5,
                color: en.type === 'heavy' ? '#ff375f' : '#ff9f0a',
              })
            }
          }

          // Bullet collision
          bullets.forEach(b => {
            if (Math.hypot(b.x - en.x, b.y - en.y) < (en.type === 'boss' ? 45 : 18)) {
              en.hp -= 15
              b.y = -100 // despawn
              for (let i = 0; i < 4; i++) {
                particles.push({
                  x: en.x,
                  y: en.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#ffd700',
                  alpha: 1,
                  size: 2,
                })
              }
            }
          })
        })

        // Kill enemies
        enemies = enemies.filter(en => {
          if (en.hp <= 0) {
            score += en.type === 'boss' ? 1000 : en.type === 'heavy' ? 100 : 50
            onScoreChange(score)
            snd(250, 'sawtooth', 0.2)
            for (let i = 0; i < (en.type === 'boss' ? 40 : 12); i++) {
              particles.push({
                x: en.x,
                y: en.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: en.type === 'heavy' ? '#ff375f' : '#00f5ff',
                alpha: 1,
                size: 4,
              })
            }
            // Powerup drop chance
            if (Math.random() < 0.25) {
              powerups.push({
                x: en.x,
                y: en.y,
                type: Math.random() < 0.6 ? 'upgrade' : 'bomb',
              })
            }
            return false
          }
          return true
        })

        // Powerups update
        powerups.forEach(pw => {
          pw.y += 2
          if (Math.hypot(pw.x - ship.x, pw.y - ship.y) < 25) {
            pw.collected = true
            if (pw.type === 'upgrade') {
              ship.weaponLevel = Math.min(3, ship.weaponLevel + 1)
              snd(700, 'sine', 0.2)
            } else {
              ship.bombs = Math.min(3, ship.bombs + 1)
              snd(800, 'sine', 0.2)
            }
          }
        })
        powerups = powerups.filter(pw => !pw.collected && pw.y < H + 20)

        // Particles
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.alpha -= 0.04
        })
        particles = particles.filter(p => p.alpha > 0)

        // Wave progression
        if (enemies.length === 0) {
          if (wave < 4) {
            wave++
            spawnWave(wave)
          } else {
            victory = true
            onVictory(score + 1000)
          }
        }

        if (ship.health <= 0) {
          gameOver = true
          onGameOver(score)
        }

        const boss = enemies.find(e => e.type === 'boss')
        setHud({
          health: Math.max(0, ship.health),
          shield: Math.round(ship.shield),
          wave,
          score,
          bombs: ship.bombs,
          bossHp: boss ? Math.round((boss.hp / boss.maxHp) * 100) : null,
        })
      }

      // ── RENDER ─────────────────────────────────────────────────────
      ctx.fillStyle = '#050713'
      ctx.fillRect(0, 0, W, H)

      // Starfield
      ctx.fillStyle = '#ffffff'
      stars.forEach(s => {
        ctx.globalAlpha = s.speed / 3
        ctx.fillRect(s.x, s.y, s.size, s.size)
      })
      ctx.globalAlpha = 1

      // Powerups
      powerups.forEach(pw => {
        ctx.fillStyle = pw.type === 'upgrade' ? '#ffd700' : '#00f5ff'
        ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle
        ctx.beginPath(); ctx.arc(pw.x, pw.y, 10, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(pw.type === 'upgrade' ? '⚡' : '💣', pw.x, pw.y + 3)
        ctx.shadowBlur = 0
      })

      // Alien Bullets
      alienBullets.forEach(ab => {
        ctx.fillStyle = ab.color
        ctx.shadowBlur = 10; ctx.shadowColor = ab.color
        ctx.beginPath(); ctx.arc(ab.x, ab.y, 4, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      })

      // Player Lasers
      bullets.forEach(b => {
        ctx.fillStyle = b.color
        ctx.shadowBlur = 12; ctx.shadowColor = b.color
        ctx.fillRect(b.x - 2, b.y, 4, 12)
        ctx.shadowBlur = 0
      })

      // Enemies
      enemies.forEach(en => {
        if (en.type === 'boss') {
          // Epic Boss Ship
          ctx.fillStyle = '#bf5af2'
          ctx.shadowBlur = 20; ctx.shadowColor = '#bf5af2'
          ctx.beginPath()
          ctx.moveTo(en.x, en.y + 35)
          ctx.lineTo(en.x - 45, en.y - 25)
          ctx.lineTo(en.x + 45, en.y - 25)
          ctx.closePath()
          ctx.fill()
          // Boss Eye Core
          ctx.fillStyle = '#ff375f'
          ctx.beginPath(); ctx.arc(en.x, en.y - 5, 14, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
        } else {
          ctx.fillStyle = en.type === 'heavy' ? '#ff375f' : en.type === 'shooter' ? '#ff9f0a' : '#32d74b'
          ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle
          // Alien shape
          ctx.beginPath()
          ctx.moveTo(en.x, en.y + 12)
          ctx.lineTo(en.x - 14, en.y - 12)
          ctx.lineTo(en.x, en.y - 6)
          ctx.lineTo(en.x + 14, en.y - 12)
          ctx.closePath()
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // Player Spaceship
      const isBlink = ship.invuln > 0 && Math.floor(ship.invuln / 3) % 2 === 0
      if (!isBlink) {
        ctx.save()
        ctx.translate(ship.x, ship.y)

        // Shield Bubble
        if (ship.shield > 10) {
          ctx.strokeStyle = `rgba(0, 245, 255, ${ship.shield / 150})`
          ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke()
        }

        // Hull
        ctx.fillStyle = '#00f5ff'
        ctx.shadowBlur = 15; ctx.shadowColor = '#00f5ff'
        ctx.beginPath()
        ctx.moveTo(0, -18)
        ctx.lineTo(16, 16)
        ctx.lineTo(0, 10)
        ctx.lineTo(-16, 16)
        ctx.closePath()
        ctx.fill()

        // Cockpit
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-3, -6, 6, 8)
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

      // Boss HP Bar overlay
      if (hud.bossHp !== null) {
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(W / 2 - 120, 20, 240, 12)
        ctx.fillStyle = '#ff375f'
        ctx.fillRect(W / 2 - 120, 20, 240 * (hud.bossHp / 100), 12)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('ALIEN MOTHERSHIP BOSS', W / 2, 16)
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
    <div className="relative flex flex-col items-center w-full max-w-3xl mx-auto select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span>❤️</span>
            <div className="w-18 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${hud.health}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span>🛡️</span>
            <div className="w-18 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${hud.shield}%` }} />
            </div>
          </div>
          <span className="text-yellow-400">💣 EMP: {hud.bombs}</span>
        </div>
        <div className="text-purple-400 font-mono">
          🛸 WAVE {hud.wave}/4 | {hud.score} PTS
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full max-h-[550px] aspect-[7/5.5] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none cursor-crosshair"
      />

      <div className="mt-2 text-center text-slate-400 text-xs flex flex-wrap gap-4 justify-center">
        <span>🎮 <b>WASD/Arrows</b> Move</span>
        <span>•</span>
        <span>🔫 <b>Space/Z</b> Fire Lasers</span>
        <span>•</span>
        <span>💥 <b>X / B</b> EMP Nuke Screen</span>
      </div>
    </div>
  )
}
