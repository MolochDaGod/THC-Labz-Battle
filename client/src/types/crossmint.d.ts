/**
 * TypeScript declarations for Crossmint integration types.
 */

export interface CrossmintUser {
  userId: string;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  serverWallet?: string;
  solanaWallet?: string;
  google?: {
    name: string;
    picture: string;
    email?: string;
  };
  discord?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
  };
  farcaster?: {
    fid: string;
    username: string;
    bio: string;
    displayName: string;
    pfpUrl: string;
    custody: string;
    verifications: string[];
  };
  createdAt: string;
  lastLogin: string;
}

export interface CrossmintAuthToken {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface CrossmintWallet {
  type: string;
  address: string;
  linkedUser: string;
  createdAt: string;
  chain: string;
  config?: Record<string, any>;
}

export interface CrossmintMintRequest {
  collectionId: string;
  recipient: string;
  metadata: CrossmintNFTMetadata;
  reuploadLinkedFiles?: boolean;
  mintConfig?: {
    quantity?: number;
    totalPrice?: string;
    currency?: string;
  };
}

export interface CrossmintNFTMetadata {
  name: string;
  image: string;
  description: string;
  attributes: CrossmintAttribute[];
  animation_url?: string;
  external_url?: string;
  properties?: Record<string, any>;
}

export interface CrossmintAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
}

export interface CrossmintMintResponse {
  id: string;
  actionId: string;
  status: 'pending' | 'in-progress' | 'succeeded' | 'failed';
  onChain?: {
    status: string;
    chain: string;
    contractAddress?: string;
    tokenId?: string;
    txId?: string;
  };
}

export interface CrossmintSwapValidation {
  approved: boolean;
  reasoning: string;
  adjustedAmount?: number;
  riskScore: number;
  priceProtection: {
    minAcceptableRate: number;
    currentRate: number;
    protectionTriggered: boolean;
  };
}

export interface CrossmintOTPRequest {
  identifier: string;
  method: 'email' | 'phone';
}

export interface CrossmintOTPVerify {
  identifier: string;
  otp: string;
  method: 'email' | 'phone';
}

export interface CrossmintAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CrossmintUser | null;
  wallet: CrossmintWallet | null;
  token: string | null;
  error: string | null;
}
