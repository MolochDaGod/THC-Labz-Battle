import { Router } from 'express';
import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

const router = Router();

// AI Agent Wallet Configuration
const AI_AGENT_PRIVATE_KEY = process.env.AI_AGENT_PRIVATE_KEY;
const GBUX_TOKEN_MINT = process.env.GBUX_TOKEN_MINT || 'GBUXTokenMintAddressHere';
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Initialize Solana connection
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// AI Agent Wallet Keypair
let aiAgentWallet: Keypair;
try {
  if (AI_AGENT_PRIVATE_KEY) {
    const trimmed = AI_AGENT_PRIVATE_KEY.trim().replace(/^["'\s]+|["'\s]+$/g, '');
    let secretBytes: Uint8Array | null = null;

    if (trimmed.startsWith('[')) {
      // JSON byte array: [1,2,3,...]
      secretBytes = Uint8Array.from(JSON.parse(trimmed));
    } else if (/^[0-9a-fA-F]{128}$/.test(trimmed)) {
      // Hex-encoded 64-byte key (128 hex chars)
      secretBytes = new Uint8Array(trimmed.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    } else if (/^[A-Za-z0-9+/=]{88,}$/.test(trimmed) && (trimmed.includes('+') || trimmed.includes('/') || trimmed.includes('='))) {
      // Standard base64
      secretBytes = Uint8Array.from(Buffer.from(trimmed, 'base64'));
    } else if (/^[A-Za-z0-9_-]{86,}$/.test(trimmed)) {
      // URL-safe base64
      secretBytes = Uint8Array.from(Buffer.from(trimmed, 'base64url'));
    } else if (trimmed.length >= 85) {
      // Base58 private key (Phantom export ~87-88 chars)
      secretBytes = bs58.decode(trimmed);
    } else {
      // Value looks like a public key or is too short — skip silently
      console.info('ℹ️ AI_AGENT_PRIVATE_KEY appears to be a public address or unsupported format — on-chain GBUX swaps disabled');
    }

    if (secretBytes) {
      aiAgentWallet = Keypair.fromSecretKey(secretBytes);
      console.log('✅ AI Agent Wallet loaded:', aiAgentWallet.publicKey.toString());
    }
  } else {
    console.info('ℹ️ AI_AGENT_PRIVATE_KEY not set — on-chain GBUX swaps disabled');
  }
} catch (error) {
  console.warn('⚠️ Could not load AI Agent wallet (swaps disabled):', (error as Error).message);
}

// SOL to GBUX swap endpoint
router.post('/sol-to-gbux', async (req, res) => {
  try {
    const { walletAddress, gbuxAmount, solAmount } = req.body;

    // Validation
    if (!walletAddress || !gbuxAmount || !solAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: walletAddress, gbuxAmount, solAmount'
      });
    }

    if (!aiAgentWallet) {
      return res.status(500).json({
        success: false,
        error: 'AI Agent wallet not configured'
      });
    }

    // Validate swap rate (1 GBUX = 0.1 SOL)
    const expectedSolAmount = gbuxAmount * 0.1;
    if (Math.abs(solAmount - expectedSolAmount) > 0.001) {
      return res.status(400).json({
        success: false,
        error: `Invalid swap rate. Expected ${expectedSolAmount} SOL for ${gbuxAmount} GBUX`
      });
    }

    const userPublicKey = new PublicKey(walletAddress);
    const solAmountInLamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

    // Check user's SOL balance
    const userBalance = await connection.getBalance(userPublicKey);
    if (userBalance < solAmountInLamports + 5000) { // 5000 lamports for transaction fees
      return res.status(400).json({
        success: false,
        error: 'Insufficient SOL balance for transaction and fees'
      });
    }

    // Check AI Agent's GBUX balance
    const gbuxMint = new PublicKey(GBUX_TOKEN_MINT);
    const aiAgentTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      aiAgentWallet,
      gbuxMint,
      aiAgentWallet.publicKey
    );

    const aiAgentGbuxBalance = await connection.getTokenAccountBalance(aiAgentTokenAccount.address);
    const requiredGbuxAmount = gbuxAmount * Math.pow(10, 9); // Assuming 9 decimals for GBUX

    if (Number(aiAgentGbuxBalance.value.amount) < requiredGbuxAmount) {
      return res.status(500).json({
        success: false,
        error: 'AI Agent has insufficient GBUX tokens for this swap'
      });
    }

    // Create user's GBUX token account if it doesn't exist
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      aiAgentWallet, // AI Agent pays for account creation
      gbuxMint,
      userPublicKey
    );

    // Create swap transaction
    const transaction = new Transaction();

    // Step 1: User sends SOL to AI Agent
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: aiAgentWallet.publicKey,
        lamports: solAmountInLamports,
      })
    );

    // Step 2: AI Agent sends GBUX to user
    transaction.add(
      createTransferInstruction(
        aiAgentTokenAccount.address,
        userTokenAccount.address,
        aiAgentWallet.publicKey,
        requiredGbuxAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Set recent blockhash and fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = aiAgentWallet.publicKey;

    // Partial sign with AI Agent wallet
    transaction.partialSign(aiAgentWallet);

    // Serialize transaction for user to sign
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    // For now, we'll execute the transaction server-side for simplicity
    // In production, you'd want the user to sign this transaction
    try {
      // This is a simplified version - in production, you'd need proper user signature handling
      const signature = await sendAndConfirmTransaction(connection, transaction, [aiAgentWallet]);
      
      console.log(`✅ GBUX swap completed: ${gbuxAmount} GBUX for ${solAmount} SOL`);
      console.log(`🔗 Transaction: ${signature}`);

      // Log the swap for tracking
      const swapRecord = {
        timestamp: new Date().toISOString(),
        userWallet: walletAddress,
        gbuxAmount,
        solAmount,
        txSignature: signature,
        type: 'SOL_TO_GBUX'
      };

      // Here you could store the swap record in your database
      console.log('💾 Swap record:', swapRecord);

      res.json({
        success: true,
        txSignature: signature,
        gbuxAmount,
        solAmount,
        message: `Successfully swapped ${solAmount} SOL for ${gbuxAmount} GBUX`
      });

    } catch (txError: any) {
      console.error('❌ Transaction failed:', txError);
      res.status(500).json({
        success: false,
        error: 'Transaction failed',
        details: txError?.message || 'Unknown transaction error'
      });
    }

  } catch (error: any) {
    console.error('❌ GBUX swap error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    });
  }
});

