import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CATEGORIES } from '../../data/gamesRegistry.js'
import { useGameStore } from '../../store/gameStore.js'

function CategoryGrid() {
  const { setActiveCategory } = useGameStore()

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId)
    setTimeout(() => {
      const el = document.getElementById('all-games')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const displayCats = CATEGORIES.filter(c => c.id !== 'all')

  return (
    <section className="platform-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="platform-section__header"
      >
        <h2 className="platform-section__title">Browse Categories 🗂️</h2>
      </motion.div>

      <div className="category-grid">
        {displayCats.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to="/"
              className="category-card"
              onClick={() => handleCategoryClick(cat.id)}
              style={{ '--cat-color': cat.color }}
            >
              <span className="category-card__icon">{cat.icon}</span>
              <span className="category-card__label">{cat.label}</span>
              <div className="category-card__glow" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default CategoryGrid
