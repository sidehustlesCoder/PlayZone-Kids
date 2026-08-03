/**
 * useKidsProgress — XP & star tracking for the Kids GameZone
 * Persists to localStorage so progress survives page reloads.
 */
import { useState, useCallback, useEffect } from 'react'

const KEY = 'gamezone-kids-progress'

export const BADGE_CONFIG = [
  { id: 'first_star', name: 'First Star!', description: 'You earned your first star!', icon: '🌟', condition: (p) => p.totalStars >= 1 },
  { id: 'five_games', name: 'High Five!', description: 'Play 5 times', icon: '🖐️', condition: (p) => Object.values(p.games).reduce((sum, g) => sum + g.played, 0) >= 5 },
  { id: 'three_streak', name: '3-Day Streak', description: 'Play 3 days in a row', icon: '🔥', condition: (p) => p.streak >= 3 },
  { id: 'explorer', name: 'Explorer', description: 'Play 3 different games', icon: '🗺️', condition: (p) => Object.keys(p.games).length >= 3 },
]

function getInitialState() {
  const defaultState = { totalStars: 0, games: {}, badges: [], streak: 0, lastPlayDate: null, placedItems: [] }
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) || {}
    return { ...defaultState, ...data, placedItems: data.placedItems || [] }
  } catch {
    return defaultState
  }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function updateStreak(progress) {
  const today = new Date().toISOString().slice(0, 10)
  if (progress.lastPlayDate === today) return progress

  let newStreak = 1
  if (progress.lastPlayDate) {
    const last = new Date(progress.lastPlayDate)
    const current = new Date(today)
    const diffDays = Math.round(Math.abs(current - last) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      newStreak = progress.streak + 1
    }
  }
  
  return { ...progress, streak: newStreak, lastPlayDate: today }
}

function unlockBadges(progress) {
  let newBadges = [...progress.badges]
  BADGE_CONFIG.forEach(badge => {
    if (!newBadges.includes(badge.id) && badge.condition(progress)) {
      newBadges.push(badge.id)
    }
  })
  if (newBadges.length > progress.badges.length) {
    return { ...progress, badges: newBadges }
  }
  return progress
}

export function useKidsProgress() {
  const [progress, setProgress] = useState(getInitialState)

  // Check streak and badges on mount
  useEffect(() => {
    setProgress(prev => {
      let updated = updateStreak(prev)
      updated = unlockBadges(updated)
      if (updated !== prev) save(updated)
      return updated
    })
  }, [])

  const awardStars = useCallback((gameId, stars = 1) => {
    setProgress(prev => {
      let updated = {
        ...prev,
        totalStars: prev.totalStars + stars,
        games: {
          ...prev.games,
          [gameId]: {
            played: (prev.games[gameId]?.played || 0) + 1,
            stars: Math.max(prev.games[gameId]?.stars || 0, stars),
          },
        },
      }
      updated = updateStreak(updated)
      updated = unlockBadges(updated)
      save(updated)
      return updated
    })
  }, [])

  const markPlayed = useCallback((gameId) => {
    setProgress(prev => {
      let updated = { ...prev }
      if (!updated.games[gameId]) {
        updated.games = {
          ...updated.games,
          [gameId]: { played: 1, stars: 0 },
        }
      } else {
        updated.games = {
          ...updated.games,
          [gameId]: {
            ...updated.games[gameId],
            played: updated.games[gameId].played + 1
          }
        }
      }
      updated = updateStreak(updated)
      updated = unlockBadges(updated)
      save(updated)
      return updated
    })
  }, [])

  const togglePlaceItem = useCallback((itemId) => {
    setProgress(prev => {
      const isPlaced = prev.placedItems?.includes(itemId)
      const nextPlaced = isPlaced
        ? (prev.placedItems || []).filter(id => id !== itemId)
        : [...(prev.placedItems || []), itemId]
      
      const updated = {
        ...prev,
        placedItems: nextPlaced
      }
      save(updated)
      return updated
    })
  }, [])

  const resetProgress = useCallback(() => {
    const fresh = { totalStars: 0, games: {}, badges: [], streak: 0, lastPlayDate: null, placedItems: [] }
    save(fresh)
    setProgress(fresh)
  }, [])

  return { progress, awardStars, markPlayed, togglePlaceItem, resetProgress }
}
