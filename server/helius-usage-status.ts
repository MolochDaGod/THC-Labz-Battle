/**
 * Helius Usage Status API Route
 * Provides information about daily Helius API usage limits
 */

import { Request, Response } from 'express';
import { heliusRateLimiter } from './helius-rate-limiter';

/**
 * Get Helius API usage status
 */
export const getHeliusUsageStatus = (req: Request, res: Response) => {
  try {
    const status = heliusRateLimiter.getUsageStatus();
    const canUseToday = heliusRateLimiter.canUseHeliusToday();
    
    res.json({
      success: true,
      usage: status,
      canUseToday,
      message: canUseToday 
        ? 'Helius API available for use today'
        : 'Daily Helius usage limit reached, using fallback RPC'
    });
  } catch (error) {
    console.error('Error getting Helius usage status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage status'
    });
  }
};

/**
 * Reset Helius usage for testing (admin only)
 */
export const resetHeliusUsage = (req: Request, res: Response) => {
  try {
    heliusRateLimiter.resetUsageForTesting();
    res.json({
      success: true,
      message: 'Helius usage reset for testing'
    });
  } catch (error) {
    console.error('Error resetting Helius usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset usage'
    });
  }
};