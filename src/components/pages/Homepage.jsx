import HeroSection from '../sections/HeroSection.jsx'
import RecentlyPlayed from '../sections/RecentlyPlayed.jsx'
import TrendingSection from '../sections/TrendingSection.jsx'
import NewGamesSection from '../sections/NewGamesSection.jsx'
import CategoryGrid from '../sections/CategoryGrid.jsx'
import AllGamesSection from '../sections/AllGamesSection.jsx'

function Homepage() {
  return (
    <div className="homepage">
      <HeroSection />
      <RecentlyPlayed />
      <TrendingSection />
      <CategoryGrid />
      <NewGamesSection />
      <AllGamesSection />
    </div>
  )
}

export default Homepage
