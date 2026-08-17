import { Link } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore.js'

function Footer() {
  const { setActiveCategory } = useGameStore()

  return (
    <footer className="platform-footer">
      <div className="platform-footer__inner">
        <div className="platform-footer__top">
          {/* Brand */}
          <div className="platform-footer__brand">
            <span className="platform-footer__logo">
              🎮 Game<span className="platform-footer__logo-accent">Zone</span>Kids
            </span>
            <p className="platform-footer__tagline">
              The ultimate free browser gaming platform for kids aged 3–12.
              No downloads, no signups — just pure fun!
            </p>
            <span className="platform-footer__badge">
              ✅ Free Forever · No Ads · Kid-Safe
            </span>
          </div>

          {/* Links */}
          <div className="platform-footer__links">
            <div className="platform-footer__col">
              <h4>Play</h4>
              <Link to="/" onClick={() => setActiveCategory('all')}>All Games</Link>
              <Link to="/profile">My Profile</Link>
              <Link to="/leaderboard">Leaderboards</Link>
            </div>
            <div className="platform-footer__col">
              <h4>Categories</h4>
              <Link to="/" onClick={() => setActiveCategory('action')}>Action</Link>
              <Link to="/" onClick={() => setActiveCategory('puzzle')}>Puzzle</Link>
              <Link to="/" onClick={() => setActiveCategory('racing')}>Racing</Link>
              <Link to="/" onClick={() => setActiveCategory('sports')}>Sports</Link>
              <Link to="/" onClick={() => setActiveCategory('educational')}>Educational</Link>
            </div>
            <div className="platform-footer__col">
              <h4>About</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Contact Us</a>
              <a href="#">For Parents</a>
            </div>
          </div>
        </div>

        <div className="platform-footer__bottom">
          <p>© {new Date().getFullYear()} GameZoneKids.com — Made with ❤️ for kids everywhere</p>
          <p className="platform-footer__tech">
            Built with React · Three.js · Phaser.js
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
