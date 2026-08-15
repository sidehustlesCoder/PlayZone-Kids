import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="platform-footer">
      <div className="platform-footer__inner">
        <div className="platform-footer__top">
          <div className="platform-footer__brand">
            <span className="platform-footer__logo">🎮 GameZoneKids</span>
            <p className="platform-footer__tagline">
              The ultimate browser gaming platform for kids. Play free, no downloads!
            </p>
          </div>

          <div className="platform-footer__links">
            <div className="platform-footer__col">
              <h4>Play</h4>
              <Link to="/">All Games</Link>
              <Link to="/profile">My Profile</Link>
            </div>
            <div className="platform-footer__col">
              <h4>Categories</h4>
              <Link to="/">Action</Link>
              <Link to="/">Puzzle</Link>
              <Link to="/">Racing</Link>
              <Link to="/">Sports</Link>
            </div>
            <div className="platform-footer__col">
              <h4>About</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>

        <div className="platform-footer__bottom">
          <p>© {new Date().getFullYear()} GameZoneKids.com — Made with ❤️ for kids everywhere</p>
          <p className="platform-footer__tech">
            Built with React + Phaser.js + Three.js
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
