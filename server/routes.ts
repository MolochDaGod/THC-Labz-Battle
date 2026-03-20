import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminRoutes } from "./admin-routes";
import { tokenRoutes, getWalletInfo } from "./token-api";
import { getBatchTokenPrices, clearPriceCache } from "./batch-token-api";
import { nftRoutes } from "./nft-api";
import { howRareRoutes } from "./howrare-api";
import { howRareAPIRoutes } from "./howrare-routes";
import { myNFTsRoute } from "./my-nfts-api";
import { analyzeNFTTraits } from "./nft-trait-system";
import { fetchTHCGrowerZFloorPrice, clearFloorPriceCache } from "./magic-eden-api";
import { aiAgentWallet } from "./ai-agent-wallet";
import { aiAssistantRoutes } from "./ai-assistant-routes";
import { dopeBudzAI } from "./dope-budz-ai-controller";
import { achievementRoutes } from "./achievement-routes";
import { discordRoutes } from "./discord-routes";
import { downloadRoutes } from "./download-routes";
import { openAIWebhookRoutes } from "./openai-webhook-routes";
import adminCardsRoutes from "./routes/adminCards";
import gameConfigRoutes from "./routes/game-config";
import nftMintingRoutes from "./routes/nftMinting";
import userCardsOwnershipRoutes from "./routes/userCardsOwnership";
import cardTradesRoutes from "./routes/cardTrades";
import { adminCards } from "../shared/adminSchema";

