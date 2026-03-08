import {
  Connection, PublicKey, Transaction, clusterApiUrl,
  SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export const GAME_TOKEN_MINT = 'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT'; // THC LABZ
export const GBUX_MINT       = '55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray';
export const BUDZ_MINT       = '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ';
export const TREASURY_WALLET = '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ';

export const PACK_USD_PRICES: Record<string, number> = {
  'green-bag':   0.10,
  'dank-pack':   0.30,
  'legend-kush': 0.75,
};

export const PACK_GBUX_PRICES: Record<string, number> = {
  'green-bag':   20,
  'dank-pack':   60,
  'legend-kush': 150,
};

export type PaymentToken = 'GBUX' | 'SOL' | 'BUDZ' | 'GAME_TOKEN';

export interface TokenPrices {
  sol: number;
  gbux: number;
  budz: number;
  thcLabz: number;
}

const connection = new Connection(
  (import.meta as any).env?.VITE_SOLANA_RPC || clusterApiUrl('mainnet-beta'),
  'confirmed'
);

function getSolanaProvider(): any {
  const win = window as any;
  if (win.solana?.isPhantom || win.solana?.isSolflare || win.solana?.isMagicEden) return win.solana;
  if (win.phantom?.solana) return win.phantom.solana;
  return win.solana || null;
}

export function isWalletConnected(): boolean {
  const provider = getSolanaProvider();
  return !!(provider?.publicKey || provider?.isConnected);
}

export async function getTokenDecimals(mintAddress: string): Promise<number> {
  try {
    const mintPubkey = new PublicKey(mintAddress);
    const info = await connection.getParsedAccountInfo(mintPubkey);
    const parsed = (info.value?.data as any)?.parsed?.info;
    return parsed?.decimals ?? 6;
  } catch {
    return 6;
  }
}

export async function fetchAllTokenPrices(): Promise<TokenPrices> {
  try {
    const resp = await fetch('/api/token-prices/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (resp.ok) {
      const d = await resp.json();
      const solPrice = await fetchSolPrice();
      return {
        sol: solPrice,
        gbux: d.gbux || 0.0000123,
        budz: d.budz || 0.0000123,
        thcLabz: d.thcLabz || 0.001,
      };
    }
  } catch {}
  return { sol: 180, gbux: 0.0000123, budz: 0.0000123, thcLabz: 0.001 };
}

async function fetchSolPrice(): Promise<number> {
  try {
    const r = await fetch('https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112');
    if (r.ok) {
      const d = await r.json();
      return d.data?.['So11111111111111111111111111111111111111112']?.price || 180;
    }
  } catch {}
  return 180;
}

export function calcTokenAmount(packType: string, token: PaymentToken, prices: TokenPrices): number {
  const usd = PACK_USD_PRICES[packType] ?? 0.10;
  switch (token) {
    case 'GBUX':       return PACK_GBUX_PRICES[packType] ?? 20;
    case 'SOL':        return prices.sol > 0 ? usd / prices.sol : 0;
    case 'BUDZ':       return prices.budz > 0 ? usd / prices.budz : 0;
    case 'GAME_TOKEN': return prices.thcLabz > 0 ? usd / prices.thcLabz : 0;
  }
}

export interface PurchaseQuote {
  packType: string;
  paymentToken: PaymentToken;
  rawAmount: bigint;
  uiAmount: number;
  tokenMint: string;
  priceUSD: number;
  packUSD: number;
}

export async function getPackQuote(
  packType: string,
  paymentToken: PaymentToken,
  prices: TokenPrices
): Promise<PurchaseQuote> {
  const packUSD = PACK_USD_PRICES[packType] ?? 0.10;
  const uiAmount = calcTokenAmount(packType, paymentToken, prices);

  let tokenMint = GBUX_MINT;
  let rawAmount: bigint;

  if (paymentToken === 'SOL') {
    rawAmount = BigInt(Math.ceil(uiAmount * LAMPORTS_PER_SOL));
    return { packType, paymentToken, rawAmount, uiAmount, tokenMint: 'SOL', priceUSD: prices.sol, packUSD };
  } else if (paymentToken === 'BUDZ') {
    tokenMint = BUDZ_MINT;
  } else if (paymentToken === 'GAME_TOKEN') {
    tokenMint = GAME_TOKEN_MINT;
  } else {
    tokenMint = GBUX_MINT;
  }

  const decimals = await getTokenDecimals(tokenMint);
  rawAmount = BigInt(Math.ceil(uiAmount * 10 ** decimals));
  return { packType, paymentToken, rawAmount, uiAmount, tokenMint, priceUSD: prices.sol, packUSD };
}

export async function buildPackPurchaseTransaction(
  fromWalletAddress: string,
  quote: PurchaseQuote
): Promise<Transaction> {
  const from = new PublicKey(fromWalletAddress);
  const treasury = new PublicKey(TREASURY_WALLET);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: from });
  (tx as any)._lastValidBlockHeight = lastValidBlockHeight;

  if (quote.paymentToken === 'SOL') {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: treasury,
        lamports: quote.rawAmount,
      })
    );
  } else {
    const mint = new PublicKey(quote.tokenMint);
    const fromATA = await getAssociatedTokenAddress(mint, from);
    const toATA = await getAssociatedTokenAddress(mint, treasury);
    tx.add(
      createTransferInstruction(fromATA, toATA, from, quote.rawAmount, [], TOKEN_PROGRAM_ID)
    );
  }

  return tx;
}

