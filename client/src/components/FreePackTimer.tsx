import { useState, useEffect, useCallback, useRef } from 'react';
import GameIcon from './GameIcon';
import PackOpeningModal from './PackOpeningModal';

const STORAGE_KEY = 'thc-free-packs';
const FREE_PACK_INTERVAL = 30 * 60 * 1000;
const MAX_PACKS = 3;
const CARDS_PER_PACK = 3;
const DECK_KEY = 'thc-clash-battle-deck';

interface FreePackState {
  count: number;
  lastAddTime: number;
}

function loadState(): FreePackState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 1, lastAddTime: Date.now() };
}

function saveState(s: FreePackState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function computeState(s: FreePackState): FreePackState {
  const now = Date.now();
  let { count, lastAddTime } = s;
  const elapsed = now - lastAddTime;
  const packsToAdd = Math.floor(elapsed / FREE_PACK_INTERVAL);
  if (packsToAdd > 0) {
    count = Math.min(MAX_PACKS, count + packsToAdd);
    lastAddTime = lastAddTime + packsToAdd * FREE_PACK_INTERVAL;
  }
  return { count, lastAddTime };
}

function msToNextPack(s: FreePackState): number {
  if (s.count >= MAX_PACKS) return 0;
  const next = s.lastAddTime + FREE_PACK_INTERVAL;
  return Math.max(0, next - Date.now());
}

function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function addCardsToDeck(cards: any[]) {
  try {
    const raw = localStorage.getItem(DECK_KEY);
    const deck: any[] = raw ? JSON.parse(raw) : [];
    const newDeck = [...deck, ...cards];
    localStorage.setItem(DECK_KEY, JSON.stringify(newDeck));
  } catch {}
}

interface Props {
  walletAddress?: string;
  onPackClaimed?: (cards: any[]) => void;
}

export default function FreePackTimer({ walletAddress, onPackClaimed }: Props) {
  const [packState, setPackState] = useState<FreePackState>(() => computeState(loadState()));
  const [countdown, setCountdown] = useState(() => msToNextPack(computeState(loadState())));
  const [opening, setOpening] = useState(false);
  const [modalCards, setModalCards] = useState<any[] | null>(null);
  const allCardsRef = useRef<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/cards')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.cards) && data.cards.length > 0) {
          allCardsRef.current = data.cards.filter((c: any) => c.id !== 'captain' && !c.name?.includes('Captain'));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      const fresh = computeState(packState);
      const changed = fresh.count !== packState.count;
      if (changed) {
        saveState(fresh);
        setPackState(fresh);
      }
      setCountdown(msToNextPack(fresh));
    }, 1000);
    return () => clearInterval(tick);
  }, [packState]);

  const claimPack = useCallback(async () => {
    if (packState.count <= 0 || opening) return;
    setOpening(true);

    let cards: any[] = [];

    if (allCardsRef.current.length >= CARDS_PER_PACK) {
      const eligible = allCardsRef.current.filter(c => {
        const r = (c.rarity || 'common').toLowerCase();
        return r === 'common' || r === 'uncommon';
      });
      const pool = eligible.length >= CARDS_PER_PACK ? eligible : allCardsRef.current.filter(c => (c.rarity || 'common').toLowerCase() === 'common');
      const drawPool = pool.length >= CARDS_PER_PACK ? pool : allCardsRef.current;
      const shuffled = [...drawPool].sort(() => 0.5 - Math.random());
      cards = shuffled.slice(0, CARDS_PER_PACK).map(c => ({
        id: `free_${Date.now()}_${c.id}`,
        name: c.name,
        rarity: c.rarity || 'common',
        class: c.class || 'warrior',
        attack: c.attack || 50,
        health: c.health || 100,
        cost: c.cost || 3,
        image: c.image || '',
        description: c.description || '',
        type: c.type || 'unit',
        abilities: c.abilities || [],
        sourceId: c.id,
      }));
    } else {
      const rarities = ['common', 'common', 'uncommon'];
      cards = rarities.map((rarity, i) => ({
        id: `free_${Date.now()}_${i}`,
        name: rarity === 'uncommon' ? 'Kush Warrior' : 'Dank Knight',
        rarity,
        class: 'warrior',
        attack: rarity === 'uncommon' ? 65 : 50,
        health: rarity === 'uncommon' ? 130 : 100,
        cost: rarity === 'uncommon' ? 4 : 3,
        image: '',
        description: `A ${rarity} card ready for battle.`,
        type: 'unit',
        abilities: [],
      }));
    }

    try {
      if (walletAddress) {
        await fetch('/api/card-shop/free-pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });
      }
    } catch {}

    const newState: FreePackState = {
      count: packState.count - 1,
      lastAddTime: packState.count === MAX_PACKS ? Date.now() : packState.lastAddTime,
    };
    saveState(newState);
    setPackState(newState);
    setCountdown(msToNextPack(newState));

    setModalCards(cards);
    onPackClaimed?.(cards);
    setOpening(false);
  }, [packState, opening, walletAddress, onPackClaimed]);

  const handleModalDone = useCallback(() => {
    if (modalCards) {
      addCardsToDeck(modalCards);
    }
    setModalCards(null);
  }, [modalCards]);

  const pips = Array.from({ length: MAX_PACKS }, (_, i) => i < packState.count);

  return (
    <>
      <div className="cartoon-card cartoon-card-green p-4">
        <div className="flex items-center gap-3 mb-3">
          <GameIcon icon="gift" size={36} className="flex-shrink-0" />
          <div className="flex-1">
            <div className="cartoon-label text-green-300 text-xs mb-0.5">Free Packs</div>
            <div className="font-black text-white text-lg leading-none" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>
              Common Pack
            </div>
          </div>
          <div className="flex gap-1.5">
            {pips.map((full, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border-2 transition-all"
                style={{
                  borderColor: '#39ff14',
                  background: full ? '#39ff14' : 'transparent',
                  boxShadow: full ? '0 0 8px #39ff14' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {packState.count < MAX_PACKS && (
            <div className="flex items-center gap-1.5 flex-1">
              <GameIcon icon="timer" size={18} />
              <span className="cartoon-label text-gray-300 text-xs">Next in</span>
              <span
                className="cartoon-label text-green-300 text-sm"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatMs(countdown)}
              </span>
            </div>
          )}
          {packState.count === MAX_PACKS && (
            <span className="cartoon-label text-green-300 text-xs flex-1">Full! Claim a pack</span>
          )}

          <button
            onClick={claimPack}
            disabled={packState.count <= 0 || opening}
            className={`cartoon-btn py-2.5 px-5 text-sm ${packState.count > 0 ? 'cartoon-btn-green pulse-green' : 'cartoon-btn-dark'}`}
            style={{ minHeight: 40, opacity: packState.count <= 0 ? 0.5 : 1 }}
          >
            {opening ? 'Opening...' : packState.count > 0 ? 'Claim!' : 'None Left'}
          </button>
        </div>
      </div>

      {modalCards && (
        <PackOpeningModal
          cards={modalCards}
          packName="Common Pack"
          packColor="#39ff14"
          packArtUrl="/card-art/pack-sour-diesel.jpg"
          onDone={handleModalDone}
        />
      )}
    </>
  );
}
