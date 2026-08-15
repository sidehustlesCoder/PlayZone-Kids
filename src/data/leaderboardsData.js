/*
 * Master Leaderboards System for PlayZone Kids
 * Generates dynamic community rank boards merged with real local player scores
 */

const BOT_PLAYERS = [
  { name: 'PixelNinja', avatar: '🥷', country: 'US', badge: 'Pro' },
  { name: 'CosmoCat', avatar: '🐱', country: 'CA', badge: 'Star' },
  { name: 'DragonSlayer', avatar: '🐉', country: 'UK', badge: 'Elite' },
  { name: 'CyberWolf', avatar: '🐺', country: 'DE', badge: 'Veteran' },
  { name: 'StarGazer', avatar: '⭐', country: 'JP', badge: 'Master' },
  { name: 'SpeedyFox', avatar: '🦊', country: 'FR', badge: 'Rookie' },
  { name: 'NeonViper', avatar: '🐍', country: 'BR', badge: 'Pro' },
  { name: 'QuantumKid', avatar: '🤖', country: 'AU', badge: 'Elite' },
  { name: 'SolarPanda', avatar: '🐼', country: 'KR', badge: 'Star' },
  { name: 'ShadowHawk', avatar: '🦅', country: 'SG', badge: 'Veteran' },
]

export function getLeaderboardForGame(gameId, playerHighScore = 0, playerName = 'You', playerAvatar = '🦊') {
  // Base seed calculation for consistent, realistic community high scores
  let hash = 0
  for (let i = 0; i < gameId.length; i++) {
    hash = (hash << 5) - hash + gameId.charCodeAt(i)
    hash |= 0
  }
  const baseScore = Math.abs(hash % 800) + 400

  const entries = BOT_PLAYERS.map((bot, index) => {
    const variance = (index * 47) % 150
    const score = Math.max(50, baseScore - (index * 75) + variance)
    return {
      id: `bot-${gameId}-${index}`,
      name: bot.name,
      avatar: bot.avatar,
      score,
      badge: bot.badge,
      isPlayer: false,
    }
  })

  // Insert player entry
  if (playerHighScore >= 0) {
    entries.push({
      id: 'player-entry',
      name: `${playerName} (You)`,
      avatar: playerAvatar,
      score: playerHighScore,
      badge: 'Player',
      isPlayer: true,
    })
  }

  // Sort descending by score
  entries.sort((a, b) => b.score - a.score)

  return entries.map((entry, rank) => ({
    ...entry,
    rank: rank + 1,
  }))
}

export function getGlobalTopPlayers(profile, gameStats = {}) {
  const totalXP = profile?.xp || 0
  const totalPlays = Object.values(gameStats || {}).reduce((s, g) => s + g.plays, 0)
  const playerGlobalScore = totalXP * 2 + totalPlays * 50

  const list = [
    { rank: 1, name: 'CyberDragon', avatar: '🐉', level: 32, xp: 6400, score: 14800, badge: 'Legend' },
    { rank: 2, name: 'NovaValkyrie', avatar: '🦄', level: 28, xp: 5600, score: 12900, badge: 'Grandmaster' },
    { rank: 3, name: 'PixelSamurai', avatar: '🥷', level: 25, xp: 5000, score: 11500, badge: 'Master' },
    { rank: 4, name: 'AstroBot_99', avatar: '🤖', level: 21, xp: 4200, score: 9800, badge: 'Elite' },
    { rank: 5, name: 'ShadowPanda', avatar: '🐼', level: 19, xp: 3800, score: 8600, badge: 'Veteran' },
    { rank: 6, name: 'CosmicFox', avatar: '🦊', level: 16, xp: 3200, score: 7400, badge: 'Pro' },
    { rank: 7, name: 'GalaxyRider', avatar: '🚀', level: 14, xp: 2800, score: 6500, badge: 'Pro' },
    { rank: 8, name: 'HyperTiger', avatar: '🐯', level: 12, xp: 2400, score: 5500, badge: 'Star' },
    {
      rank: 9,
      name: `${profile?.name || 'Player'} (You)`,
      avatar: profile?.avatar || '🦊',
      level: profile?.level || 1,
      xp: totalXP,
      score: playerGlobalScore,
      badge: 'Player',
      isPlayer: true,
    },
    { rank: 10, name: 'BlazeLion', avatar: '🦁', level: 8, xp: 1600, score: 3800, badge: 'Rookie' },
  ]

  list.sort((a, b) => b.score - a.score)
  return list.map((item, idx) => ({ ...item, rank: idx + 1 }))
}
