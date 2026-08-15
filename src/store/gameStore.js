import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACHIEVEMENTS, getAchievementById } from '../data/achievementsData.js'

const DEFAULT_PROFILE = {
  name: 'Player',
  avatar: '🦊',
  xp: 0,
  level: 1,
  coins: 50,
  streak: 0,
  lastLoginDate: null,
}

const XP_PER_LEVEL = 200
const AVATARS = ['🦊', '🐯', '🦁', '🐻', '🐼', '🦄', '🐉', '🦖', '🐙', '🦈', '🐬', '🦜', '🤖', '👽', '🧙', '🥷']

function calcLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function calcLevelProgress(xp) {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Player profile
      profile: { ...DEFAULT_PROFILE },

      // Game state
      favorites: [],
      recentlyPlayed: [],
      gameStats: {},       // { [gameId]: { plays, highScore, totalTime, lastPlayed } }
      achievements: [],    // ['first-step', ...]
      unlockedItems: [],

      // Notification / Celebration toast
      activeToast: null,   // { id, title, icon, xpReward, coinReward }

      // Daily
      dailyRewardDay: 0,
      dailyRewardClaimed: false,
      lastDailyDate: null,
      spinAvailable: true,

      // Settings
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        volume: 0.7,
        showTutorials: true,
        difficulty: 'Medium',
      },

      // UI
      sidebarOpen: false,
      searchQuery: '',
      activeCategory: 'All',

      // Actions
      setSearchQuery: (q) => set({ searchQuery: q }),
      setActiveCategory: (c) => set({ activeCategory: c }),
      setSidebarOpen: (o) => set({ sidebarOpen: o }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      dismissToast: () => set({ activeToast: null }),

      updateProfile: (updates) => {
        set(s => ({ profile: { ...s.profile, ...updates } }))
        get().checkAllAchievements()
      },

      setAvatar: (avatar) => {
        set(s => ({ profile: { ...s.profile, avatar } }))
        get().checkAllAchievements()
      },

      addXP: (amount) => {
        let earnedLevelUp = false
        set(s => {
          const newXP = s.profile.xp + amount
          const newLevel = calcLevel(newXP)
          earnedLevelUp = newLevel > s.profile.level
          return {
            profile: {
              ...s.profile,
              xp: newXP,
              level: newLevel,
              ...(earnedLevelUp ? { coins: s.profile.coins + 25 } : {})
            }
          }
        })
        get().checkAllAchievements()
      },

      addCoins: (amount) => {
        set(s => ({
          profile: { ...s.profile, coins: s.profile.coins + amount }
        }))
        get().checkAllAchievements()
      },

      spendCoins: (amount) => {
        const state = get()
        if (state.profile.coins < amount) return false
        set(s => ({ profile: { ...s.profile, coins: s.profile.coins - amount } }))
        return true
      },

      // Favorites
      toggleFavorite: (gameId) => {
        set(s => ({
          favorites: s.favorites.includes(gameId)
            ? s.favorites.filter(id => id !== gameId)
            : [...s.favorites, gameId]
        }))
        get().checkAllAchievements()
      },

      isFavorite: (gameId) => get().favorites.includes(gameId),

      // Recently played & stats
      recordPlay: (gameId) => {
        set(s => {
          const recent = [gameId, ...s.recentlyPlayed.filter(id => id !== gameId)].slice(0, 20)
          const stats = { ...s.gameStats }
          if (!stats[gameId]) {
            stats[gameId] = { plays: 0, highScore: 0, totalTime: 0, lastPlayed: null }
          }
          stats[gameId].plays += 1
          stats[gameId].lastPlayed = Date.now()
          return { recentlyPlayed: recent, gameStats: stats }
        })
        get().checkAllAchievements()
      },

      updateHighScore: (gameId, score) => {
        let isNewHigh = false
        set(s => {
          const stats = { ...s.gameStats }
          if (!stats[gameId]) {
            stats[gameId] = { plays: 0, highScore: 0, totalTime: 0, lastPlayed: null }
          }
          if (score > stats[gameId].highScore) {
            stats[gameId].highScore = score
            isNewHigh = true
          }
          return { gameStats: stats }
        })
        get().checkAllAchievements()
        return isNewHigh
      },

      // Achievements
      unlockAchievement: (id) => {
        const state = get()
        if (state.achievements.includes(id)) return

        const ach = getAchievementById(id)
        if (!ach) return

        set(s => ({
          achievements: [...s.achievements, id],
          profile: {
            ...s.profile,
            xp: s.profile.xp + ach.xpReward,
            level: calcLevel(s.profile.xp + ach.xpReward),
            coins: s.profile.coins + ach.coinReward,
          },
          activeToast: {
            id: ach.id,
            title: ach.title,
            icon: ach.icon,
            xpReward: ach.xpReward,
            coinReward: ach.coinReward,
            tier: ach.tier,
          }
        }))
      },

      hasAchievement: (id) => get().achievements.includes(id),

      checkAllAchievements: (extra = {}) => {
        const state = get()
        const context = {
          favoritesCount: state.favorites.length,
          unlockedAchievementsCount: state.achievements.length,
          ...extra
        }

        ACHIEVEMENTS.forEach(ach => {
          if (!state.achievements.includes(ach.id)) {
            if (typeof ach.check === 'function') {
              try {
                if (ach.check(state.gameStats, state.profile, context)) {
                  get().unlockAchievement(ach.id)
                }
              } catch {
                // Ignore evaluation errors
              }
            }
          }
        })
      },

      // Daily rewards
      claimDailyReward: () => {
        set(s => {
          const today = new Date().toDateString()
          if (s.lastDailyDate === today) return s
          const isConsecutive = s.lastDailyDate === new Date(Date.now() - 86400000).toDateString()
          const newDay = isConsecutive ? (s.dailyRewardDay + 1) % 7 : 0
          const rewards = [10, 15, 20, 25, 30, 40, 75]
          const coinReward = rewards[newDay]
          return {
            dailyRewardDay: newDay,
            dailyRewardClaimed: true,
            lastDailyDate: today,
            profile: { ...s.profile, coins: s.profile.coins + coinReward, streak: isConsecutive ? s.profile.streak + 1 : 1 },
          }
        })
        get().checkAllAchievements()
      },

      claimSpin: (coins) => {
        set(s => ({
          spinAvailable: false,
          profile: { ...s.profile, coins: s.profile.coins + coins }
        }))
        get().checkAllAchievements({ spunWheel: true })
      },

      // Settings
      updateSettings: (updates) => set(s => ({
        settings: { ...s.settings, ...updates }
      })),

      // Check daily reset
      checkDailyReset: () => set(s => {
        const today = new Date().toDateString()
        if (s.lastDailyDate !== today) {
          return { dailyRewardClaimed: false, spinAvailable: true }
        }
        return {}
      }),
    }),
    {
      name: 'gamezone-kids-store',
      version: 3,
    }
  )
)

export { AVATARS, XP_PER_LEVEL, calcLevel, calcLevelProgress }
