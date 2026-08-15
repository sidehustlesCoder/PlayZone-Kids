import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Coins, Gamepad2, Flame, Target, Gift, Crown, CheckCircle2, Lock, Sparkles, User } from 'lucide-react'
import { useGameStore, AVATARS, calcLevelProgress, XP_PER_LEVEL } from '../../store/gameStore.js'
import { getGameById } from '../../data/gamesRegistry.js'
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS, ACHIEVEMENT_CATEGORIES, getAchievementsByCategory } from '../../data/achievementsData.js'
import LeaderboardView from '../leaderboards/LeaderboardView.jsx'

const DAILY_REWARDS = [10, 15, 20, 25, 30, 40, 75]
const SPIN_PRIZES = [5, 10, 15, 20, 25, 50, 100, 10]

export default function PlayerProfile() {
  const {
    profile, gameStats, recentlyPlayed, favorites, achievements,
    setAvatar, updateProfile, claimDailyReward, dailyRewardClaimed, dailyRewardDay,
    spinAvailable, claimSpin, checkDailyReset, checkAllAchievements
  } = useGameStore()

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'achievements' | 'leaderboard'
  const [achievementCat, setAchievementCat] = useState('all')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile.name || 'Player')
  const [spinAngle, setSpinAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState(null)

  const levelProgress = calcLevelProgress(profile.xp)
  const totalPlays = Object.values(gameStats).reduce((s, g) => s + g.plays, 0)
  const topGameEntry = Object.entries(gameStats).sort((a, b) => b[1].plays - a[1].plays)[0]
  const topGame = topGameEntry ? getGameById(topGameEntry[0]) : null

  // Ensure daily reset and achievement criteria on mount
  useEffect(() => {
    checkDailyReset()
    checkAllAchievements()
  }, [])

  const handleSaveName = (e) => {
    e.preventDefault()
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() })
    }
    setIsEditingName(false)
  }

  const handleSpin = () => {
    if (!spinAvailable || spinning) return
    setSpinning(true)
    setSpinResult(null)
    const prizeIndex = Math.floor(Math.random() * SPIN_PRIZES.length)
    const newAngle = spinAngle + 1440 + (prizeIndex * 45) + Math.random() * 30
    setSpinAngle(newAngle)
    setTimeout(() => {
      const coins = SPIN_PRIZES[prizeIndex]
      claimSpin(coins)
      setSpinResult(coins)
      setSpinning(false)
    }, 3500)
  }

  const filteredAchievements = getAchievementsByCategory(achievementCat)
  const unlockedCount = achievements.length

  return (
    <div className="profile-page max-w-6xl mx-auto px-4 py-8">
      {/* ── PROFILE HERO CARD ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl mb-8"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border-2 border-cyan-400/60 hover:border-cyan-300 flex items-center justify-center text-5xl sm:text-6xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 group relative overflow-hidden"
                title="Click to change avatar"
              >
                <span>{profile.avatar}</span>
                <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-cyan-300">
                  Change
                </div>
              </button>

              {/* Avatar Selector Dropdown Modal */}
              <AnimatePresence>
                {showAvatarPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-full left-0 mt-3 z-50 p-3 bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl grid grid-cols-4 gap-2 w-64"
                  >
                    {AVATARS.map(a => (
                      <button
                        key={a}
                        onClick={() => { setAvatar(a); setShowAvatarPicker(false) }}
                        className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                          profile.avatar === a
                            ? 'bg-cyan-500/30 border border-cyan-400'
                            : 'bg-slate-800/80 hover:bg-slate-700'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Name & Level details */}
            <div>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-400 text-white font-black text-xl"
                    maxLength={16}
                    autoFocus
                  />
                  <button type="submit" className="px-3 py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs">
                    Save
                  </button>
                </form>
              ) : (
                <h1
                  onClick={() => setIsEditingName(true)}
                  className="text-2xl sm:text-3xl font-black text-white cursor-pointer hover:text-cyan-400 transition-colors flex items-center justify-center sm:justify-start gap-2"
                  title="Click to edit name"
                >
                  {profile.name}
                  <span className="text-xs text-slate-500 font-normal">✏️</span>
                </h1>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-xs font-extrabold flex items-center gap-1">
                  <Crown size={13} /> Level {profile.level}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {profile.xp} / {profile.level * XP_PER_LEVEL} XP
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="w-56 sm:w-72 h-3 bg-slate-950 rounded-full mt-3 overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.max(8, levelProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center min-w-[90px]">
              <div className="text-yellow-400 font-black text-lg sm:text-xl flex items-center justify-center gap-1 font-mono">
                <Coins size={16} /> {profile.coins}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Coins</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center min-w-[90px]">
              <div className="text-orange-400 font-black text-lg sm:text-xl flex items-center justify-center gap-1 font-mono">
                <Flame size={16} /> {profile.streak}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Streak</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 text-center min-w-[90px]">
              <div className="text-cyan-400 font-black text-lg sm:text-xl flex items-center justify-center gap-1 font-mono">
                <Trophy size={16} /> {unlockedCount}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Badges</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── NAVIGATION TABS ───────────────────────── */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <User size={15} /> Dashboard & Rewards
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-slate-950 shadow-lg shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Trophy size={15} /> Achievements ({unlockedCount}/{ACHIEVEMENTS.length})
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crown size={15} /> Leaderboards
        </button>
      </div>

      {/* ── OVERVIEW / DAILY REWARDS TAB ──────────── */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* 7-Day Login Streak Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Flame className="text-orange-400" size={18} /> 7-Day Daily Streak
              </h3>
              <span className="text-xs text-orange-400 font-bold font-mono">
                {profile.streak} Days Active
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 my-4">
              {DAILY_REWARDS.map((reward, i) => {
                const isClaimed = i < dailyRewardDay || (i === dailyRewardDay && dailyRewardClaimed)
                const isCurrent = i === dailyRewardDay && !dailyRewardClaimed

                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-2.5 text-center border transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-b from-yellow-500/20 to-orange-500/20 border-yellow-400 shadow-lg shadow-yellow-500/20'
                        : isClaimed
                        ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-extrabold uppercase">Day {i + 1}</div>
                    <div className="text-lg my-1">{isClaimed ? '✅' : '🪙'}</div>
                    <div className="text-xs font-black text-yellow-400 font-mono">+{reward}</div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={claimDailyReward}
              disabled={dailyRewardClaimed}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                dailyRewardClaimed
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-orange-500/25'
              }`}
            >
              <Gift size={16} /> {dailyRewardClaimed ? 'Claimed for Today!' : 'Claim Daily Reward'}
            </button>
          </div>

          {/* Lucky Spin Wheel Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl text-center">
            <h3 className="text-lg font-black text-white flex items-center justify-center gap-2 mb-1">
              <Sparkles className="text-yellow-400" size={18} /> Lucky Spin Wheel
            </h3>
            <p className="text-xs text-slate-400 mb-4">Spin daily for bonus coins!</p>

            <div className="relative w-44 h-44 mx-auto my-2">
              {/* Pointer */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 text-yellow-400 text-2xl">
                ▼
              </div>

              {/* Wheel */}
              <motion.div
                className="w-full h-full rounded-full border-4 border-yellow-400/60 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 shadow-2xl flex items-center justify-center relative overflow-hidden"
                style={{ rotate: spinAngle }}
                transition={{ duration: 3.5, ease: [0.15, 0.9, 0.2, 1] }}
              >
                <div className="absolute text-center text-xs font-black text-yellow-300">
                  {spinning ? 'SPINNING...' : 'LUCKY WHEEL'}
                </div>
              </motion.div>
            </div>

            {spinResult && (
              <div className="text-sm font-black text-yellow-400 my-2 animate-bounce">
                🎉 Won +{spinResult} Coins!
              </div>
            )}

            <button
              onClick={handleSpin}
              disabled={!spinAvailable || spinning}
              className={`w-full mt-2 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                !spinAvailable || spinning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-slate-950 shadow-lg shadow-cyan-500/25'
              }`}
            >
              {spinning ? 'Spinning...' : spinAvailable ? 'Free Daily Spin!' : 'Used for Today'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── 50+ ACHIEVEMENTS SHOWCASE TAB ──────────── */}
      {activeTab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Categories Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {ACHIEVEMENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setAchievementCat(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                  achievementCat === cat.id
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(ach => {
              const isUnlocked = achievements.includes(ach.id)
              const tier = ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.BRONZE

              return (
                <div
                  key={ach.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                    isUnlocked
                      ? 'bg-slate-900/90 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  }`}
                  style={{ borderColor: isUnlocked ? tier.color : undefined }}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border"
                      style={{
                        backgroundColor: isUnlocked ? tier.bg : 'rgba(30, 41, 59, 0.5)',
                        borderColor: isUnlocked ? tier.color : '#334155',
                      }}
                    >
                      {isUnlocked ? ach.icon : <Lock size={18} className="text-slate-500" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded"
                          style={{ color: tier.color, backgroundColor: tier.bg }}
                        >
                          {tier.label}
                        </span>
                        {isUnlocked && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 size={13} /> Unlocked
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-white truncate mt-1">
                        {ach.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                        {ach.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] font-bold">
                        <span className="text-cyan-400">+{ach.xpReward} XP</span>
                        <span className="text-yellow-400">+{ach.coinReward} Coins</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── LEADERBOARD TAB ──────────────────────── */}
      {activeTab === 'leaderboard' && (
        <LeaderboardView />
      )}
    </div>
  )
}
