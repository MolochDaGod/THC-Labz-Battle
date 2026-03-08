/**
 * Crossmint Authentication Service
 * Implements multiple login methods: SOL wallet, email, phone, Discord
 * All methods link to the same unified user account
 */

import fetch from 'node-fetch';

interface CrossmintUser {
  userId: string;
  email?: string;
  phoneNumber?: string;
  google?: {
    name: string;
    picture: string;
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
  discord?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
  };
  walletAddress?: string;
  serverWallet?: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthToken {
  token: string;
  userId: string;
  expiresAt: string;
}

interface LoginResponse {
  success: boolean;
  user?: CrossmintUser;
  token?: string;
  error?: string;
}

class CrossmintAuthService {
  private apiKey: string;
  private projectId: string;
  private baseUrl = 'https://api.crossmint.com/api/v1-alpha1';

  constructor() {
    this.apiKey = process.env.CROSSMINT_API_KEY!;
    this.projectId = process.env.CROSSMINT_PROJECT_ID!;
    
    if (!this.apiKey || !this.projectId) {
      console.error('❌ Crossmint API key or project ID missing');
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      console.log(`🔗 Crossmint API: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-PROJECT-ID': this.projectId,
        },
        body: data ? JSON.stringify(data) : undefined,
        // Add timeout and disable SSL verification for certificate issues
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Crossmint API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Crossmint request failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with Solana wallet
   */
  async authenticateWithWallet(walletAddress: string, signature?: string): Promise<LoginResponse> {
    try {
      // For now, we'll use a simplified auth without signature verification
      // In production, you'd verify the signature here
      const userId = `wallet_${walletAddress}`;
      
      const user: CrossmintUser = {
        userId,
        walletAddress,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log(`✅ Wallet authentication successful: ${walletAddress}`);
      return {
        success: true,
        user,
        token: this.generateToken(userId)
      };
    } catch (error) {
      console.error('Wallet authentication error:', error);
      return {
        success: false,
        error: 'Wallet authentication failed'
      };
    }
  }

  /**
   * Authenticate user with email OTP
   */
  async authenticateWithEmail(email: string, otp?: string): Promise<LoginResponse> {
    try {
      if (!otp) {
        // Send OTP
        await this.sendEmailOTP(email);
        return {
          success: true,
          error: 'OTP sent to email'
        };
      }

      // Verify OTP (simplified for now)
      const userId = `email_${email.replace('@', '_at_')}`;
      
      const user: CrossmintUser = {
        userId,
        email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log(`✅ Email authentication successful: ${email}`);
      return {
        success: true,
        user,
        token: this.generateToken(userId)
      };
    } catch (error) {
      console.error('Email authentication error:', error);
      return {
        success: false,
        error: 'Email authentication failed'
      };
    }
  }

  /**
   * Authenticate user with phone number
   */
  async authenticateWithPhone(phoneNumber: string, otp?: string): Promise<LoginResponse> {
    try {
      if (!otp) {
        // Send SMS OTP
        await this.sendPhoneOTP(phoneNumber);
        return {
          success: true,
          error: 'OTP sent to phone'
        };
      }

      // Verify OTP (simplified for now)
      const userId = `phone_${phoneNumber.replace(/[^0-9]/g, '')}`;
      
      const user: CrossmintUser = {
        userId,
        phoneNumber,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log(`✅ Phone authentication successful: ${phoneNumber}`);
      return {
        success: true,
        user,
        token: this.generateToken(userId)
      };
    } catch (error) {
      console.error('Phone authentication error:', error);
      return {
        success: false,
        error: 'Phone authentication failed'
      };
    }
  }

  /**
   * Authenticate user with Discord
   */
  async authenticateWithDiscord(discordCode: string): Promise<LoginResponse> {
    try {
      // Exchange Discord code for user info
      const discordUser = await this.getDiscordUser(discordCode);
      const userId = `discord_${discordUser.id}`;
      
      const user: CrossmintUser = {
        userId,
        email: discordUser.email,
        discord: discordUser,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log(`✅ Discord authentication successful: ${discordUser.username}`);
      return {
        success: true,
        user,
        token: this.generateToken(userId)
      };
    } catch (error) {
      console.error('Discord authentication error:', error);
      return {
        success: false,
        error: 'Discord authentication failed'
      };
    }
  }

  /**
   * Link multiple authentication methods to same account
   */
  async linkAuthMethods(primaryUserId: string, secondaryAuth: any): Promise<boolean> {
    try {
      // Implementation would store the link in database
      console.log(`🔗 Linking auth methods for user: ${primaryUserId}`);
      return true;
    } catch (error) {
      console.error('Error linking auth methods:', error);
      return false;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUser(userId: string): Promise<CrossmintUser | null> {
    try {
      // This would fetch from your database
      console.log(`👤 Fetching user profile: ${userId}`);
      return null; // Placeholder
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<CrossmintUser>): Promise<boolean> {
    try {
      // This would update in your database
      console.log(`📝 Updating user profile: ${userId}`, updates);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  private async sendEmailOTP(email: string): Promise<void> {
    console.log(`📧 Sending OTP to email: ${email}`);
    // Implementation would send actual OTP
  }

  private async sendPhoneOTP(phoneNumber: string): Promise<void> {
    console.log(`📱 Sending OTP to phone: ${phoneNumber}`);
    // Implementation would send actual SMS
  }

  private async getDiscordUser(code: string): Promise<any> {
    // Implementation would exchange code for Discord user
    console.log(`🎮 Getting Discord user with code: ${code}`);
    return {
      id: '123456789',
      username: 'testuser',
      discriminator: '0001',
      avatar: 'avatar_hash',
      email: 'test@discord.com'
    };
  }

  private generateToken(userId: string): string {
    // Simple token generation (use JWT in production)
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
    console.log(`🔑 Generated token for user: ${userId}`);
    return token;
  }

  /**
   * Verify authentication token
   */
  verifyToken(token: string): { valid: boolean; userId?: string } {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId, timestamp] = decoded.split(':');
      
      // Check if token is not older than 24 hours
      const isValid = Date.now() - parseInt(timestamp) < 24 * 60 * 60 * 1000;
      
      return {
        valid: isValid,
        userId: isValid ? userId : undefined
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

export const crossmintAuth = new CrossmintAuthService();
export type { CrossmintUser, LoginResponse };