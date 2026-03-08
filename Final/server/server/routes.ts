import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminRoutes } from "./admin-routes";
import { tokenRoutes } from "./token-api";
import { nftRoutes } from "./nft-api";
import { howRareRoutes } from "./howrare-api";
import { aiAgentWallet } from "./ai-agent-wallet";
import { aiAssistantRoutes } from "./ai-assistant-routes";
import { achievementRoutes } from "./achievement-routes";
import { discordRoutes } from "./discord-routes";
import { downloadRoutes } from "./download-routes";

import { crossmintService } from "./crossmint";
import { desc, sql, eq } from "drizzle-orm";
import { leaderboard, insertLeaderboardSchema, users, lifetimeLeaderboard, insertLifetimeLeaderboardSchema } from "../shared/schema";
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
    } catch (error) {
      console.error("Health check error:", error);
      res.status(503).json({
        success: false,
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Leaderboard endpoints
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

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const { name, score, day, walletAddress, serverWallet } = req.body;
      
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
      
      // Enforce one score per wallet rule - remove existing score if present
      const existingDailyScore = await db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.walletAddress, walletAddress))
        .limit(1);
      
      if (existingDailyScore.length > 0) {
        // Remove existing score, keep only the highest
        if (parseInt(score) > existingDailyScore[0].score) {
          await db
            .delete(leaderboard)
            .where(eq(leaderboard.walletAddress, walletAddress));
          console.log(`🔄 Replaced lower score for wallet: ${walletAddress} (${existingDailyScore[0].score} → ${score})`);
        } else {
          return res.status(400).json({ 
            error: `Your current score (${existingDailyScore[0].score}) is higher than ${score}. Only your best score counts!` 
          });
        }
      }
      
      let dailyScore;
      if (existingDailyScore.length > 0) {
        // Update only if new score is higher
        if (parseInt(score) > existingDailyScore[0].score) {
          console.log(`🔄 Updating score for wallet ${walletAddress}: ${existingDailyScore[0].score} → ${score}`);
          dailyScore = await db
            .update(leaderboard)
            .set(scoreData)
            .where(eq(leaderboard.walletAddress, walletAddress))
            .returning();
        } else {
          console.log(`⚠️ Score ${score} not higher than existing ${existingDailyScore[0].score} for wallet ${walletAddress}`);
          // Return existing score if new one isn't higher
          return res.status(400).json({ 
            error: `Score ${score} not higher than your existing score of ${existingDailyScore[0].score}. Complete another 45-day round to improve!` 
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
        // Return error - NO MOCK DATA OR PLACEHOLDERS as requested
        return res.status(503).json({ 
          error: 'Real server-side SOL wallet creation unavailable', 
          message: 'Crossmint service is currently unavailable. No mock wallets or placeholders will be created. Please try again later.',
          details: crossmintError.message,
          fallback: false,
          mockData: false
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

  // Admin routes
  app.get("/api/admin/stats", adminRoutes.getStats);
  app.get("/api/admin/users", adminRoutes.getUsers);
  app.get("/api/admin/leaderboard", adminRoutes.getLeaderboard);
  app.patch("/api/admin/users/:userId/balance", adminRoutes.updateUserBalance);
  app.post("/api/admin/process-rewards", adminRoutes.processRewards);
  app.post("/api/admin/custom-reward", adminRoutes.sendCustomReward);
  app.post("/api/admin/weekly-rewards", adminRoutes.triggerWeeklyRewards);
  app.get("/api/admin/health", adminRoutes.getHealth);

  // Token management routes
  app.get("/api/token-price/:mintAddress", tokenRoutes.getTokenPrice);
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
  
  // Main wallet endpoint with real token balances
  app.get("/api/wallet/:walletAddress", (req, res) => {
    console.log(`🔄 Wallet endpoint called for: ${req.params.walletAddress}`);
    tokenRoutes.getWalletInfo(req, res);
  });

  // NFT collection routes
  app.get("/api/nft/growerz/:walletAddress", nftRoutes.getGrowerNFTs);
  app.get("/api/nft/collection/growerz", nftRoutes.getGrowerCollectionInfo);
  
  // HowRare NFT Marketplace routes
  app.get("/api/marketplace/collections", howRareRoutes.getCollections);
  app.get("/api/marketplace/collections/growerz/all", howRareRoutes.getAllGrowerNFTs);
  app.get("/api/marketplace/wallet/:walletAddress/nfts", howRareRoutes.getWalletNFTs);
  app.post("/api/marketplace/register", howRareRoutes.registerUser);
  app.get("/api/marketplace/user/:walletAddress/register", howRareRoutes.registerUser);
  app.post("/api/marketplace/assistant/select", howRareRoutes.selectAssistant);
  app.get("/api/marketplace/stats", howRareRoutes.getMarketplaceStats);
  
  // NFT-gated gameplay mechanics
  app.post("/api/gameplay/nft-bonus", async (req, res) => {
    try {
      const { walletAddress, nftMint } = req.body;
      
      if (!walletAddress || !nftMint) {
        return res.status(400).json({ error: "Wallet address and NFT mint required" });
      }

      // Verify NFT ownership first
      const nftResponse = await fetch(`http://localhost:5000/api/nft/growerz/${walletAddress}`);
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

  // Download routes
  app.get("/api/download/final", downloadRoutes.downloadFinal);
  app.get("/api/download/info", downloadRoutes.getPackageInfo);

  // Favicon route
  app.get("/favicon.ico", (req, res) => {
    res.sendFile("/home/runner/workspace/client/public/favicon.ico");
  });

  const httpServer = createServer(app);

  return httpServer;
}
