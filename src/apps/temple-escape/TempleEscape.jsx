import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'

// ── 3D ADVENTURER RUNNER MODEL ──────────────────────────────────────────────
function AdventurerRunner({ laneX, playerY, isSliding, isGrounded, isBoost, isShield }) {
  const runnerRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (runnerRef.current) {
      // Smooth lane bank
      runnerRef.current.rotation.z = (runnerRef.current.position.x - laneX) * 0.15
      runnerRef.current.position.x += (laneX - runnerRef.current.position.x) * 0.22
      runnerRef.current.position.y = playerY
    }

    // Running animation
    if (isGrounded && !isSliding) {
      const stride = Math.sin(time * 16)
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * 0.9
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.9
      if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.9
      if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.9
    }
  })

  return (
    <group ref={runnerRef} position={[0, 0, 0]}>
      {/* Shield Energy Bubble */}
      {isShield && (
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#00f5ff" transparent opacity={0.35} emissive="#00ffff" emissiveIntensity={0.8} wireframe />
        </mesh>
      )}

      {/* Boost Fire Aura */}
      {isBoost && (
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[1.6, 16, 16]} />
          <meshStandardMaterial color="#ffaa00" transparent opacity={0.3} emissive="#ff5500" emissiveIntensity={1.5} />
        </mesh>
      )}

      {isSliding ? (
        /* Sliding Pose */
        <group position={[0, 0.4, 0]}>
          {/* Torso sliding */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.7, 0.4, 1.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.35, -0.6]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshStandardMaterial color="#fcd34d" />
          </mesh>
          {/* Cargo Pants */}
          <mesh position={[0, 0.15, 0.6]}>
            <boxGeometry args={[0.65, 0.3, 0.8]} />
            <meshStandardMaterial color="#3f6212" />
          </mesh>
        </group>
      ) : (
        /* Standing / Running Pose */
        <group>
          {/* Torso & Explorer Jacket */}
          <mesh position={[0, 1.35, 0]} castShadow>
            <boxGeometry args={[0.75, 0.9, 0.45]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>

          {/* Leather Backpack */}
          <mesh position={[0, 1.35, 0.3]} castShadow>
            <boxGeometry args={[0.55, 0.7, 0.28]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>

          {/* Head & Ponytail */}
          <mesh position={[0, 2.05, 0]} castShadow>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshStandardMaterial color="#fcd34d" roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.15, 0.28]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.04, 0.45, 8]} />
            <meshStandardMaterial color="#b45309" roughness={0.8} />
          </mesh>

          {/* Arms */}
          <group ref={leftArmRef} position={[-0.48, 1.35, 0]}>
            <mesh position={[0, -0.3, 0]}>
              <boxGeometry args={[0.2, 0.65, 0.2]} />
              <meshStandardMaterial color="#fcd34d" />
            </mesh>
          </group>
          <group ref={rightArmRef} position={[0.48, 1.35, 0]}>
            <mesh position={[0, -0.3, 0]}>
              <boxGeometry args={[0.2, 0.65, 0.2]} />
              <meshStandardMaterial color="#fcd34d" />
            </mesh>
          </group>

          {/* Cargo Pants Legs */}
          <group ref={leftLegRef} position={[-0.22, 0.8, 0]}>
            <mesh position={[0, -0.4, 0]} castShadow>
              <boxGeometry args={[0.26, 0.8, 0.26]} />
              <meshStandardMaterial color="#3f6212" roughness={0.7} />
            </mesh>
          </group>
          <group ref={rightLegRef} position={[0.22, 0.8, 0]}>
            <mesh position={[0, -0.4, 0]} castShadow>
              <boxGeometry args={[0.26, 0.8, 0.26]} />
              <meshStandardMaterial color="#3f6212" roughness={0.7} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}

