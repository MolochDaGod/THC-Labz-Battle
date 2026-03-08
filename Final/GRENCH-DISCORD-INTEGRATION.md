# 🎮 Grench Discord Integration for THC Dope Budz

## Overview

The Grench Discord webhook integration provides AI-powered community engagement and player recruitment for THC Dope Budz. Grench acts as the underground trading network recruiter with a streetwise persona focused on attracting players to the cannabis trading game.

## Features

### 🤖 Grench Persona
- **Name**: Grench 🎮
- **Role**: Underground Trading Network Recruiter
- **Style**: Street-smart, engaging, focused on BUDZ tokens and gameplay
- **Target**: Cannabis trading enthusiasts and Web3 gamers

### 📢 Discord Messages

#### 1. Recruitment Messages
**Purpose**: Attract new players to THC Dope Budz
**Triggers**: Manual or scheduled

**Content Includes**:
- Game overview (45-day cycles, 16 cities, 8 strains)
- BUDZ token rewards (50 achievements, max 1,250 per round)
- GROWERZ NFT holder benefits (AI assistant access)
- Weekly leaderboard rewards
- Direct game link

#### 2. Daily Market Updates
**Purpose**: Keep community engaged with game statistics
**Triggers**: Daily automated reports

**Content Includes**:
- Active player count
- Running game rounds
- Total BUDZ distributed
- Current leaderboard leader
- Grench's trading tips

#### 3. Achievement Celebrations
**Purpose**: Celebrate player milestones publicly
**Triggers**: When players unlock achievements

**Content Includes**:
- Player identification (wallet prefix)
- Achievement name and description
- BUDZ reward amount
- Encouraging message for community

#### 4. Leaderboard Updates
**Purpose**: Announce weekly winners and rewards
**Triggers**: Weekly reward distribution

**Content Includes**:
- Top 10 player rankings with scores
- BUDZ rewards distributed
- Motivational message for next cycle

#### 5. New Player Welcomes
**Purpose**: Welcome new players and detect GROWERZ holders
**Triggers**: New wallet connections

**Content Includes**:
- Welcome message with wallet prefix
- Special recognition for GROWERZ NFT holders
- Encouragement to start trading

#### 6. Market Alerts
**Purpose**: Notify about significant price movements
**Triggers**: Large price changes in any city/strain combination

**Content Includes**:
- City and strain affected
- Price change percentage
- Trading urgency messaging

## API Endpoints

### Base URL: `/api/discord/`

#### POST `/recruit`
Send recruitment message to attract new players
```json
Response: {
  "success": true,
  "message": "Grench recruitment message sent to Discord"
}
```

#### POST `/daily-update`
Send daily market statistics
```json
Body: {
  "totalPlayers": 150,
  "activeRounds": 25,
  "totalRewards": 50000,
  "topPlayer": "Player123",
  "topScore": 125000
}
```

#### POST `/achievement`
Celebrate player achievements
```json
Body: {
  "playerName": "Trader456",
  "achievement": "First Million",
  "reward": 50
}
```

#### POST `/leaderboard`
Announce weekly winners
```json
Body: {
  "topPlayers": [
    {"name": "Champion", "score": 200000, "reward": 500},
    {"name": "Runner", "score": 180000, "reward": 300}
  ]
}
```

#### POST `/welcome`
Welcome new players
```json
Body: {
  "playerAddress": "98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK",
  "hasNFTs": true
}
```

#### POST `/market-alert`
Send price movement alerts
```json
Body: {
  "city": "New York",
  "strain": "OG Kush",
  "priceChange": 25.5
}
```

#### POST `/test`
Test webhook connection
```json
Response: {
  "success": true,
  "message": "Grench webhook test successful"
}
```

#### GET `/status`
Check integration status
```json
Response: {
  "success": true,
  "webhookConfigured": true,
  "grenchPersona": {
    "name": "Grench 🎮",
    "role": "Underground Trading Network Recruiter"
  }
}
```

## Configuration

Set the `DISCORD_WEBHOOK_URL` environment variable to enable Discord integration:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

## Usage Examples

### Manual Recruitment
```bash
curl -X POST http://localhost:5000/api/discord/recruit
```

### Achievement Celebration
```bash
curl -X POST http://localhost:5000/api/discord/achievement \
  -H "Content-Type: application/json" \
  -d '{"playerName":"TopTrader","achievement":"Million Dollar Move","reward":100}'
```

### Market Alert
```bash
curl -X POST http://localhost:5000/api/discord/market-alert \
  -H "Content-Type: application/json" \
  -d '{"city":"Los Angeles","strain":"Purple Haze","priceChange":-15.2}'
```

## Grench's Trading Tips

Random tips included in daily updates:
- "Watch for price patterns - history repeats itself in the underground"
- "NYC prices are wild but the profit margins... 🤑"
- "Don't sleep on Detroit - hidden gems for those who know"
- "GROWERZ holders got insider info - use it wisely"
- "Achievement hunting pays - every BUDZ counts"

## Integration with Game Events

The Discord integration can be triggered automatically by:
- New player registrations
- Achievement unlocks
- Leaderboard updates
- Significant price movements
- Daily statistics compilation

This creates an engaging community experience that drives player retention and recruitment through Grench's underground network persona.