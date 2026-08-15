import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import { Gauge, Flame } from 'lucide-react'

// 3D Player Vehicle Model
function PlayerCar({ position, steering, isNitro }) {
  const carRef = useRef()

  useFrame(() => {
    if (carRef.current) {
      carRef.current.rotation.z = -steering * 0.18
      carRef.current.rotation.y = -steering * 0.12
    }
  })

  return (
    <group ref={carRef} position={position}>
      {/* Car Main Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.5, 0.5, 3.2]} />
        <meshStandardMaterial
          color={isNitro ? '#00f5ff' : '#ff0055'}
          roughness={0.2}
          metalness={0.8}
          emissive={isNitro ? '#0077aa' : '#550022'}
        />
      </mesh>

      {/* Cabin Roof / Glass */}
      <mesh position={[0, 0.8, -0.2]}>
        <boxGeometry args={[1.1, 0.45, 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Glowing Headlights */}
      <mesh position={[-0.55, 0.4, 1.6]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.55, 0.4, 1.6]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* Glowing Taillights */}
      <mesh position={[-0.55, 0.4, -1.6]}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
        <meshStandardMaterial color="#ff0044" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.55, 0.4, -1.6]}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
        <meshStandardMaterial color="#ff0044" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>

      {/* Wheels */}
      {[-0.8, 0.8].map((x, i) =>
        [-0.9, 0.9].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  )
}

