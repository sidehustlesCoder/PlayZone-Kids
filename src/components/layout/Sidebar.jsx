import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { CATEGORIES } from '../../data/gamesRegistry.js'
import { useGameStore } from '../../store/gameStore.js'

function Sidebar() {
  const location = useLocation()
  const { activeCategory, setActiveCategory, sidebarOpen, setSidebarOpen } = useGameStore()

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId)
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar__backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="sidebar"
          >
            <div className="sidebar__header">
              <h2 className="sidebar__title">Categories</h2>
              <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sidebar__list">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.id}
                  to="/"
                  className={`sidebar__item ${activeCategory === cat.id ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{ '--cat-color': cat.color }}
                >
                  <span className="sidebar__item-icon">{cat.icon}</span>
                  <span className="sidebar__item-label">{cat.label}</span>
                  {activeCategory === cat.id && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="sidebar__item-active-bg"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="sidebar__footer">
              <Link to="/profile" className="sidebar__footer-link" onClick={() => setSidebarOpen(false)}>
                🏰 My Profile
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
