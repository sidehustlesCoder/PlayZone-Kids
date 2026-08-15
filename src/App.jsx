import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Link, useParams } from 'react-router-dom'
import Navbar from './components/layout/Navbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Footer from './components/layout/Footer.jsx'
import ParticleBackground from './components/ui/ParticleBackground.jsx'
import AchievementToast from './components/ui/AchievementToast.jsx'
import PWAInstallPrompt from './components/ui/PWAInstallPrompt.jsx'
import Homepage from './components/pages/Homepage.jsx'
import PlayerProfile from './components/profile/PlayerProfile.jsx'
import LeaderboardView from './components/leaderboards/LeaderboardView.jsx'
import GameShell from './components/game-shell/GameShell.jsx'
import NotFound from './components/NotFound.jsx'
import { useGameStore } from './store/gameStore.js'
import { getGameById } from './data/gamesRegistry.js'

// Lazy-load existing game components for high performance code splitting
const ShapeSorter = lazy(() => import('./apps/shape-sorter/ShapeSorter.jsx'))
const ColorSplash = lazy(() => import('./apps/color-splash/ColorSplash.jsx'))
const AnimalSoundMatch = lazy(() => import('./apps/animal-sound-match/AnimalSoundMatch.jsx'))
const MemoryMatch = lazy(() => import('./apps/memory-match/MemoryMatch.jsx'))
const SimonSays = lazy(() => import('./apps/simon-says/SimonSays.jsx'))
const WordSearch = lazy(() => import('./apps/word-search/WordSearch.jsx'))
const WhackAMole = lazy(() => import('./apps/whack-a-mole/WhackAMole.jsx'))
const MazeRunner = lazy(() => import('./apps/maze-runner/MazeRunner.jsx'))
const ConnectFour = lazy(() => import('./apps/connect-four/ConnectFour.jsx'))
const SlidingPuzzle = lazy(() => import('./apps/sliding-puzzle/SlidingPuzzle.jsx'))
const TicTacToe = lazy(() => import('./apps/tic-tac-toe/TicTacToe.jsx'))
const Hangman = lazy(() => import('./apps/hangman/Hangman.jsx'))
const NumberGuesser = lazy(() => import('./apps/number-guesser/NumberGuesser.jsx'))
const Quiz = lazy(() => import('./apps/quiz/Quiz.jsx'))
const TextAdventure = lazy(() => import('./apps/text-adventure/TextAdventure.jsx'))

// Lazy-load new Phase 3 & Phase 4 Games
const GalaxyDefender = lazy(() => import('./apps/galaxy-defender/GalaxyDefender.jsx'))
const BubbleShooter = lazy(() => import('./apps/bubble-shooter/BubbleShooter.jsx'))
const TempleEscape = lazy(() => import('./apps/temple-escape/TempleEscape.jsx'))
const TurboRacing = lazy(() => import('./apps/turbo-racing/TurboRacing.jsx'))
const ShadowNinja = lazy(() => import('./apps/shadow-ninja/ShadowNinja.jsx'))
const ZombieSurvival = lazy(() => import('./apps/zombie-survival/ZombieSurvival.jsx'))
const RobotBattle = lazy(() => import('./apps/robot-battle/RobotBattle.jsx'))
const FruitSlice = lazy(() => import('./apps/fruit-slice/FruitSlice.jsx'))
const ChessAI = lazy(() => import('./apps/chess-ai/ChessAI.jsx'))
const SudokuGame = lazy(() => import('./apps/sudoku/Sudoku.jsx'))
const CricketChampionship = lazy(() => import('./apps/cricket-championship/CricketChampionship.jsx'))
const FootballPenalty = lazy(() => import('./apps/football-penalty/FootballPenalty.jsx'))
const BasketballStars = lazy(() => import('./apps/basketball-stars/BasketballStars.jsx'))
const MotoX = lazy(() => import('./apps/moto-x/MotoX.jsx'))
const BlockPuzzle = lazy(() => import('./apps/block-puzzle/BlockPuzzle.jsx'))
const MonsterTruck = lazy(() => import('./apps/monster-truck/MonsterTruck.jsx'))
const PoliceChase = lazy(() => import('./apps/police-chase/PoliceChase.jsx'))
const AlienAttack = lazy(() => import('./apps/alien-attack/AlienAttack.jsx'))
const SamuraiLegends = lazy(() => import('./apps/samurai-legends/SamuraiLegends.jsx'))
const DinoHunter = lazy(() => import('./apps/dino-hunter/DinoHunter.jsx'))

