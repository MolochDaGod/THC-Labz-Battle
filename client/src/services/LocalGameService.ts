// Local Storage Game Service - pure browser storage, no external dependencies
export interface PlayerData {
  walletAddress: string;
  nftData?: any;
  wins: number;
  losses: number;
  totalBattles: number;
  highestCrowns: number;
  lastPlayed: string;
  rank: number;
  experience: number;
}

export interface BattleResult {
  playerId: string;
  opponentType: 'ai' | 'player';
  winner: 'player' | 'ai';
  playerCrowns: number;
  enemyCrowns: number;
  battleDuration: number;
  damageDealt: number;
  unitsDeployed: number;
  nftBonusUsed: boolean;
  timestamp: string;
}

export class LocalGameService {
  
  // Save or update player data
  static async savePlayerData(walletAddress: string, nftData?: any): Promise<void> {
    try {
      const existingData = localStorage.getItem(`player_${walletAddress}`);
      let playerData: PlayerData;

      if (existingData) {
        // Update existing player
        playerData = JSON.parse(existingData);
        playerData.nftData = nftData;
        playerData.lastPlayed = new Date().toISOString();
      } else {
        // Create new player
        playerData = {
          walletAddress,
          nftData,
          wins: 0,
          losses: 0,
          totalBattles: 0,
          highestCrowns: 0,
          lastPlayed: new Date().toISOString(),
          rank: 1000, // Starting rank
          experience: 0
        };
      }
      
      localStorage.setItem(`player_${walletAddress}`, JSON.stringify(playerData));
      console.log('💾 Player data saved locally for', walletAddress.substring(0, 8) + '...');
    } catch (error) {
      console.warn('❌ Failed to save player data locally:', error);
    }
  }

  // Save NFT bonuses 
  static async saveNFTBonuses(walletAddress: string, bonuses: any): Promise<void> {
    try {
      localStorage.setItem(`nft_bonuses_${walletAddress}`, JSON.stringify(bonuses));
      console.log('💾 NFT bonuses saved locally for', walletAddress.substring(0, 8) + '...');
    } catch (error) {
      console.warn('❌ Failed to save NFT bonuses locally:', error);
    }
  }

  // Get player data
  static async getPlayerData(walletAddress: string): Promise<PlayerData | null> {
    try {
      const data = localStorage.getItem(`player_${walletAddress}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('❌ Failed to get player data:', error);
      return null;
    }
  }

  // Save battle result
  static async saveBattleResult(result: BattleResult): Promise<void> {
    try {
      const battles = this.getBattleHistory(result.playerId);
      battles.push({
        ...result,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 battles
      if (battles.length > 50) {
        battles.splice(0, battles.length - 50);
      }
      
      localStorage.setItem(`battles_${result.playerId}`, JSON.stringify(battles));
      
      // Update player stats
      const playerData = await this.getPlayerData(result.playerId);
      if (playerData) {
        playerData.totalBattles++;
        if (result.winner === 'player') {
          playerData.wins++;
          playerData.experience += 10;
        } else {
          playerData.losses++;
          playerData.experience += 5;
        }
        
        if (result.playerCrowns > playerData.highestCrowns) {
          playerData.highestCrowns = result.playerCrowns;
        }
        
        await this.savePlayerData(result.playerId, playerData.nftData);
      }
    } catch (error) {
      console.warn('❌ Failed to save battle result:', error);
    }
  }

  // Get battle history
  static getBattleHistory(walletAddress: string): BattleResult[] {
    try {
      const data = localStorage.getItem(`battles_${walletAddress}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('❌ Failed to get battle history:', error);
      return [];
    }
  }

  // Get leaderboard data (mock for local storage)
  static async getLeaderboard(limit: number = 10): Promise<PlayerData[]> {
    try {
      const players: PlayerData[] = [];
      
      // Get all player data from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('player_')) {
          const data = localStorage.getItem(key);
          if (data) {
            players.push(JSON.parse(data));
          }
        }
      }
      
      // Sort by wins, then by experience
      return players
        .sort((a, b) => (b.wins - a.wins) || (b.experience - a.experience))
        .slice(0, limit);
    } catch (error) {
      console.warn('❌ Failed to get leaderboard:', error);
      return [];
    }
  }
}