export async function signAndSendTransaction(tx: Transaction): Promise<string> {
  const provider = getSolanaProvider();
  if (!provider) throw new Error('No Solana wallet found. Install Phantom or Solflare.');

  const signed: Transaction = await provider.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

export interface PurchaseResult {
  success: boolean;
  cards?: any[];
  newGbuxBalance?: number;
  error?: string;
  signature?: string;
}

export async function executePurchaseAndOpenPack(
  walletAddress: string,
  packType: string,
  paymentToken: PaymentToken,
  tokenPricesOrPrice: TokenPrices | number,
  onStatus?: (msg: string) => void
): Promise<PurchaseResult> {
  try {
    let prices: TokenPrices;
    if (typeof tokenPricesOrPrice === 'number') {
      prices = { sol: 180, gbux: 0.0000123, budz: 0.0000123, thcLabz: tokenPricesOrPrice };
    } else {
      prices = tokenPricesOrPrice;
    }

    if (paymentToken === 'GBUX') {
      onStatus?.('Processing...');
      const resp = await fetch('/api/card-shop/open-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, packType, paymentToken: 'GBUX' }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Purchase failed');
      return { success: true, cards: data.cards, newGbuxBalance: data.newGbuxBalance };
    }

    onStatus?.('Calculating price...');
    const quote = await getPackQuote(packType, paymentToken, prices);

    if (quote.rawAmount === 0n) {
      throw new Error('Unable to calculate token price. Try again later.');
    }

    onStatus?.('Building transaction...');
    const tx = await buildPackPurchaseTransaction(walletAddress, quote);

    onStatus?.('Waiting for wallet signature...');
    const signature = await signAndSendTransaction(tx);

    onStatus?.('Confirming on Solana...');
    await new Promise(r => setTimeout(r, 2000));

    onStatus?.('Verifying purchase...');
    const resp = await fetch('/api/card-shop/verify-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, walletAddress, packType, paymentToken }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Verification failed');

    return { success: true, cards: data.cards, newGbuxBalance: data.newGbuxBalance, signature };
  } catch (err: any) {
    const message = err?.message || 'Transaction failed';
    if (message.includes('User rejected') || message.includes('cancelled')) {
      return { success: false, error: 'Transaction cancelled by user.' };
    }
    return { success: false, error: message };
  }
}

export { connection as solanaConnection };