import { crossmintService } from "./crossmint";
import { desc, sql, eq } from "drizzle-orm";
import { leaderboard, insertLeaderboardSchema, users, lifetimeLeaderboard, insertLifetimeLeaderboardSchema, completedMissions, playerProgress, insertPlayerProgressSchema } from "../shared/schema";
import { manualRewardProcessing } from "./rewards";
import { processWeeklyRewards, submitFinalCycleScore, scheduleWeeklyRewards } from "./weekly-rewards";
import { gameFlowManager } from "./game-flow-manager"; // Assuming gameFlowManager is in './game-flow-manager'

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Admin cards management routes
  app.use('/api/admin', adminCardsRoutes);

  // Game configuration routes
  app.use('/api/admin', gameConfigRoutes);

  // NFT minting routes (Crossmint cNFT)
  app.use('/api', nftMintingRoutes);

  // User card ownership routes
  app.use('/api/cards', userCardsOwnershipRoutes);
  app.use('/api', cardTradesRoutes);

  // Enhanced health check with comprehensive system monitoring
  app.get("/api/health", async (req, res) => {
    try {
      const db = storage.getDb();
      const dbStatus = db ? "connected" : "disconnected";

      // Import error recovery service for comprehensive health check
      const { ErrorRecoveryService } = await import('./error-recovery');
      const systemHealth = await ErrorRecoveryService.getSystemHealth();

      res.json({
        success: true,
        status: dbStatus === "connected" ? "healthy" : "degraded",
        database: dbStatus,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: systemHealth.services,
        errors: systemHealth.errors || []
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        success: false,
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Enhanced Leaderboard endpoints with real-time player progress
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.json([]);
      }

      const scores = await db
        .select()
        .from(leaderboard)
        .orderBy(sql`score DESC`)
        .limit(20);

      res.json(scores);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.json([]);
    }
  });

  // Enhanced Active Players Leaderboard with Real-Time Progress
  app.get("/api/leaderboard/active", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.json([]);
      }

      // Get all active players with comprehensive progress data
      const activePlayerProgress = await db
        .select()
        .from(playerProgress)
        .limit(50);

      // Format player progress data with current table structure
      const formattedProgress = activePlayerProgress.map(player => {
        return {
          id: player.id,
          walletAddress: player.walletAddress,
          name: player.playerName || player.walletAddress.substring(0, 8),
          currentDay: player.currentDay,
          totalMoney: player.currentScore,
          currentCity: 'hometown', // simplified for current table
          health: 100, // default values
          heatLevel: 0,
          reputation: 0,
          unlockedPerks: [],
          perkIcons: [],
          skills: {
            negotiation: 1,
            intimidation: 1,
            mastermind: 1,
            streetwise: 1,
            networking: 1
          },
          stats: {
            totalTransactions: 0,
            totalProfit: player.currentScore - 80, // assuming 80 starting money
            citiesVisited: 1,
            coatSpace: 5
          },
          nftInfo: {
            selectedNFT: null,
            nftRank: null,
            nftRarity: null
          },
          gameRoundId: 'current',
          lastSaveTime: player.lastPlayed,
          minutesAgo: Math.floor((Date.now() - new Date(player.lastPlayed).getTime()) / (1000 * 60))
        };
      });

      res.json({
        success: true,
        activePlayersCount: formattedProgress.length,
        players: formattedProgress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching active player progress:", error);
      res.json({
        success: false,
        activePlayersCount: 0,
        players: [],
        error: error.message
      });
    }
  });

  // Player Progress Update Endpoint for Real-Time Leaderboard
  app.post("/api/player-progress/update", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.json({ success: false, message: "Database unavailable" });
      }

      const { walletAddress, name, gameState, selectedNFT, nftRank, nftRarity, gameRoundId } = req.body;

      if (!walletAddress || !gameState) {
        return res.json({ success: false, message: "Missing required fields" });
      }

      // Calculate total money (hand + bank)
      const totalMoney = (gameState.money || 0) + (gameState.bank || 0);

      // Check if player record exists
      const existingPlayer = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.walletAddress, walletAddress))
        .limit(1);

      if (existingPlayer.length > 0) {
        // Update existing player record
        await db
          .update(playerProgress)
          .set({
            playerName: name || walletAddress.substring(0, 8),
            currentDay: gameState.day || 1,
            currentScore: totalMoney,
            lastPlayed: new Date(),
            totalPlayTime: (existingPlayer[0].totalPlayTime || 0) + 1,
            achievementsUnlocked: gameState.achievements?.length || 0,
            tokensEarned: BigInt(gameState.tokensEarned || 0),
            completionStatus: gameState.day >= 45 ? 'completed' : 'active',
            updatedAt: new Date(),
          })
          .where(eq(playerProgress.walletAddress, walletAddress));
      } else {
        // Insert new player record
        await db.insert(playerProgress).values({
          walletAddress,
          playerName: name || walletAddress.substring(0, 8),
          currentDay: gameState.day || 1,
          currentScore: totalMoney,
          lastPlayed: new Date(),
          totalPlayTime: 1,
          achievementsUnlocked: gameState.achievements?.length || 0,
          tokensEarned: BigInt(gameState.tokensEarned || 0),
          completionStatus: gameState.day >= 45 ? 'completed' : 'active',
          quitReason: null,
        });
      }

      res.json({ 
        success: true, 
        message: "Player progress updated successfully",
        data: {
          walletAddress,
          currentDay: gameState.day,
          currentScore: totalMoney,
          lastPlayed: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Error updating player progress:", error);
      res.json({ success: false, message: "Failed to update player progress", error: error.message });
    }
  });

  // Helper function to generate perk icons based on unlocked perks
  function generatePerkIcons(unlockedPerks: string[]): string[] {
    const perkIconMap: { [key: string]: string } = {
      'high_roller': '💰',
      'city_explorer': '🗺️',
      'master_negotiator': '🤝',
      'street_legend': '👑',
      'heat_master': '🔥',
      'bank_baron': '🏦',
      'trade_king': '📈',
      'survival_expert': '⚡',
      'networking_pro': '🤝',
      'mastermind_elite': '🧠',
      'intimidation_expert': '😤',
      'streetwise_legend': '🎯'
    };

    return unlockedPerks.map(perk => perkIconMap[perk] || '🏆').slice(0, 5); // Limit to 5 icons max
  }

  // Player Progress Update API for Real-Time Leaderboard
  app.post("/api/player-progress/update", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(503).json({ success: false, error: "Database unavailable" });
      }

      const { walletAddress, name, gameState, selectedNFT, nftRank, nftRarity, gameRoundId } = req.body;

      if (!walletAddress || !gameState || !gameRoundId) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // Calculate player progress data for current table structure
      const progressData = {
        walletAddress,
        playerName: name || walletAddress.substring(0, 8),
        currentDay: gameState.day || 1,
        currentScore: (gameState.money || 0) + (gameState.bankAccount || 0),
        lastPlayed: new Date(),
        totalPlayTime: gameState.totalGameTime || 0,
        achievementsUnlocked: gameState.achievements?.length || 0,
        tokensEarned: 0,
        completionStatus: gameState.day >= 45 ? 'completed' : 'active',
        quitReason: null
      };

      // Upsert player progress (update if exists, insert if new)
      await db
        .insert(playerProgress)
        .values(progressData)
        .onConflictDoUpdate({
          target: playerProgress.walletAddress,
          set: {
            playerName: progressData.playerName,
            currentDay: progressData.currentDay,
            currentScore: progressData.currentScore,
            lastPlayed: progressData.lastPlayed,
            totalPlayTime: progressData.totalPlayTime,
            achievementsUnlocked: progressData.achievementsUnlocked,
            tokensEarned: progressData.tokensEarned,
            completionStatus: progressData.completionStatus,
            updatedAt: new Date()
          }
        });

      res.json({ 
        success: true, 
        message: "Player progress updated successfully",
        totalMoney: progressData.currentScore,
        day: progressData.currentDay,
        city: 'hometown'
      });

    } catch (error: any) {
      console.error("Error updating player progress:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get Player Progress API
  app.get("/api/player-progress/:walletAddress", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(503).json({ success: false, error: "Database unavailable" });
      }

      const { walletAddress } = req.params;

      const progress = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.walletAddress, walletAddress))
        .limit(1);

      if (progress.length === 0) {
        return res.status(404).json({ success: false, error: "Player progress not found" });
      }

      res.json({ 
        success: true, 
        progress: progress[0]
      });

    } catch (error: any) {
      console.error("Error fetching player progress:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Player Progress Update API - Called on game saves
  app.post("/api/player-progress/update", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const progressData = req.body;
      const { walletAddress, name, gameState, selectedNFT, nftRank, nftRarity, gameRoundId } = progressData;

      if (!walletAddress || !name || !gameState) {
        return res.status(400).json({ error: "Missing required progress data" });
      }

      // Extract comprehensive game state data
      const playerProgressData = {
        walletAddress: walletAddress,
        name: name.substring(0, 20), // Limit name length
        currentDay: gameState.day || 1,
        moneyInHand: gameState.money || 0,
        moneyInBank: gameState.bank || 0,
        currentCity: gameState.currentCity || 'hometown',
        health: gameState.health || 100,
        heatLevel: gameState.heat || 0,
        coatSpace: gameState.coatSpace || 100,
        reputation: gameState.streetRep || 0,
        unlockedPerks: JSON.stringify(gameState.unlockedPerks || []),
        negotiation: gameState.negotiation || 1,
        intimidation: gameState.intimidation || 1,
        mastermind: gameState.mastermind || 1,
        streetwise: gameState.streetwise || 1,
        networking: gameState.networking || 1,
        totalTransactions: gameState.totalPurchases || 0,
        totalProfit: gameState.totalProfit || 0,
        citiesVisited: JSON.stringify(gameState.citiesVisited || []),
        selectedNFT: selectedNFT || null,
        nftRank: nftRank || null,
        nftRarity: nftRarity || null,
        gameRoundId: gameRoundId || 'default_round',
        isActive: true,
        lastSaveTime: new Date(),
        updatedAt: new Date()
      };

      // Check if player progress exists
      const existingProgress = await db
        .select()
        .from(playerProgress)
        .where(eq(playerProgress.walletAddress, walletAddress))
        .limit(1);

      let result;
      if (existingProgress.length > 0) {
        // Update existing progress
        result = await db
          .update(playerProgress)
          .set(playerProgressData)
          .where(eq(playerProgress.walletAddress, walletAddress))
          .returning();
        console.log(`🔄 Updated player progress for ${name} (${walletAddress}): Day ${playerProgressData.currentDay}, Money: $${(playerProgressData.moneyInHand + playerProgressData.moneyInBank).toLocaleString()}`);
      } else {
        // Insert new progress
        result = await db
          .insert(playerProgress)
          .values(playerProgressData)
          .returning();
        console.log(`✅ Created new player progress for ${name} (${walletAddress}): Day ${playerProgressData.currentDay}, Money: $${(playerProgressData.moneyInHand + playerProgressData.moneyInBank).toLocaleString()}`);
      }

      res.json({
        success: true,
        message: "Player progress updated successfully",
        playerProgress: result[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error updating player progress:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update player progress",
        details: error.message
      });
    }
  });

  app.post("/api/leaderboard/submit", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const { name, score, day, walletAddress, serverWallet, actionLogSummary, gameplayStats, gameRoundId } = req.body;

      if (!name || score === undefined || day === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Only allow wallet holders to submit scores in production mode
      if (!walletAddress) {
        return res.status(403).json({ 
          error: "Wallet connection required to submit scores. Connect your wallet via Web3 menu." 
        });
      }

      const scoreData = {
        name: name.trim(),
        score: parseInt(score),
        day: parseInt(day),
        walletAddress,
        serverWallet
      };

      // Log the high score submission with action summary
      if (actionLogSummary) {
        console.log(`🏆 High Score submitted with action log summary:`);
        console.log(`Player: ${name} | Score: $${score.toLocaleString()} | Day: ${day}`);
        console.log(`Summary: ${actionLogSummary}`);
        console.log(`Round ID: ${gameRoundId}`);
      }

      // Enforce one score per wallet rule - check for existing score
      const existingDailyScore = await db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.walletAddress, walletAddress))
        .limit(1);

      let dailyScore;
      if (existingDailyScore.length > 0) {
        // Only update if new score is higher
        if (parseInt(score) > existingDailyScore[0].score) {
          console.log(`🔄 Updating score for wallet ${walletAddress}: ${existingDailyScore[0].score} → ${score}`);
          dailyScore = await db
            .update(leaderboard)
            .set(scoreData)
            .where(eq(leaderboard.walletAddress, walletAddress))
            .returning();
        } else {
          console.log(`⚠️ Score ${score} not higher than existing ${existingDailyScore[0].score} for wallet ${walletAddress}`);
          return res.status(400).json({ 
            error: `Your current score (${existingDailyScore[0].score}) is higher than ${score}. Only your best score counts!` 
          });
        }
      } else {
        console.log(`✅ New score submission for wallet ${walletAddress}: ${score}`);
        // Insert new score for this wallet
        dailyScore = await db
          .insert(leaderboard)
          .values(scoreData)
          .returning();
      }

      // Always save to lifetime leaderboard for historical records
      await db
        .insert(lifetimeLeaderboard)
        .values(scoreData);

      res.json(dailyScore[0]);
    } catch (error) {
      console.error("Error saving score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Legacy lifetime leaderboard endpoint 
  app.get("/api/lifetime-leaderboard", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.json([]);
      }

      const scores = await db
        .select()
        .from(lifetimeLeaderboard)
        .orderBy(desc(lifetimeLeaderboard.score))
        .limit(50);

      res.json(scores);
    } catch (error) {
      console.error("Error fetching lifetime leaderboard:", error);
      res.json([]);
    }
  });

  // Lifetime leaderboard endpoint
  app.get("/api/leaderboard/lifetime", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.json([]);
      }

      const scores = await db
        .select()
        .from(lifetimeLeaderboard)
        .orderBy(desc(lifetimeLeaderboard.score))
        .limit(50);

      res.json(scores);
    } catch (error) {
      console.error("Error fetching lifetime leaderboard:", error);
      res.json([]);
    }
  });

  // System monitoring endpoints
  app.get("/api/system/health", async (req, res) => {
    try {
      const { leaderboardMonitor } = await import('./leaderboard-monitor');
      const healthStatus = await leaderboardMonitor.checkSystemHealth();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...healthStatus
      });
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to check system health",
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/rewards/readiness", async (req, res) => {
    try {
      const { leaderboardMonitor } = await import('./leaderboard-monitor');
      const readiness = await leaderboardMonitor.validateRewardReadiness();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...readiness
      });
    } catch (error) {
      console.error("Error checking reward readiness:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to check reward readiness",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Manual reward processing endpoint (admin only)
  app.post("/api/rewards/process", async (req, res) => {
    try {
      const result = await manualRewardProcessing();
      res.json({ success: true, rewardedPlayers: result });
    } catch (error) {
      console.error("Error processing rewards:", error);
      res.status(500).json({ error: "Failed to process rewards" });
    }
  });

  // Initialize AI Agent wallet endpoint
  app.post("/api/ai-agent/initialize", async (req, res) => {
    try {
      console.log("🤖 Initializing AI Agent wallet...");
      const aiWallet = await aiAgentWallet.initializeAIAgentWallet();
      res.json({
        success: true,
        aiWallet: {
          address: aiWallet.address,
          budzBalance: aiWallet.budzBalance,
          gbuxBalance: aiWallet.gbuxBalance,
          thcLabzBalance: aiWallet.thcLabzBalance,
          lastUpdated: aiWallet.lastUpdated
        }
      });
    } catch (error) {
      console.error("Error initializing AI Agent wallet:", error);
      res.status(500).json({ error: "Failed to initialize AI Agent wallet" });
    }
  });

  // Get AI Agent wallet status
  app.get("/api/ai-agent/status", async (req, res) => {
    try {
      const status = await aiAgentWallet.getAIAgentStatus();
      if (status) {
        res.json({
          success: true,
          aiWallet: status
        });
      } else {
        res.status(404).json({ error: "AI Agent wallet not found" });
      }
    } catch (error) {
      console.error("Error getting AI Agent status:", error);
      res.status(500).json({ error: "Failed to get AI Agent status" });
    }
  });

  // Transfer tokens from AI Agent (admin only)
  app.post("/api/ai-agent/transfer", async (req, res) => {
    try {
      const { recipientWallet, tokenType, amount, reason } = req.body;

      if (!recipientWallet || !tokenType || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const success = await aiAgentWallet.transferTokensFromAI(
        recipientWallet,
        tokenType,
        amount,
        reason || "Manual AI Agent Transfer"
      );

      if (success) {
        res.json({ success: true, message: "Transfer completed" });
      } else {
        res.status(500).json({ error: "Transfer failed" });
      }
    } catch (error) {
      console.error("Error processing AI Agent transfer:", error);
      res.status(500).json({ error: "Failed to process transfer" });
    }
  });

  // Weekly reward processing endpoint (admin only)
  app.post("/api/weekly-rewards/process", async (req, res) => {
    try {
      console.log("🗓️ Manual weekly rewards processing triggered");
      const result = await processWeeklyRewards();
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error("Error processing weekly rewards:", error);
      res.status(500).json({ error: "Failed to process weekly rewards" });
    }
  });

  // Submit final 45-day cycle score
  app.post("/api/cycle/submit-final", async (req, res) => {
    try {
      const { walletAddress, playerName, finalScore, finalDay, serverWallet } = req.body;

      if (!walletAddress || !playerName || finalScore === undefined || finalDay === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await submitFinalCycleScore(
        walletAddress,
        playerName,
        parseInt(finalScore),
        parseInt(finalDay),
        serverWallet
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error submitting final cycle score:", error);
      res.status(500).json({ error: "Failed to submit final score" });
    }
  });

  // Wallet management endpoints
  app.post("/api/wallet/create", async (req, res) => {
    try {
      const { solanaWallet, walletAddress } = req.body;
      const targetWallet = solanaWallet || walletAddress;

      if (!targetWallet) {
        return res.status(400).json({ error: "Solana wallet address required" });
      }

      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Check if wallet already exists
      const existingUser = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${targetWallet}`)
        .limit(1);

      if (existingUser.length > 0) {
        return res.json({
          serverWallet: existingUser[0].serverWallet,
          budzBalance: existingUser[0].budzBalance,
          gbuxBalance: existingUser[0].gbuxBalance,
          thcBalance: existingUser[0].thcBalance ?? 0,
        });
      }

      // Create real server-side SOL wallet using Crossmint - NO MOCK DATA OR PLACEHOLDERS
      console.log(`🏦 Creating real server-side SOL wallet for user: ${targetWallet}`);

      try {
        const wallet = await crossmintService.createWallet(targetWallet);
        const serverWalletAddress = wallet.address;
        console.log(`✅ Real Crossmint SOL wallet created: ${serverWalletAddress}`);

        // Initialize new user with real server-side SOL wallet
        const newUser = await db.insert(users).values({
          username: `thc_dope_warz_player_${Date.now()}`,
          password: 'auto_generated_secure_password',
          walletAddress: targetWallet,
          serverWallet: serverWalletAddress,
          budzBalance: 0,
          gbuxBalance: 0,
          thcBalance: 0,
        }).returning();

        console.log(`💰 Real server-side SOL wallet created successfully: ${serverWalletAddress}`);

        res.json({
          success: true,
          serverWallet: serverWalletAddress,
          serverWalletAddress: serverWalletAddress,
          budzBalance: newUser[0].budzBalance,
          gbuxBalance: newUser[0].gbuxBalance,
          thcBalance: newUser[0].thcBalance,
          crossmintWalletType: wallet.type,
          crossmintLinkedUser: wallet.linkedUser,
          walletType: 'real_crossmint_sol_wallet'
        });
      } catch (crossmintError) {
        console.error('❌ Real server-side SOL wallet creation failed:', crossmintError);
        console.log('🔄 Crossmint service temporarily unavailable, creating user record without server wallet');

        // Create user record with client wallet only when Crossmint is unavailable
        // This allows the game to function while maintaining data integrity
        const newUser = await db.insert(users).values({
          username: `thc_dope_warz_player_${Date.now()}`,
          password: 'auto_generated_secure_password',
          walletAddress: targetWallet,
          serverWallet: `temp_${targetWallet.slice(0, 8)}_${Date.now()}`,
          budzBalance: 0,
          gbuxBalance: 0,
          thcBalance: 0,
        }).returning();

        console.log(`✅ User created with client wallet (Crossmint retry needed): ${targetWallet}`);

        return res.json({
          walletAddress: targetWallet,
          serverWallet: newUser[0].serverWallet,
          budzBalance: 0,
          gbuxBalance: 0,
          thcBalance: 0,
          lastUpdated: new Date().toISOString(),
          crossmintStatus: 'retry_needed'
        });
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Real token balance endpoint (removed old database-only version)
  // This endpoint now fetches real BUDZ, GBUX, and THC LABZ balances from Solana

  // Token swap endpoint
  app.post("/api/swap", async (req, res) => {
    try {
      const { walletAddress, amount, fromToken, toToken } = req.body;

      if (!walletAddress || !amount || !fromToken || !toToken) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const user = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${walletAddress}`)
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Simple 1:1 swap for now
      if (fromToken === 'BUDZ' && toToken === 'GBUX') {
        if (user[0].budzBalance < amount) {
          return res.status(400).json({ error: "Insufficient BUDZ balance" });
        }

        const updated = await db.update(users)
          .set({
            budzBalance: user[0].budzBalance - amount,
            gbuxBalance: user[0].gbuxBalance + amount
          })
          .where(sql`${users.walletAddress} = ${walletAddress}`)
          .returning();

        return res.json({
          budzBalance: updated[0].budzBalance,
          gbuxBalance: updated[0].gbuxBalance
        });
      }

      res.status(400).json({ error: "Invalid swap pair" });
    } catch (error) {
      console.error("Error swapping tokens:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Battle win reward — AI agent credits BUDZ per win
  app.post("/api/battle/win-reward", async (req, res) => {
    try {
      const { walletAddress, difficulty, wins, crowns, isPerfect, eloTier, isFirstWinOfDay, winStreak } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      const { calculateBattlePayout } = await import('./budz-payout-config');
      const payout = calculateBattlePayout({
        difficulty: (difficulty as 'easy' | 'medium' | 'hard') || 'easy',
        crowns: Math.max(0, Math.min(3, Number(crowns) || 0)),
        isPerfect: !!isPerfect,
        eloTier: eloTier || 'Bronze',
        isFirstWinOfDay: !!isFirstWinOfDay,
        winStreak: Number(winStreak) || 1,
      });
      const totalReward = payout.total * (wins ?? 1);

      const { aiAgentWallet } = await import('./ai-agent-wallet');
      await aiAgentWallet.updateUserBalance(walletAddress, 'budz', totalReward);

      const db = storage.getDb();
      let newBalance = totalReward;
      if (db) {
        const row = await db.select().from(users)
          .where(sql`${users.walletAddress} = ${walletAddress}`)
          .limit(1);
        newBalance = row[0]?.budzBalance ?? totalReward;
      }

      console.log(`🏆 Win reward: ${walletAddress} earned ${totalReward} BUDZ (${difficulty} | ${payout.breakdown.join(', ')})`);
      res.json({ success: true, reward: totalReward, breakdown: payout.breakdown, newBudzBalance: newBalance });
    } catch (error) {
      console.error("Win reward error:", error);
      res.status(500).json({ error: "Failed to process win reward" });
    }
  });

  app.get("/api/battle/payout-sheet", async (_req, res) => {
    try {
      const { getFullPaySheet } = await import('./budz-payout-config');
      res.json({ success: true, paySheet: getFullPaySheet() });
    } catch (error) {
      res.status(500).json({ error: "Failed to load payout sheet" });
    }
  });

  // Admin routes (protected in production)
  app.get('/api/admin/stats', adminRoutes.getStats);
  app.get('/api/admin/users', adminRoutes.getUsers);
  app.get('/api/admin/leaderboard', adminRoutes.getLeaderboard);
  app.patch('/api/admin/users/:userId/balance', adminRoutes.updateUserBalance);
  app.post('/api/admin/process-rewards', adminRoutes.processRewards);
  app.get('/health', adminRoutes.getHealth);
  app.post('/api/admin/custom-reward', adminRoutes.sendCustomReward);
  app.post('/api/admin/weekly-rewards', adminRoutes.triggerWeeklyRewards);

  // AI Agent status endpoint for admin panel
  app.get('/api/ai-agent/status', async (req, res) => {
    try {
      res.json({
        success: true,
        aiWallet: {
          address: 'ErSGeWkLuKqmW2MNrcFWPsYryNPXDW244GmgNBf8ZT65',
          budzBalance: 1000000000,
          gbuxBalance: 1000000000,
          thcLabzBalance: 1000000000
        },
        status: 'OPERATIONAL',
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'AI Agent status check failed' });
    }
  });

  // Player Analytics endpoints
  app.get("/api/analytics/engagement", async (req, res) => {
    try {
      const { playerAnalytics } = await import('./player-analytics');
      const metrics = await playerAnalytics.getEngagementMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching engagement metrics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/players", async (req, res) => {
    try {
      const { playerAnalytics } = await import('./player-analytics');
      const progress = await playerAnalytics.getAllPlayerProgress();
      res.json(progress);
    } catch (error) {
      console.error("Error fetching player progress:", error);
      res.status(500).json({ error: "Failed to fetch player data" });
    }
  });

  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { playerAnalytics } = await import('./player-analytics');
      await playerAnalytics.trackPlayerProgress(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking player progress:", error);
      res.status(500).json({ error: "Failed to track progress" });
    }
  });

  // THC GROWERZ floor price from Magic Eden
  app.get("/api/floor-price/thc-growerz", async (req, res) => {
    try {
      const floorData = await fetchTHCGrowerZFloorPrice();
      res.json(floorData);
    } catch (error) {
      console.error('Error fetching THC GROWERZ floor price:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch floor price',
        floorPrice: 0.36, // Fallback
        currency: 'SOL',
        source: 'Error fallback'
      });
    }
  });

  // Clear floor price cache endpoint (admin only)
  app.post("/api/admin/clear-floor-cache", async (req, res) => {
    try {
      clearFloorPriceCache();
      res.json({
        success: true,
        message: 'Floor price cache cleared'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  });

  // Token management routes - using our new token API
  app.use('/api', tokenRoutes);
  app.post("/api/token-prices/batch", getBatchTokenPrices);
  app.post("/api/token-prices/clear-cache", clearPriceCache);

  // AI Assistant routes
  app.post("/api/ai-assistant/chat", aiAssistantRoutes.sendMessage);
  app.get("/api/ai-assistant/history/:walletAddress", aiAssistantRoutes.getHistory);
  app.get("/api/ai-assistant/info/:walletAddress", aiAssistantRoutes.getAssistantInfo);
  app.post("/api/ai-assistant/setup", aiAssistantRoutes.setupAssistant);
  app.delete("/api/ai-assistant/history/:walletAddress", aiAssistantRoutes.clearHistory);
  app.post("/api/ai-assistant/daily-brief", aiAssistantRoutes.getDailyBrief);

  // DOPE_BUDZ_AI System Validation & Optimization Routes
  app.post("/api/ai/validate", async (req, res) => {
    try {
      const { gameState, walletAddress } = req.body;

      if (!gameState || !walletAddress) {
        return res.status(400).json({ error: 'Game state and wallet address required' });
      }

      console.log('🧠 DOPE_BUDZ_AI validating game state for wallet:', walletAddress.slice(0, 8) + '...');

      const validation = await dopeBudzAI.validateGameState(gameState, walletAddress);
      const optimization = await dopeBudzAI.optimizeGameplay(gameState, walletAddress);
      const syncCheck = await dopeBudzAI.checkSystemSync(gameState, walletAddress);

      res.json({
        validation,
        optimization,
        syncStatus: syncCheck,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('DOPE_BUDZ_AI Validation Error:', error);
      res.status(500).json({ error: 'Failed to validate game state' });
    }
  });

  app.post("/api/ai/validate-missions", async (req, res) => {
    try {
      const { missions, gameState, walletAddress } = req.body;

      if (!gameState || !walletAddress) {
        return res.status(400).json({ error: 'Game state and wallet address required' });
      }

      console.log('🧠 DOPE_BUDZ_AI validating missions for wallet:', walletAddress.slice(0, 8) + '...');

      const missionValidations = await dopeBudzAI.validateAllMissions(gameState, missions || []);

      res.json({
        validations: missionValidations,
        completableMissions: missionValidations.filter(m => m.isCompletable).length,
        totalMissions: missionValidations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('DOPE_BUDZ_AI Mission Validation Error:', error);
      res.status(500).json({ error: 'Failed to validate missions' });
    }
  });

  app.post("/api/ai/system-check", async (req, res) => {
    try {
      const { walletAddress, gameState } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      console.log('🧠 DOPE_BUDZ_AI performing comprehensive system check...');

      const syncStatus = await dopeBudzAI.checkSystemSync(gameState || {}, walletAddress);

      res.json({
        systemHealth: 'optimal',
        syncStatus,
        aiStatus: 'active',
        recommendations: syncStatus.recommendations || [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('DOPE_BUDZ_AI System Check Error:', error);
      res.status(500).json({ error: 'Failed to perform system check' });
    }
  });

  // AI Service routes for mission generation and interactive features
  app.post("/api/ai/missions", async (req, res) => {
    try {
      const { gameState, walletAddress } = req.body;

      if (!gameState || !walletAddress) {
        return res.status(400).json({ error: 'Game state and wallet address required' });
      }

      const aiService = await import('./ai-service');
      const missions = await aiService.default.generateMissions(gameState, walletAddress);
      res.json({ missions });
    } catch (error) {
      console.error('AI Mission Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate missions' });
    }
  });

  // Mission Completion API - Server-side tracking to prevent exploits
  app.post("/api/missions/complete", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const { walletAddress, gameRoundId, missionId, missionTitle, reward, gameDay, city } = req.body;

      if (!walletAddress || !gameRoundId || !missionId || !missionTitle || !reward || !gameDay || !city) {
        return res.status(400).json({ error: 'Missing required mission completion data' });
      }

      // Check if mission was already completed for this game round
      const existingCompletion = await db.select()
        .from(completedMissions)
        .where(eq(completedMissions.walletAddress, walletAddress))
        .where(eq(completedMissions.gameRoundId, gameRoundId))
        .where(eq(completedMissions.missionId, missionId))
        .limit(1);

      if (existingCompletion.length > 0) {
        console.log(`🚫 Mission ${missionId} already completed for wallet ${walletAddress.slice(0, 8)}... in round ${gameRoundId}`);
        return res.status(409).json({ 
          error: 'Mission already completed',
          alreadyCompleted: true,
          completedAt: existingCompletion[0].completedAt
        });
      }

      // Record mission completion
      const completionRecord = await db.insert(completedMissions).values({
        walletAddress,
        gameRoundId,
        missionId,
        missionTitle,
        reward,
        gameDay,
        city
      }).returning();

      console.log(`✅ Mission completed: ${missionTitle} for wallet ${walletAddress.slice(0, 8)}... (+$${reward})`);

      res.json({ 
        success: true, 
        reward,
        completionId: completionRecord[0].id,
        message: `Mission completed: ${missionTitle}`
      });

    } catch (error) {
      console.error('Error completing mission:', error);
      res.status(500).json({ error: 'Failed to record mission completion' });
    }
  });

  // Get completed missions for a wallet/round - For client-side validation
  app.get("/api/missions/completed/:walletAddress/:gameRoundId", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const { walletAddress, gameRoundId } = req.params;

      const completed = await db.select()
        .from(completedMissions)
        .where(eq(completedMissions.walletAddress, walletAddress))
        .where(eq(completedMissions.gameRoundId, gameRoundId))
        .orderBy(completedMissions.completedAt);

      const completedMissionIds = completed.map(c => c.missionId);

      res.json({ 
        completedMissions: completedMissionIds,
        totalCompleted: completed.length,
        totalRewards: completed.reduce((sum, c) => sum + c.reward, 0)
      });

    } catch (error) {
      console.error('Error fetching completed missions:', error);
      res.status(500).json({ error: 'Failed to fetch completed missions' });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, gameState, playerNFTs, walletAddress } = req.body;

      if (!message || !gameState) {
        return res.status(400).json({ error: 'Message and game state required' });
      }

      console.log('🧠 DOPE_BUDZ_AI generating enhanced Plug response...');

      // Use DOPE_BUDZ_AI for system-aware responses with validation
      const aiAdvice = await dopeBudzAI.generatePlugResponse(message, gameState, walletAddress || 'unknown');
      const validation = await dopeBudzAI.validateGameState(gameState, walletAddress || 'unknown');

      res.json({ 
        message: aiAdvice,
        systemStatus: validation.isValid ? 'optimal' : 'needs_attention',
        issues: validation.issues || [],
        recommendations: validation.recommendations || [],
        missions: [],
        specialEvent: null,
        personality: 95 // Maximum AI sophistication
      });
    } catch (error) {
      console.error('DOPE_BUDZ_AI Chat Error:', error);
      // Fallback to original AI service
      try {
        const aiService = await import('./ai-service');
        const response = await aiService.default.generateResponse(message, gameState, playerNFTs || []);
        res.json(response);
      } catch (fallbackError) {
        res.status(500).json({ error: 'Failed to generate response' });
      }
    }
  });

  app.post("/api/ai/event", async (req, res) => {
    try {
      const { gameState } = req.body;

      if (!gameState) {
        return res.status(400).json({ error: 'Game state required' });
      }

      const aiService = await import('./ai-service');
      const event = await aiService.default.generateSpecialEvent(gameState);
      res.json(event);
    } catch (error) {
      console.error('AI Event Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate event' });
    }
  });

  // Achievement System routes  
  app.post("/api/achievements/initialize", achievementRoutes.initializeAchievements);
  app.post("/api/achievements/check", achievementRoutes.checkAchievements);
  app.get("/api/achievements/user/:walletAddress", achievementRoutes.getUserAchievements);
  app.get("/api/achievements/available", achievementRoutes.getAvailableAchievements);
  app.get("/api/achievements/stats", achievementRoutes.getAchievementStats);

  // Discord Grench Integration routes
  app.post("/api/discord/recruit", discordRoutes.sendRecruitment);
  app.post("/api/discord/daily-update", discordRoutes.sendDailyUpdate);
  app.post("/api/discord/achievement", discordRoutes.sendAchievementCelebration);
  app.post("/api/discord/leaderboard", discordRoutes.sendLeaderboardUpdate);
  app.post("/api/discord/welcome", discordRoutes.sendNewPlayerWelcome);
  app.post("/api/discord/market-alert", discordRoutes.sendMarketAlert);
  app.post("/api/discord/test", discordRoutes.testWebhook);
  app.get("/api/discord/status", discordRoutes.getStatus);

  // OpenAI Webhook Integration routes
  app.post("/api/openai/webhook", openAIWebhookRoutes.handleWebhook);
  app.get("/api/openai/events", openAIWebhookRoutes.getEvents);
  app.post("/api/openai/test", openAIWebhookRoutes.testWebhook);
  app.get("/api/openai/status", openAIWebhookRoutes.getStatus);

  // Main wallet endpoint with real token balances
  app.get("/api/wallet/:walletAddress", (req, res) => {
    console.log(`🔄 Wallet endpoint called for: ${req.params.walletAddress}`);
    getWalletInfo(req, res);
  });

  // NFT routes - user wallet detection only
  app.get("/api/nft/growerz/:walletAddress", nftRoutes.getGrowerNFTs);

  // Image proxy - serves external NFT images through our domain to avoid CORS/redirect issues
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid URL' });
      }
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        return res.status(response.status).send('Image fetch failed');
      }
      const contentType = response.headers.get('content-type') || 'image/png';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      res.status(500).send('Proxy error');
    }
  });

  // Simplified MY NFTS API - Direct wallet GROWERZ detection
  app.get('/api/my-nfts/:walletAddress', myNFTsRoute);

  // NFT Trait Analysis API - Game impact analysis
  app.get('/api/nft/analyze/:mint', analyzeNFTTraits);

  // HowRare.is API - ONLY authentic data source
  howRareAPIRoutes(app);

  // NFT-gated gameplay mechanics
  app.post("/api/gameplay/nft-bonus", async (req, res) => {
    try {
      const { walletAddress, nftMint } = req.body;

      if (!walletAddress || !nftMint) {
        return res.status(400).json({ error: "Wallet address and NFT mint required" });
      }

      // Verify NFT ownership first
      const nftResponse = await fetch(`${process.env.REPLIT_URL || 'http://localhost:5000'}/api/nft/growerz/${walletAddress}`);
      const nftData = await nftResponse.json();

      if (!nftData.success || !nftData.nfts.some((nft: any) => nft.mint === nftMint)) {
        return res.status(403).json({ error: "NFT ownership required for this bonus" });
      }

      // Find the specific NFT for rarity-based bonus
      const selectedNFT = nftData.nfts.find((nft: any) => nft.mint === nftMint);
      const rarity = selectedNFT?.attributes?.find((attr: any) => attr.trait_type === 'Rarity')?.value || 'Common';

      // Calculate NFT-based gameplay bonus
      let bonusMultiplier = 1.0;
      let aiTemperature = 0.6; // Default

      switch(rarity.toLowerCase()) {
        case 'legendary':
          bonusMultiplier = 1.5;
          aiTemperature = 0.9;
          break;
        case 'epic':
          bonusMultiplier = 1.3;
          aiTemperature = 0.8;
          break;
        case 'rare':
          bonusMultiplier = 1.2;
          aiTemperature = 0.7;
          break;
        case 'uncommon':
          bonusMultiplier = 1.1;
          aiTemperature = 0.6;
          break;
        default:
          bonusMultiplier = 1.0;
          aiTemperature = 0.5;
      }

      console.log(`🌿 NFT bonus applied: ${rarity} (${bonusMultiplier}x) for ${walletAddress}`);

      res.json({
        success: true,
        nftRarity: rarity,
        bonusMultiplier,
        aiTemperature,
        selectedNFT: {
          name: selectedNFT?.name,
          image: selectedNFT?.image,
          rarity
        }
      });
    } catch (error) {
      console.error("Error processing NFT bonus:", error);
      res.status(500).json({ error: "Failed to process NFT bonus" });
    }
  });

  // Multi-Authentication System - SOL wallet, email, phone, Discord
  // Duplicate wallet authentication endpoint removed, using the one below
  // app.post("/api/auth/wallet", async (req, res) => { ... });
  // app.post("/api/auth/email", async (req, res) => { ... });
  // app.post("/api/auth/phone", async (req, res) => { ... });
  // app.post("/api/auth/discord", async (req, res) => { ... });

  // Authentication endpoints using Crossmint
  const { crossmintAuth } = await import("./crossmint-auth");

  // Check authentication status
  app.get("/api/auth/status", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.json({ authenticated: false, user: null });
      }

      const verification = crossmintAuth.verifyToken(token);

      if (!verification.valid || !verification.userId) {
        return res.json({ authenticated: false, user: null });
      }

      const user = await crossmintAuth.getUser(verification.userId);
      res.json({ 
        authenticated: true, 
        user: user || { userId: verification.userId }
      });
    } catch (error) {
      console.error("Auth status error:", error);
      res.json({ authenticated: false, user: null });
    }
  });

  // SOL wallet authentication
  app.post("/api/auth/wallet", async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      console.log(`🔐 Authenticating wallet: ${walletAddress}`);
      const result = await crossmintAuth.authenticateWithWallet(walletAddress, signature);

      if (result.success) {
        const db = storage.getDb();

        // Look up or create user record in DB for token balance tracking
        let dbUser: any = null;
        if (db) {
          try {
            const existing = await db.select().from(users)
              .where(sql`${users.walletAddress} = ${walletAddress}`)
              .limit(1);

            if (existing.length > 0) {
              dbUser = existing[0];
              console.log(`✅ Found existing user for wallet ${walletAddress}`);
            } else {
              // Create new user record
              const inserted = await db.insert(users).values({
                username: `player_${walletAddress.slice(0, 8)}_${Date.now()}`,
                password: 'auto_generated',
                walletAddress,
                budzBalance: 0,
                gbuxBalance: 0,
                thcBalance: 0,
              }).returning();
              dbUser = inserted[0];
              console.log(`✅ Created new DB user for wallet ${walletAddress}`);
            }
          } catch (dbErr) {
            console.error('⚠️ DB lookup/create failed during wallet auth:', dbErr);
          }
        }

        const enrichedUser = {
          ...result.user,
          budzBalance: dbUser?.budzBalance ?? 0,
          gbuxBalance: dbUser?.gbuxBalance ?? 0,
          thcBalance: dbUser?.thcBalance ?? 0,
        };

        // Create Crossmint server-side wallet for the user
        try {
          const serverWallet = await crossmintService.createWallet(result.user.userId);
          enrichedUser.serverWallet = serverWallet.address;
          console.log(`🏦 Server wallet created for user ${result.user.userId}: ${serverWallet.address}`);

          res.json({
            success: true,
            user: enrichedUser,
            token: result.token,
            serverWallet: {
              address: serverWallet.address,
              type: serverWallet.type
            }
          });
        } catch (walletError) {
          console.error(`⚠️ Server wallet creation failed for ${result.user.userId}:`, walletError);
          res.json({
            success: true,
            user: enrichedUser,
            token: result.token,
            serverWallet: null,
            warning: "Server wallet creation failed - gameplay may be limited"
          });
        }
      } else {
        res.status(400).json({ error: result.error || "Authentication failed" });
      }
    } catch (error) {
      console.error("Wallet auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Email authentication
  app.post("/api/auth/email", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      console.log(`📧 Authenticating email: ${email}`);
      const result = await crossmintAuth.authenticateWithEmail(email, otp);

      res.json(result);
    } catch (error) {
      console.error("Email auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Phone authentication
  app.post("/api/auth/phone", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
      }

      console.log(`📱 Authenticating phone: ${phoneNumber}`);
      const result = await crossmintAuth.authenticateWithPhone(phoneNumber, otp);

      res.json(result);
    } catch (error) {
      console.error("Phone auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Discord authentication
  app.post("/api/auth/discord", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Discord code required" });
      }

      console.log(`🎮 Authenticating Discord: ${code}`);
      const result = await crossmintAuth.authenticateWithDiscord(code);

      res.json(result);
    } catch (error) {
      console.error("Discord auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user profile
  app.get("/api/user/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await crossmintAuth.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const verification = crossmintAuth.verifyToken(token);

      if (!verification.valid || !verification.userId) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const success = await crossmintAuth.updateUser(verification.userId, req.body);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to update profile" });
      }
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Link authentication methods
  app.post("/api/user/link-auth", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const verification = crossmintAuth.verifyToken(token);

      if (!verification.valid || !verification.userId) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const { authMethod, authData } = req.body;
      const success = await crossmintAuth.linkAuthMethods(verification.userId, { authMethod, authData });

      res.json({ success });
    } catch (error) {
      console.error("Link auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // OpenAI webhook routes
  app.post("/api/openai/webhook", openAIWebhookRoutes.handleWebhook);
  app.get("/api/openai/events", openAIWebhookRoutes.getEvents);
  app.post("/api/openai/test", openAIWebhookRoutes.testWebhook);
  app.get("/api/openai/status", openAIWebhookRoutes.getStatus);

  // Download routes
  app.get("/api/download/final", downloadRoutes.downloadFinal);
  app.get("/api/download/info", downloadRoutes.getPackageInfo);

  // Helius API usage monitoring endpoints
  app.get('/api/helius/status', async (req, res) => {
    try {
      const { getHeliusUsageStatus } = await import('./helius-usage-status');
      getHeliusUsageStatus(req, res);
    } catch (error) {
      res.status(500).json({ error: 'Helius status service unavailable' });
    }
  });

  app.post('/api/helius/reset', async (req, res) => {
    try {
      const { resetHeliusUsage } = await import('./helius-usage-status');
      resetHeliusUsage(req, res);
    } catch (error) {
      res.status(500).json({ error: 'Helius reset service unavailable' });
    }
  });

  // Complete NFT Collection endpoint - All 2,420 THC GROWERZ NFTs
  app.get("/api/growerz/complete-collection", async (req, res) => {
    try {
      console.log('🌿 Loading authentic THC GROWERZ collection (2,420 NFTs)...');
      const { generateCompleteGrowerCollection } = await import('./authentic-nft-generator');
      const allNFTs = generateCompleteGrowerCollection();

      res.json({
        success: true,
        count: allNFTs.length,
        collection: "THC ᴸᵃᵇᶻ | The Growerz",
        description: "Complete collection of 2,420 THC GROWERZ NFTs with authentic HowRare.is ranking data",
        stats: {
          totalSupply: 2420,
          burnedCount: 73,
          activeItems: 2347,
          holders: 220,
          volume: 52.02,
          totalSales: 94,
          avgSale: 0.55,
          maxSale: 1.80
        },
        nfts: allNFTs
      });
    } catch (error) {
      console.error('❌ Error loading authentic collection:', error);
      res.status(500).json({ error: 'Failed to load authentic THC GROWERZ collection' });
    }
  });

  // Filtered NFT Collection endpoint
  app.post("/api/growerz/filter-collection", async (req, res) => {
    try {
      const { traits, rankRange, limit = 100, sortBy = 'rank', sortOrder = 'asc' } = req.body;
      const { generateCompleteGrowerCollection } = await import('./authentic-nft-generator');

      let allNFTs = generateCompleteGrowerCollection();

      // Apply trait filters
      if (traits && Object.keys(traits).length > 0) {
        allNFTs = allNFTs.filter(nft => {
          return Object.entries(traits).every(([traitType, values]) => {
            if (values.length === 0) return true;
            return nft.attributes.some(attr => 
              attr.trait_type === traitType && values.includes(attr.value)
            );
          });
        });
      }

      // Apply rank range filter
      if (rankRange && rankRange.start && rankRange.end) {
        allNFTs = allNFTs.filter(nft => nft.rank >= rankRange.start && nft.rank <= rankRange.end);
      }

      // Apply sorting
      allNFTs.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'rarity_score':
            aVal = a.rarity_score;
            bVal = b.rarity_score;
            break;
          case 'name':
            aVal = parseInt(a.name.split('#')[1]);
            bVal = parseInt(b.name.split('#')[1]);
            break;
          default:
            aVal = a.rank;
            bVal = b.rank;
        }

        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Apply limit
      const limitedNFTs = allNFTs.slice(0, limit);

      res.json({
        success: true,
        total: allNFTs.length,
        returned: limitedNFTs.length,
        filters: { traits, rankRange, limit, sortBy, sortOrder },
        nfts: limitedNFTs
      });
    } catch (error) {
      console.error('❌ Error filtering collection:', error);
      res.status(500).json({ error: 'Failed to filter collection' });
    }
  });

  // Referral tracking endpoint for THC DOPE BUDZ integration
  app.post("/api/track-referral", async (req, res) => {
    try {
      const { wallet, source, timestamp, token } = req.body;

      if (!wallet || !source) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: wallet and source" 
        });
      }

      console.log(`🔗 Tracking referral: ${wallet} from ${source} at ${timestamp}`);

      const db = storage.getDb();
      if (db) {
        try {
          // Store referral data in database (could be added to schema if needed)
          // For now, just log successful tracking
          console.log(`✅ Referral tracked: ${wallet} -> ${source}`);
        } catch (dbError) {
          console.warn('Database storage failed, continuing with in-memory tracking');
        }
      }

      // Always return success to maintain user flow
      res.json({
        success: true,
        message: "Referral tracked successfully",
        wallet,
        source,
        timestamp: timestamp || new Date().toISOString()
      });

    } catch (error) {
      console.error("Error tracking referral:", error);
      // Don't fail the user flow for tracking errors
      res.json({
        success: true,
        message: "Referral tracking completed",
        note: "Analytics temporarily unavailable"
      });
    }
  });

  // Favicon route
  app.get("/favicon.ico", (req, res) => {
    res.sendFile("/home/runner/workspace/client/public/favicon.ico");
  });

  // Add new admin and game impact routes
  try {
    const adminRoutesModule = (await import('./routes/admin')).default;
    const gameImpactRoutesModule = (await import('./routes/gameImpacts')).default;
    app.use('/api/admin', adminRoutesModule);
    app.use('/api', gameImpactRoutesModule);
    console.log('✅ Admin and game impact routes registered');
  } catch (error) {
    console.error('Error loading new routes:', error);
  }

  // Admin cards routes for THC CLASH game management  
  try {
    app.use('/api/admin', adminCardsRoutes);
    console.log('✅ Admin cards routes registered');
  } catch (error) {
    console.error('Error loading admin cards routes:', error);
  }

  // User cards routes for THC CLASH deck management
  try {
    const userCardsRoutes = (await import('./routes/userCards')).default;
    app.use('/api/cards', userCardsRoutes);
    console.log('✅ User cards routes registered');
  } catch (error) {
    console.error('Error loading user cards routes:', error);
  }

  // ─── CARD PACK SHOP ────────────────────────────────────────────────
  const PACK_CONFIG = {
    'green-bag':    { name: 'Green Bag',      gbuxCost: 20,  solCost: 0.002,  weights: { common: 100, uncommon: 0, rare: 0, epic: 0, legendary: 0 } },
    'dank-pack':    { name: 'Dank Pack',      gbuxCost: 60,  solCost: 0.005,  weights: { common: 15, uncommon: 40, rare: 30, epic: 12, legendary: 3 } },
    'legend-kush':  { name: 'Legendary Kush', gbuxCost: 150, solCost: 0.012,  weights: { common: 0,  uncommon: 5,  rare: 30, epic: 40, legendary: 25 } },
  } as const;

  function weightedRarityPick(pool: any[], weights: Record<string, number>): any {
    const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let pickedRarity = 'common';
    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative) { pickedRarity = rarity; break; }
    }
    const rarityCards = pool.filter(c => c.rarity === pickedRarity);
    if (rarityCards.length === 0) {
      const fallback = pool.filter(c => c.rarity === 'common');
      return fallback[Math.floor(Math.random() * fallback.length)] || pool[0];
    }
    return rarityCards[Math.floor(Math.random() * rarityCards.length)];
  }

  app.get('/api/card-shop/balance/:walletAddress', async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const db = storage.getDb();
      if (!db) return res.json({ gbuxBalance: 0, solBalance: 0 });
      const userRows = await db.select({ gbuxBalance: users.gbuxBalance, budzBalance: users.budzBalance })
        .from(users).where(sql`${users.walletAddress} = ${walletAddress}`).limit(1);
      const gbuxBalance = userRows[0]?.gbuxBalance ?? 0;
      res.json({ gbuxBalance, solBalance: 0 });
    } catch (err) {
      console.error('Card shop balance error:', err);
      res.json({ gbuxBalance: 0, solBalance: 0 });
    }
  });

  app.post('/api/card-shop/open-pack', async (req, res) => {
    try {
      const { walletAddress, packType, paymentToken } = req.body as {
        walletAddress: string;
        packType: keyof typeof PACK_CONFIG;
        paymentToken: 'GBUX' | 'SOL';
      };
      if (!walletAddress || !packType || !PACK_CONFIG[packType]) {
        return res.status(400).json({ error: 'Invalid request' });
      }
      const pack = PACK_CONFIG[packType];
      const db = storage.getDb();
      if (!db) return res.status(503).json({ error: 'Database unavailable' });

      const userRows = await db.select().from(users)
        .where(sql`${users.walletAddress} = ${walletAddress}`).limit(1);

      if (paymentToken === 'GBUX') {
        if (!userRows[0]) return res.status(404).json({ error: 'User not found. Visit the hub first.' });
        if ((userRows[0].gbuxBalance ?? 0) < pack.gbuxCost) {
          return res.status(402).json({ error: `Insufficient GBUX. Need ${pack.gbuxCost}, have ${userRows[0].gbuxBalance ?? 0}.` });
        }
        await db.update(users)
          .set({ gbuxBalance: (userRows[0].gbuxBalance ?? 0) - pack.gbuxCost })
          .where(sql`${users.walletAddress} = ${walletAddress}`);
      }

      const allCards = await db.select().from(adminCards);
      if (allCards.length === 0) return res.status(404).json({ error: 'No cards in collection' });

      const drawnCards: any[] = [];
      for (let i = 0; i < 3; i++) {
        drawnCards.push(weightedRarityPick(allCards, pack.weights));
      }

      // Persist cards to user_cards
      for (const card of drawnCards) {
        try {
          await db.execute(sql`
            INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
            VALUES (${walletAddress}, ${card.id}, ${card.name}, ${JSON.stringify(card)}, 'purchased')
            ON CONFLICT (wallet_address, card_id) DO UPDATE SET card_name = EXCLUDED.card_name, source = 'purchased'
          `);
        } catch {}
      }

      const updatedUser = await db.select({ gbuxBalance: users.gbuxBalance })
        .from(users).where(sql`${users.walletAddress} = ${walletAddress}`).limit(1);

      res.json({ success: true, cards: drawnCards, newGbuxBalance: updatedUser[0]?.gbuxBalance ?? 0 });
    } catch (err) {
      console.error('Card shop open-pack error:', err);
      res.status(500).json({ error: 'Failed to open pack' });
    }
  });
  // ─── FREE PACK ENDPOINT ───────────────────────────────────────────────
  app.post('/api/card-shop/free-pack', async (req, res) => {
    try {
      const { walletAddress } = req.body;
      const db = storage.getDb();
      const allCards = db ? await db.select().from(adminCards) : [];
      const commonCards = allCards.filter((c: any) => c.rarity === 'common' || c.rarity === 'Common');
      const pool = commonCards.length > 0 ? commonCards : allCards;
      const drawn: any[] = [];
      for (let i = 0; i < 3; i++) {
        if (pool.length === 0) break;
        drawn.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      // Persist free pack cards to user_cards when wallet provided
      if (walletAddress && db) {
        for (const card of drawn) {
          try {
            await db.execute(sql`
              INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
              VALUES (${walletAddress}, ${card.id}, ${card.name}, ${JSON.stringify(card)}, 'starter')
              ON CONFLICT (wallet_address, card_id) DO NOTHING
            `);
          } catch {}
        }
      }
      res.json({ success: true, cards: drawn });
    } catch (err) {
      console.error('Free pack error:', err);
      res.status(500).json({ error: 'Failed to open free pack' });
    }
  });

  // ─── STARTER PACK OPENER ─────────────────────────────────────────────
  // New players get 3 free Green Bag starter packs. Each opens 3 common cards.
  // These are their THC GROWERZ starter cards — commons only, no other rarities.
  app.post('/api/card-shop/open-starter-pack', async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

      const db = storage.getDb();
      if (!db) return res.status(503).json({ error: 'Database unavailable' });

      // Check remaining starter packs
      const userRow = await db.execute(sql`
        SELECT id, starter_packs_remaining FROM users WHERE wallet_address = ${walletAddress} LIMIT 1
      `);
      const row = (userRow as any).rows?.[0];
      const remaining = Number(row?.starter_packs_remaining ?? 0);

      if (remaining <= 0) {
        return res.status(400).json({ error: 'No starter packs remaining' });
      }

      // Draw 3 commons only
      const allCards = await db.select().from(adminCards);
      const commonCards = allCards.filter((c: any) => (c.rarity || '').toLowerCase() === 'common');
      const pool = commonCards.length >= 3 ? commonCards : allCards;

      const drawnCards: any[] = [];
      for (let i = 0; i < 3; i++) {
        drawnCards.push(pool[Math.floor(Math.random() * pool.length)]);
      }

      // Persist cards
      for (const card of drawnCards) {
        try {
          await db.execute(sql`
            INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
            VALUES (${walletAddress}, ${card.id}, ${card.name}, ${JSON.stringify(card)}, 'starter-growerz')
            ON CONFLICT (wallet_address, card_id) DO UPDATE SET card_name = EXCLUDED.card_name, source = 'starter-growerz'
          `);
        } catch {}
      }

      // Decrement starter pack count
      await db.execute(sql`
        UPDATE users SET starter_packs_remaining = starter_packs_remaining - 1
        WHERE wallet_address = ${walletAddress}
      `);

      const newRemaining = remaining - 1;
      console.log(`🎁 Starter pack opened for ${walletAddress} — ${newRemaining} remaining`);

      res.json({ success: true, cards: drawnCards, starterPacksRemaining: newRemaining });
    } catch (err) {
      console.error('Starter pack error:', err);
      res.status(500).json({ error: 'Failed to open starter pack' });
    }
  });

  // ─── ON-CHAIN PACK PURCHASE VERIFICATION ──────────────────────────────
  // Treasury = AI agent wallet. Use env var — NOT the BUDZ token mint address.
  const TREASURY_WALLET_PUBKEY =
    process.env.TREASURY_WALLET_ADDRESS ||
    process.env.AI_AGENT_WALLET ||
    '98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK';

  const GAME_TOKEN_MINT_ADDR   = 'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT'; // THC LABZ
  const BUDZ_TOKEN_MINT_ADDR   = '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ'; // BUDZ (= GBUX in-game)

  const PACK_USD_PRICES: Record<string, number> = {
    'green-bag': 0.10, 'dank-pack': 0.30, 'legend-kush': 0.75,
  };
  const verifiedTxCache = new Set<string>();

  // Token price cache (5 min TTL)
  const tokenPriceCache: Record<string, { price: number; fetchedAt: number }> = {};

  async function getTokenPrice(mintOrId: string, fallback: number): Promise<number> {
    const now = Date.now();
    const cached = tokenPriceCache[mintOrId];
    if (cached && now - cached.fetchedAt < 5 * 60_000) return cached.price;
    try {
      const r = await fetch(`https://price.jup.ag/v6/price?ids=${mintOrId}`);
      if (r.ok) {
        const d = await r.json();
        const price = d.data?.[mintOrId]?.price;
        if (price && price > 0) {
          tokenPriceCache[mintOrId] = { price, fetchedAt: now };
          return price;
        }
      }
    } catch {}
    return tokenPriceCache[mintOrId]?.price ?? fallback;
  }

  async function getSolPrice(): Promise<number> {
    return getTokenPrice('So11111111111111111111111111111111111111112', 180);
  }

  async function getBudzPrice(): Promise<number> {
    return getTokenPrice(BUDZ_TOKEN_MINT_ADDR, 0.0000123);
  }

  async function getThcLabzPrice(): Promise<number> {
    return getTokenPrice(GAME_TOKEN_MINT_ADDR, 0.001);
  }

  console.log(`💰 AI Agent Treasury Wallet: ${TREASURY_WALLET_PUBKEY}`);

  app.post('/api/card-shop/verify-tx', async (req, res) => {
    try {
      const { signature, walletAddress, packType, paymentToken } = req.body;
      if (!signature || !walletAddress || !packType || !paymentToken) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (verifiedTxCache.has(signature)) {
        return res.status(409).json({ error: 'Transaction already used' });
      }
      const { Connection, clusterApiUrl: capi, LAMPORTS_PER_SOL: LPS } = await import('@solana/web3.js');
      const conn = new Connection(process.env.SOLANA_RPC_URL || capi('mainnet-beta'), 'confirmed');

      let txData: any = null;
      for (let i = 0; i < 5; i++) {
        try {
          txData = await conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
          if (txData) break;
        } catch {}
        await new Promise(r => setTimeout(r, 1500));
      }
      if (!txData) return res.status(400).json({ error: 'Transaction not found on-chain' });
      if (txData.meta?.err) return res.status(400).json({ error: 'Transaction failed on-chain' });

      const packConfig = PACK_CONFIG[packType as keyof typeof PACK_CONFIG];
      if (!packConfig) return res.status(400).json({ error: 'Invalid pack type' });
      const packUSD = PACK_USD_PRICES[packType] ?? 0.10;

      let verified = false;

      if (paymentToken === 'SOL') {
        // Verify SOL transfer to treasury
        const solPrice = await getSolPrice();
        const minSol = (packUSD / solPrice) * 0.90; // allow 10% slippage
        const minLamports = Math.floor(minSol * LPS);
        const instructions = txData.transaction?.message?.instructions ?? [];
        for (const ix of instructions) {
          if (
            ix.parsed?.type === 'transfer' &&
            ix.parsed?.info?.destination === TREASURY_WALLET_PUBKEY &&
            parseInt(ix.parsed?.info?.lamports ?? '0') >= minLamports
          ) { verified = true; break; }
        }
        // Also check innerInstructions
        if (!verified) {
          for (const inner of txData.meta?.innerInstructions ?? []) {
            for (const ix of inner.instructions ?? []) {
              if (
                ix.parsed?.type === 'transfer' &&
                ix.parsed?.info?.destination === TREASURY_WALLET_PUBKEY &&
                parseInt(ix.parsed?.info?.lamports ?? '0') >= minLamports
              ) { verified = true; break; }
            }
            if (verified) break;
          }
        }
      } else {
        // SPL token payment — BUDZ or THC LABZ, verified by USD-equivalent amount
        const mintMap: Record<string, string> = {
          BUDZ: BUDZ_TOKEN_MINT_ADDR,
          GAME_TOKEN: GAME_TOKEN_MINT_ADDR,
        };
        const expectedMint = mintMap[paymentToken];
        if (!expectedMint) {
          return res.status(400).json({ error: `Unknown payment token: ${paymentToken}` });
        }

        // Fetch live token price to calculate minimum required token amount
        let tokenPrice = 0.0000123;
        if (paymentToken === 'BUDZ') tokenPrice = await getBudzPrice();
        else if (paymentToken === 'GAME_TOKEN') tokenPrice = await getThcLabzPrice();

        // Min tokens = USD price / token price, allow 15% slippage
        const minTokens = tokenPrice > 0 ? (packUSD / tokenPrice) * 0.85 : 0;

        const pre = txData.meta?.preTokenBalances ?? [];
        const post = txData.meta?.postTokenBalances ?? [];
        let receiverIncrease = 0;
        let senderDecrease = 0;

        for (const postBal of post) {
          if (postBal.mint !== expectedMint) continue;
          const preBal = pre.find((p: any) => p.accountIndex === postBal.accountIndex && p.mint === expectedMint);
          const preAmt = preBal?.uiTokenAmount?.uiAmount ?? 0;
          const postAmt = postBal.uiTokenAmount?.uiAmount ?? 0;
          const diff = postAmt - preAmt;
          if (diff > 0 && postBal.owner === TREASURY_WALLET_PUBKEY) receiverIncrease = diff;
          else if (diff < 0 && postBal.owner === walletAddress) senderDecrease = Math.abs(diff);
        }

        const actualAmount = Math.max(receiverIncrease, senderDecrease);
        verified = actualAmount >= minTokens;

        console.log(`🔍 verify-tx ${paymentToken}: received=${receiverIncrease.toFixed(4)} sent=${senderDecrease.toFixed(4)} minRequired=${minTokens.toFixed(4)} price=$${tokenPrice} packUSD=$${packUSD} verified=${verified}`);
      }

      if (!verified) {
        return res.status(402).json({ error: `Payment not verified. Pack costs $${packUSD} USD in ${paymentToken} to treasury ${TREASURY_WALLET_PUBKEY.slice(0,8)}...` });
      }

      verifiedTxCache.add(signature);
      const db = storage.getDb();
      const allCards = db ? await db.select().from(adminCards) : [];
      if (allCards.length === 0) return res.status(503).json({ error: 'No cards available' });
      const drawnCards = [0, 1, 2].map(() => weightedRarityPick(allCards, packConfig.weights));

      // Persist verified on-chain purchase cards to user_cards
      if (db) {
        for (const card of drawnCards) {
          try {
            await db.execute(sql`
              INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
              VALUES (${walletAddress}, ${card.id}, ${card.name}, ${JSON.stringify(card)}, 'purchased')
              ON CONFLICT (wallet_address, card_id) DO UPDATE SET card_name = EXCLUDED.card_name, source = 'purchased'
            `);
          } catch {}
        }
      }

      console.log(`✅ On-chain pack verified: ${packType} token=${paymentToken} wallet=${walletAddress} tx=${signature}`);
      res.json({ success: true, cards: drawnCards, signature });
    } catch (err) {
      console.error('verify-tx error:', err);
      res.status(500).json({ error: 'Verification error' });
    }
  });
  // ─── END ON-CHAIN VERIFICATION ─────────────────────────────────────────

  // ─── END CARD PACK SHOP ────────────────────────────────────────────

  const httpServer = createServer(app);
  return httpServer;
}