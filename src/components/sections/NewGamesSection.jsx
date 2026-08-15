import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import GameCard from '../ui/GameCard.jsx'
import { getNewGames } from '../../data/gamesRegistry.js'

function NewGamesSection() {
  const newGames = getNewGames().slice(0, 8)

  if (!newGames.length) return null

  return (
    <section className="platform-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="platform-section__header"
      >
        <div className="platform-section__title-row">
          <Sparkles size={24} className="platform-section__icon" style={{ color: '#bf5af2' }} />
          <h2 className="platform-section__title">New Games ✨</h2>
        </div>
        <p className="platform-section__subtitle">Fresh releases and coming soon</p>
      </motion.div>

      <div className="game-grid">
        {newGames.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>
    </section>
  )
}

export default NewGamesSection
