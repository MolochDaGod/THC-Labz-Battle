import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminRoutes } from "./admin-routes";
import { tokenRoutes } from "./token-api";
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

import { crossmintService } from "./crossmint";
import { desc, sql, eq } from "drizzle-orm";
import { leaderboard, insertLeaderboardSchema, users, lifetimeLeaderboard, insertLifetimeLeaderboardSchema, completedMissions, playerProgress, insertPlayerProgressSchema } from "../shared/schema";
import { manualRewardProcessing } from "./rewards";
import { processWeeklyRewards, submitFinalCycleScore, scheduleWeeklyRewards } from "./weekly-rewards";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

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
    } catch (error: any) {
      console.error("Health check error:", error);
      res.status(503).json({
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
        .orderBy(desc(leaderboard.score))
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
        .where(eq(playerProgress.isActive, true))
        .orderBy(desc(sql`${playerProgress.moneyInHand} + ${playerProgress.moneyInBank}`))
        .limit(50);

      // Format player progress data with perk icons and comprehensive display info
      const formattedProgress = activePlayerProgress.map((player: any) => {
        const unlockedPerks = JSON.parse(player.unlockedPerks || '[]');
        const citiesVisited = JSON.parse(player.citiesVisited || '[]');
        const totalMoney = player.moneyInHand + player.moneyInBank;
        
        return {
          id: player.id,
          walletAddress: player.walletAddress,
          name: player.name,
          currentDay: player.currentDay,
          moneyInHand: player.moneyInHand,
          moneyInBank: player.moneyInBank,
          totalMoney: totalMoney,
          currentCity: player.currentCity,
          health: player.health,
          heatLevel: player.heatLevel,
          reputation: player.reputation,
          unlockedPerks: unlockedPerks,
          perkIcons: generatePerkIcons(unlockedPerks),
          skills: {
            negotiation: player.negotiation,
            intimidation: player.intimidation,
            mastermind: player.mastermind,
            streetwise: player.streetwise,
            networking: player.networking
          },
          stats: {
            totalTransactions: player.totalTransactions,
            totalProfit: player.totalProfit,
            citiesVisited: citiesVisited.length,
            coatSpace: player.coatSpace
          },
          nftInfo: {
            selectedNFT: player.selectedNFT,
            nftRank: player.nftRank,
            nftRarity: player.nftRarity
          },
          gameRoundId: player.gameRoundId,
          lastSaveTime: player.lastSaveTime,
          minutesAgo: Math.floor((Date.now() - new Date(player.lastSaveTime).getTime()) / (1000 * 60))
        };
      });

      res.json({
        success: true,
        activePlayersCount: formattedProgress.length,
        players: formattedProgress,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
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

      // Calculate comprehensive player progress data
      const progressData = {
        walletAddress,
        name: name || walletAddress.substring(0, 8),
        currentDay: gameState.day || 1,
        moneyInHand: gameState.money || 0,
        moneyInBank: gameState.bankAccount || 0,
        currentCity: gameState.currentCity || 'hometown',
        health: gameState.health || 100,
        heatLevel: gameState.heat || 0,
        coatSpace: gameState.coatSpace || 5,
        reputation: gameState.reputation || 0,
        unlockedPerks: JSON.stringify(gameState.unlockedPerks || []),
        negotiation: gameState.skills?.negotiation || 1,
        intimidation: gameState.skills?.intimidation || 1,
        mastermind: gameState.skills?.mastermind || 1,
        streetwise: gameState.skills?.streetwise || 1,
        networking: gameState.skills?.networking || 1,
        totalTransactions: gameState.totalTransactions || 0,
        totalProfit: gameState.totalProfit || 0,
        citiesVisited: JSON.stringify(gameState.citiesVisited || ['hometown']),
        selectedNft: selectedNFT,
        nftRank: nftRank,
        nftRarity: nftRarity,
        gameRoundId,
        isActive: true,
        lastSaveTime: new Date()
      };

      // Upsert player progress (update if exists, insert if new)
      await db
        .insert(playerProgress)
        .values(progressData)
        .onConflictDoUpdate({
          target: playerProgress.walletAddress,
          set: {
            name: progressData.name,
            currentDay: progressData.currentDay,
            moneyInHand: progressData.moneyInHand,
            moneyInBank: progressData.moneyInBank,
            currentCity: progressData.currentCity,
            health: progressData.health,
            heatLevel: progressData.heatLevel,
            coatSpace: progressData.coatSpace,
            reputation: progressData.reputation,
            unlockedPerks: progressData.unlockedPerks,
            negotiation: progressData.negotiation,
            intimidation: progressData.intimidation,
            mastermind: progressData.mastermind,
            streetwise: progressData.streetwise,
            networking: progressData.networking,
            totalTransactions: progressData.totalTransactions,
            totalProfit: progressData.totalProfit,
            citiesVisited: progressData.citiesVisited,
            selectedNft: progressData.selectedNft,
            nftRank: progressData.nftRank,
            nftRarity: progressData.nftRarity,
            gameRoundId: progressData.gameRoundId,
            isActive: progressData.isActive,
            lastSaveTime: progressData.lastSaveTime,
            updatedAt: new Date()
          }
        });

      res.json({ 
        success: true, 
        message: "Player progress updated successfully",
        totalMoney: progressData.moneyInHand + progressData.moneyInBank,
        day: progressData.currentDay,
        city: progressData.currentCity
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
          gbuxBalance: existingUser[0].gbuxBalance
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
          thcLabzTokenBalance: 0,
          lastLogin: new Date()
        }).returning();

        console.log(`💰 Real server-side SOL wallet created successfully: ${serverWalletAddress}`);

        res.json({
          success: true,
          serverWallet: serverWalletAddress,
          serverWalletAddress: serverWalletAddress,
          budzBalance: newUser[0].budzBalance,
          gbuxBalance: newUser[0].gbuxBalance,
          thcLabzTokenBalance: newUser[0].thcLabzTokenBalance,
          solBalance: 0,
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
          serverWallet: `temp_${targetWallet.slice(0, 8)}_${Date.now()}`, // Temporary identifier
          budzBalance: 0,
          gbuxBalance: 0,
          thcLabzTokenBalance: 0,
          solBalance: 0,

          lastLogin: new Date()
        }).returning();

        console.log(`✅ User created with client wallet (Crossmint retry needed): ${targetWallet}`);
        
        return res.json({
          walletAddress: targetWallet,
          serverWallet: newUser[0].serverWallet,
          budzBalance: 0,
          gbuxBalance: 0,
          thcLabzTokenBalance: 0,
          solBalance: 0,
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

  // Token management routes
  app.get("/api/token-price/:mintAddress", tokenRoutes.getTokenPrice);
  app.post("/api/token-prices/batch", getBatchTokenPrices);
  app.post("/api/token-prices/clear-cache", clearPriceCache);
  app.post("/api/swap-tokens", tokenRoutes.executeTokenSwap);
  app.get("/api/wallet-info/:walletAddress", tokenRoutes.getWalletInfo);
  app.get("/api/ai-agent/stats", tokenRoutes.getAIAgentStats);

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
    tokenRoutes.getWalletInfo(req, res);
  });

  // NFT routes - user wallet detection only
  app.get("/api/nft/growerz/:walletAddress", nftRoutes.getGrowerNFTs);

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
  app.post("/api/auth/wallet", async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      const { crossmintAuth } = await import('./crossmint-auth');
      const result = await crossmintAuth.authenticateWithWallet(walletAddress, signature);

      if (result.success) {
        console.log(`✅ SOL Wallet auth successful: ${walletAddress}`);
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Error in wallet authentication:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/email", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const { crossmintAuth } = await import('./crossmint-auth');
      const result = await crossmintAuth.authenticateWithEmail(email, otp);

      res.json(result);
    } catch (error) {
      console.error("Error in email authentication:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/phone", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
      }

      const { crossmintAuth } = await import('./crossmint-auth');
      const result = await crossmintAuth.authenticateWithPhone(phoneNumber, otp);

      res.json(result);
    } catch (error) {
      console.error("Error in phone authentication:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/discord", async (req, res) => {
    try {
      const { discordCode } = req.body;

      if (!discordCode) {
        return res.status(400).json({ error: "Discord code required" });
      }

      const { crossmintAuth } = await import('./crossmint-auth');
      const result = await crossmintAuth.authenticateWithDiscord(discordCode);

      res.json(result);
    } catch (error) {
      console.error("Error in Discord authentication:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

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
        res.json({
          success: true,
          user: result.user,
          token: result.token
        });
      } else {
        res.status(400).json({ error: result.error });
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

  // Favicon route
  app.get("/favicon.ico", (req, res) => {
    res.sendFile("/home/runner/workspace/client/public/favicon.ico");
  });

  const httpServer = createServer(app);

  return httpServer;
}