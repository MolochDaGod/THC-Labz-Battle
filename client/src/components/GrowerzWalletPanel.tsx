import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Heart, Star, ChevronDown, ChevronUp, RefreshCw, Swords } from 'lucide-react';
import {
  nftToGrowerzUnitCard,
  getGrowerzRarityTier,
  rarityColor,
  type GrowerzUnitCard,
} from '../utils/GrowerzUnitSystem';

interface GrowerzWalletPanelProps {
  walletAddress: string | null;
  onAddToDeck?: (card: GrowerzUnitCard) => void;
  currentDeck?: any[];
}

export default function GrowerzWalletPanel({
  walletAddress,
  onAddToDeck,
  currentDeck = [],
}: GrowerzWalletPanelProps) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [unitCards, setUnitCards] = useState<GrowerzUnitCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [selectedCard, setSelectedCard] = useState<GrowerzUnitCard | null>(null);

  useEffect(() => {
    if (walletAddress) {
      fetchGrowerzNFTs();
    }
  }, [walletAddress]);

  const fetchGrowerzNFTs = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/my-nfts/${walletAddress}`);
      const data = await res.json();
      if (data.success && data.nfts?.length > 0) {
        setNfts(data.nfts);
        const cards = data.nfts
          .filter((n: any) => n)
          .map(nftToGrowerzUnitCard);
        setUnitCards(cards);
      } else {
        setNfts([]);
        setUnitCards([]);
      }
    } catch (err) {
      setError('Could not reach wallet scan service');
    } finally {
      setLoading(false);
    }
  };

  const isInDeck = (card: GrowerzUnitCard) =>
    currentDeck.some((c) => c.id === card.id);

  if (!walletAddress) {
    return (
      <div className="bg-black/40 border border-green-800/50 rounded-xl p-4 text-center">
        <div className="mb-2"><img src="/budz-token.png" alt="" className="w-8 h-8 mx-auto" /></div>
        <p className="text-gray-400 text-sm">Connect a Solana wallet to detect your GROWERZ NFTs</p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-900/40 hover:bg-green-900/60 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <img src="/budz-token.png" alt="" className="w-5 h-5" />
          <span className="text-white font-bold text-sm">YOUR GROWERZ</span>
          {unitCards.length > 0 && (
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
              {unitCards.length} NFT{unitCards.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); fetchGrowerzNFTs(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); fetchGrowerzNFTs(); } }}
            className="text-gray-400 hover:text-white p-1"
            title="Refresh wallet"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3">
              {loading && (
                <div className="flex items-center justify-center py-6 gap-2 text-green-400">
                  <div className="animate-spin w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full" />
                  <span className="text-sm">Scanning wallet for GROWERZ…</span>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm text-center py-3">{error}</div>
              )}

              {!loading && unitCards.length === 0 && !error && (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-gray-400 text-sm">No GROWERZ NFTs found in this wallet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}
                  </p>
                </div>
              )}

              {!loading && unitCards.length > 0 && (
                <>
                  <p className="text-gray-400 text-xs mb-3 text-center">
                    Each GROWERZ you own becomes a deployable battle unit — stats are determined by its traits
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {unitCards.map((card) => (
                      <GrowerzCard
                        key={card.id}
                        card={card}
                        inDeck={isInDeck(card)}
                        onSelect={() => setSelectedCard(card)}
                        onAddToDeck={onAddToDeck}
                        selected={selectedCard?.id === card.id}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border-2 rounded-2xl p-5 max-w-sm w-full"
              style={{ borderColor: rarityColor(selectedCard.rarity) }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-4 mb-4">
                <img
                  src={selectedCard.image}
                  alt={selectedCard.name}
                  className="w-24 h-24 rounded-xl object-cover border-2"
                  style={{ borderColor: rarityColor(selectedCard.rarity) }}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23228B22"/><circle cx="50" cy="50" r="30" fill="%2339ff14" opacity="0.4"/></svg>'; }}
                />
                <div>
                  <h3 className="text-white font-bold text-lg">{selectedCard.name}</h3>
                  <div className="text-xs px-2 py-0.5 rounded-full inline-block mt-1 font-bold capitalize"
                    style={{ backgroundColor: rarityColor(selectedCard.rarity) + '33', color: rarityColor(selectedCard.rarity), border: `1px solid ${rarityColor(selectedCard.rarity)}` }}>
                    {selectedCard.rarity} • Rank #{selectedCard.nftRank}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <div className="flex items-center gap-1 text-orange-400 text-xs"><Swords className="w-3 h-3" />{selectedCard.attack}</div>
                    <div className="flex items-center gap-1 text-green-400 text-xs"><Heart className="w-3 h-3" />{selectedCard.health}</div>
                    <div className="flex items-center gap-1 text-purple-400 text-xs"><Zap className="w-3 h-3" />{selectedCard.cost}</div>
                  </div>
                </div>
              </div>

              {/* Traits */}
              <div className="bg-black/30 rounded-xl p-3 mb-3">
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">NFT Traits</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(selectedCard.traits).map(([key, value]) => (
                    <div key={key} className="bg-black/40 rounded-lg px-2 py-1">
                      <span className="text-gray-500 text-[10px] uppercase">{key}</span>
                      <p className="text-white text-xs font-medium truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abilities */}
              <div className="mb-4">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">Abilities</p>
                {selectedCard.abilities.map((ab, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1">
                    <Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-xs">{ab}</span>
                  </div>
                ))}
                <p className="text-gray-500 text-xs mt-1">{selectedCard.description}</p>
              </div>

              <div className="flex gap-2">
                {onAddToDeck && (
                  <button
                    onClick={() => { onAddToDeck(selectedCard); setSelectedCard(null); }}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    + Add to Deck
                  </button>
                )}
                <button
                  onClick={() => setSelectedCard(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Individual GROWERZ card widget ───────────────────────────────────────────
function GrowerzCard({
  card,
  inDeck,
  onSelect,
  onAddToDeck,
  selected,
}: {
  card: GrowerzUnitCard;
  inDeck: boolean;
  onSelect: () => void;
  onAddToDeck?: (card: GrowerzUnitCard) => void;
  selected: boolean;
}) {
  const color = rarityColor(card.rarity);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
        selected ? 'scale-105 shadow-lg' : 'hover:scale-102'
      }`}
      style={{ borderColor: selected ? color : color + '55', background: `linear-gradient(135deg, #0a1a0a, #0d2b0d)` }}
      onClick={onSelect}
    >
      {/* NFT Image */}
      <div className="relative">
        <img
          src={card.image}
          alt={card.name}
          className="w-full aspect-square object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23228B22"/><circle cx="50" cy="50" r="30" fill="%2339ff14" opacity="0.4"/></svg>';
          }}
        />
        {/* Cost badge */}
        <div className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: '#7c3aed' }}>
          {card.cost}
        </div>
        {/* Rarity indicator */}
        <div className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
          style={{ background: color + '33', color, border: `1px solid ${color}66` }}>
          {card.rarity}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-2 py-1.5 bg-black/60">
        <p className="text-white text-xs font-bold truncate">{card.name}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-orange-400 text-[10px]">
            <Swords className="w-2.5 h-2.5" />{card.attack}
          </div>
          <div className="flex items-center gap-1 text-green-400 text-[10px]">
            <Heart className="w-2.5 h-2.5" />{card.health}
          </div>
          <div className="text-[9px] text-gray-400 capitalize">{card.attackType}</div>
        </div>

        {/* Add to deck button */}
        {onAddToDeck && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!inDeck) onAddToDeck(card); }}
            className={`mt-1.5 w-full text-[10px] py-1 rounded-lg font-bold transition-all ${
              inDeck
                ? 'bg-green-900/50 text-green-400 cursor-default'
                : 'bg-green-600/80 hover:bg-green-500 text-white'
            }`}
          >
            {inDeck ? '✓ In Deck' : '+ Add'}
          </button>
        )}
      </div>
    </div>
  );
}