// Get swap rates endpoint
router.get('/rates', (req, res) => {
  res.json({
    success: true,
    rates: {
      'SOL_TO_GBUX': 0.1, // 1 GBUX = 0.1 SOL
      'GBUX_TO_SOL': 10,  // 1 SOL = 10 GBUX
    },
    minimumSwap: {
      gbux: 1,
      sol: 0.1
    },
    maximumSwap: {
      gbux: 100,
      sol: 10
    }
  });
});

// Get AI Agent wallet status
router.get('/agent-status', async (req, res) => {
  try {
    if (!aiAgentWallet) {
      return res.json({
        success: false,
        error: 'AI Agent wallet not configured'
      });
    }

    const solBalance = await connection.getBalance(aiAgentWallet.publicKey);
    
    // Try to get GBUX balance if token account exists
    let gbuxBalance = 0;
    try {
      const gbuxMint = new PublicKey(GBUX_TOKEN_MINT);
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        aiAgentWallet,
        gbuxMint,
        aiAgentWallet.publicKey
      );
      const balance = await connection.getTokenAccountBalance(tokenAccount.address);
      gbuxBalance = Number(balance.value.amount) / Math.pow(10, 9);
    } catch (tokenError: any) {
      console.log('ℹ️ GBUX token account not found or error:', tokenError?.message || 'Unknown token error');
    }

    res.json({
      success: true,
      agentWallet: aiAgentWallet.publicKey.toString(),
      balances: {
        sol: solBalance / LAMPORTS_PER_SOL,
        gbux: gbuxBalance
      },
      status: 'active'
    });

  } catch (error) {
    console.error('❌ Agent status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check agent status'
    });
  }
});

export default router;