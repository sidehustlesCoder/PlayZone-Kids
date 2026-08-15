import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, Star, Coins, Trophy } from 'lucide-react'
import { useGameStore, calcLevelProgress } from '../../store/gameStore.js'
import { searchGames } from '../../data/gamesRegistry.js'

function Navbar() {
  const navigate = useNavigate()
  const { profile, searchQuery, setSearchQuery, toggleSidebar, sidebarOpen } = useGameStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const searchRef = useRef(null)
  const levelProgress = calcLevelProgress(profile.xp)

  useEffect(() => {
    if (searchQuery.length > 1) {
      setSearchResults(searchGames(searchQuery).slice(0, 6))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="navbar"
    >
      <div className="navbar__inner">
        {/* Left: Menu + Logo */}
        <div className="navbar__left">
          <button
            className="navbar__menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="navbar__logo">
            <span className="navbar__logo-icon">🎮</span>
            <span className="navbar__logo-text">
              Game<span className="navbar__logo-accent">Zone</span>Kids
            </span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="navbar__center" ref={searchRef}>
          <div className={`navbar__search ${searchOpen ? 'navbar__search--open' : ''}`}>
            <Search size={18} className="navbar__search-icon" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              className="navbar__search-input"
              id="search-input"
            />
            {searchQuery && (
              <button
                className="navbar__search-clear"
                onClick={() => { setSearchQuery(''); setSearchResults([]) }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="navbar__search-dropdown"
              >
                {searchResults.map(game => (
                  <button
                    key={game.id}
                    className="navbar__search-result"
                    onClick={() => {
                      navigate(`/app/${game.id}`)
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <span className="navbar__search-result-icon">{game.icon}</span>
                    <div>
                      <div className="navbar__search-result-name">{game.name}</div>
                      <div className="navbar__search-result-cat">{game.category}</div>
                    </div>
                    {game.status === 'coming-soon' && (
                      <span className="navbar__badge navbar__badge--soon">Soon</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Stats + Profile */}
        <div className="navbar__right">
          <Link
            to="/leaderboard"
            className="navbar__stat hover:bg-yellow-500/20 hover:text-yellow-400 transition-colors"
            title="Leaderboards"
          >
            <Trophy size={16} className="navbar__stat-icon text-yellow-400" />
            <span className="hidden sm:inline text-xs font-extrabold uppercase">Ranks</span>
          </Link>

          <div className="navbar__stat" title={`${profile.coins} coins`}>
            <Coins size={16} className="navbar__stat-icon navbar__stat-icon--coins" />
            <span>{profile.coins}</span>
          </div>

          <div className="navbar__stat" title={`Level ${profile.level}`}>
            <Star size={16} className="navbar__stat-icon navbar__stat-icon--xp" />
            <span>Lv.{profile.level}</span>
          </div>

          <Link to="/profile" className="navbar__avatar" title="Profile">
            <span className="navbar__avatar-emoji">{profile.avatar}</span>
            <div className="navbar__avatar-xpring">
              <svg viewBox="0 0 36 36" className="navbar__avatar-ring">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke="url(#xpGradient)" strokeWidth="2"
                  strokeDasharray={`${levelProgress * 100.5} 100.5`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
                <defs>
                  <linearGradient id="xpGradient">
                    <stop offset="0%" stopColor="#00f5ff" />
                    <stop offset="100%" stopColor="#bf5af2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
