import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, X, RefreshCw, Gem, Loader } from 'lucide-react';
import CardRarityBackground from './CardRarityBackground';

interface Trade {
  id: number;
  seller_wallet: string;
  card_id: string;
  card_name: string;
  card_data: any;
  nft_mint: string | null;
  asking_price_budz: number;
  status: string;
  created_at: string;
}

interface OwnedCard {
  card_id: string;
  card_name: string;
  card_data: any;
  nft_mint: string | null;
  source: string;
}

interface NFTTradePageProps {
  walletAddress?: string;
  onBack: () => void;
}

function shortAddr(addr: string, n = 6) {
  if (!addr) return '—';
  return `${addr.slice(0, n)}…${addr.slice(-4)}`;
}

function TradeCard({ trade, isOwn, onCancel, onAccept, loading }: {
  trade: Trade;
  isOwn: boolean;
  onCancel?: () => void;
  onAccept?: () => void;
  loading?: boolean;
}) {
  const rarity = trade.card_data?.rarity || 'common';
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.15)' }}>
      <CardRarityBackground rarity={rarity} />
      <div className="relative z-10 p-3">
        {trade.nft_mint && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-purple-900/80 rounded-full px-2 py-0.5 text-[10px] text-purple-300 font-bold">
            <Gem size={8} />
            NFT
          </div>
        )}
        <div className="font-black text-white text-sm mb-1 truncate pr-10" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>
          {trade.card_name || 'Unknown Card'}
        </div>
        <div className="text-gray-400 text-[10px] mb-1 capitalize">
          {rarity} · {trade.card_data?.class || ''}
        </div>
        {trade.card_data && (
          <div className="flex gap-2 mb-2 text-xs">
            <span className="text-red-400">⚔ {trade.card_data.attack}</span>
            <span className="text-green-400">❤ {trade.card_data.health}</span>
            <span className="text-purple-400">⚡ {trade.card_data.cost}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-yellow-400 font-black text-sm">
            <img src="/budz-token.png" alt="" className="inline w-4 h-4 mr-1 align-middle" />{trade.asking_price_budz.toLocaleString()} BUDZ
          </div>
          {isOwn ? (
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 bg-red-800 text-red-200 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {loading ? <Loader size={10} className="animate-spin" /> : <X size={10} />}
              Cancel
            </button>
          ) : (
            <button
              onClick={onAccept}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 bg-green-700 text-green-100 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {loading ? <Loader size={10} className="animate-spin" /> : <span>Accept</span>}
            </button>
          )}
        </div>
        <div className="text-gray-600 text-[9px] mt-1 truncate">
          Seller: {shortAddr(trade.seller_wallet)}
          {trade.nft_mint && (
            <> · Mint: {shortAddr(trade.nft_mint, 4)}</>
          )}
        </div>
      </div>
    </div>
  );
}

