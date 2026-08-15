import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Pause, Play, RotateCcw, Volume2, VolumeX,
  Maximize, Minimize, HelpCircle, Share2, Trophy,
  Settings, Home, Sparkles, Check
} from 'lucide-react'
import { useGameStore } from '../../store/gameStore.js'
import { getGameById, getTrendingGames } from '../../data/gamesRegistry.js'
import Confetti from '../Confetti.jsx'

// Context for games that prefer to consume props via hook
export const GameContext = createContext({})
export const useGameContext = () => useContext(GameContext)

export default function GameShell({ gameId, render, children }) {
  const navigate = useNavigate()
  const game = getGameById(gameId)
  const {
    gameStats, recordPlay, updateHighScore, addXP, addCoins,
    settings, updateSettings
  } = useGameStore()

  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [gameState, setGameState] = useState('playing') // 'playing', 'victory', 'gameover'
  const [finalScore, setFinalScore] = useState(0)
  const [isNewHigh, setIsNewHigh] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [restartTrigger, setRestartTrigger] = useState(0)

  const shellRef = useRef(null)
  const currentHighScore = gameStats[gameId]?.highScore || 0

  useEffect(() => {
    if (gameId) {
      recordPlay(gameId)
      addXP(15)
      setScore(0)
      setGameState('playing')
      setIsPaused(false)
    }
  }, [gameId, restartTrigger])

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Keyboard shortcut listener (ESC or P for pause)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          setIsPaused(prev => !prev)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState])

  const toggleFullscreen = () => {
    if (!shellRef.current) return
    if (!document.fullscreenElement) {
      shellRef.current.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  const handleRestart = () => {
    setScore(0)
    setGameState('playing')
    setIsPaused(false)
    setRestartTrigger(prev => prev + 1)
  }

  const handleScoreUpdate = (newScore) => {
    setScore(newScore)
    if (newScore > currentHighScore) {
      updateHighScore(gameId, newScore)
    }
  }

  const handleGameOver = (finalGameScore = score) => {
    const isHigh = updateHighScore(gameId, finalGameScore)
    setFinalScore(finalGameScore)
    setIsNewHigh(isHigh)
    setGameState('gameover')
    addXP(20)
    addCoins(5)
  }

  const handleVictory = (finalGameScore = score) => {
    const isHigh = updateHighScore(gameId, finalGameScore)
    setFinalScore(finalGameScore)
    setIsNewHigh(isHigh)
    setGameState('victory')
    addXP(50)
    addCoins(15)
  }

  const handleShare = async () => {
    const shareData = {
      title: `${game?.name || 'PlayZone Game'}`,
      text: `I just scored ${score > 0 ? score : finalScore} in ${game?.name} on GameZoneKids! Can you beat my score?`,
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // Fallback to clipboard
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text} 👉 ${shareData.url}`)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 3000)
    }
  }

  const recommendedGames = getTrendingGames()
    .filter(g => g.id !== gameId)
    .slice(0, 3)

  if (!game) return null

  return (
    <div
      ref={shellRef}
      className={`game-shell-container relative w-full max-w-6xl mx-auto flex flex-col bg-slate-950 text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : 'min-h-[85vh] rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl my-auto'
      }`}
    >
      {/* Top HUD / Control Bar */}
      <header className="game-shell-header flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-30">
        {/* Left: Back & Game Info */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/50 transition-all"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{game.icon}</span>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight flex items-center gap-2">
                {game.name}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {game.category}
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Plays: {gameStats[gameId]?.plays || 1}</span>
                <span>•</span>
                <span className="text-yellow-400 font-semibold flex items-center gap-1">
                  <Trophy size={11} /> Best: {currentHighScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Score Display */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-2xl">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Score</div>
            <div className="text-xl font-black text-cyan-400 font-mono leading-none">{score}</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">High Score</div>
            <div className="text-xl font-black text-yellow-400 font-mono leading-none">
              {Math.max(score, currentHighScore)}
            </div>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border transition-all ${
              isPaused
                ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-bold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50'
            }`}
            title="Pause Game (Esc)"
          >
            {isPaused ? <Play size={17} /> : <Pause size={17} />}
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all"
            title="Restart Game"
          >
            <RotateCcw size={17} />
          </button>

          {/* Sound Mute */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-xl border transition-all ${
              settings.soundEnabled
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {/* Tutorial / Help */}
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/50 transition-all"
            title="How to Play"
          >
            <HelpCircle size={17} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all"
            title="Game Settings"
          >
            <Settings size={17} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-pink-400 border border-slate-700/50 transition-all"
            title="Share Game"
          >
            {copiedShare ? <Check size={17} className="text-emerald-400" /> : <Share2 size={17} />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
        </div>
      </header>

      {/* Main Game Screen Canvas / Area */}
      <main className="game-shell-viewport flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 bg-radial from-slate-900 to-slate-950 overflow-y-auto overflow-x-hidden w-full">
        <GameContext.Provider
          value={{
            score,
            highScore: currentHighScore,
            isPaused,
            setScore: handleScoreUpdate,
            triggerGameOver: handleGameOver,
            triggerVictory: handleVictory,
            settings,
          }}
        >
          <div key={restartTrigger} className="w-full flex-1 flex flex-col items-center justify-center my-auto">
            {render
              ? render({
                  isPaused,
                  onScoreChange: handleScoreUpdate,
                  onGameOver: handleGameOver,
                  onVictory: handleVictory,
                  settings,
                })
              : children}
          </div>
        </GameContext.Provider>

        {/* ── PAUSE MODAL ───────────────────────── */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-sm w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl mx-auto mb-3">
                  ⏸️
                </div>
                <h3 className="text-2xl font-black text-white">Game Paused</h3>
                <p className="text-xs text-slate-400 mt-1">Take a breath, champion!</p>

                <div className="flex flex-col gap-2.5 mt-6">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    <Play size={18} /> Resume Game
                  </button>

                  <button
                    onClick={handleRestart}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <RotateCcw size={16} /> Restart
                  </button>

                  <button
                    onClick={() => { setIsPaused(false); setShowTutorial(true) }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <HelpCircle size={16} /> How to Play
                  </button>

                  <Link
                    to="/"
                    className="w-full py-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-all mt-2"
                  >
                    <Home size={15} /> Quit to Dashboard
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VICTORY SCREEN ──────────────────────── */}
        <AnimatePresence>
          {gameState === 'victory' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <Confetti />
              <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full bg-slate-900/95 border border-yellow-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
              >
                {/* Glow Banner */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 animate-pulse" />

                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">
                  VICTORY!
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1">Magnificent performance!</p>

                {/* Score Cards */}
                <div className="grid grid-cols-2 gap-3 my-5">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{finalScore}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Rewards</div>
                    <div className="text-sm font-bold text-yellow-400 flex items-center justify-center gap-2 mt-1">
                      <span>+50 XP</span>
                      <span>•</span>
                      <span>+15 🪙</span>
                    </div>
                  </div>
                </div>

                {isNewHigh && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
                    <Sparkles size={14} /> New Personal Best!
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleRestart}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 transition-all"
                  >
                    <RotateCcw size={18} /> Play Again
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                    >
                      <Share2 size={15} /> Share Score
                    </button>
                    <Link
                      to="/"
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                    >
                      <Home size={15} /> Dashboard
                    </Link>
                  </div>
                </div>

                {/* Next Game Recommendations */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Try Next
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {recommendedGames.map(rec => (
                      <button
                        key={rec.id}
                        onClick={() => navigate(`/app/${rec.id}`)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-center transition-all group"
                      >
                        <div className="text-xl group-hover:scale-110 transition-transform">{rec.icon}</div>
                        <div className="text-[10px] font-bold text-slate-300 truncate mt-1">{rec.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GAME OVER SCREEN ────────────────────── */}
        <AnimatePresence>
          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full bg-slate-900/95 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
              >
                <div className="text-5xl mb-2">💥</div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">
                  Game Over
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1">Great effort! Practice makes legend.</p>

                <div className="grid grid-cols-2 gap-3 my-5">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Final Score</div>
                    <div className="text-2xl font-black text-rose-400 font-mono">{finalScore}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400">High Score</div>
                    <div className="text-2xl font-black text-yellow-400 font-mono">
                      {Math.max(finalScore, currentHighScore)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleRestart}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all"
                  >
                    <RotateCcw size={18} /> Retry Now
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                    >
                      <Share2 size={15} /> Share
                    </button>
                    <Link
                      to="/"
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                    >
                      <Home size={15} /> Dashboard
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HOW TO PLAY MODAL ───────────────────── */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{game.icon}</span>
                    <h3 className="text-xl font-black text-white">{game.name} Guide</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {game.difficulty}
                  </span>
                </div>

                <div className="my-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                      Objective
                    </h4>
                    <p>{game.description}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                      Controls
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-bold text-white block">⌨️ Keyboard</span>
                        <span className="text-slate-400">Arrow keys / WASD / Spacebar</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="font-bold text-white block">🖱️ Mouse & Touch</span>
                        <span className="text-slate-400">Tap, click & drag to interact</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowTutorial(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg"
                >
                  Got It, Let's Play!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SETTINGS MODAL ──────────────────────── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-left"
              >
                <h3 className="text-xl font-black text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-cyan-400" /> Platform Settings
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Sound FX Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Sound Effects</div>
                      <div className="text-slate-400">Game audio and clicks</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Music Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Background Music</div>
                      <div className="text-slate-400">Atmospheric game music</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.musicEnabled ? 'bg-purple-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span>Master Volume</span>
                      <span>{Math.round((settings.volume || 0.7) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.volume || 0.7}
                      onChange={e => updateSettings({ volume: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Close Settings
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
