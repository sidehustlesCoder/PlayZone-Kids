import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import GameCard from '../ui/GameCard.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { getGameById } from '../../data/gamesRegistry.js'

function RecentlyPlayed() {
  const { recentlyPlayed } = useGameStore()

  const recentGames = recentlyPlayed
    .map(id => getGameById(id))
    .filter(Boolean)
    .slice(0, 4)

  if (!recentGames.length) return null

  return (
    <section className="platform-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="platform-section__header"
      >
        <div className="platform-section__title-row">
          <Clock size={24} className="platform-section__icon" style={{ color: '#0a84ff' }} />
          <h2 className="platform-section__title">Continue Playing 🎯</h2>
        </div>
        <p className="platform-section__subtitle">Jump back into your recent games</p>
      </motion.div>

      <div className="game-grid">
        {recentGames.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>
    </section>
  )
}

export default RecentlyPlayed
