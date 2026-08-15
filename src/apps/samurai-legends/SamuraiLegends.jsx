import { useEffect, useRef, useState } from 'react'

export default function SamuraiLegends({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ health: 100, ki: 100, combo: 0, score: 0, wave: 1 })

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
        g.gain.setValueAtTime((settings?.volume || 0.7) * 0.12, ac.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur)
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur)
      } catch {}
    }

    // ── SAMURAI PLAYER ──────────────────────────────────────────────
    const samurai = {
      x: 100,
      y: 360,
      w: 32,
      h: 52,
      vx: 0,
      vy: 0,
      facingRight: true,
      health: 100,
      maxHealth: 100,
      ki: 100,
      maxKi: 100,
      attacking: false,
      attackType: 'light',
      attackTimer: 0,
      attackCooldown: 0,
      parrying: false,
      parryTimer: 0,
      invulnerable: 0,
    }

    let groundY = 380
    let score = 0, combo = 0, comboTimer = 0, wave = 1
    let enemies = [], particles = [], blossoms = []
    let tick = 0, gameOver = false, victory = false

    // Falling Sakura Cherry Blossoms
    for (let i = 0; i < 40; i++) {
      blossoms.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speedX: Math.random() * 1.5 + 0.5,
        speedY: Math.random() * 1.2 + 0.8,
        rot: Math.random() * Math.PI,
        size: Math.random() * 4 + 3,
      })
    }

    const spawnWave = (w) => {
      enemies = []
      if (w === 3) {
        // BOSS: Shogun
        enemies.push({
          x: W - 150,
          y: groundY - 58,
          w: 42,
          h: 58,
          hp: 450,
          maxHp: 450,
          type: 'shogun',
          vx: -2,
          attackTimer: 50,
          stunTimer: 0,
        })
        snd(160, 'sawtooth', 0.4)
        return
      }

      const count = 3 + w * 2
      for (let i = 0; i < count; i++) {
        enemies.push({
          x: W + 80 + i * 110,
          y: groundY - 48,
          w: 32,
          h: 48,
          hp: 50 + w * 15,
          maxHp: 50 + w * 15,
          type: i % 2 === 0 ? 'ronin' : 'spearman',
          vx: -1.8,
          attackTimer: 40 + Math.random() * 30,
          stunTimer: 0,
        })
      }
      snd(550, 'sine', 0.2)
    }

    spawnWave(1)

    const triggerAttack = (type) => {
      if (samurai.attackCooldown > 0) return
      samurai.attacking = true
      samurai.attackType = type
      samurai.attackTimer = type === 'heavy' ? 18 : 12
      samurai.attackCooldown = type === 'heavy' ? 26 : 16

      snd(type === 'heavy' ? 220 : 380, 'sawtooth', 0.12)

      // Hit enemies
      const range = type === 'heavy' ? 85 : 55
      const dmg = type === 'heavy' ? 55 : 30

      enemies.forEach(en => {
        const dx = samurai.facingRight ? en.x - samurai.x : samurai.x - en.x
        if (dx > 0 && dx < range && Math.abs(en.y - samurai.y) < 40) {
          en.hp -= dmg
          en.stunTimer = 16
          en.x += samurai.facingRight ? 20 : -20

          combo++
          comboTimer = 75
          score += dmg * combo
          onScoreChange(score)
          snd(450, 'sine', 0.08)

          for (let i = 0; i < 12; i++) {
            particles.push({
              x: en.x,
              y: en.y + 15,
              vx: (Math.random() - 0.5) * 8 + (samurai.facingRight ? 4 : -4),
              vy: Math.random() * -6 - 1,
              color: type === 'heavy' ? '#ffd700' : '#ff375f',
              alpha: 1,
              size: 4,
            })
          }
        }
      })
    }

    const triggerUltimate = () => {
      if (samurai.ki < 100) return
      samurai.ki = 0
      samurai.invulnerable = 45
      snd(180, 'sawtooth', 0.4)

      enemies.forEach(en => {
        en.hp -= 180
        en.stunTimer = 35
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: en.x,
            y: en.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            color: '#00f5ff',
            alpha: 1,
            size: 5,
          })
        }
      })
    }

    const keys = {}
    const onKD = (e) => {
      keys[e.key] = true
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()

      if (e.key === 'z' || e.key === 'Z' || e.key === 'j' || e.key === 'J') triggerAttack('light')
      if (e.key === 'x' || e.key === 'X' || e.key === 'k' || e.key === 'K') triggerAttack('heavy')
      if (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U') triggerUltimate()

      // Parry block
      if (e.code === 'Space') {
        samurai.parrying = true
        samurai.parryTimer = 20
        snd(500, 'triangle', 0.08)
      }
    }
    const onKU = (e) => {
      keys[e.key] = false
      if (e.code === 'Space') samurai.parrying = false
    }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const loop = () => {
      if (!isMounted) return
      tick++

      if (!isPaused && !gameOver && !victory) {
        // Player Movement
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
          samurai.x = Math.max(40, samurai.x - 5)
          samurai.facingRight = false
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
          samurai.x = Math.min(W - 40, samurai.x + 5)
          samurai.facingRight = true
        }

        // Timers
        if (samurai.attackTimer > 0) samurai.attackTimer--
        else samurai.attacking = false
        if (samurai.attackCooldown > 0) samurai.attackCooldown--
        if (samurai.parryTimer > 0) samurai.parryTimer--
        if (samurai.invulnerable > 0) samurai.invulnerable--

        // Ki recharge
        if (samurai.ki < 100) samurai.ki += 0.2

        // Combo decay
        if (comboTimer > 0) comboTimer--
        else combo = 0

        // Blossoms
        blossoms.forEach(b => {
          b.x += b.speedX
          b.y += b.speedY
          b.rot += 0.02
          if (b.y > H || b.x > W) { b.y = -10; b.x = Math.random() * W }
        })

        // Enemies AI & Attack
        enemies.forEach(en => {
          if (en.stunTimer > 0) {
            en.stunTimer--
            return
          }

          // Advance towards samurai
          const dx = samurai.x - en.x
          en.vx = dx > 0 ? 2 : -2
          en.x += en.vx

          // Attack player
          if (Math.abs(dx) < 45) {
            en.attackTimer--
            if (en.attackTimer <= 0) {
              en.attackTimer = en.type === 'shogun' ? 45 : 65
              if (samurai.parrying) {
                // Successful parry!
                snd(700, 'sine', 0.2)
                en.stunTimer = 30
                score += 100
                samurai.ki = Math.min(100, samurai.ki + 25)
              } else if (samurai.invulnerable <= 0) {
                samurai.health -= en.type === 'shogun' ? 25 : 15
                samurai.invulnerable = 25
                snd(120, 'sawtooth', 0.2)
              }
            }
          }
        })

        // Dead enemies
        enemies = enemies.filter(en => {
          if (en.hp <= 0) {
            score += en.type === 'shogun' ? 1000 : 150
            onScoreChange(score)
            snd(250, 'sawtooth', 0.2)
            for (let i = 0; i < 20; i++) {
              particles.push({
                x: en.x,
                y: en.y + 20,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -6 - 2,
                color: '#ff375f',
                alpha: 1,
                size: 4,
              })
            }
            return false
          }
          return true
        })

        // Particles
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.03
        })
        particles = particles.filter(p => p.alpha > 0)

        // Wave advancement
        if (enemies.length === 0) {
          if (wave < 3) {
            wave++
            spawnWave(wave)
          } else {
            victory = true
            onVictory(score + 1000)
          }
        }

        if (samurai.health <= 0) {
          gameOver = true
          onGameOver(score)
        }

        setHud({
          health: Math.max(0, samurai.health),
          ki: Math.round(samurai.ki),
          combo,
          score,
          wave,
        })
      }

      // ── RENDER ─────────────────────────────────────────────────────
      // Moonlit night sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a0a1a')
      sky.addColorStop(0.7, '#1b122c')
      sky.addColorStop(1, '#2c1b2c')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Giant Glowing Blood Moon
      ctx.fillStyle = '#ff375f'
      ctx.shadowBlur = 40; ctx.shadowColor = '#ff375f'
      ctx.beginPath(); ctx.arc(W - 160, 110, 60, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0

      // Distant Pagoda Silhouettes
      ctx.fillStyle = '#100b18'
      ctx.fillRect(80, groundY - 140, 70, 140)
      ctx.fillRect(W - 220, groundY - 180, 90, 180)

      // Ground Temple Bridge / Stone
      ctx.fillStyle = '#1e1622'
      ctx.fillRect(0, groundY, W, H - groundY)
      ctx.fillStyle = '#ff375f'
      ctx.fillRect(0, groundY, W, 3)

      // Falling Cherry Blossoms
      ctx.fillStyle = '#ff7597'
      blossoms.forEach(b => {
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(b.rot)
        ctx.beginPath()
        ctx.ellipse(0, 0, b.size, b.size * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Enemies
      enemies.forEach(en => {
        ctx.save()
        ctx.translate(en.x, en.y)

        // Health bar
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-20, -14, 40, 5)
        ctx.fillStyle = '#ff375f'
        ctx.fillRect(-20, -14, 40 * (en.hp / en.maxHp), 5)

        // Character Body
        ctx.fillStyle = en.type === 'shogun' ? '#8b0000' : '#475569'
        ctx.fillRect(-en.w / 2, 0, en.w, en.h)
        // Red Eyes / Demon Mask
        ctx.fillStyle = '#ff375f'
        ctx.fillRect(-6, 8, 4, 3)
        ctx.fillRect(2, 8, 4, 3)

        // Enemy Weapon
        ctx.fillStyle = '#e2e8f0'
        if (en.type === 'spearman') {
          ctx.fillRect(-en.w / 2 - 25, 20, 30, 4)
        } else {
          ctx.fillRect(-en.w / 2 - 18, 16, 20, 4)
        }

        ctx.restore()
      })

      // Player Samurai
      const isBlink = samurai.invulnerable > 0 && Math.floor(samurai.invulnerable / 3) % 2 === 0
      if (!isBlink) {
        ctx.save()
        ctx.translate(samurai.x, samurai.y)
        if (!samurai.facingRight) ctx.scale(-1, 1)

        // Parry Shield Glow
        if (samurai.parrying) {
          ctx.strokeStyle = '#00f5ff'
          ctx.lineWidth = 3
          ctx.shadowBlur = 15; ctx.shadowColor = '#00f5ff'
          ctx.beginPath(); ctx.arc(10, 20, 28, -Math.PI / 3, Math.PI / 3); ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Kimono / Armor
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(-12, 10, 24, 34)
        // Red Sash
        ctx.fillStyle = '#ff375f'
        ctx.fillRect(-12, 22, 24, 6)
        // Head / Samurai Topknot
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(-8, -6, 16, 16)
        ctx.fillStyle = '#00f5ff'
        ctx.fillRect(4, -1, 3, 2) // glowing eye

        // Katana Sword
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = samurai.attacking ? 20 : 8
        ctx.shadowColor = samurai.attackType === 'heavy' ? '#ffd700' : '#00f5ff'

        if (samurai.attacking) {
          // Slash swing arc
          ctx.fillRect(12, 8, 38, 4)
          ctx.fillStyle = '#00f5ff'
          ctx.fillRect(45, 4, 8, 12)
        } else {
          ctx.fillRect(6, 14, 24, 3)
        }
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

      // Combo Banner
      if (combo > 1) {
        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 26px sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700'
        ctx.fillText(`${combo}x COMBO!`, W / 2, 80)
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
            <span>⚡ KI</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${hud.ki}%` }} />
            </div>
          </div>
          {hud.combo > 1 && <span className="text-yellow-400">🔥 {hud.combo}x Combo</span>}
        </div>
        <div className="text-purple-400 font-mono">
          🌸 WAVE {hud.wave}/3 | {hud.score} PTS
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full max-h-[500px] aspect-[5/3] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none cursor-crosshair"
      />

      <div className="mt-2 text-center text-slate-400 text-xs flex flex-wrap gap-4 justify-center">
        <span>⚔️ <b>Z / J</b> Light Slash</span>
        <span>•</span>
        <span>💥 <b>X / K</b> Heavy Strike</span>
        <span>•</span>
        <span>🛡️ <b>Space</b> Parry Block</span>
        <span>•</span>
        <span>🌀 <b>C / U</b> Whirlwind Ultimate (100% Ki)</span>
      </div>
    </div>
  )
}