function ListCardModal({ ownedCards, onList, onClose }: {
  ownedCards: OwnedCard[];
  onList: (card: OwnedCard, price: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<OwnedCard | null>(null);
  const [price, setPrice] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleList = async () => {
    if (!selected) return;
    setLoading(true);
    await onList(selected, price);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 pb-8"
        style={{ background: '#0f1a0f', border: '2px solid rgba(57,255,20,0.3)', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-white text-lg" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>
            List Card for Trade
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>

        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Select a card to list:</div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {ownedCards.length === 0 ? (
              <p className="col-span-2 text-gray-500 text-sm text-center py-4">No cards available to list</p>
            ) : ownedCards.map(card => (
              <button
                key={card.card_id}
                onClick={() => setSelected(card)}
                className={`rounded-xl p-2 text-left transition-all border ${
                  selected?.card_id === card.card_id
                    ? 'border-green-400 bg-green-900/40'
                    : 'border-gray-700 bg-gray-900/60'
                }`}
              >
                <div className="font-bold text-white text-xs truncate">{card.card_name || card.card_id}</div>
                <div className="text-gray-400 text-[10px] capitalize">{card.card_data?.rarity || 'common'}</div>
                {card.nft_mint && (
                  <div className="text-purple-400 text-[9px] flex items-center gap-0.5 mt-0.5">
                    <Gem size={8} /> NFT
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-1 block">Asking price (BUDZ):</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white text-lg font-bold focus:outline-none focus:border-green-400"
          />
        </div>

        <button
          onClick={handleList}
          disabled={!selected || loading}
          className="w-full py-3 rounded-xl font-black text-white text-base transition-all disabled:opacity-40"
          style={{ background: selected ? 'linear-gradient(135deg, #1a4a1a, #39ff14)' : '#222', fontFamily: "'LEMON MILK', sans-serif" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2"><Loader size={16} className="animate-spin" /> Listing...</span>
          ) : (
            `List for ${price.toLocaleString()} BUDZ`
          )}
        </button>
      </div>
    </div>
  );
}

export default function NFTTradePage({ walletAddress, onBack }: NFTTradePageProps) {
  const [tab, setTab] = useState<'market' | 'mine'>('market');
  const [marketTrades, setMarketTrades] = useState<Trade[]>([]);
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchMarket = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/trades');
      const d = await r.json();
      if (d.success) setMarketTrades(d.trades.filter((t: Trade) => t.seller_wallet !== walletAddress));
    } catch {}
    setLoading(false);
  }, [walletAddress]);

  const fetchMine = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const r = await fetch(`/api/trades/my/${walletAddress}`);
      const d = await r.json();
      if (d.success) setMyTrades(d.trades);
    } catch {}
  }, [walletAddress]);

  const fetchOwnedCards = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const r = await fetch(`/api/cards/owned/${walletAddress}`);
      const d = await r.json();
      const arr = Array.isArray(d) ? d : (d?.cards ?? []);
      if (arr.length > 0) setOwnedCards(arr);
    } catch {}
  }, [walletAddress]);

  useEffect(() => {
    fetchMarket();
    if (walletAddress) {
      fetchMine();
      fetchOwnedCards();
    }
  }, [fetchMarket, fetchMine, fetchOwnedCards]);

  const handleList = async (card: OwnedCard, price: number) => {
    if (!walletAddress) return;
    try {
      const r = await fetch('/api/trades/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerWallet: walletAddress,
          cardId: card.card_id,
          cardName: card.card_name,
          cardData: card.card_data,
          nftMint: card.nft_mint,
          askingPriceBudz: price
        })
      });
      const d = await r.json();
      if (d.success) {
        setShowModal(false);
        fetchMine();
      }
    } catch {}
  };

  const handleCancel = async (id: number) => {
    if (!walletAddress) return;
    setActionId(id);
    try {
      await fetch(`/api/trades/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      fetchMine();
    } catch {}
    setActionId(null);
  };

  const handleAccept = async (id: number) => {
    if (!walletAddress) return;
    setActionId(id);
    try {
      const r = await fetch(`/api/trades/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerWallet: walletAddress })
      });
      const d = await r.json();
      if (d.success) {
        fetchMarket();
        fetchOwnedCards();
      }
    } catch {}
    setActionId(null);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] overflow-y-auto text-white" style={{ background: 'linear-gradient(180deg, #050d05 0%, #0a1a0a 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3" style={{ background: 'rgba(5,13,5,0.95)', borderBottom: '1px solid rgba(57,255,20,0.2)', backdropFilter: 'blur(10px)' }}>
        <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="cartoon-title text-xl" style={{ color: '#39ff14' }}>NFT TRADE</h1>
        <button onClick={() => { fetchMarket(); fetchMine(); }} className="text-gray-400 hover:text-white">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 mb-4 rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(57,255,20,0.2)' }}>
        <button
          onClick={() => setTab('market')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${tab === 'market' ? 'text-black' : 'text-gray-400'}`}
          style={{ background: tab === 'market' ? '#39ff14' : 'transparent' }}
        >
          MARKET {marketTrades.length > 0 && `(${marketTrades.length})`}
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all ${tab === 'mine' ? 'text-black' : 'text-gray-400'}`}
          style={{ background: tab === 'mine' ? '#39ff14' : 'transparent' }}
        >
          MY LISTINGS {myTrades.filter(t => t.status === 'active').length > 0 && `(${myTrades.filter(t => t.status === 'active').length})`}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader size={32} className="animate-spin text-green-400" />
          </div>
        )}

        {tab === 'market' && !loading && (
          <>
            {!walletAddress && (
              <div className="cartoon-card p-6 text-center mb-4">
                <div className="text-4xl mb-3">🔗</div>
                <p className="text-gray-300 text-sm">Connect your wallet to trade cards</p>
              </div>
            )}
            {marketTrades.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4"><img src="/budz-token.png" alt="" className="w-12 h-12 mx-auto" /></div>
                <p className="text-gray-400 text-base font-bold">Market is empty</p>
                <p className="text-gray-600 text-sm mt-1">Be the first to list a card!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {marketTrades.map(trade => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    isOwn={false}
                    onAccept={() => handleAccept(trade.id)}
                    loading={actionId === trade.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'mine' && !loading && (
          <>
            {!walletAddress ? (
              <div className="cartoon-card p-6 text-center">
                <div className="text-4xl mb-3">🔗</div>
                <p className="text-gray-300 text-sm">Connect your wallet to manage listings</p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-3 rounded-2xl mb-4 font-black text-base flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #1a4a1a, #39ff14)', color: '#000', fontFamily: "'LEMON MILK', sans-serif" }}
                >
                  <Plus size={20} />
                  List a Card
                </button>

                {myTrades.filter(t => t.status === 'active').length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-gray-400">No active listings</p>
                    <p className="text-gray-600 text-sm mt-1">List a card to start trading</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {myTrades.filter(t => t.status === 'active').map(trade => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        isOwn={true}
                        onCancel={() => handleCancel(trade.id)}
                        loading={actionId === trade.id}
                      />
                    ))}
                  </div>
                )}

                {myTrades.filter(t => t.status !== 'active').length > 0 && (
                  <div className="mt-6">
                    <div className="text-gray-500 text-xs mb-2 uppercase tracking-widest">Completed / Cancelled</div>
                    <div className="grid grid-cols-2 gap-3 opacity-50">
                      {myTrades.filter(t => t.status !== 'active').slice(0, 4).map(trade => (
                        <TradeCard
                          key={trade.id}
                          trade={trade}
                          isOwn={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ListCardModal
          ownedCards={ownedCards}
          onList={handleList}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="h-6" />
    </div>
  );
}
