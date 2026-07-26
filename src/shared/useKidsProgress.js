/**
 * useKidsProgress — XP & star tracking for the Kids GameZone
 * Persists to localStorage so progress survives page reloads.
 */
import { useState, useCallback } from 'react'

const KEY = 'gamezone-kids-progress'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { totalStars: 0, games: {} }
  } catch {
    return { totalStars: 0, games: {} }
  }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

export function useKidsProgress() {
  const [progress, setProgress] = useState(load)

  const awardStars = useCallback((gameId, stars = 1) => {
    setProgress(prev => {
      const updated = {
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
      save(updated)
      return updated
    })
  }, [])

  const markPlayed = useCallback((gameId) => {
    setProgress(prev => {
      if (prev.games[gameId]) return prev // already tracked
      const updated = {
        ...prev,
        games: {
          ...prev.games,
          [gameId]: { played: 1, stars: 0 },
        },
      }
      save(updated)
      return updated
    })
  }, [])

  const resetProgress = useCallback(() => {
    const fresh = { totalStars: 0, games: {} }
    save(fresh)
    setProgress(fresh)
  }, [])

  return { progress, awardStars, markPlayed, resetProgress }
}
