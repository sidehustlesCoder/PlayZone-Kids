import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Gamepad2 } from 'lucide-react'
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

  return (
    <div className="leaderboards-container max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-yellow-500/30 p-6 sm:p-8 backdrop-blur-xl mb-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-widest">
              <Trophy size={16} /> Hall of Champions
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
              Platform Leaderboards
            </h1>
            <p className="text-sm text-slate-300 max-w-lg mt-1">
              Climb the ranks, shatter high scores, and claim your place among the greatest players!
            </p>
          </div>

          {/* Player Quick Rank Card */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl">
              {profile.avatar}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">{profile.name}</div>
              <div className="text-sm font-black text-yellow-400 flex items-center gap-1.5">
                <Crown size={14} /> Level {profile.level}
              </div>
              <div className="text-[11px] text-cyan-400 font-mono">{profile.xp} Total XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center sm:justify-start gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'global'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crown size={15} /> Global Champions
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'game'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gamepad2 size={15} /> Game Rankings
        </button>
      </div>

      {/* ── GLOBAL RANKINGS VIEW ───────────────── */}
      {activeTab === 'global' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                className={`grid grid-cols-12 items-center px-4 py-3 rounded-2xl border transition-all ${
                  player.isPlayer
                    ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                    : isTop3
                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-900/50 border-slate-800/60'
                }`}
              >
                {/* Rank Badge */}
                <div className="col-span-2 sm:col-span-1 flex items-center">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${
                      rankColors[player.rank] || 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                  </span>
                </div>

                {/* Player Info */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{player.avatar}</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                      {player.name}
                      {player.isPlayer && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold">
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
                <div className="col-span-2 text-center hidden sm:block font-mono text-xs text-cyan-400">
                  {player.xp.toLocaleString()} XP
                </div>

                {/* Power Score */}
                <div className="col-span-4 sm:col-span-2 text-right font-black font-mono text-sm sm:text-base text-yellow-400">
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {liveGames.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGameId(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                  selectedGameId === g.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{g.icon}</span> {g.name}
              </button>
            ))}
          </div>

          {/* Selected Game Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedGame.icon}</span>
              <div>
                <h3 className="font-extrabold text-white text-base">{selectedGame.name} High Scores</h3>
                <span className="text-xs text-slate-400">{selectedGame.description}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Your Record</div>
              <div className="text-xl font-black text-yellow-400 font-mono">{gameHighScore}</div>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-2.5">
            {gameLeaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                  entry.isPlayer
                    ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${
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
                  <span className="text-xl">{entry.avatar}</span>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      {entry.name}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{entry.badge}</span>
                  </div>
                </div>

                <div className="text-right font-black font-mono text-base text-cyan-400">
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
