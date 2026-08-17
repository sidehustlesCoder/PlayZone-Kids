import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Gamepad2, Medal, Flame, Star, Sparkles } from 'lucide-react'
import { useGameStore } from '../../store/gameStore.js'
import { GAMES, getLiveGames } from '../../data/gamesRegistry.js'
import { getLeaderboardForGame, getGlobalTopPlayers } from '../../data/leaderboardsData.js'

export default function LeaderboardView() {
  const { profile, gameStats } = useGameStore()
  const liveGames = getLiveGames()

  const [activeTab, setActiveTab] = useState('global') // 'global' | 'game'
  const [selectedGameId, setSelectedGameId] = useState(liveGames[0]?.id || 'memory-match')

  const globalPlayers = getGlobalTopPlayers(profile, gameStats)
  const selectedGame = GAMES.find(g => g.id === selectedGameId) || liveGames[0]
  const gameHighScore = gameStats[selectedGameId]?.highScore || 0
  const gameLeaderboard = getLeaderboardForGame(selectedGameId, gameHighScore, profile.name, profile.avatar)

  const topThree = activeTab === 'global' ? globalPlayers.slice(0, 3) : gameLeaderboard.slice(0, 3)
  const remainingPlayers = activeTab === 'global' ? globalPlayers.slice(3) : gameLeaderboard.slice(3)

  return (
    <div className="leaderboards-container max-w-5xl mx-auto px-4 py-8">
      {/* ── HEADER BANNER ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-cyan-500/15 border border-yellow-500/30 p-6 sm:p-8 backdrop-blur-2xl mb-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-xs uppercase tracking-widest">
              <Trophy size={16} /> Hall of Champions
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
              Platform Leaderboards 🏆
            </h1>
            <p className="text-sm text-slate-300 max-w-lg mt-1 font-medium">
              Compete with players worldwide, break records, and climb the ranks to become the ultimate legend!
            </p>
          </div>

          {/* Player Quick Rank Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 flex-shrink-0 shadow-lg shadow-cyan-500/10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center text-3xl">
              {profile.avatar}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold">{profile.name}</div>
              <div className="text-sm font-black text-yellow-400 flex items-center gap-1.5">
                <Crown size={14} /> Level {profile.level}
              </div>
              <div className="text-xs text-cyan-400 font-mono font-bold mt-0.5">{profile.xp} Total XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ────────────────────────────────── */}
      <div className="flex items-center justify-center sm:justify-start gap-3 mb-8 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'global'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/25 scale-105'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crown size={16} /> Global Champions
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'game'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-105'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gamepad2 size={16} /> Game Records
        </button>
      </div>

      {/* ── TOP 3 PODIUM DISPLAY ───────────────── */}
      {topThree.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-10 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="text-center mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Sparkles size={13} /> Podium Winners
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto pt-4">
            {/* 2nd Place (Silver) */}
            <div className="flex flex-col items-center text-center order-1">
              <div className="text-3xl sm:text-4xl mb-1">🥈</div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-2xl sm:text-3xl shadow-lg relative mb-2">
                {topThree[1]?.avatar}
              </div>
              <div className="font-black text-xs sm:text-sm text-white truncate max-w-[100px] sm:max-w-[140px]">
                {topThree[1]?.name}
              </div>
              <div className="text-[11px] font-mono text-cyan-300 font-bold">
                {topThree[1]?.score?.toLocaleString()} pts
              </div>
              {/* Podium Column */}
              <div className="w-full h-24 sm:h-28 mt-3 rounded-t-2xl bg-gradient-to-b from-slate-700/60 to-slate-900 border-t-2 border-slate-400 flex items-center justify-center font-black text-slate-300 text-lg">
                2
              </div>
            </div>

            {/* 1st Place (Gold) */}
            <div className="flex flex-col items-center text-center order-2 -mt-6">
              <div className="text-4xl sm:text-5xl mb-1 animate-bounce">👑</div>
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-2 border-yellow-400 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-yellow-500/25 relative mb-2">
                {topThree[0]?.avatar}
              </div>
              <div className="font-black text-sm sm:text-base text-yellow-300 truncate max-w-[110px] sm:max-w-[160px]">
                {topThree[0]?.name}
              </div>
              <div className="text-xs sm:text-sm font-mono text-yellow-400 font-extrabold">
                {topThree[0]?.score?.toLocaleString()} pts
              </div>
              {/* Podium Column */}
              <div className="w-full h-32 sm:h-36 mt-3 rounded-t-2xl bg-gradient-to-b from-yellow-500/40 via-amber-600/30 to-slate-900 border-t-2 border-yellow-400 flex items-center justify-center font-black text-yellow-300 text-2xl shadow-lg shadow-yellow-500/10">
                1
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex flex-col items-center text-center order-3">
              <div className="text-3xl sm:text-4xl mb-1">🥉</div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-amber-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg relative mb-2">
                {topThree[2]?.avatar}
              </div>
              <div className="font-black text-xs sm:text-sm text-white truncate max-w-[100px] sm:max-w-[140px]">
                {topThree[2]?.name}
              </div>
              <div className="text-[11px] font-mono text-amber-400 font-bold">
                {topThree[2]?.score?.toLocaleString()} pts
              </div>
              {/* Podium Column */}
              <div className="w-full h-18 sm:h-20 mt-3 rounded-t-2xl bg-gradient-to-b from-amber-800/40 to-slate-900 border-t-2 border-amber-600 flex items-center justify-center font-black text-amber-400 text-lg">
                3
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── GLOBAL RANKINGS LIST ───────────────── */}
      {activeTab === 'global' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 px-5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <span className="col-span-2 sm:col-span-1">Rank</span>
            <span className="col-span-6 sm:col-span-5">Player</span>
            <span className="col-span-2 text-center hidden sm:block">Level</span>
            <span className="col-span-2 text-center hidden sm:block">Total XP</span>
            <span className="col-span-4 sm:col-span-2 text-right">Power Score</span>
          </div>

          {/* Entries */}
          {globalPlayers.map((player) => {
            const isTop3 = player.rank <= 3
            const rankColors = {
              1: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300',
              2: 'bg-slate-300/20 border-slate-300/50 text-slate-200',
              3: 'bg-amber-600/20 border-amber-600/50 text-amber-300',
            }

            return (
              <div
                key={player.rank}
                className={`grid grid-cols-12 items-center px-5 py-3.5 rounded-2xl border transition-all ${
                  player.isPlayer
                    ? 'bg-cyan-950/40 border-cyan-400/70 shadow-lg shadow-cyan-500/15 scale-[1.01]'
                    : isTop3
                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-900/70'
                }`}
              >
                {/* Rank Badge */}
                <div className="col-span-2 sm:col-span-1 flex items-center">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${
                      rankColors[player.rank] || 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                  </span>
                </div>

                {/* Player Info */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{player.avatar}</span>
                  <div className="min-w-0">
                    <div className="font-black text-sm text-white truncate flex items-center gap-1.5">
                      {player.name}
                      {player.isPlayer && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.2 rounded font-black tracking-wider">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{player.badge}</span>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-2 text-center hidden sm:block">
                  <span className="text-xs font-bold text-slate-300">Lv. {player.level}</span>
                </div>

                {/* XP */}
                <div className="col-span-2 text-center hidden sm:block font-mono text-xs text-cyan-400 font-bold">
                  {player.xp.toLocaleString()} XP
                </div>

                {/* Power Score */}
                <div className="col-span-4 sm:col-span-2 text-right font-black font-mono text-base text-yellow-400">
                  {player.score.toLocaleString()}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* ── PER-GAME RANKINGS VIEW ─────────────── */}
      {activeTab === 'game' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Game Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            {liveGames.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGameId(g.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap flex items-center gap-2 border transition-all ${
                  selectedGameId === g.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/70 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{g.icon}</span> {g.name}
              </button>
            ))}
          </div>

          {/* Selected Game Banner */}
          <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3.5">
              <span className="text-4xl">{selectedGame.icon}</span>
              <div>
                <h3 className="font-black text-white text-lg">{selectedGame.name} Records</h3>
                <span className="text-xs text-slate-400 font-medium">{selectedGame.description}</span>
              </div>
            </div>
            <div className="text-right bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
              <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Your Record</div>
              <div className="text-2xl font-black text-yellow-400 font-mono">{gameHighScore}</div>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-3">
            {gameLeaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all ${
                  entry.isPlayer
                    ? 'bg-cyan-950/40 border-cyan-400/70 shadow-lg shadow-cyan-500/15'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${
                      entry.rank === 1
                        ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
                        : entry.rank === 2
                        ? 'bg-slate-300/20 border-slate-300/50 text-slate-200'
                        : entry.rank === 3
                        ? 'bg-amber-600/20 border-amber-600/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="text-2xl">{entry.avatar}</span>
                  <div>
                    <div className="font-black text-sm text-white flex items-center gap-1.5">
                      {entry.name}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{entry.badge}</span>
                  </div>
                </div>

                <div className="text-right font-black font-mono text-lg text-cyan-400">
                  {entry.score.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
