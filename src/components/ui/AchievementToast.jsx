import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Coins, X } from 'lucide-react'
import { useGameStore } from '../../store/gameStore.js'
import { ACHIEVEMENT_TIERS } from '../../data/achievementsData.js'

export default function AchievementToast() {
  const { activeToast, dismissToast } = useGameStore()

  useEffect(() => {
    if (!activeToast) return
    const timer = setTimeout(() => {
      dismissToast()
    }, 5000)
    return () => clearTimeout(timer)
  }, [activeToast, dismissToast])

  if (!activeToast) return null

  const tier = ACHIEVEMENT_TIERS[activeToast.tier] || ACHIEVEMENT_TIERS.BRONZE

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full pointer-events-auto"
        style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 245, 255, 0.3))' }}
      >
        <div
          className="relative overflow-hidden rounded-2xl border bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl"
          style={{ borderColor: tier.color }}
        >
          {/* Neon Top Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 animate-pulse"
          />

          <div className="flex items-start gap-3">
            {/* Icon Badge */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
              style={{ backgroundColor: tier.bg, borderColor: tier.color }}
            >
              {activeToast.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Trophy size={13} className="text-yellow-400" />
                <span>Achievement Unlocked!</span>
              </div>
              <h4 className="text-base font-extrabold text-white truncate mt-0.5">
                {activeToast.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                  <Star size={12} className="text-cyan-400" /> +{activeToast.xpReward} XP
                </span>
                <span className="flex items-center gap-1 text-yellow-300 font-semibold">
                  <Coins size={12} className="text-yellow-400" /> +{activeToast.coinReward} Coins
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
