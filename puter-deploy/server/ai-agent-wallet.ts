/**
 * AI Agent Wallet Management System
 * Manages the Grench AI wallet for token distribution and batch operations
 */

import { crossmintService } from './crossmint';
import { storage } from './storage';
import { users } from '../shared/schema';
import { sql } from 'drizzle-orm';

interface AIAgentWallet {
  address: string;
  budzBalance: number;
  gbuxBalance: number;
  thcLabzBalance: number;
  lastUpdated: Date;
}

class AIAgentWalletService {
  private static readonly AI_AGENT_WALLET_ID = 'grench-ai-master-wallet';
  private static readonly AI_AGENT_SOLANA_ADDRESS = 'ErSGeWkLuKqmW2MNrcFWPsYryNPXDW224GmgNBf8ZT65';
  
  /**
   * Initialize or get existing AI agent wallet
   */
  async initializeAIAgentWallet(): Promise<AIAgentWallet> {
    try {
      console.log('🤖 Initializing Grench AI Agent wallet...');
      
      const db = storage.getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Check if AI agent wallet already exists in database
      const existingAgent = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${AIAgentWalletService.AI_AGENT_SOLANA_ADDRESS}`)
        .limit(1);

      if (existingAgent.length > 0) {
        console.log('✅ AI Agent wallet found in database');
        return {
          address: existingAgent[0].serverWallet,
          budzBalance: existingAgent[0].budzBalance,
          gbuxBalance: existingAgent[0].gbuxBalance,
          thcLabzBalance: 0, // THC LABZ not stored in database yet
          lastUpdated: new Date(existingAgent[0].updatedAt || existingAgent[0].createdAt)
        };
      }

      // Create real Crossmint wallet for AI Agent - NO FALLBACKS
      const wallet = await crossmintService.createWallet(AIAgentWalletService.AI_AGENT_WALLET_ID);
      const serverWalletAddress = wallet.address;
      console.log(`✅ Real Crossmint AI Agent wallet created: ${serverWalletAddress}`);

      // Insert AI agent into database with 1 billion tokens (within integer range)
      const aiAgentUser = await db.insert(users).values({
        username: 'Grench_AI_Agent',
        password: 'ai_secure_password',
        walletAddress: AIAgentWalletService.AI_AGENT_SOLANA_ADDRESS,
        serverWallet: serverWalletAddress,
        budzBalance: 1000000000, // 1 billion BUDZ (within PostgreSQL integer range)
        gbuxBalance: 1000000000  // 1 billion GBUX (within PostgreSQL integer range)
      }).returning();

      console.log('🤖 AI Agent wallet initialized with 1B tokens each');

      return {
        address: serverWalletAddress,
        budzBalance: aiAgentUser[0].budzBalance,
        gbuxBalance: aiAgentUser[0].gbuxBalance,
        thcLabzBalance: 1000000000, // 1 billion THC LABZ
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to initialize AI Agent wallet:', error);
      throw error;
    }
  }

  /**
   * Transfer tokens from AI agent wallet to user wallet
   */
  async transferTokensFromAI(
    recipientWallet: string,
    tokenType: 'budz' | 'gbux' | 'thc_labz',
    amount: number,
    reason: string = 'AI Agent Transfer'
  ): Promise<boolean> {
    try {
      console.log(`🤖 AI Agent transferring ${amount} ${tokenType.toUpperCase()} to ${recipientWallet}`);
      
      const db = storage.getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Get AI agent wallet
      const aiAgent = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${AIAgentWalletService.AI_AGENT_SOLANA_ADDRESS}`)
        .limit(1);

      if (aiAgent.length === 0) {
        throw new Error('AI Agent wallet not found');
      }

      // Get recipient wallet
      const recipient = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${recipientWallet}`)
        .limit(1);

      if (recipient.length === 0) {
        throw new Error('Recipient wallet not found');
      }

      // Check AI agent has sufficient balance
      const currentBalance = tokenType === 'budz' ? aiAgent[0].budzBalance : aiAgent[0].gbuxBalance;
      if (currentBalance < amount) {
        throw new Error(`Insufficient AI Agent ${tokenType} balance: ${currentBalance} < ${amount}`);
      }

      // Update balances in database
      const aiUpdateField = tokenType === 'budz' ? 'budzBalance' : 'gbuxBalance';
      const recipientUpdateField = tokenType === 'budz' ? 'budzBalance' : 'gbuxBalance';

      // Deduct from AI agent
      await db.update(users)
        .set({
          [aiUpdateField]: sql`${tokenType === 'budz' ? users.budzBalance : users.gbuxBalance} - ${amount}`
        })
        .where(sql`${users.walletAddress} = ${AIAgentWalletService.AI_AGENT_SOLANA_ADDRESS}`);

      // Add to recipient
      await db.update(users)
        .set({
          [recipientUpdateField]: sql`${tokenType === 'budz' ? users.budzBalance : users.gbuxBalance} + ${amount}`
        })
        .where(sql`${users.walletAddress} = ${recipientWallet}`);

      console.log(`✅ AI Agent transfer completed: ${amount} ${tokenType.toUpperCase()} → ${recipientWallet}`);
      console.log(`📝 Reason: ${reason}`);

      return true;

    } catch (error) {
      console.error('❌ AI Agent transfer failed:', error);
      return false;
    }
  }

  /**
   * Get AI agent wallet status
   */
  async getAIAgentStatus(): Promise<AIAgentWallet | null> {
    try {
      const db = storage.getDb();
      if (!db) {
        return null;
      }

      const aiAgent = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${AIAgentWalletService.AI_AGENT_SOLANA_ADDRESS}`)
        .limit(1);

      if (aiAgent.length === 0) {
        return null;
      }

      return {
        address: aiAgent[0].serverWallet,
        budzBalance: aiAgent[0].budzBalance,
        gbuxBalance: aiAgent[0].gbuxBalance,
        thcLabzBalance: 1000000000, // Static for now - 1 billion
        lastUpdated: new Date(aiAgent[0].updatedAt || aiAgent[0].createdAt)
      };

    } catch (error) {
      console.error('❌ Failed to get AI Agent status:', error);
      return null;
    }
  }

  /**
   * Process batch token distributions (for daily rewards)
   */
  async processBatchDistribution(distributions: Array<{
    walletAddress: string;
    tokenType: 'budz' | 'gbux';
    amount: number;
    reason: string;
  }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log(`🤖 AI Agent processing batch distribution: ${distributions.length} transfers`);

    for (const distribution of distributions) {
      const transferred = await this.transferTokensFromAI(
        distribution.walletAddress,
        distribution.tokenType,
        distribution.amount,
        distribution.reason
      );

      if (transferred) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`✅ Batch distribution complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }
}

export const aiAgentWallet = new AIAgentWalletService();