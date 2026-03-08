/**
 * CrossmintService — client-side wrapper for all Crossmint API calls.
 * Talks to /api/auth/* and /api/crossmint/* server routes.
 */

import type {
  CrossmintUser,
  CrossmintAuthToken,
  CrossmintWallet,
  CrossmintMintRequest,
  CrossmintMintResponse,
  CrossmintOTPRequest,
  CrossmintOTPVerify,
  CrossmintSwapValidation,
} from '../types/crossmint.d.ts';

const BASE = '';

export class CrossmintService {
  private static _token: string | null = null;
  private static _userId: string | null = null;

  static setSession(token: string, userId: string) {
    CrossmintService._token = token;
    CrossmintService._userId = userId;
    try {
      localStorage.setItem('crossmint_token',   token);
      localStorage.setItem('crossmint_user_id', userId);
    } catch {}
  }

  static clearSession() {
    CrossmintService._token = null;
    CrossmintService._userId = null;
    try {
      localStorage.removeItem('crossmint_token');
      localStorage.removeItem('crossmint_user_id');
    } catch {}
  }

  static loadSession() {
    try {
      CrossmintService._token   = localStorage.getItem('crossmint_token');
      CrossmintService._userId  = localStorage.getItem('crossmint_user_id');
    } catch {}
  }

  static get token() { return CrossmintService._token; }
  static get userId() { return CrossmintService._userId; }
  static get isAuthenticated() { return !!CrossmintService._token; }

  private static headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (CrossmintService._token) h['Authorization'] = `Bearer ${CrossmintService._token}`;
    return h;
  }

  static async authWithWallet(
    walletAddress: string,
    signMessage: (msg: Uint8Array) => Promise<{ signature: Uint8Array }>
  ): Promise<{ user: CrossmintUser; token: string }> {
    const nonce = `THC-CLASH-LOGIN-${Date.now()}`;
    const encoded = new TextEncoder().encode(nonce);
    const { signature } = await signMessage(encoded);
    const sigHex = Buffer.from(signature).toString('hex');

    const res = await fetch(`${BASE}/api/auth/wallet`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ walletAddress, signature: sigHex, nonce }),
    });
    if (!res.ok) throw new Error(`Wallet auth failed: ${res.status}`);
    const data = await res.json();
    CrossmintService.setSession(data.token, data.user.userId);
    return data;
  }

  static async sendOTP(request: CrossmintOTPRequest): Promise<{ success: boolean; message: string }> {
    const endpoint = request.method === 'email'
      ? '/api/auth/email/send-otp'
      : '/api/auth/phone/send-otp';
    const res = await fetch(`${BASE}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(request),
    });
    return res.json();
  }

  static async verifyOTP(request: CrossmintOTPVerify): Promise<{ user: CrossmintUser; token: string }> {
    const endpoint = request.method === 'email'
      ? '/api/auth/email/verify-otp'
      : '/api/auth/phone/verify-otp';
    const res = await fetch(`${BASE}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`OTP verify failed: ${res.status}`);
    const data = await res.json();
    CrossmintService.setSession(data.token, data.user.userId);
    return data;
  }

  static getDiscordAuthUrl(): string {
    return `${BASE}/api/auth/discord`;
  }

  static async getUserProfile(userId?: string): Promise<CrossmintUser> {
    const id = userId ?? CrossmintService._userId;
    const res = await fetch(`${BASE}/api/auth/user/${id}`, {
      headers: CrossmintService.headers(),
    });
    if (!res.ok) throw new Error(`Get profile failed: ${res.status}`);
    return res.json();
  }

  static async getWallet(userId?: string): Promise<CrossmintWallet | null> {
    const id = userId ?? CrossmintService._userId;
    try {
      const res = await fetch(`${BASE}/api/wallet/${id}`, {
        headers: CrossmintService.headers(),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  static async createWallet(userId: string): Promise<CrossmintWallet> {
    const res = await fetch(`${BASE}/api/auth/wallet/create`, {
      method:  'POST',
      headers: CrossmintService.headers(),
      body:    JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(`Create wallet failed: ${res.status}`);
    return res.json();
  }

  static async mintNFT(request: CrossmintMintRequest): Promise<CrossmintMintResponse> {
    const res = await fetch(`${BASE}/api/cards/mint-nft`, {
      method:  'POST',
      headers: CrossmintService.headers(),
      body:    JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Mint NFT failed: ${res.status}`);
    return res.json();
  }

  static async getMintStatus(actionId: string): Promise<CrossmintMintResponse> {
    const res = await fetch(`${BASE}/api/cards/mint-status/${actionId}`, {
      headers: CrossmintService.headers(),
    });
    if (!res.ok) throw new Error(`Get mint status failed: ${res.status}`);
    return res.json();
  }

  static async validateSwap(params: {
    fromToken: string;
    toToken: string;
    fromAmount: number;
    toAmount: number;
    userWallet: string;
    priceImpact: number;
  }): Promise<CrossmintSwapValidation> {
    const res = await fetch(`${BASE}/api/ai-agent/validate-swap`, {
      method:  'POST',
      headers: CrossmintService.headers(),
      body:    JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Swap validation failed: ${res.status}`);
    return res.json();
  }

  static async linkWallet(userId: string, walletAddress: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE}/api/auth/link-wallet`, {
      method:  'POST',
      headers: CrossmintService.headers(),
      body:    JSON.stringify({ userId, walletAddress }),
    });
    return res.json();
  }
}

export default CrossmintService;
