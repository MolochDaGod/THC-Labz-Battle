/**
 * Enhanced Game Save Service
 * Handles saving/loading game state with inventory and comprehensive action logging
 */

import { storage } from './storage';
import { eq, and, desc } from 'drizzle-orm';
import type { GameSaveData, PlayerAction } from '../shared/game-saves-schema';

class GameSaveService {
  /**
   * Save complete game state with inventory and action log
   */
  async saveGameState(saveData: GameSaveData): Promise<{ success: boolean; message: string }> {
    try {
      const saveKey = `save_${saveData.walletAddress}_${saveData.gameRoundId}`;
      
      // Enhanced save data with complete inventory and action history
      const completeGameSave = {
        ...saveData,
        savedAt: new Date().toISOString(),
        version: '2.0' // Version tracking for save compatibility
      };

      // Save to localStorage-style storage for immediate access
      localStorage.setItem(saveKey, JSON.stringify(completeGameSave));

      // Also save action log entry
      await this.logPlayerAction(
        saveData.walletAddress,
        saveData.gameRoundId,
        saveData.day,
        {
          id: `save_${Date.now()}`,
          day: saveData.day,
          time: new Date().toLocaleTimeString(),
          type: 'special',
          description: `Game progress saved on day ${saveData.day}`,
          details: {
            location: saveData.currentCity,
            money: saveData.money,
            inventory: Object.keys(saveData.inventory).length
          },
          result: 'success'
        }
      );

      console.log(`💾 Game saved for ${saveData.walletAddress} - Day ${saveData.day}, Money: $${saveData.money.toLocaleString()}`);
      
      return {
        success: true,
        message: `Game saved: Day ${saveData.day} progress saved successfully`
      };

    } catch (error) {
      console.error('❌ Save game error:', error);
      return {
        success: false,
        message: 'Failed to save game progress'
      };
    }
  }

  /**
   * Load saved game state with full inventory and action history
   */
  async loadGameState(walletAddress: string, gameRoundId?: string): Promise<GameSaveData | null> {
    try {
      // Try to find most recent save for this wallet
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`save_${walletAddress}`)
      );

      if (keys.length === 0) {
        console.log(`🔍 No saves found for wallet: ${walletAddress}`);
        return null;
      }

      // Get most recent save
      const mostRecentKey = keys.sort().pop();
      if (!mostRecentKey) return null;

      const saveDataStr = localStorage.getItem(mostRecentKey);
      if (!saveDataStr) return null;

      const saveData = JSON.parse(saveDataStr) as GameSaveData & { savedAt: string; version: string };
      
      console.log(`🔄 Loaded save from ${saveData.savedAt} - Day ${saveData.day}, Money: $${saveData.money.toLocaleString()}`);
      
      return saveData;

    } catch (error) {
      console.error('❌ Load game error:', error);
      return null;
    }
  }

  /**
   * Log player action for detailed gameplay tracking
   */
  async logPlayerAction(
    walletAddress: string, 
    gameRoundId: string, 
    day: number, 
    action: PlayerAction
  ): Promise<void> {
    try {
      // Get existing action log from save data
      const saveKey = `save_${walletAddress}_${gameRoundId}`;
      const existingSave = localStorage.getItem(saveKey);
      
      if (existingSave) {
        const saveData = JSON.parse(existingSave);
        if (!saveData.actionLog) saveData.actionLog = [];
        
        // Add new action
        saveData.actionLog.push({
          ...action,
          timestamp: new Date().toISOString()
        });

        // Keep only last 200 actions to prevent save bloat
        if (saveData.actionLog.length > 200) {
          saveData.actionLog = saveData.actionLog.slice(-200);
        }

        // Update save
        localStorage.setItem(saveKey, JSON.stringify(saveData));
      }

      console.log(`📝 Logged action: ${action.type} - ${action.description}`);

    } catch (error) {
      console.error('❌ Error logging player action:', error);
    }
  }

  /**
   * Get player action log for display
   */
  async getPlayerActionLog(walletAddress: string, gameRoundId: string): Promise<PlayerAction[]> {
    try {
      const saveKey = `save_${walletAddress}_${gameRoundId}`;
      const saveData = localStorage.getItem(saveKey);
      
      if (saveData) {
        const parsed = JSON.parse(saveData);
        return parsed.actionLog || [];
      }

      return [];

    } catch (error) {
      console.error('❌ Error getting action log:', error);
      return [];
    }
  }

  /**
   * Generate action log summary for display
   */
  generateActionSummary(actions: PlayerAction[]): string {
    const summary = {
      trades: actions.filter(a => a.type === 'buy' || a.type === 'sell').length,
      travels: actions.filter(a => a.type === 'travel').length,
      events: actions.filter(a => a.type === 'event').length,
      missions: actions.filter(a => a.type === 'mission').length,
      achievements: actions.filter(a => a.type === 'achievement').length,
      totalProfit: actions
        .filter(a => a.details.profit)
        .reduce((sum, a) => sum + (a.details.profit || 0), 0),
      totalTransactions: actions.filter(a => a.details.price).length
    };

    return `
📊 GAMEPLAY SUMMARY
🏪 Trades: ${summary.trades}
✈️ Travels: ${summary.travels}
⚡ Events: ${summary.events}
🎯 Missions: ${summary.missions}
🏆 Achievements: ${summary.achievements}
💰 Net Profit: $${summary.totalProfit.toLocaleString()}
📈 Transactions: ${summary.totalTransactions}
    `.trim();
  }
}

export const gameSaveService = new GameSaveService();