const GAME_COMPONENTS = {
  // Phase 1 existing games
  'shape-sorter': ShapeSorter,
  'color-splash': ColorSplash,
  'animal-sound-match': AnimalSoundMatch,
  'memory-match': MemoryMatch,
  'simon-says': SimonSays,
  'word-search': WordSearch,
  'whack-a-mole': WhackAMole,
  'maze-runner': MazeRunner,
  'connect-four': ConnectFour,
  'sliding-puzzle': SlidingPuzzle,
  'tic-tac-toe': TicTacToe,
  'hangman': Hangman,
  'number-guesser': NumberGuesser,
  'quiz': Quiz,
  'text-adventure': TextAdventure,

  // Phase 3 & 4 newly built games
  'galaxy-defender': GalaxyDefender,
  'bubble-shooter': BubbleShooter,
  'temple-escape': TempleEscape,
  'turbo-racing': TurboRacing,

  // Batch 1 — Featured Action
  'shadow-ninja': ShadowNinja,
  'zombie-survival': ZombieSurvival,
  'robot-battle': RobotBattle,

  // Batch 2 — Arcade & Brain
  'fruit-slice': FruitSlice,
  'chess-ai': ChessAI,
  'sudoku': SudokuGame,

  // Batch 3 — Sports & Racing
  'cricket-championship': CricketChampionship,
  'football-penalty': FootballPenalty,
  'basketball-stars': BasketballStars,
  'moto-x': MotoX,

  // Batch 4 — Final Arcades, Shooters & Quests
  'block-puzzle': BlockPuzzle,
  'monster-truck': MonsterTruck,
  'police-chase': PoliceChase,
  'alien-attack': AlienAttack,
  'samurai-legends': SamuraiLegends,
  'dino-hunter': DinoHunter,
}

function GameLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-300">
      <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
      <p className="text-sm font-bold tracking-wider uppercase text-cyan-300">Loading Game Engine...</p>
    </div>
  )
}

function GamePage() {
  const { appId } = useParams()
  const game = getGameById(appId)

  if (!game) return <NotFound />

  const GameComponent = GAME_COMPONENTS[appId]

  if (!GameComponent) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center shadow-2xl backdrop-blur-xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 mb-6">
          ← Back to Games Dashboard
        </Link>
        <div className="text-6xl mb-4">{game.icon}</div>
        <h1 className="text-3xl font-black text-white">{game.name}</h1>
        <p className="text-sm text-yellow-400 font-bold uppercase tracking-wider my-2">🚀 Launching Soon</p>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{game.description}</p>
      </div>
    )
  }

  return (
    <GameShell
      gameId={appId}
      render={(gameProps) => (
        <Suspense fallback={<GameLoader />}>
          <GameComponent {...gameProps} />
        </Suspense>
      )}
    />
  )
}


function App() {
  const { checkDailyReset, checkAllAchievements } = useGameStore()

  useEffect(() => {
    checkDailyReset()
    checkAllAchievements()
    document.body.classList.add('dark-theme')
  }, [])

  return (
    <div className="platform min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <ParticleBackground />
      <AchievementToast />
      <PWAInstallPrompt />

      <Navbar />
      <Sidebar />

      <main className="platform__main flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col justify-center">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/profile" element={<PlayerProfile />} />
          <Route path="/leaderboard" element={<LeaderboardView />} />
          <Route path="/app/:appId" element={<GamePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