// 3D Neon Road & Environment
function Highway({ speed, isNitro }) {
  const roadLinesRef = useRef()

  useFrame((_, delta) => {
    if (roadLinesRef.current) {
      roadLinesRef.current.position.z -= speed * delta * 2.5
      if (roadLinesRef.current.position.z < -20) {
        roadLinesRef.current.position.z = 0
      }
    }
  })

  return (
    <group>
      {/* Asphalt Highway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
        <planeGeometry args={[14, 200]} />
        <meshStandardMaterial color="#080b18" roughness={0.8} />
      </mesh>

      {/* Glowing Neon Side Rails */}
      <mesh position={[-7, 0.2, -20]}>
        <boxGeometry args={[0.4, 0.4, 200]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[7, 0.2, -20]}>
        <boxGeometry args={[0.4, 0.4, 200]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={1.5} />
      </mesh>

      {/* Animated Lane Dashes */}
      <group ref={roadLinesRef}>
        {Array.from({ length: 20 }).map((_, i) => (
          <group key={i} position={[0, 0.02, i * 10 - 50]}>
            <mesh position={[-2.3, 0, 0]}>
              <boxGeometry args={[0.15, 0.02, 4]} />
              <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[2.3, 0, 0]}>
              <boxGeometry args={[0.15, 0.02, 4]} />
              <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

// 3D Scene Controller
function GameScene({
  isPaused,
  speed,
  setSpeed,
  playerX,
  setPlayerX,
  steering,
  isNitro,
  setNitro,
  onCrash,
  onCollectCoin,
}) {
  const [traffic, setTraffic] = useState([])
  const [coins, setCoins] = useState([])
  const lastSpawn = useRef(0)

  useFrame((state, delta) => {
    if (isPaused) return

    const time = state.clock.getElapsedTime()

    // Spawn traffic & collectibles
    if (time - lastSpawn.current > 1.8 / (speed / 40)) {
      lastSpawn.current = time
      const lanes = [-4.6, -2.3, 0, 2.3, 4.6]
      const lane = lanes[Math.floor(Math.random() * lanes.length)]

      if (Math.random() < 0.65) {
        setTraffic(t => [
          ...t,
          {
            id: Math.random(),
            x: lane,
            z: -90,
            speed: 18 + Math.random() * 10,
            color: ['#ffd700', '#3b82f6', '#10b981', '#f97316'][Math.floor(Math.random() * 4)],
          },
        ])
      } else {
        setCoins(c => [
          ...c,
          { id: Math.random(), x: lane, z: -90, collected: false },
        ])
      }
    }

    // Move traffic
    setTraffic(prev =>
      prev
        .map(t => ({ ...t, z: t.z + (speed - t.speed) * delta * 1.5 }))
        .filter(t => {
          // Collision with player at z = 0
          if (Math.abs(t.z) < 2.2 && Math.abs(t.x - playerX) < 1.4) {
            onCrash()
            return false
          }
          return t.z < 20
        })
    )

    // Move coins
    setCoins(prev =>
      prev
        .map(c => ({ ...c, z: c.z + speed * delta * 1.5 }))
        .filter(c => {
          if (!c.collected && Math.abs(c.z) < 2.0 && Math.abs(c.x - playerX) < 1.3) {
            onCollectCoin()
            return false
          }
          return c.z < 20
        })
    )
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3.8, 7]} fov={isNitro ? 85 : 70} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 15]} intensity={1.2} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={2} />

      <Highway speed={speed} isNitro={isNitro} />
      <PlayerCar position={[playerX, 0, 0]} steering={steering} isNitro={isNitro} />

      {/* Traffic Vehicles */}
      {traffic.map(t => (
        <group key={t.id} position={[t.x, 0.4, t.z]}>
          <mesh>
            <boxGeometry args={[1.4, 0.5, 3.0]} />
            <meshStandardMaterial color={t.color} roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.0, 0.4, 1.4]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      {/* Collectible Coins */}
      {coins.map(c => (
        <mesh key={c.id} position={[c.x, 0.6, c.z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.15, 16]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
        </mesh>
      ))}
    </>
  )
}

export default function TurboRacing({ isPaused, onScoreChange, onGameOver, onVictory, settings }) {
  const [speed, setSpeed] = useState(65)
  const [playerX, setPlayerX] = useState(0)
  const [steering, setSteering] = useState(0)
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)
  const [nitroFuel, setNitroFuel] = useState(100)
  const [isNitro, setIsNitro] = useState(false)

  // Keyboard controls
  useEffect(() => {
    let animId
    const keys = {}

    const handleKeyDown = (e) => {
      keys[e.key] = true
      if (e.key === 'Shift' || e.key === ' ' || e.code === 'Space') {
        setIsNitro(true)
      }
    }
    const handleKeyUp = (e) => {
      keys[e.key] = false
      if (e.key === 'Shift' || e.key === ' ' || e.code === 'Space') {
        setIsNitro(false)
      }
    }

    const updateControls = () => {
      if (!isPaused) {
        let steer = 0
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) steer -= 1
        if (keys['ArrowRight'] || keys['d'] || keys['D']) steer += 1
        setSteering(steer)

        setPlayerX(x => {
          const next = x + steer * 0.18
          return Math.max(-5.2, Math.min(5.2, next))
        })

        // Speed ramp & distance
        const currentSpeed = isNitro ? 130 : 65
        setSpeed(currentSpeed)
        setDistance(d => {
          const newD = d + Math.round(currentSpeed * 0.05)
          onScoreChange(newD + coins * 25)
          return newD
        })

        // Nitro fuel drain / recharge
        if (isNitro) {
          setNitroFuel(f => {
            if (f <= 1) {
              setIsNitro(false)
              return 0
            }
            return f - 0.4
          })
        } else {
          setNitroFuel(f => Math.min(100, f + 0.15))
        }
      }
      animId = requestAnimationFrame(updateControls)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    animId = requestAnimationFrame(updateControls)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPaused, isNitro, coins, onScoreChange])

  const handleCrash = () => {
    onGameOver(distance + coins * 25)
  }

  const handleCollectCoin = () => {
    setCoins(c => c + 1)
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-5xl mx-auto select-none">
      {/* Speedometer & Nitro HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-b-0 border-slate-800 rounded-t-2xl text-xs font-black">
        {/* Speed */}
        <div className="flex items-center gap-2">
          <Gauge className="text-cyan-400" size={16} />
          <span className="text-white font-mono text-base">{Math.round(speed * 1.8)} KM/H</span>
        </div>

        {/* Nitro Meter */}
        <div className="flex items-center gap-2">
          <Flame className={isNitro ? 'text-cyan-400 animate-pulse' : 'text-orange-400'} size={16} />
          <div className="w-32 h-3 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/40 p-0.5">
            <div
              className={`h-full rounded-full transition-all ${
                isNitro ? 'bg-cyan-400 shadow-md shadow-cyan-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'
              }`}
              style={{ width: `${nitroFuel}%` }}
            />
          </div>
        </div>

        {/* Distance & Coins */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-yellow-400 font-bold">🪙 {coins} Coins</span>
          <span className="text-cyan-400 font-bold">🛣️ {distance}m</span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="w-full h-[520px] bg-slate-950 border border-slate-800 rounded-b-2xl overflow-hidden relative shadow-2xl">
        <Canvas>
          <GameScene
            isPaused={isPaused}
            speed={speed}
            setSpeed={setSpeed}
            playerX={playerX}
            setPlayerX={setPlayerX}
            steering={steering}
            isNitro={isNitro}
            setNitro={setIsNitro}
            onCrash={handleCrash}
            onCollectCoin={handleCollectCoin}
          />
        </Canvas>

        {/* Touch Controls (Mobile) */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto sm:hidden">
          <div className="flex gap-2">
            <button
              onTouchStart={() => setPlayerX(x => Math.max(-5.2, x - 1.5))}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-cyan-500/40 text-cyan-400 font-black text-xl flex items-center justify-center backdrop-blur-md active:bg-cyan-500 active:text-slate-950"
            >
              ◀
            </button>
            <button
              onTouchStart={() => setPlayerX(x => Math.min(5.2, x + 1.5))}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-cyan-500/40 text-cyan-400 font-black text-xl flex items-center justify-center backdrop-blur-md active:bg-cyan-500 active:text-slate-950"
            >
              ▶
            </button>
          </div>

          <button
            onTouchStart={() => setIsNitro(true)}
            onTouchEnd={() => setIsNitro(false)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-cyan-500/30 active:scale-95"
          >
            NITRO
          </button>
        </div>
      </div>

      <div className="mt-2 text-center text-slate-400 text-xs flex items-center gap-4">
        <span>🎮 <b>A / D</b> or <b>Arrow Keys</b> to Steer</span>
        <span>•</span>
        <span>⚡ <b>Space / Shift</b> for Nitro Boost</span>
      </div>
    </div>
  )
}
