/*
 * 50+ Master Achievement Registry for PlayZone Kids
 * Spans 6 categories: General, Puzzle, Brain, Arcade, Action, Loyalty
 * Tiers: Bronze (25 XP), Silver (50 XP), Gold (100 XP), Platinum (200 XP), Legendary (500 XP)
 */

export const ACHIEVEMENT_TIERS = {
  BRONZE: { label: 'Bronze', color: '#cd7f32', border: 'border-amber-600/40', bg: 'rgba(205, 127, 50, 0.15)' },
  SILVER: { label: 'Silver', color: '#c0c0c0', border: 'border-slate-300/40', bg: 'rgba(192, 192, 192, 0.15)' },
  GOLD: { label: 'Gold', color: '#ffd700', border: 'border-yellow-400/50', bg: 'rgba(255, 215, 0, 0.18)' },
  PLATINUM: { label: 'Platinum', color: '#00f5ff', border: 'border-cyan-400/50', bg: 'rgba(0, 245, 255, 0.18)' },
  LEGENDARY: { label: 'Legendary', color: '#bf5af2', border: 'border-purple-400/60', bg: 'rgba(191, 90, 242, 0.22)' }
}

export const ACHIEVEMENTS = [
  // ── General & Onboarding (1-8) ──────────────
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Play your very first game on GameZone Kids!',
    category: 'general',
    tier: 'BRONZE',
    icon: '🚀',
    xpReward: 25,
    coinReward: 10,
    check: (stats) => Object.values(stats || {}).reduce((s, g) => s + g.plays, 0) >= 1
  },
  {
    id: 'game-explorer-5',
    title: 'Game Explorer',
    description: 'Try 5 different games across the platform.',
    category: 'general',
    tier: 'BRONZE',
    icon: '🧭',
    xpReward: 50,
    coinReward: 20,
    check: (stats) => Object.keys(stats || {}).length >= 5
  },
  {
    id: 'game-enthusiast-10',
    title: 'Game Enthusiast',
    description: 'Try 10 different games across the platform.',
    category: 'general',
    tier: 'SILVER',
    icon: '🌟',
    xpReward: 100,
    coinReward: 40,
    check: (stats) => Object.keys(stats || {}).length >= 10
  },
  {
    id: 'platform-master-all',
    title: 'Platform Master',
    description: 'Play at least 15 unique games on the platform.',
    category: 'general',
    tier: 'GOLD',
    icon: '👑',
    xpReward: 250,
    coinReward: 100,
    check: (stats) => Object.keys(stats || {}).length >= 15
  },
  {
    id: 'level-up-5',
    title: 'Rising Star',
    description: 'Reach Player Level 5.',
    category: 'general',
    tier: 'SILVER',
    icon: '⭐',
    xpReward: 75,
    coinReward: 30,
    check: (_, profile) => (profile?.level || 1) >= 5
  },
  {
    id: 'level-up-10',
    title: 'Champion Cadet',
    description: 'Reach Player Level 10.',
    category: 'general',
    tier: 'GOLD',
    icon: '🏆',
    xpReward: 200,
    coinReward: 80,
    check: (_, profile) => (profile?.level || 1) >= 10
  },
  {
    id: 'level-up-20',
    title: 'Legendary Hero',
    description: 'Reach Player Level 20.',
    category: 'general',
    tier: 'LEGENDARY',
    icon: '💎',
    xpReward: 500,
    coinReward: 250,
    check: (_, profile) => (profile?.level || 1) >= 20
  },
  {
    id: 'avatar-stylist',
    title: 'Identity Shift',
    description: 'Customize your player avatar.',
    category: 'general',
    tier: 'BRONZE',
    icon: '🎭',
    xpReward: 25,
    coinReward: 15,
    check: (_, profile) => profile?.avatar && profile.avatar !== '🦊'
  },

  // ── Loyalty & Daily Streaks (9-14) ──────────────
  {
    id: 'streak-3',
    title: 'Daily Habit',
    description: 'Maintain a 3-day daily play streak.',
    category: 'loyalty',
    tier: 'BRONZE',
    icon: '🔥',
    xpReward: 50,
    coinReward: 25,
    check: (_, profile) => (profile?.streak || 0) >= 3
  },
  {
    id: 'streak-7',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day daily login streak!',
    category: 'loyalty',
    tier: 'GOLD',
    icon: '⚡',
    xpReward: 200,
    coinReward: 100,
    check: (_, profile) => (profile?.streak || 0) >= 7
  },
  {
    id: 'coin-collector-100',
    title: 'Pocket Change',
    description: 'Collect 100 total coins.',
    category: 'loyalty',
    tier: 'BRONZE',
    icon: '🪙',
    xpReward: 30,
    coinReward: 15,
    check: (_, profile) => (profile?.coins || 0) >= 100
  },
  {
    id: 'coin-collector-500',
    title: 'Treasure Hunter',
    description: 'Amass a fortune of 500 coins.',
    category: 'loyalty',
    tier: 'SILVER',
    icon: '💰',
    xpReward: 100,
    coinReward: 50,
    check: (_, profile) => (profile?.coins || 0) >= 500
  },
  {
    id: 'coin-tycoon-1000',
    title: 'Coin Tycoon',
    description: 'Hold 1,000 coins in your bank.',
    category: 'loyalty',
    tier: 'PLATINUM',
    icon: '🏦',
    xpReward: 300,
    coinReward: 150,
    check: (_, profile) => (profile?.coins || 0) >= 1000
  },
  {
    id: 'lucky-spinner',
    title: 'Wheel of Fortune',
    description: 'Spin the Lucky Daily Prize Wheel.',
    category: 'loyalty',
    tier: 'BRONZE',
    icon: '🎡',
    xpReward: 25,
    coinReward: 10,
    check: (_, profile, ext) => ext?.spunWheel === true
  },

  // ── Puzzle & Memory Games (15-23) ──────────────
  {
    id: 'memory-novice',
    title: 'Sharp Eyes',
    description: 'Complete a game of Memory Match.',
    category: 'puzzle',
    tier: 'BRONZE',
    icon: '🃏',
    xpReward: 35,
    coinReward: 15,
    check: (stats) => (stats?.['memory-match']?.plays || 0) >= 1
  },
  {
    id: 'memory-master',
    title: 'Eidetic Memory',
    description: 'Play Memory Match 5 times.',
    category: 'puzzle',
    tier: 'SILVER',
    icon: '🎴',
    xpReward: 80,
    coinReward: 35,
    check: (stats) => (stats?.['memory-match']?.plays || 0) >= 5
  },
  {
    id: 'connect-four-victor',
    title: 'Four in a Row',
    description: 'Play Connect Four against the AI.',
    category: 'puzzle',
    tier: 'BRONZE',
    icon: '🔴',
    xpReward: 35,
    coinReward: 15,
    check: (stats) => (stats?.['connect-four']?.plays || 0) >= 1
  },
  {
    id: 'connect-four-champion',
    title: 'Grid Strategist',
    description: 'Win 5 games of Connect Four.',
    category: 'puzzle',
    tier: 'SILVER',
    icon: '🟡',
    xpReward: 100,
    coinReward: 40,
    check: (stats) => (stats?.['connect-four']?.plays || 0) >= 5
  },
  {
    id: 'sliding-puzzle-solver',
    title: 'Tile Shifter',
    description: 'Complete the Sliding Puzzle.',
    category: 'puzzle',
    tier: 'BRONZE',
    icon: '🧩',
    xpReward: 40,
    coinReward: 20,
    check: (stats) => (stats?.['sliding-puzzle']?.plays || 0) >= 1
  },
  {
    id: 'maze-runner-escapist',
    title: 'Labyrinth Navigator',
    description: 'Escape your first maze in Maze Runner.',
    category: 'puzzle',
    tier: 'BRONZE',
    icon: '🌀',
    xpReward: 40,
    coinReward: 20,
    check: (stats) => (stats?.['maze-runner']?.plays || 0) >= 1
  },
  {
    id: 'maze-speedrunner',
    title: 'Minotaur’s Nightmare',
    description: 'Conquer 5 mazes in Maze Runner.',
    category: 'puzzle',
    tier: 'GOLD',
    icon: '⚡',
    xpReward: 150,
    coinReward: 60,
    check: (stats) => (stats?.['maze-runner']?.plays || 0) >= 5
  },
  {
    id: 'shape-sorter-whiz',
    title: 'Geometry Prodigy',
    description: 'Match all shapes in Shape Sorter.',
    category: 'puzzle',
    tier: 'BRONZE',
    icon: '🔺',
    xpReward: 30,
    coinReward: 15,
    check: (stats) => (stats?.['shape-sorter']?.plays || 0) >= 1
  },
  {
    id: 'shape-master-5',
    title: 'Master Architect',
    description: 'Play Shape Sorter 5 times.',
    category: 'puzzle',
    tier: 'SILVER',
    icon: '🔷',
    xpReward: 70,
    coinReward: 30,
    check: (stats) => (stats?.['shape-sorter']?.plays || 0) >= 5
  },

  // ── Word & Brain Games (24-32) ──────────────
  {
    id: 'simon-repeater',
    title: 'Rhythm Follower',
    description: 'Play Simon Says color patterns.',
    category: 'brain',
    tier: 'BRONZE',
    icon: '🎵',
    xpReward: 35,
    coinReward: 15,
    check: (stats) => (stats?.['simon-says']?.plays || 0) >= 1
  },
  {
    id: 'simon-virtuoso',
    title: 'Pattern Virtuoso',
    description: 'Achieve a score of 10+ in Simon Says.',
    category: 'brain',
    tier: 'GOLD',
    icon: '🎶',
    xpReward: 150,
    coinReward: 60,
    check: (stats) => (stats?.['simon-says']?.highScore || 0) >= 10
  },
  {
    id: 'word-searcher',
    title: 'Vocabulary Scout',
    description: 'Find words in the Word Search grid.',
    category: 'brain',
    tier: 'BRONZE',
    icon: '🔤',
    xpReward: 35,
    coinReward: 15,
    check: (stats) => (stats?.['word-search']?.plays || 0) >= 1
  },
  {
    id: 'lexicon-legend',
    title: 'Lexicon Legend',
    description: 'Complete 5 word searches.',
    category: 'brain',
    tier: 'SILVER',
    icon: '📖',
    xpReward: 100,
    coinReward: 40,
    check: (stats) => (stats?.['word-search']?.plays || 0) >= 5
  },
  {
    id: 'hangman-detective',
    title: 'Word Detective',
    description: 'Guess the mystery word in Hangman.',
    category: 'brain',
    tier: 'BRONZE',
    icon: '🪓',
    xpReward: 35,
    coinReward: 15,
    check: (stats) => (stats?.['hangman']?.plays || 0) >= 1
  },
  {
    id: 'hangman-savior',
    title: 'Linguistic Savior',
    description: 'Save 5 characters in Hangman.',
    category: 'brain',
    tier: 'SILVER',
    icon: '🛡️',
    xpReward: 90,
    coinReward: 35,
    check: (stats) => (stats?.['hangman']?.plays || 0) >= 5
  },
  {
    id: 'number-guesser-mind',
    title: 'Mind Reader',
    description: 'Crack the secret number in Number Guesser.',
    category: 'brain',
    tier: 'BRONZE',
    icon: '🎯',
    xpReward: 30,
    coinReward: 15,
    check: (stats) => (stats?.['number-guesser']?.plays || 0) >= 1
  },
  {
    id: 'quiz-brainiac',
    title: 'Trivia Brainiac',
    description: 'Answer questions in Quiz Challenge.',
    category: 'brain',
    tier: 'BRONZE',
    icon: '🔬',
    xpReward: 40,
    coinReward: 20,
    check: (stats) => (stats?.['quiz']?.plays || 0) >= 1
  },
  {
    id: 'text-adventure-hero',
    title: 'Storybook Hero',
    description: 'Complete a story branch in Text Adventure.',
    category: 'brain',
    tier: 'BRONZE',
    icon: '🌲',
    xpReward: 40,
    coinReward: 20,
    check: (stats) => (stats?.['text-adventure']?.plays || 0) >= 1
  },

  // ── Arcade & Action (33-42) ──────────────
  {
    id: 'whack-a-mole-hitter',
    title: 'Fast Reflexes',
    description: 'Whack some moles in Whack-a-Mole.',
    category: 'arcade',
    tier: 'BRONZE',
    icon: '🔨',
    xpReward: 35,
    coinReward: 15,
    check: (stats) => (stats?.['whack-a-mole']?.plays || 0) >= 1
  },
  {
    id: 'whack-frenzy',
    title: 'Hammer Frenzy',
    description: 'Score 20+ points in Whack-a-Mole.',
    category: 'arcade',
    tier: 'SILVER',
    icon: '⚡',
    xpReward: 85,
    coinReward: 35,
    check: (stats) => (stats?.['whack-a-mole']?.highScore || 0) >= 20
  },
  {
    id: 'color-splash-popper',
    title: 'Color Splasher',
    description: 'Pop balloons in Color Splash.',
    category: 'arcade',
    tier: 'BRONZE',
    icon: '🎈',
    xpReward: 30,
    coinReward: 15,
    check: (stats) => (stats?.['color-splash']?.plays || 0) >= 1
  },
  {
    id: 'animal-sound-listener',
    title: 'Jungle Ears',
    description: 'Identify animal sounds correctly.',
    category: 'arcade',
    tier: 'BRONZE',
    icon: '🦁',
    xpReward: 30,
    coinReward: 15,
    check: (stats) => (stats?.['animal-sound-match']?.plays || 0) >= 1
  },
  {
    id: 'tic-tac-toe-duelist',
    title: 'Tic-Tac Master',
    description: 'Play classic Tic-Tac-Toe.',
    category: 'arcade',
    tier: 'BRONZE',
    icon: '❌',
    xpReward: 25,
    coinReward: 10,
    check: (stats) => (stats?.['tic-tac-toe']?.plays || 0) >= 1
  },
  {
    id: 'galaxy-pilot-initiate',
    title: 'Space Cadet',
    description: 'Launch your spaceship in Galaxy Defender!',
    category: 'action',
    tier: 'BRONZE',
    icon: '🚀',
    xpReward: 50,
    coinReward: 25,
    check: (stats) => (stats?.['galaxy-defender']?.plays || 0) >= 1
  },
  {
    id: 'galaxy-alien-crusher',
    title: 'Alien Destroyer',
    description: 'Score 500+ points in Galaxy Defender.',
    category: 'action',
    tier: 'GOLD',
    icon: '💥',
    xpReward: 150,
    coinReward: 60,
    check: (stats) => (stats?.['galaxy-defender']?.highScore || 0) >= 500
  },
  {
    id: 'galaxy-ace-pilot',
    title: 'Galaxy Commander',
    description: 'Score 1,500+ points in Galaxy Defender!',
    category: 'action',
    tier: 'PLATINUM',
    icon: '🛸',
    xpReward: 300,
    coinReward: 120,
    check: (stats) => (stats?.['galaxy-defender']?.highScore || 0) >= 1500
  },
  {
    id: 'bubble-popper-novice',
    title: 'Bubble Blaster',
    description: 'Shoot and pop bubbles in Bubble Shooter Deluxe.',
    category: 'arcade',
    tier: 'BRONZE',
    icon: '🫧',
    xpReward: 40,
    coinReward: 20,
    check: (stats) => (stats?.['bubble-shooter']?.plays || 0) >= 1
  },
  {
    id: 'bubble-combo-king',
    title: 'Combo Monarch',
    description: 'Score 800+ in Bubble Shooter Deluxe.',
    category: 'arcade',
    tier: 'SILVER',
    icon: '🌈',
    xpReward: 120,
    coinReward: 50,
    check: (stats) => (stats?.['bubble-shooter']?.highScore || 0) >= 800
  },

  // ── 3D & Runner Games (43-52) ──────────────
  {
    id: 'turbo-racer-start',
    title: 'Ignition Ready',
    description: 'Take the wheel in Turbo City Racing 3D!',
    category: 'action',
    tier: 'BRONZE',
    icon: '🏎️',
    xpReward: 50,
    coinReward: 25,
    check: (stats) => (stats?.['turbo-racing']?.plays || 0) >= 1
  },
  {
    id: 'turbo-speed-demon',
    title: 'Speed Demon',
    description: 'Drive over 1,000m in Turbo City Racing.',
    category: 'action',
    tier: 'GOLD',
    icon: '🏁',
    xpReward: 180,
    coinReward: 75,
    check: (stats) => (stats?.['turbo-racing']?.highScore || 0) >= 1000
  },
  {
    id: 'turbo-nitro-master',
    title: 'Nitro Overdrive',
    description: 'Score 2,500+ distance in Turbo City Racing.',
    category: 'action',
    tier: 'PLATINUM',
    icon: '⚡',
    xpReward: 350,
    coinReward: 150,
    check: (stats) => (stats?.['turbo-racing']?.highScore || 0) >= 2500
  },
  {
    id: 'temple-runner-start',
    title: 'Ancient Expedition',
    description: 'Enter the ruins in Temple Escape.',
    category: 'arcade',
    tier: 'BRONZE',
    icon: '🏛️',
    xpReward: 40,
    coinReward: 20,
    check: (stats) => (stats?.['temple-escape']?.plays || 0) >= 1
  },
  {
    id: 'temple-idol-collector',
    title: 'Relic Collector',
    description: 'Survive 500m in Temple Escape.',
    category: 'arcade',
    tier: 'SILVER',
    icon: '🗿',
    xpReward: 100,
    coinReward: 45,
    check: (stats) => (stats?.['temple-escape']?.highScore || 0) >= 500
  },
  {
    id: 'shadow-ninja-blade',
    title: 'Way of the Shinobi',
    description: 'Step onto the path of the Shadow Ninja.',
    category: 'action',
    tier: 'BRONZE',
    icon: '🥷',
    xpReward: 50,
    coinReward: 25,
    check: (stats) => (stats?.['shadow-ninja']?.plays || 0) >= 1
  },
  {
    id: 'zombie-survivor-day1',
    title: 'Last Stand',
    description: 'Survive your first horde in Zombie Survival.',
    category: 'action',
    tier: 'BRONZE',
    icon: '🧟',
    xpReward: 50,
    coinReward: 25,
    check: (stats) => (stats?.['zombie-survival']?.plays || 0) >= 1
  },
  {
    id: 'favorite-collector',
    title: 'Curator',
    description: 'Add 3 or more games to your favorites list.',
    category: 'general',
    tier: 'BRONZE',
    icon: '❤️',
    xpReward: 35,
    coinReward: 15,
    check: (_, __, ext) => (ext?.favoritesCount || 0) >= 3
  },
  {
    id: 'marathon-gamer',
    title: 'Marathon Gamer',
    description: 'Accumulate 50 total game sessions across all games.',
    category: 'general',
    tier: 'PLATINUM',
    icon: '🎖️',
    xpReward: 350,
    coinReward: 150,
    check: (stats) => Object.values(stats || {}).reduce((s, g) => s + g.plays, 0) >= 50
  },
  {
    id: 'centurion-player',
    title: 'Centurion Legend',
    description: 'Accumulate 100 total game sessions across all games.',
    category: 'general',
    tier: 'LEGENDARY',
    icon: '👑',
    xpReward: 600,
    coinReward: 300,
    check: (stats) => Object.values(stats || {}).reduce((s, g) => s + g.plays, 0) >= 100
  },
  {
    id: 'achievement-hunter-25',
    title: 'Trophy Hunter',
    description: 'Unlock 25 achievements on GameZone Kids!',
    category: 'general',
    tier: 'PLATINUM',
    icon: '🏆',
    xpReward: 300,
    coinReward: 150,
    check: (_, __, ext) => (ext?.unlockedAchievementsCount || 0) >= 25
  },
  {
    id: 'grandmaster-50',
    title: 'Grandmaster of PlayZone',
    description: 'Unlock 40+ achievements across the entire universe!',
    category: 'general',
    tier: 'LEGENDARY',
    icon: '🌌',
    xpReward: 1000,
    coinReward: 500,
    check: (_, __, ext) => (ext?.unlockedAchievementsCount || 0) >= 40
  }
]

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', label: 'All Badges', icon: '🏆' },
  { id: 'general', label: 'General', icon: '⭐' },
  { id: 'loyalty', label: 'Streaks & Coins', icon: '🔥' },
  { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
  { id: 'brain', label: 'Brain', icon: '🧠' },
  { id: 'arcade', label: 'Arcade', icon: '👾' },
  { id: 'action', label: 'Action & 3D', icon: '⚔️' }
]

export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id)
}

export function getAchievementsByCategory(category) {
  if (category === 'all') return ACHIEVEMENTS
  return ACHIEVEMENTS.filter(a => a.category === category)
}
