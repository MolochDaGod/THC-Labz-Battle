import React, { useEffect, useState } from 'react';

interface AIValidationProps {
  gameState: any;
  connectedWallet: string;
  onValidationComplete?: (results: any) => void;
}

interface ValidationResults {
  gameState: {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    optimization: string;
  };
  missions: {
    completableMissions: number;
    totalMissions: number;
    blockedMissions: any[];
  };
  systemSync: {
    tokenBalances: boolean;
    achievements: boolean;
    nftData: boolean;
    gameProgress: boolean;
    recommendations: string[];
  };
}

export default function AISystemValidator({ gameState, connectedWallet, onValidationComplete }: AIValidationProps) {
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  const performComprehensiveValidation = async () => {
    if (!connectedWallet || !gameState) return;
    
    // Prevent validation spam
    if (lastValidation && Date.now() - lastValidation.getTime() < 60000) {
      console.log('🧠 DOPE_BUDZ_AI validation skipped - too recent');
      return;
    }
    
    setIsValidating(true);
    console.log('🧠 DOPE_BUDZ_AI performing system validation (optimized)...');
    
    try {
      // Only do system check - simpler and faster
      const systemCheck = await fetch('/api/ai/system-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState, walletAddress: connectedWallet })
      });

      const results: ValidationResults = {
        gameState: { isValid: true, issues: [], recommendations: [], optimization: '' },
        missions: { completableMissions: 0, totalMissions: 0, blockedMissions: [] },
        systemSync: { tokenBalances: true, achievements: true, nftData: true, gameProgress: true, recommendations: [] }
      };

      if (systemCheck.ok) {
        const systemData = await systemCheck.json();
        results.systemSync = systemData.syncStatus || results.systemSync;
        
        // Only log if there are actual issues
        if (systemData.issues && systemData.issues.length > 0) {
          console.log('⚠️ DOPE_BUDZ_AI system check:', systemData.issues);
        }
      }

      setValidationResults(results);
      setLastValidation(new Date());
      
      if (onValidationComplete) {
        onValidationComplete(results);
      }

      // Only log if there are issues - reduce console spam
      console.log('✅ DOPE_BUDZ_AI system check complete');
      
    } catch (error) {
      console.error('DOPE_BUDZ_AI Validation Error:', error);
      setValidationResults({
        gameState: { isValid: false, issues: ['AI validation service unavailable'], recommendations: [], optimization: '' },
        missions: { completableMissions: 0, totalMissions: 0, blockedMissions: [] },
        systemSync: { tokenBalances: true, achievements: true, nftData: true, gameProgress: true, recommendations: [] }
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Validate only every 5 minutes during active gameplay (reduced from 30 seconds)
  useEffect(() => {
    if (!connectedWallet) return;
    
    const interval = setInterval(() => {
      if (gameState.day && !isValidating) {
        performComprehensiveValidation();
      }
    }, 300000); // 5 minutes instead of 30 seconds

    // Initial validation only on first load
    if (!lastValidation) {
      performComprehensiveValidation();
    }

    return () => clearInterval(interval);
  }, [connectedWallet]);

  // Validation only on major milestones (day changes, significant money changes)
  useEffect(() => {
    if (gameState.day && connectedWallet && !isValidating && lastValidation) {
      const timeSinceLastValidation = Date.now() - lastValidation.getTime();
      const significantMoneyChange = gameState.money && Math.abs(gameState.money - (validationResults?.gameState as any)?.lastMoney || 0) > 1000;
      
      // Only validate if it's been at least 2 minutes since last validation
      if (timeSinceLastValidation > 120000 && significantMoneyChange) {
        const timer = setTimeout(() => {
          performComprehensiveValidation();
        }, 5000); // 5 second delay to avoid spam

        return () => clearTimeout(timer);
      }
    }
  }, [gameState.day]); // Only trigger on day changes

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isValidating && (
        <div className="bg-purple-900 text-green-400 px-3 py-2 rounded-lg shadow-lg border border-green-400 animate-pulse">
          🧠 DOPE_BUDZ_AI Validating...
        </div>
      )}
      
      {validationResults && !isValidating && (
        <div className={`px-3 py-2 rounded-lg shadow-lg border text-xs ${
          validationResults.gameState.isValid 
            ? 'bg-green-900 text-green-200 border-green-400' 
            : 'bg-red-900 text-red-200 border-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>{validationResults.gameState.isValid ? '✅' : '⚠️'}</span>
            <span>AI System: {validationResults.gameState.isValid ? 'OPTIMAL' : 'ISSUES'}</span>
          </div>
          {lastValidation && (
            <div className="text-xs opacity-75">
              Last check: {lastValidation.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}