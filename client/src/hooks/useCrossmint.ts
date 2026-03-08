/**
 * useCrossmint — React hook for Crossmint authentication state.
 * Provides login methods, session state, and wallet data.
 */

import { useState, useEffect, useCallback } from 'react';
import { CrossmintService } from '../services/CrossmintService';
import type { CrossmintAuthState, CrossmintUser, CrossmintWallet } from '../types/crossmint.d.ts';

function getSolanaProvider(): any {
  const w = window as any;
  return w.solana ?? w.phantom?.solana ?? null;
}

export function useCrossmint() {
  const [state, setState] = useState<CrossmintAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user:   null,
    wallet: null,
    token:  null,
    error:  null,
  });

  useEffect(() => {
    CrossmintService.loadSession();
    if (CrossmintService.isAuthenticated && CrossmintService.userId) {
      setState(s => ({ ...s, token: CrossmintService.token, isLoading: true }));
      CrossmintService.getUserProfile()
        .then(user => {
          setState({
            isAuthenticated: true,
            isLoading: false,
            user,
            wallet: null,
            token: CrossmintService.token,
            error: null,
          });
          return CrossmintService.getWallet();
        })
        .then(wallet => {
          if (wallet) setState(s => ({ ...s, wallet }));
        })
        .catch(() => {
          CrossmintService.clearSession();
          setState({ isAuthenticated: false, isLoading: false, user: null, wallet: null, token: null, error: null });
        });
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const loginWithWallet = useCallback(async (): Promise<string | null> => {
    const provider = getSolanaProvider();
    if (!provider) {
      setState(s => ({ ...s, error: 'No Solana wallet detected. Please install Phantom or Solflare.' }));
      return null;
    }
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      await provider.connect();
      const walletAddress: string = provider.publicKey.toString();
      const signMessage = async (msg: Uint8Array) => {
        const result = await provider.signMessage(msg, 'utf8');
        return { signature: result.signature ?? result };
      };
      const { user, token } = await CrossmintService.authWithWallet(walletAddress, signMessage);
      const wallet = await CrossmintService.getWallet();
      setState({ isAuthenticated: true, isLoading: false, user, wallet, token, error: null });
      return walletAddress;
    } catch (err: any) {
      setState(s => ({ ...s, isLoading: false, error: err?.message ?? 'Wallet login failed' }));
      return null;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await CrossmintService.sendOTP({ identifier: email, method: 'email' });
      setState(s => ({ ...s, isLoading: false }));
      return result.success;
    } catch (err: any) {
      setState(s => ({ ...s, isLoading: false, error: err?.message ?? 'Failed to send OTP' }));
      return false;
    }
  }, []);

  const loginWithPhone = useCallback(async (phone: string): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await CrossmintService.sendOTP({ identifier: phone, method: 'phone' });
      setState(s => ({ ...s, isLoading: false }));
      return result.success;
    } catch (err: any) {
      setState(s => ({ ...s, isLoading: false, error: err?.message ?? 'Failed to send SMS' }));
      return false;
    }
  }, []);

  const verifyOTP = useCallback(async (
    identifier: string,
    otp: string,
    method: 'email' | 'phone'
  ): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const { user, token } = await CrossmintService.verifyOTP({ identifier, otp, method });
      const wallet = await CrossmintService.getWallet();
      setState({ isAuthenticated: true, isLoading: false, user, wallet, token, error: null });
      return true;
    } catch (err: any) {
      setState(s => ({ ...s, isLoading: false, error: err?.message ?? 'Invalid OTP' }));
      return false;
    }
  }, []);

  const loginWithDiscord = useCallback(() => {
    const url = CrossmintService.getDiscordAuthUrl();
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    CrossmintService.clearSession();
    setState({ isAuthenticated: false, isLoading: false, user: null, wallet: null, token: null, error: null });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!CrossmintService.isAuthenticated) return;
    try {
      const user = await CrossmintService.getUserProfile();
      const wallet = await CrossmintService.getWallet();
      setState(s => ({ ...s, user, wallet: wallet ?? s.wallet }));
    } catch {}
  }, []);

  return {
    ...state,
    loginWithWallet,
    loginWithEmail,
    loginWithPhone,
    verifyOTP,
    loginWithDiscord,
    logout,
    refreshUser,
  };
}

export default useCrossmint;
