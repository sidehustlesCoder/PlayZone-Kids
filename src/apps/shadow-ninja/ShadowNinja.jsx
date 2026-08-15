import { useEffect, useRef, useState } from 'react'

export default function ShadowNinja({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ score: 0, health: 100, level: 1, energy: 100 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let isMounted = true

    const W = 800, H = 480
    canvas.width = W
    canvas.height = H

    const snd = (freq, type = 'square', dur = 0.1) => {
      if (!settings?.soundEnabled) return
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)()
        const o = ac.createOscillator(); const g = ac.createGain()
        o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime)
        g.gain.setValueAtTime((settings?.volume || 0.7) * 0.12, ac.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur)
        o.connect(g); g.connect(ac.destination)
        o.start(); o.stop(ac.currentTime + dur)
      } catch {}
    }

    const LEVEL_CFG = [
      { plats: [[50,400,160,14],[260,340,130,14],[430,280,150,14],[620,340,130,14],[300,210,120,14],[520,150,110,14],[710,100,90,14]], enemyCount: 4, bg: '#0d0d1a' },
      { plats: [[50,410,130,14],[210,350,110,14],[360,290,110,14],[500,350,120,14],[650,290,120,14],[180,210,110,14],[390,140,120,14],[590,70,110,14]], enemyCount: 7, bg: '#0a1428' },
      { plats: [[50,420,120,14],[190,350,100,14],[320,280,110,14],[460,350,100,14],[580,280,110,14],[700,350,100,14],[100,190,110,14],[330,110,120,14],[570,40,110,14]], enemyCount: 11, bg: '#1a0a0a' },
    ]

    let level = 0, score = 0, gameOver = false, victory = false
    let platforms = [], enemies = [], particles = [], projectiles = [], coins = [], portal = null
    let cameraX = 0, tick = 0

    const ninja = { x:70, y:360, w:28, h:44, vx:0, vy:0, speed:5.5, grounded:false, facingRight:true, health:100, energy:100, attackTimer:0, attackCooldown:0, invincible:0, dashCooldown:0, wallSliding:false, wallJumpCooldown:0 }

    const initLevel = (lvl) => {
      const cfg = LEVEL_CFG[lvl]
      platforms = [...cfg.plats.map(([x,y,w,h]) => ({x,y,w,h})), { x:-200, y:H-20, w:W+400, h:20 }]
      enemies = Array.from({length: cfg.enemyCount}, (_,i) => ({
        x: 200 + i * 80, y: 300, w:30, h:44, vx:(i%2?1:-1)*1.6, vy:0, grounded:false,
        health:40, maxHealth:40, attackTimer:0, stunTimer:0,
        type: i%3===0 ? 'archer' : 'grunt', shootTimer: 80 + i*25,
      }))
      coins = cfg.plats.map(([px,py,pw]) => ({ x:px+pw/2, y:py-18, collected:false }))
      portal = null
    }
    initLevel(0)

    const keys = {}
    const onKD = (e) => {
      keys[e.key] = true
      if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      if ((e.key==='z'||e.key==='Z'||e.key==='x'||e.key==='X') && ninja.attackCooldown<=0) {
        ninja.attackTimer=14; ninja.attackCooldown=22
        snd(280,'sawtooth',0.08)
        enemies.forEach(en => {
          const ax = ninja.facingRight ? ninja.x+ninja.w : ninja.x-40
          if (Math.abs(en.y-ninja.y)<45 && en.x>ax-10 && en.x<ax+52) {
            en.health-=35; en.stunTimer=18; en.vx=ninja.facingRight?5:-5; en.vy=-5
            snd(180,'sawtooth',0.12)
            for(let i=0;i<8;i++) particles.push({x:en.x+15,y:en.y+15,vx:(Math.random()-.5)*7,vy:Math.random()*-5-1,color:'#ff375f',alpha:1,size:3})
          }
        })
      }
      if ((e.key==='c'||e.key==='C') && ninja.dashCooldown<=0 && ninja.energy>=25) {
        ninja.vx=ninja.facingRight?18:-18; ninja.energy-=25; ninja.dashCooldown=50; ninja.invincible=16
        snd(550,'sine',0.1)
        for(let i=0;i<10;i++) particles.push({x:ninja.x+14,y:ninja.y+22,vx:(Math.random()-.5)*4-(ninja.facingRight?4:-4),vy:(Math.random()-.5)*3,color:'#00f5ff',alpha:1,size:3})
      }
    }
    const onKU = (e) => { keys[e.key] = false }
    window.addEventListener('keydown', onKD)
    window.addEventListener('keyup', onKU)

    const resolveAABB = (obj) => {
      obj.grounded = false; obj.wallSliding = false
      platforms.forEach(p => {
        if (obj.x+obj.w>p.x && obj.x<p.x+p.w && obj.y+obj.h>p.y && obj.y<p.y+p.h) {
          const top=obj.y+obj.h-p.y, bot=p.y+p.h-obj.y, lft=obj.x+obj.w-p.x, rgt=p.x+p.w-obj.x
          const m = Math.min(top,bot,lft,rgt)
          if (m===top&&obj.vy>=0){obj.y=p.y-obj.h;obj.vy=0;obj.grounded=true}
          else if(m===bot&&obj.vy<0){obj.y=p.y+p.h;obj.vy=0}
          else if(m===lft){obj.x=p.x-obj.w;if(obj.vy>0)obj.wallSliding=true}
          else{obj.x=p.x+p.w}
        }
      })
    }

    const loop = () => {
      if (!isMounted) return
      tick++
      if (!isPaused && !gameOver && !victory) {
        // Player
        if (keys['ArrowLeft']||keys['a']||keys['A']){ninja.vx=-ninja.speed;ninja.facingRight=false}
        else if(keys['ArrowRight']||keys['d']||keys['D']){ninja.vx=ninja.speed;ninja.facingRight=true}
        else ninja.vx*=0.75
        if ((keys['ArrowUp']||keys[' ']||keys['w']||keys['W'])&&ninja.grounded){ninja.vy=-13.5;ninja.grounded=false;snd(380,'triangle',0.08)}
        if ((keys['ArrowUp']||keys[' '])&&ninja.wallSliding&&ninja.wallJumpCooldown<=0){ninja.vy=-12;ninja.vx=ninja.facingRight?-9:9;ninja.facingRight=!ninja.facingRight;ninja.wallJumpCooldown=20;snd(440,'triangle',0.1)}
        ninja.vy+=0.72; ninja.x+=ninja.vx; ninja.y+=ninja.vy
        if(ninja.y>H+100)ninja.health=0
        resolveAABB(ninja)
        if(ninja.attackTimer>0)ninja.attackTimer--;else ninja.attacking=false
        if(ninja.attackCooldown>0)ninja.attackCooldown--
        if(ninja.dashCooldown>0)ninja.dashCooldown--
        if(ninja.invincible>0)ninja.invincible--
        if(ninja.wallJumpCooldown>0)ninja.wallJumpCooldown--
        if(ninja.energy<100)ninja.energy+=0.15
        cameraX = Math.max(0, Math.min(W*0.5, ninja.x-W*0.3))

        // Enemies
        enemies.forEach(en => {
          if(en.stunTimer>0){en.stunTimer--;en.vy+=0.6;en.x+=en.vx*0.3;en.y+=en.vy;resolveAABB(en);return}
          const dx=ninja.x-en.x
          if(Math.abs(dx)>8)en.vx=(dx/Math.abs(dx))*1.7
          en.vy+=0.7; en.x+=en.vx; en.y+=en.vy; resolveAABB(en)
          if(en.type==='archer'){
            en.shootTimer--
            if(en.shootTimer<=0){en.shootTimer=120;const ang=Math.atan2(ninja.y-en.y,ninja.x-en.x);projectiles.push({x:en.x+15,y:en.y+15,vx:Math.cos(ang)*5.5,vy:Math.sin(ang)*5.5,color:'#ff375f',owner:'enemy'});snd(300,'sawtooth',0.07)}
          }
          if(en.attackTimer<=0&&Math.hypot(ninja.x-en.x,ninja.y-en.y)<42&&ninja.invincible<=0){ninja.health-=12;ninja.invincible=32;ninja.vx=en.vx>0?5:-5;ninja.vy=-4;snd(120,'sawtooth',0.15);en.attackTimer=65}
          if(en.attackTimer>0)en.attackTimer--
        })
        enemies = enemies.filter(en => {
          if(en.health<=0){score+=en.type==='archer'?60:40;onScoreChange(score);for(let i=0;i<12;i++)particles.push({x:en.x+15,y:en.y+15,vx:(Math.random()-.5)*7,vy:Math.random()*-5-1,color:'#ff375f',alpha:1,size:3});return false}
          return true
        })

        // Projectiles
        projectiles.forEach(p=>{p.x+=p.vx;p.y+=p.vy})
        projectiles=projectiles.filter(p=>{
          if(p.owner==='enemy'&&ninja.invincible<=0&&Math.hypot(p.x-ninja.x-14,p.y-ninja.y-22)<22){ninja.health-=10;ninja.invincible=25;snd(140,'sawtooth',0.1);return false}
          return p.x>-100&&p.x<W+300&&p.y>-100&&p.y<H+100
        })

        // Coins
        coins.forEach(c=>{if(!c.collected&&Math.hypot(c.x-ninja.x-14,c.y-ninja.y-22)<28){c.collected=true;score+=15;onScoreChange(score);snd(700,'sine',0.08)}})

        // Portal
        if(enemies.length===0&&!portal){portal={x:W-80,y:60,pulse:0};snd(600,'sine',0.4)}
        if(portal){
          portal.pulse=(portal.pulse+0.08)%(Math.PI*2)
          if(Math.hypot(ninja.x+14-portal.x,ninja.y+22-portal.y)<40){
            if(level<LEVEL_CFG.length-1){level++;score+=300;onScoreChange(score);initLevel(level);ninja.x=70;ninja.y=360;ninja.vx=0;ninja.vy=0;cameraX=0;snd(880,'sine',0.3)}
            else{victory=true;score+=500;onScoreChange(score);onVictory(score)}
          }
        }

        // Particles
        particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.alpha-=0.03})
        particles=particles.filter(p=>p.alpha>0)
        if(ninja.health<=0){gameOver=true;onGameOver(score)}

        setHud({score,health:Math.max(0,Math.round(ninja.health)),level:level+1,energy:Math.round(ninja.energy)})
      }

      // ── RENDER ────────────────────────────────────────────────────
      const cfg = LEVEL_CFG[level]
      ctx.fillStyle = cfg.bg
      ctx.fillRect(0,0,W,H)
      // Parallax lines
      ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1
      for(let i=0;i<14;i++){ctx.beginPath();ctx.moveTo(i*70-(cameraX*0.2)%70,0);ctx.lineTo(i*70-(cameraX*0.2)%70,H);ctx.stroke()}

      ctx.save()
      ctx.translate(-cameraX,0)

      // Platforms
      platforms.forEach(p=>{
        const g2=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h)
        g2.addColorStop(0,'#334155');g2.addColorStop(1,'#1e293b')
        ctx.fillStyle=g2;ctx.fillRect(p.x,p.y,p.w,p.h)
        ctx.fillStyle='rgba(0,245,255,0.25)';ctx.fillRect(p.x,p.y,p.w,2)
      })

      // Coins
      coins.forEach((c,i)=>{
        if(c.collected)return
        const pulse=Math.sin(tick*0.05+i)*3
        ctx.fillStyle='#ffd700';ctx.shadowBlur=10;ctx.shadowColor='#ffd700'
        ctx.beginPath();ctx.arc(c.x,c.y+pulse,7,0,Math.PI*2);ctx.fill()
        ctx.shadowBlur=0
      })

      // Portal
      if(portal){
        ctx.save();ctx.translate(portal.x,portal.y)
        const s=1+Math.sin(portal.pulse)*0.15
        ctx.scale(s,s);ctx.shadowBlur=30;ctx.shadowColor='#bf5af2'
        ctx.fillStyle='#bf5af2';ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('⬆',0,7)
        ctx.shadowBlur=0;ctx.restore()
      }

      // Enemies
      enemies.forEach(en=>{
        ctx.fillStyle='#0f172a';ctx.fillRect(en.x,en.y-12,30,5)
        ctx.fillStyle=en.health>20?'#32d74b':'#ff375f';ctx.fillRect(en.x,en.y-12,30*(en.health/en.maxHealth),5)
        ctx.shadowBlur=8;ctx.shadowColor=en.type==='archer'?'#ff9f0a':'#ff375f'
        ctx.fillStyle=en.type==='archer'?'#ff9f0a':'#ff375f'
        ctx.fillRect(en.x+4,en.y+28,8,16);ctx.fillRect(en.x+18,en.y+28,8,16)
        ctx.fillRect(en.x+2,en.y+8,26,22)
        ctx.fillStyle='#b45309';ctx.fillRect(en.x+6,en.y-2,18,14)
        ctx.shadowBlur=0
        if(en.type==='archer'){ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd700';ctx.fillText('🏹',en.x+15,en.y-16)}
      })

      // Projectiles
      projectiles.forEach(p=>{
        ctx.fillStyle=p.color;ctx.shadowBlur=8;ctx.shadowColor=p.color
        ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
      })

      // Ninja player
      const alpha2=ninja.invincible>0?(Math.floor(ninja.invincible/3)%2===0?0.3:1):1
      ctx.globalAlpha=alpha2
      ctx.save();ctx.translate(ninja.x+ninja.w/2,ninja.y+ninja.h/2)
      if(!ninja.facingRight)ctx.scale(-1,1)
      ctx.shadowBlur=ninja.attackTimer>0?22:10;ctx.shadowColor='#00f5ff'
      ctx.fillStyle='#0d0d1a';ctx.fillRect(-10,10,8,20);ctx.fillRect(2,10,8,20)
      ctx.fillStyle='#0a0a14';ctx.fillRect(-12,-10,24,22)
      ctx.fillStyle='#ff375f';ctx.fillRect(-12,-4,24,8)
      ctx.fillStyle='#0a0a14';ctx.fillRect(-8,-24,16,16)
      ctx.fillStyle='#00f5ff';ctx.fillRect(2,-18,5,4)
      if(ninja.attackTimer>0){
        ctx.fillStyle='#fff';ctx.shadowBlur=18;ctx.shadowColor='#fff';ctx.fillRect(12,-12,30,4)
        ctx.fillStyle='#00f5ff';ctx.fillRect(38,-16,8,12)
      }
      ctx.shadowBlur=0;ctx.restore()
      ctx.globalAlpha=1

      // Particles
      particles.forEach(p=>{
        ctx.fillStyle=p.color;ctx.globalAlpha=p.alpha
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()
        ctx.globalAlpha=1
      })
      ctx.restore()

      ctx.fillStyle='rgba(191,90,242,0.9)';ctx.font='bold 10px sans-serif';ctx.textAlign='left'
      ctx.fillText(`LEVEL ${level+1}/${LEVEL_CFG.length}  •  ${enemies.length} enemies remaining`,12,16)

      animId=requestAnimationFrame(loop)
    }

    animId=requestAnimationFrame(loop)
    return () => {
      isMounted=false;cancelAnimationFrame(animId)
      window.removeEventListener('keydown',onKD)
      window.removeEventListener('keyup',onKU)
    }
  }, [isPaused, onScoreChange, onGameOver, onVictory, settings])

  return (
    <div className="relative flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>❤️</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all rounded-full" style={{width:`${hud.health}%`}} />
            </div>
            <span className="text-rose-400">{hud.health}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all rounded-full" style={{width:`${hud.energy}%`}} />
            </div>
          </div>
        </div>
        <div className="text-purple-400 font-mono uppercase">Level {hud.level}/3</div>
      </div>
      <canvas ref={canvasRef} className="w-full max-h-[520px] aspect-[5/3] bg-slate-950 border border-slate-800 rounded-b-2xl shadow-2xl touch-none cursor-crosshair" />
      <div className="mt-2 text-center text-slate-400 text-xs flex flex-wrap items-center justify-center gap-3">
        <span>🎮 <b>WASD/Arrows</b> Move+Jump</span><span>•</span>
        <span>⚔️ <b>Z/X</b> Attack</span><span>•</span>
        <span>💨 <b>C</b> Dash</span><span>•</span>
        <span>🟣 Reach portal to advance</span>
      </div>
    </div>
  )
}
