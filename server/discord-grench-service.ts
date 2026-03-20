/**
 * Discord Grench Service for THC Dope Budz
 * AI-powered community engagement and player recruitment
 */

import fetch from 'node-fetch';

interface DiscordWebhookMessage {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: {
      text: string;
    };
    timestamp?: string;
  }>;
  username?: string;
  avatar_url?: string;
}

interface GameStats {
  totalPlayers: number;
  activeRounds: number;
  totalRewards: number;
  topPlayer?: string;
  topScore?: number;
}

class DiscordGrenchService {
  private webhookUrl: string;
  private grenchPersona = {
    username: "Grench 🎮",
    avatar_url: "https://i.imgur.com/grench-avatar.png", // Can be updated with actual avatar
  };

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      console.warn('⚠️ DISCORD_WEBHOOK_URL not configured - Discord notifications disabled');
    }
  }

  /**
   * Send recruitment message to Discord
   */
  async sendRecruitmentMessage(): Promise<void> {
    if (!this.webhookUrl) return;

    const message: DiscordWebhookMessage = {
      ...this.grenchPersona,
      embeds: [{
        title: "🌿 Ready to Stack Some BUDZ? 💰",
        description: "Yo cannabis traders! The streets are HOT and the BUDZ market is PUMPING! 🔥\n\nTime to prove you got what it takes in the underground economy...",
        color: 0x4CAF50, // Green color
        fields: [
          {
            name: "🎯 What's the Play?",
            value: "• Buy low, sell high across 16 cities\n• Stack BUDZ tokens for real rewards\n• Complete 50 achievements (1,250 BUDZ max)\n• Outsmart the competition in 45-day cycles",
            inline: false
          },
          {
            name: "💎 For GROWERZ Holders",
            value: "Got THC LABZ GROWERZ NFTs? Your strain becomes your personal AI assistant! Get insider tips and market intelligence that regular players can't access.",
            inline: false
          },
          {
            name: "🏆 Weekly Rewards",
            value: "Top 10 players split the BUDZ pot every week. Think you can climb the leaderboard?",
            inline: false
          },
          {
            name: "🚀 Join the Game",
            value: "[**PLAY THC DOPE BUDZ NOW**](https://your-game-url.replit.app)\n\nConnect your Solana wallet and start trading!",
            inline: false
          }
        ],
        footer: {
          text: "Grench's Underground Trading Network • Real BUDZ • Real Rewards"
        },
        timestamp: new Date().toISOString()
      }]
    };

    await this.sendWebhook(message);
  }

  /**
   * Send daily market update
   */
  async sendDailyUpdate(stats: GameStats): Promise<void> {
    if (!this.webhookUrl) return;

    const message: DiscordWebhookMessage = {
      ...this.grenchPersona,
      embeds: [{
        title: "📊 Daily Market Report from Grench",
        description: "Streets been busy! Here's what's happening in the underground...",
        color: 0xFF9800, // Orange color
        fields: [
          {
            name: "👥 Active Traders",
            value: `${stats.totalPlayers} players grinding`,
            inline: true
          },
          {
            name: "🔄 Active Rounds",
            value: `${stats.activeRounds} games running`,
            inline: true
          },
          {
            name: "💰 BUDZ Distributed",
            value: `${stats.totalRewards.toLocaleString()} tokens`,
            inline: true
          },
          {
            name: "👑 Top Dog",
            value: stats.topPlayer ? `${stats.topPlayer} - ${stats.topScore?.toLocaleString()} points` : "Nobody claiming the throne yet...",
            inline: false
          },
          {
            name: "💭 Grench's Tip",
            value: this.getRandomTip(),
            inline: false
          }
        ],
        footer: {
          text: "Stay sharp. Market changes fast. - Grench"
        },
        timestamp: new Date().toISOString()
      }]
    };

    await this.sendWebhook(message);
  }

  /**
   * Send achievement celebration
   */
  async sendAchievementCelebration(playerName: string, achievement: string, reward: number): Promise<void> {
    if (!this.webhookUrl) return;

    const message: DiscordWebhookMessage = {
      ...this.grenchPersona,
      content: `🎉 **${playerName}** just unlocked "${achievement}" and earned **${reward} BUDZ**!\n\nThat's how you hustle! Who's next? 👀`,
    };

    await this.sendWebhook(message);
  }

  /**
   * Send leaderboard update
   */
  async sendLeaderboardUpdate(topPlayers: Array<{name: string, score: number, reward: number}>): Promise<void> {
    if (!this.webhookUrl) return;

    const leaderboard = topPlayers.map((player, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
      return `${medal} **${player.name}** - ${player.score.toLocaleString()} pts (${player.reward} BUDZ)`;
    }).join('\n');

    const message: DiscordWebhookMessage = {
      ...this.grenchPersona,
      embeds: [{
        title: "🏆 Weekly Leaderboard - BUDZ Rewards Dropped!",
        description: "The hustle paid off! Here's who dominated the streets this week:",
        color: 0xFFD700, // Gold color
        fields: [
          {
            name: "👑 Top Performers",
            value: leaderboard,
            inline: false
          },
          {
            name: "🔥 Next Week",
            value: "New cycle starting! Fresh opportunities to climb the ranks and stack BUDZ. You in?",
            inline: false
          }
        ],
        footer: {
          text: "Real players. Real BUDZ. Real rewards. - Grench"
        },
        timestamp: new Date().toISOString()
      }]
    };

    await this.sendWebhook(message);
  }

  /**
   * Send new player welcome
   */
  async sendNewPlayerWelcome(playerAddress: string, hasNFTs: boolean): Promise<void> {
    if (!this.webhookUrl) return;

    const nftBonus = hasNFTs ? "\n\n🌟 **GROWERZ HOLDER DETECTED!** Your AI assistant is ready to help you dominate!" : "";

    const message: DiscordWebhookMessage = {
      ...this.grenchPersona,
      content: `🎯 Fresh blood on the streets! **${playerAddress.slice(0, 8)}...** just connected their wallet.${nftBonus}\n\nTime to see what you're made of! 💪`,
    };

    await this.sendWebhook(message);
  }

  /**
   * Send market alert
   */
  async sendMarketAlert(city: string, strain: string, priceChange: number): Promise<void> {
    if (!this.webhookUrl) return;

    const trend = priceChange > 0 ? "📈 PUMPING" : "📉 DUMPING";
    const emoji = priceChange > 0 ? "🚀" : "💥";

    const message: DiscordWebhookMessage = {
      ...this.grenchPersona,
      content: `${emoji} **MARKET ALERT** ${emoji}\n\n${strain} in ${city} is ${trend} ${Math.abs(priceChange)}%!\n\nSmart traders are already making moves... 👀`,
    };

    await this.sendWebhook(message);
  }

  /**
   * Get random trading tip
   */
  private getRandomTip(): string {
    const tips = [
      "Watch for price patterns - history repeats itself in the underground",
      "NYC prices are wild but the profit margins... 🤑",
      "Don't sleep on Detroit - hidden gems for those who know",
      "Miami's always hot, but so is the competition",
      "San Francisco tech bros pay premium - exploit that",
      "Chicago's got steady demand - reliable profit",
      "Las Vegas is all about timing the tourist waves",
      "GROWERZ holders got insider info - use it wisely",
      "Achievement hunting pays - every BUDZ counts",
      "Risk management separates pros from amateurs"
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  /**
   * Send webhook message
   */
  private async sendWebhook(message: DiscordWebhookMessage): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.error('Failed to send Discord webhook:', response.status, response.statusText);
      } else {
        console.log('✅ Grench message sent to Discord');
      }
    } catch (error) {
      console.error('Error sending Discord webhook:', error);
    }
  }

  /**
   * Test webhook connection
   */
  async testWebhook(): Promise<boolean> {
    if (!this.webhookUrl) return false;

    try {
      const testMessage: DiscordWebhookMessage = {
        ...this.grenchPersona,
        content: "🔧 **Grench system online!** THC Dope Budz notifications active. Let's get this BUDZ! 🌿💰",
      };

      await this.sendWebhook(testMessage);
      return true;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }
}

export const discordGrench = new DiscordGrenchService();