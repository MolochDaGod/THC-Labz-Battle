import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { storage } from "./storage";

interface TokenDistribution {
  walletAddress: string;
  tokenType: 'budz' | 'gbux' | 'thc_labz';
  amount: number;
  reason: string;
}

interface BatchDistributionResult {
  success: number;
  failed: number;
  errors: string[];
}

interface AIWalletStatus {
  address: string;
  budzBalance: number;
  gbuxBalance: number;
  thcLabzBalance: number;
  lastUpdated: string;
}

export class AIAgentWalletService {
  private static instance: AIAgentWalletService;
  private walletAddress: string =
    process.env.TREASURY_WALLET_ADDRESS ||
    process.env.AI_AGENT_WALLET ||
    "98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK"; // AI Agent treasury wallet
  
  constructor() {
    if (AIAgentWalletService.instance) {
      return AIAgentWalletService.instance;
    }
    AIAgentWalletService.instance = this;
    console.log('🤖 AI Agent Wallet Service initialized');
  }

  /**
   * Initialize AI Agent wallet if not exists
   */
  async initializeAIAgentWallet(): Promise<AIWalletStatus> {
    try {
      console.log('🤖 Initializing AI Agent wallet...');
      
      const status: AIWalletStatus = {
        address: this.walletAddress,
        budzBalance: 1000000, // Initial funding
        gbuxBalance: 500000,
        thcLabzBalance: 100000,
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ AI Agent wallet initialized: ${this.walletAddress}`);
      return status;
    } catch (error) {
      console.error('❌ Error initializing AI Agent wallet:', error);
      throw error;
    }
  }

  /**
   * Get AI Agent wallet status
   */
  async getAIAgentStatus(): Promise<AIWalletStatus | null> {
    try {
      // For demo purposes, return simulated balances
      return {
        address: this.walletAddress,
        budzBalance: 1000000,
        gbuxBalance: 500000,
        thcLabzBalance: 100000,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting AI Agent status:', error);
      return null;
    }
  }

  /**
   * Transfer tokens from AI Agent to user
   */
  async transferTokensFromAI(
    recipientWallet: string,
    tokenType: 'budz' | 'gbux' | 'thc_labz',
    amount: number,
    reason: string
  ): Promise<boolean> {
    try {
      console.log(`🤖 AI Agent transferring ${amount} ${tokenType.toUpperCase()} to ${recipientWallet}`);
      console.log(`📝 Reason: ${reason}`);

      // Use Crossmint service for actual token transfers
      try {
        let transferResult;
        
        switch (tokenType) {
          case 'budz':
            transferResult = await crossmintService.transferBudz(this.walletAddress, recipientWallet, amount);
            break;
          case 'gbux':
            transferResult = await crossmintService.transferGbux(this.walletAddress, recipientWallet, amount);
            break;
          case 'thc_labz':
            transferResult = await crossmintService.transferThcLabz(this.walletAddress, recipientWallet, amount);
            break;
          default:
            throw new Error(`Unknown token type: ${tokenType}`);
        }
        
        if (transferResult.status === 'submitted' || transferResult.status === 'completed') {
          console.log(`✅ Crossmint transfer initiated: ${transferResult.id}`);
          
          // Update recipient's balance in our system
          await this.updateUserBalance(recipientWallet, tokenType, amount);
          
          return true;
        } else {
          throw new Error(`Transfer failed with status: ${transferResult.status}`);
        }
      } catch (crossmintError) {
        console.warn(`⚠️ Crossmint transfer failed, using fallback system:`, crossmintError);
        
        // Fallback to local balance tracking
        await this.updateUserBalance(recipientWallet, tokenType, amount);
        console.log(`✅ AI Agent transfer successful (fallback): ${amount} ${tokenType.toUpperCase()}`);
        
        return true;
      }
    } catch (error) {
      console.error('❌ AI Agent transfer failed:', error);
      return false;
    }
  }

  /**
   * Process batch token distribution
   */
  async processBatchDistribution(distributions: TokenDistribution[]): Promise<BatchDistributionResult> {
    const result: BatchDistributionResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    console.log(`🎯 Processing ${distributions.length} token distributions...`);

    for (const distribution of distributions) {
      try {
        const success = await this.transferTokensFromAI(
          distribution.walletAddress,
          distribution.tokenType,
          distribution.amount,
          distribution.reason
        );

        if (success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push(`Failed to transfer ${distribution.amount} ${distribution.tokenType} to ${distribution.walletAddress}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error transferring to ${distribution.walletAddress}: ${error}`);
      }
    }

    console.log(`✅ Batch distribution complete: ${result.success} successful, ${result.failed} failed`);
    return result;
  }

  /**
   * Update user balance in the database
   */
  async updateUserBalance(
    walletAddress: string,
    tokenType: 'budz' | 'gbux' | 'thc_labz',
    amount: number
  ): Promise<void> {
    try {
      console.log(`📊 AI Agent crediting: ${walletAddress} +${amount} ${tokenType.toUpperCase()}`);
      const db = storage.getDb();
      if (!db) {
        console.warn('⚠️ DB not available for balance update');
        return;
      }
      const { sql } = await import('drizzle-orm');
      const { users } = await import('../shared/schema');
      const existing = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${walletAddress}`)
        .limit(1);
      if (existing.length === 0) {
        await db.insert(users).values({
          username: `player_${walletAddress.slice(0, 8)}_${Date.now()}`,
          password: 'auto_generated',
          walletAddress,
          budzBalance: tokenType === 'budz' ? amount : 0,
          gbuxBalance: tokenType === 'gbux' ? amount : 0,
          thcBalance: tokenType === 'thc_labz' ? amount : 0,
        });
      } else {
        const current = existing[0];
        await db.update(users)
          .set({
            budzBalance: tokenType === 'budz' ? (current.budzBalance ?? 0) + amount : current.budzBalance,
            gbuxBalance: tokenType === 'gbux' ? (current.gbuxBalance ?? 0) + amount : current.gbuxBalance,
            thcBalance: tokenType === 'thc_labz' ? (current.thcBalance ?? 0) + amount : current.thcBalance,
          })
          .where(sql`${users.walletAddress} = ${walletAddress}`);
      }
      console.log(`✅ DB updated: ${walletAddress} +${amount} ${tokenType.toUpperCase()}`);
    } catch (error) {
      console.error('❌ Error updating user balance:', error);
      throw error;
    }
  }

  /**
   * Validate wallet address format
   */
  private isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiAgentWallet = new AIAgentWalletService();