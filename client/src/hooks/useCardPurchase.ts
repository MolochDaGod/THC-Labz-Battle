import { useState, useCallback, useEffect } from 'react';

interface PurchaseResult {
  success: boolean;
  message: string;
  newBalance?: number;
}

export const useCardPurchase = (initialBudzBalance: number = 0) => {
  const [budzBalance, setBudzBalance] = useState(initialBudzBalance);
  const [purchasedCards, setPurchasedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const purchaseCard = useCallback(async (
    cardId: string, 
    price: number, 
    walletAddress?: string
  ): Promise<PurchaseResult> => {
    if (!walletAddress) {
      return {
        success: false,
        message: 'Wallet not connected.'
      };
    }

    setLoading(true);
    
    try {
      // Check if user has enough BUDZ
      if (budzBalance < price) {
        return {
          success: false,
          message: `Insufficient BUDZ. You need ${price} but only have ${budzBalance}.`
        };
      }

      // Check if card is already purchased
      if (purchasedCards.has(cardId)) {
        return {
          success: false,
          message: 'Card already purchased.'
        };
      }

      // Actual API call to add owned card
      const response = await fetch('/api/cards/owned/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          cardId,
          source: 'purchased'
        }),
      });

      if (!response.ok) {
        throw new Error('Purchase failed');
      }

      const result = await response.json();
      
      // Update local state
      const newBalance = budzBalance - price;
      setBudzBalance(newBalance);
      setPurchasedCards(prev => new Set([...Array.from(prev), cardId]));

      // Update local balance (we still use localStorage for quick balance display, 
      // but ownership is now server-side)
      localStorage.setItem('thc-clash-budz-balance', newBalance.toString());

      return {
        success: true,
        message: `Successfully purchased card for ${price} BUDZ!`,
        newBalance
      };

    } catch (error) {
      console.error('Card purchase error:', error);
      return {
        success: false,
        message: 'Purchase failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, [budzBalance, purchasedCards]);

  const isCardPurchased = useCallback((cardId: string) => {
    return purchasedCards.has(cardId);
  }, [purchasedCards]);

  const addBudz = useCallback((amount: number) => {
    const newBalance = budzBalance + amount;
    setBudzBalance(newBalance);
    localStorage.setItem('thc-clash-budz-balance', newBalance.toString());
  }, [budzBalance]);

  // Load owned cards from server
  const loadOwnedCards = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/cards/owned/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        const cards = Array.isArray(data) ? data : (data?.cards ?? []);
        const cardIds = new Set<string>(cards.map((c: any) => c.cardId));
        setPurchasedCards(cardIds);
      }
    } catch (error) {
      console.error('Error loading owned cards:', error);
    }
  }, []);

  // Initialize from localStorage for balance, and server for cards
  useEffect(() => {
    const savedBalance = localStorage.getItem('thc-clash-budz-balance');
    if (savedBalance) {
      setBudzBalance(parseInt(savedBalance) || 0);
    }
  }, []);

  return {
    budzBalance,
    purchasedCards: Array.from(purchasedCards),
    loading,
    purchaseCard,
    isCardPurchased,
    addBudz,
    setBudzBalance,
    loadOwnedCards
  };
};