// ── 3 DEMON MONKEYS CHASING BEHIND ──────────────────────────────────────────
function DemonMonkeys({ playerX }) {
  const monkeysRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (monkeysRef.current) {
      monkeysRef.current.position.x += (playerX - monkeysRef.current.position.x) * 0.12
      monkeysRef.current.position.y = Math.abs(Math.sin(time * 14)) * 0.28
    }
  })

  const Monkey = ({ pos, scale = 1 }) => (
    <group position={pos} scale={scale}>
      {/* Black Fur Body */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.65, 12, 12]} />
        <meshStandardMaterial color="#090509" roughness={0.9} emissive="#1e051a" emissiveIntensity={0.4} />
      </mesh>
      {/* Skull Face Mask */}
      <mesh position={[0, 1.15, -0.45]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      {/* Glowing Red Eyes */}
      <mesh position={[-0.12, 1.22, -0.75]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff0033" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.12, 1.22, -0.75]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff0033" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      {/* Snapping Fangs */}
      <mesh position={[0, 1.0, -0.7]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.22, 4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )

  return (
    <group ref={monkeysRef} position={[0, 0, 4.6]}>
      <Monkey pos={[0, 0, 0]} scale={1.05} />
      <Monkey pos={[-1.3, 0, 0.7]} scale={0.88} />
      <Monkey pos={[1.3, 0, 0.7]} scale={0.88} />
    </group>
  )
}

// ── 3D WOODEN PLANK BRIDGE & JUNGLE ENVIRONMENT ────────────────────────────
function TempleBridge({ speed }) {
  const roadRef = useRef()

  useFrame((_, delta) => {
    if (roadRef.current) {
      roadRef.current.position.z += speed * delta * 2.2
      if (roadRef.current.position.z > 20) {
        roadRef.current.position.z = 0
      }
    }
  })

  return (
    <group>
      {/* Murky Emerald Swamp Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, -40]}>
        <planeGeometry args={[120, 260]} />
        <meshStandardMaterial color="#082b26" roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Moving Wooden Plank Sections */}
      <group ref={roadRef}>
        {Array.from({ length: 18 }).map((_, i) => (
          <group key={i} position={[0, 0, -i * 12 + 10]}>
            {/* Wooden Deck Planks */}
            <mesh position={[0, -0.2, 0]} receiveShadow>
              <boxGeometry args={[7.2, 0.4, 11.6]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#452b14' : '#523419'} roughness={0.85} />
            </mesh>

            {/* Mossy Green Borders */}
            <mesh position={[-3.3, 0.02, 0]}>
              <boxGeometry args={[0.5, 0.06, 11.6]} />
              <meshStandardMaterial color="#166534" roughness={0.9} />
            </mesh>
            <mesh position={[3.3, 0.02, 0]}>
              <boxGeometry args={[0.5, 0.06, 11.6]} />
              <meshStandardMaterial color="#166534" roughness={0.9} />
            </mesh>

            {/* Heavy Wooden Side Railings */}
            <mesh position={[-3.65, 0.45, 0]} castShadow>
              <boxGeometry args={[0.3, 0.85, 11.6]} />
              <meshStandardMaterial color="#2c1809" roughness={0.9} />
            </mesh>
            <mesh position={[3.65, 0.45, 0]} castShadow>
              <boxGeometry args={[0.3, 0.85, 11.6]} />
              <meshStandardMaterial color="#2c1809" roughness={0.9} />
            </mesh>

            {/* Carved Skull Totem Posts along Railings */}
            {[-3, 3].map((pz, idx) => (
              <group key={idx}>
                {/* Left Post */}
                <mesh position={[-3.65, 0.8, pz]} castShadow>
                  <boxGeometry args={[0.5, 1.4, 0.5]} />
                  <meshStandardMaterial color="#2c1809" />
                </mesh>
                <mesh position={[-3.65, 1.7, pz]} castShadow>
                  <boxGeometry args={[0.65, 0.7, 0.65]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>

                {/* Right Post */}
                <mesh position={[3.65, 0.8, pz]} castShadow>
                  <boxGeometry args={[0.5, 1.4, 0.5]} />
                  <meshStandardMaterial color="#2c1809" />
                </mesh>
                <mesh position={[3.65, 1.7, pz]} castShadow>
                  <boxGeometry args={[0.65, 0.7, 0.65]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
                </mesh>
              </group>
            ))}

            {/* Distant Jungle Mangrove Trees */}
            <mesh position={[-14 - (i % 3) * 3, 7, 0]}>
              <coneGeometry args={[4 + (i % 3), 18, 6]} />
              <meshStandardMaterial color="#061c14" roughness={0.9} />
            </mesh>
            <mesh position={[14 + (i % 3) * 3, 7, 0]}>
              <coneGeometry args={[4 + (i % 3), 18, 6]} />
              <meshStandardMaterial color="#061c14" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

// ── 3D SCENE CONTROLLER ─────────────────────────────────────────────────────
function GameScene({
  isPaused,
  speed,
  laneX,
  playerY,
  isSliding,
  isGrounded,
  isBoost,
  isShield,
  onCrash,
  onCollectCoin,
  onCollectPowerup,
}) {
  const [obstacles, setObstacles] = useState([])
  const [coins, setCoins] = useState([])
  const [powerups, setPowerups] = useState([])
  const lastSpawn = useRef(0)

  const LANES_X = [-2.2, 0, 2.2]

  useFrame((state, delta) => {
    if (isPaused) return
    const time = state.clock.getElapsedTime()
    const effSpeed = isBoost ? speed * 1.8 : speed

    // Spawning Patterns
    if (time - lastSpawn.current > 1.6 / (effSpeed / 20)) {
      lastSpawn.current = time
      const randLane = LANES_X[Math.floor(Math.random() * 3)]
      const typeRand = Math.random()

      if (typeRand < 0.35) {
        // 1. Gargoyle Fire Jet (Slide Under!)
        setObstacles(o => [
          ...o,
          { id: Math.random(), type: 'flame', x: 0, z: -90, width: 7.0 },
        ])
      } else if (typeRand < 0.7) {
        // 2. Fallen Mossy Log (Jump Over!)
        setObstacles(o => [
          ...o,
          { id: Math.random(), type: 'log', x: 0, z: -90, width: 6.8 },
        ])
      } else {
        // 3. Ancient Skull Monolith (Switch Lane!)
        setObstacles(o => [
          ...o,
          { id: Math.random(), type: 'pillar', x: randLane, z: -90 },
        ])
      }

      // Guiding Diamond Coins
      const coinLane = LANES_X[Math.floor(Math.random() * 3)]
      for (let c = 0; c < 5; c++) {
        setCoins(prev => [
          ...prev,
          {
            id: Math.random(),
            x: coinLane,
            y: 0.9 + Math.sin((c / 4) * Math.PI) * 0.9,
            z: -90 - c * 3.5,
            collected: false,
          },
        ])
      }

      // Power-up chance
      if (Math.random() < 0.18) {
        const pwLane = LANES_X[Math.floor(Math.random() * 3)]
        const pwType = ['magnet', 'shield', 'boost'][Math.floor(Math.random() * 3)]
        setPowerups(p => [
          ...p,
          { id: Math.random(), type: pwType, x: pwLane, z: -90 - 24, collected: false },
        ])
      }
    }

    // Move & Collide Obstacles
    setObstacles(prev =>
      prev
        .map(o => ({ ...o, z: o.z + effSpeed * delta * 2.2 }))
        .filter(o => {
          if (Math.abs(o.z) < 1.4) {
            let hit = false
            if (o.type === 'flame') {
              if (!isSliding || playerY > 0.4) hit = true
            } else if (o.type === 'log') {
              if (playerY < 0.85) hit = true
            } else if (o.type === 'pillar') {
              if (Math.abs(laneX - o.x) < 1.1) hit = true
            }

            if (hit) {
              onCrash()
              return false
            }
          }
          return o.z < 20
        })
    )

    // Move & Collect Coins
    setCoins(prev =>
      prev
        .map(c => ({ ...c, z: c.z + effSpeed * delta * 2.2 }))
        .filter(c => {
          if (!c.collected && Math.abs(c.z) < 1.5 && Math.abs(laneX - c.x) < 1.2 && Math.abs(playerY + 0.8 - c.y) < 1.6) {
            onCollectCoin()
            return false
          }
          return c.z < 20
        })
    )

    // Move & Collect Powerups
    setPowerups(prev =>
      prev
        .map(p => ({ ...p, z: p.z + effSpeed * delta * 2.2 }))
        .filter(p => {
          if (!p.collected && Math.abs(p.z) < 1.5 && Math.abs(laneX - p.x) < 1.3) {
            onCollectPowerup(p.type)
            return false
          }
          return p.z < 20
        })
    )
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4.2, 7.2]} fov={isBoost ? 78 : 62} />
      <ambientLight intensity={1.1} color="#ffe4b5" />
      <directionalLight position={[12, 28, 15]} intensity={1.8} color="#fffbeb" castShadow />
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#ffd700" distance={16} />

      <TempleBridge speed={speed} />
      <AdventurerRunner
        laneX={laneX}
        playerY={playerY}
        isSliding={isSliding}
        isGrounded={isGrounded}
        isBoost={isBoost}
        isShield={isShield}
      />
      <DemonMonkeys playerX={laneX} />

      {/* 3D Obstacles */}
      {obstacles.map(obs => (
        <group key={obs.id} position={[obs.x, 0, obs.z]}>
          {obs.type === 'flame' && (
            <group>
              {/* Gargoyle Posts on Sides */}
              <mesh position={[-3.6, 1.6, 0]} castShadow>
                <boxGeometry args={[0.7, 3.2, 0.7]} />
                <meshStandardMaterial color="#64748b" roughness={0.8} />
              </mesh>
              <mesh position={[3.6, 1.6, 0]} castShadow>
                <boxGeometry args={[0.7, 3.2, 0.7]} />
                <meshStandardMaterial color="#64748b" roughness={0.8} />
              </mesh>
              {/* Horizontal Fire Jet Stream */}
              <mesh position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.32, 0.32, 7.0, 8]} />
                <meshStandardMaterial color="#ff4500" emissive="#ff3300" emissiveIntensity={3} />
              </mesh>
            </group>
          )}

          {obs.type === 'log' && (
            <group>
              {/* Spiked Fallen Mossy Log */}
              <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.38, 0.38, 6.8, 8]} />
                <meshStandardMaterial color="#3f220d" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.41, 0.41, 3.2, 8]} />
                <meshStandardMaterial color="#166534" roughness={0.9} />
              </mesh>
            </group>
          )}

          {obs.type === 'pillar' && (
            <group position={[0, 1.8, 0]}>
              {/* Skull Monolith Barrier */}
              <mesh castShadow>
                <boxGeometry args={[2.0, 3.6, 1.5]} />
                <meshStandardMaterial color="#475569" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.3, 0.76]} castShadow>
                <boxGeometry args={[1.1, 1.1, 0.3]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* 3D Diamond Gold Coins */}
      {coins.map(c => (
        <group key={c.id} position={[c.x, c.y, c.z]}>
          <mesh rotation={[0, Math.PI / 4, 0]} scale={[0.8, 1.2, 0.4]}>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.15} emissive="#ffaa00" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}

      {/* 3D Power-up Orbs */}
      {powerups.map(pw => (
        <group key={pw.id} position={[pw.x, 1.4, pw.z]}>
          <mesh>
            <dodecahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial
              color={pw.type === 'magnet' ? '#ef4444' : pw.type === 'shield' ? '#00f5ff' : '#f59e0b'}
              emissive={pw.type === 'magnet' ? '#ff0000' : pw.type === 'shield' ? '#00ffff' : '#ffaa00'}
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function TempleEscape({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const LANES_X = [-2.2, 0, 2.2]
  const [laneIdx, setLaneIdx] = useState(1) // 0=Left, 1=Center, 2=Right
  const [playerY, setPlayerY] = useState(0)
  const [playerVY, setPlayerVY] = useState(0)
  const [isGrounded, setIsGrounded] = useState(true)
  const [isSliding, setIsSliding] = useState(false)

  const [speed, setSpeed] = useState(20)
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)
  const [score, setScore] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [idolPower, setIdolPower] = useState(0)

  const [shieldActive, setShieldActive] = useState(false)
  const [magnetTimer, setMagnetTimer] = useState(0)
  const [boostTimer, setBoostTimer] = useState(0)
  const [isGameOverState, setIsGameOverState] = useState(false)

  const soundFx = (freq, type = 'sine', dur = 0.1, vol = 0.2) => {
    if (!settings?.soundEnabled) return
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      const o = ac.createOscillator(), g = ac.createGain()
      o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime)
      g.gain.setValueAtTime((settings?.volume || 0.7) * vol, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur)
    } catch {}
  }

  // Controls
  const switchLane = (dir) => {
    if (isGameOverState || isPaused) return
    setLaneIdx(prev => {
      const next = Math.max(0, Math.min(2, prev + dir))
      if (next !== prev) soundFx(380, 'triangle', 0.08, 0.2)
      return next
    })
  }

  const jump = () => {
    if (isGameOverState || isPaused) return
    if (isGrounded && !isSliding) {
      setPlayerVY(0.48)
      setIsGrounded(false)
      soundFx(520, 'sine', 0.12, 0.25)
    }
  }

  const slide = () => {
    if (isGameOverState || isPaused) return
    if (isGrounded) {
      setIsSliding(true)
      soundFx(230, 'sawtooth', 0.12, 0.25)
      setTimeout(() => setIsSliding(false), 700)
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') switchLane(-1)
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') switchLane(1)
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') jump()
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') slide()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGameOverState, isPaused, isGrounded, isSliding])

  // Touch Swipe Handling
  let touchStartX = 0, touchStartY = 0
  const onTouchStart = (e) => {
    if (e.touches[0]) {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }
  }
  const onTouchEnd = (e) => {
    if (e.changedTouches[0]) {
      const dx = e.changedTouches[0].clientX - touchStartX
      const dy = e.changedTouches[0].clientY - touchStartY
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 25) switchLane(1)
        else if (dx < -25) switchLane(-1)
      } else {
        if (dy < -25) jump()
        else if (dy > 25) slide()
      }
    }
  }

  // Physics Loop (Gravity)
  useEffect(() => {
    if (isPaused || isGameOverState) return
    const timer = setInterval(() => {
      if (!isGrounded) {
        setPlayerY(py => {
          const nextY = py + playerVY
          if (nextY <= 0) {
            setPlayerVY(0)
            setIsGrounded(true)
            return 0
          }
          return nextY
        })
        setPlayerVY(v => v - 0.04)
      }

      setDistance(d => {
        const nd = d + (boostTimer > 0 ? 1.6 : 0.9)
        const newScore = Math.floor(nd * 2 + coins * 30) * multiplier
        setScore(newScore)
        onScoreChange(newScore)
        return nd
      })

      if (magnetTimer > 0) setMagnetTimer(t => t - 1)
      if (boostTimer > 0) setBoostTimer(t => t - 1)
    }, 30)

    return () => clearInterval(timer)
  }, [isPaused, isGameOverState, isGrounded, playerVY, coins, multiplier, boostTimer, magnetTimer, onScoreChange])

  const handleCrash = () => {
    if (boostTimer > 0) return
    if (shieldActive) {
      setShieldActive(false)
      soundFx(300, 'triangle', 0.2)
      return
    }
    setIsGameOverState(true)
    soundFx(130, 'sawtooth', 0.4, 0.4)
    onGameOver(score)
  }

  const handleCollectCoin = () => {
    setCoins(c => c + 1)
    setIdolPower(p => Math.min(100, p + 2.5))
    soundFx(780, 'sine', 0.05, 0.2)
  }

  const handleCollectPowerup = (type) => {
    soundFx(950, 'sine', 0.2, 0.3)
    if (type === 'magnet') setMagnetTimer(120)
    if (type === 'shield') setShieldActive(true)
    if (type === 'boost') setBoostTimer(90)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full max-w-5xl mx-auto my-auto select-none p-2 sm:p-4">
      {/* ── TOP TEMPLE RUN BANNER ─────────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-800/80 rounded-2xl text-xs font-black shadow-2xl backdrop-blur-md">
        {/* Left: Golden Idol Power */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🗿</span>
          <div className="w-20 sm:w-32 h-3.5 bg-slate-950 border border-amber-600/80 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(255,215,0,0.8)]"
              style={{ width: `${idolPower}%` }}
            />
          </div>
          <span className="text-yellow-400 font-mono text-xs hidden sm:inline">{idolPower}%</span>
        </div>

        {/* Center: Distance & Powerup Badges */}
        <div className="flex items-center gap-3">
          <span className="text-cyan-300 font-mono text-sm">🏃 {Math.round(distance)}m</span>
          <span className="text-yellow-400 font-mono text-sm">🪙 {coins}</span>

          {shieldActive && <span className="text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40 text-[10px]">🛡️ Shield</span>}
          {magnetTimer > 0 && <span className="text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40 text-[10px] animate-pulse">🧲 {Math.ceil(magnetTimer / 30)}s</span>}
          {boostTimer > 0 && <span className="text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 text-[10px] animate-bounce">⚡ {Math.ceil(boostTimer / 30)}s</span>}
        </div>

        {/* Right: Golden Score Plate */}
        <div className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 shadow-md text-amber-300 font-mono text-sm sm:text-base font-black">
          🏆 {score}
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT ────────────────────────────────────── */}
      <div
        className="relative w-full h-[520px] bg-slate-950 border-2 border-amber-900/60 rounded-3xl shadow-[0_0_80px_rgba(217,119,6,0.3)] overflow-hidden cursor-pointer touch-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Canvas shadows>
          <GameScene
            isPaused={isPaused || isGameOverState}
            speed={speed}
            laneX={LANES_X[laneIdx]}
            playerY={playerY}
            isSliding={isSliding}
            isGrounded={isGrounded}
            isBoost={boostTimer > 0}
            isShield={shieldActive}
            onCrash={handleCrash}
            onCollectCoin={handleCollectCoin}
            onCollectPowerup={handleCollectPowerup}
          />
        </Canvas>

        {/* Game Over Screen Overlay */}
        {isGameOverState && (
          <div className="absolute inset-0 bg-red-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30 animate-in fade-in">
            <h2 className="text-5xl font-black text-red-500 tracking-wider drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">CAUGHT!</h2>
            <p className="text-amber-300 text-lg font-mono">The Demon Monkeys caught you!</p>
            <div className="text-yellow-400 font-mono text-2xl font-black">Score: {score}</div>
          </div>
        )}
      </div>

      {/* ── ON-SCREEN CONTROLS (FOR MOBILE & ACCESSIBILITY) ─────────── */}
      <div className="w-full flex items-center justify-between gap-2 max-w-md">
        <button
          onClick={() => switchLane(-1)}
          className="flex-1 py-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 rounded-2xl text-amber-200 font-black text-lg active:scale-95 transition-transform shadow-lg"
        >
          ⬅️ Left
        </button>
        <button
          onClick={jump}
          className="flex-1 py-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 rounded-2xl text-yellow-300 font-black text-lg active:scale-95 transition-transform shadow-lg"
        >
          ⬆️ Jump
        </button>
        <button
          onClick={slide}
          className="flex-1 py-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 rounded-2xl text-orange-300 font-black text-lg active:scale-95 transition-transform shadow-lg"
        >
          ⬇️ Slide
        </button>
        <button
          onClick={() => switchLane(1)}
          className="flex-1 py-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 rounded-2xl text-amber-200 font-black text-lg active:scale-95 transition-transform shadow-lg"
        >
          ➡️ Right
        </button>
      </div>

      {/* ── KEYBOARD SHORTCUTS GUIDE ───────────────────────────────── */}
      <div className="text-center text-amber-300/80 text-xs flex flex-wrap gap-4 justify-center font-bold">
        <span>⬅️➡️ <b>A / D / Arrows</b> Switch Lanes</span>
        <span>•</span>
        <span>⬆️ <b>W / Space</b> Jump</span>
        <span>•</span>
        <span>⬇️ <b>S / Down</b> Slide Under Flames</span>
        <span>•</span>
        <span>📱 <b>Swipe</b> on Screen</span>
      </div>
    </div>
  )
}
