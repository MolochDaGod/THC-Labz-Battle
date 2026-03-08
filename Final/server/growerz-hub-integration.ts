/**
 * Growerz Hub Integration for THC Dope Budz
 * Connects the two games through shared wallet state and NFT data
 */

import { Request, Response } from 'express';
import { howRareService } from './howrare-api.js';

interface GrowerszHubState {
  walletAddress: string;
  nftCount: number;
  gameLevel: number;
  achievements: string[];
  lastPlayed: string;
  totalScore: number;
  growerPoints: number;
}

interface DopeWarsState {
  walletAddress: string;
  currentDay: number;
  money: number;
  health: number;
  currentCity: string;
  achievements: string[];
  totalBudz: number;
  gameRound: number;
}

class GrowerHubIntegration {
  /**
   * Sync wallet state between THC Dope Budz and Growerz Hub
   */
  async syncWalletState(walletAddress: string): Promise<any> {
    try {
      // Get GROWERZ NFTs for wallet
      const response = await fetch(`http://localhost:5000/api/nft/growerz/${walletAddress}`);
      const nftData = await response.json();
      
      // Get user achievements from Dope Budz
      const achievementResponse = await fetch(`http://localhost:5000/api/achievements/user/${walletAddress}`);
      const achievementData = await achievementResponse.json();
      
      return {
        walletAddress,
        nftData: nftData.success ? nftData : null,
        achievements: achievementData.success ? achievementData.achievements : [],
        connectedGames: ['THC Dope Budz', 'Growerz Hub'],
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error('Wallet sync error:', error);
      return {
        walletAddress,
        error: 'Failed to sync wallet state',
        lastSync: new Date().toISOString()
      };
    }
  }

  /**
   * Generate iframe embedding code for Growerz Hub
   */
  generateGrowerHubEmbed(walletAddress: string, gameMode: string = 'standard'): string {
    const baseUrl = 'https://growerz.thc-labz.xyz';
    const params = new URLSearchParams({
      wallet: walletAddress,
      mode: gameMode,
      source: 'thc-dope-budz',
      integration: 'true'
    });

    return `
      <iframe 
        id="growerz-hub-frame"
        src="${baseUrl}?${params.toString()}"
        style="width: 100%; height: 600px; border: none; border-radius: 8px;"
        frameborder="0"
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      ></iframe>
    `;
  }

  /**
   * Handle cross-game communication via postMessage
   */
  setupCrossGameCommunication(): string {
    return `
      <script>
        // Listen for messages from Growerz Hub
        window.addEventListener('message', function(event) {
          if (event.origin !== 'https://growerz.thc-labz.xyz') return;
          
          const { type, data } = event.data;
          
          switch(type) {
            case 'GROWERZ_SCORE_UPDATE':
              console.log('🌱 Growerz score update:', data);
              // Update local game state
              break;
              
            case 'GROWERZ_NFT_EQUIPPED':
              console.log('🌱 NFT equipped in Growerz Hub:', data);
              // Apply NFT buffs to Dope Budz
              break;
              
            case 'GROWERZ_ACHIEVEMENT_UNLOCKED':
              console.log('🌱 Growerz achievement unlocked:', data);
              // Cross-game achievement sync
              break;
              
            case 'GROWERZ_READY':
              console.log('🌱 Growerz Hub loaded and ready');
              // Send initial wallet state
              sendToGrowerHub('WALLET_STATE', getCurrentWalletState());
              break;
          }
        });
        
        // Send messages to Growerz Hub
        function sendToGrowerHub(type, data) {
          const iframe = document.getElementById('growerz-hub-frame');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type, data }, 'https://growerz.thc-labz.xyz');
          }
        }
        
        // Get current wallet state from Dope Budz
        function getCurrentWalletState() {
          const gameState = JSON.parse(localStorage.getItem('dopeWarsGameState') || '{}');
          const walletData = JSON.parse(localStorage.getItem('walletData') || '{}');
          
          return {
            type: 'WALLET_STATE',
            gameState: {
              money: gameState.money || 0,
              day: gameState.day || 1,
              health: gameState.health || 100,
              currentCity: gameState.currentCity || 'hometown',
              achievements: gameState.achievements || []
            },
            wallet: {
              address: walletData.address,
              type: walletData.type,
              connected: walletData.connected,
              serverWallet: walletData.serverWallet,
              budzBalance: walletData.budzBalance || 0,
              gbuxBalance: walletData.gbuxBalance || 0
            }
          };
        }
        
        // Send wallet state when iframe loads
        document.getElementById('growerz-hub-frame').onload = function() {
          setTimeout(() => {
            sendToGrowerHub('WALLET_STATE', getCurrentWalletState());
          }, 1000);
        };
      </script>
    `;
  }

  /**
   * Create cross-game NFT bonus system
   */
  calculateCrossGameBonus(nftData: any, gameType: 'dope-budz' | 'growerz-hub'): any {
    if (!nftData || !nftData.nfts || nftData.nfts.length === 0) {
      return {
        multiplier: 1.0,
        bonusType: 'none',
        description: 'No GROWERZ NFTs detected'
      };
    }

    const nftCount = nftData.nfts.length;
    const hasRareNFT = nftData.nfts.some((nft: any) => 
      nft.attributes?.some((attr: any) => 
        attr.trait_type === 'Rarity' && 
        ['Epic', 'Legendary'].includes(attr.value)
      )
    );

    let multiplier = 1.0;
    let bonusType = 'standard';
    let description = '';

    // NFT count bonuses
    if (nftCount >= 10) {
      multiplier = 1.5;
      bonusType = 'whale';
      description = 'NFT Whale Bonus - 50% boost';
    } else if (nftCount >= 5) {
      multiplier = 1.3;
      bonusType = 'collector';
      description = 'NFT Collector Bonus - 30% boost';
    } else if (nftCount >= 1) {
      multiplier = 1.15;
      bonusType = 'holder';
      description = 'NFT Holder Bonus - 15% boost';
    }

    // Rarity bonuses
    if (hasRareNFT) {
      multiplier += 0.2;
      description += ' + Rare NFT Bonus';
    }

    // Game-specific bonuses
    if (gameType === 'dope-budz') {
      return {
        multiplier,
        bonusType,
        description,
        effects: {
          priceMultiplier: multiplier,
          achievementBonus: Math.floor(nftCount * 5), // 5 BUDZ per NFT
          specialEvents: hasRareNFT ? 'unlocked' : 'locked'
        }
      };
    } else {
      return {
        multiplier,
        bonusType,
        description,
        effects: {
          growthRate: multiplier,
          yieldBonus: Math.floor(nftCount * 10), // 10% per NFT
          rareStrains: hasRareNFT ? 'unlocked' : 'locked'
        }
      };
    }
  }
}

export const growerHubIntegration = new GrowerHubIntegration();

// API Routes for Growerz Hub Integration
export const growerHubRoutes = {
  /**
   * GET /api/growerz-hub/embed/:walletAddress
   * Generate iframe embed for Growerz Hub
   */
  async getEmbed(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      const { mode = 'standard' } = req.query;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      const embedCode = growerHubIntegration.generateGrowerHubEmbed(
        walletAddress, 
        mode as string
      );
      
      const communicationScript = growerHubIntegration.setupCrossGameCommunication();
      
      res.json({
        success: true,
        embedCode,
        communicationScript,
        walletAddress,
        mode
      });
    } catch (error) {
      console.error('Growerz Hub embed error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate embed'
      });
    }
  },

  /**
   * GET /api/growerz-hub/sync/:walletAddress
   * Sync wallet state between games
   */
  async syncWallet(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      const syncData = await growerHubIntegration.syncWalletState(walletAddress);
      
      res.json({
        success: true,
        syncData
      });
    } catch (error) {
      console.error('Wallet sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync wallet state'
      });
    }
  },

  /**
   * POST /api/growerz-hub/bonus/:walletAddress
   * Calculate cross-game NFT bonuses
   */
  async calculateBonus(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      const { gameType = 'dope-budz' } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      // Get NFT data
      const nftResponse = await fetch(`http://localhost:5000/api/nft/growerz/${walletAddress}`);
      const nftData = await nftResponse.json();
      
      const bonus = growerHubIntegration.calculateCrossGameBonus(nftData, gameType as any);
      
      res.json({
        success: true,
        walletAddress,
        gameType,
        bonus,
        nftCount: nftData.success ? nftData.count : 0
      });
    } catch (error) {
      console.error('Cross-game bonus calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate bonus'
      });
    }
  }
};