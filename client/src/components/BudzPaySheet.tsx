import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Crown, Zap, Flame, Calendar, BarChart3, Star, Trophy, Info } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grand Master'];

const TIER_META: Record<string, { color: string; emoji: string }> = {
  Bronze:        { color: '#cd7f32', emoji: '🥉' },
  Silver:        { color: '#c0c0c0', emoji: '🥈' },
  Gold:          { color: '#ffd700', emoji: '🥇' },
  Platinum:      { color: '#b3e0ff', emoji: '💎' },
  Diamond:       { color: '#00d4ff', emoji: '💠' },
  'Grand Master':{ color: '#ff6b35', emoji: '👑' },
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  base:         <Zap size={13} />,
  crown:        <Crown size={13} />,
  elo:          <BarChart3 size={13} />,
  streak:       <Flame size={13} />,
  daily:        <Calendar size={13} />,
  achievement:  <Star size={13} />,
  leaderboard:  <Trophy size={13} />,
};

const SECTION_LABELS: Record<string, string> = {
  base:        'Base Win',
  crown:       'Crown Bonus',
  elo:         'ELO Bonus',
  streak:      'Win Streak',
  daily:       'Daily Quest',
  achievement: 'Achievement',
  leaderboard: 'Leaderboard',
};

export default function BudzPaySheet({ onBack }: Props) {
  const [paySheet, setPaySheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/battle/payout-sheet')
      .then(r => r.json())
      .then(data => {
        if (data.success) setPaySheet(data.payoutSheet || data.data || data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#030808',
      color: '#fff',
      fontFamily: "'LEMON MILK', 'Arial Black', sans-serif",
      position: 'relative',
      overflowY: 'auto',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/thc-clash-bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.08, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(160deg, rgba(3,8,8,0.94) 0%, rgba(0,20,10,0.9) 50%, rgba(3,8,8,0.94) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 500, margin: '0 auto', padding: '0 0 40px' }}>

        {/* Hero banner */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: 160,
          overflow: 'hidden',
          marginBottom: 0,
        }}>
          <img
            src="/paysheet-hero.png"
            alt=""
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(3,8,8,0.9) 100%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 14, left: 16, right: 16,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#39ff14', letterSpacing: 2, lineHeight: 1, textShadow: '0 0 20px rgba(57,255,20,0.9)' }}>
                BUDZ PAY SHEET
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: 1 }}>
                EARN BUDZ FOR EVERY BATTLE
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchData} style={{
                background: 'rgba(57,255,20,0.12)', border: '1px solid rgba(57,255,20,0.35)',
                borderRadius: 9, padding: '7px 10px', cursor: 'pointer', color: '#39ff14',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button onClick={onBack} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 9, padding: '7px 12px', cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: "'LEMON MILK', sans-serif",
              }}>
                <ArrowLeft size={14} /> BACK
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {/* BUDZ token icon row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
            background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <img src="/budz-token.png" alt="BUDZ" style={{ width: 32, height: 32 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#39ff14', letterSpacing: 1 }}>BUDZ REWARDS</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2, letterSpacing: 0.5 }}>
                Win battles · Complete quests · Climb the leaderboard
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <RefreshCw size={32} style={{ color: '#39ff14', animation: 'spin 1s linear infinite', margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>LOADING PAYOUTS...</div>
            </div>
          ) : paySheet ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TIER_ORDER.map(tier => {
                const meta = TIER_META[tier] || { color: '#39ff14', emoji: '🌿' };
                const data = paySheet[tier];
                return (
                  <div key={tier} style={{
                    borderRadius: 16,
                    border: `1.5px solid ${meta.color}40`,
                    overflow: 'hidden',
                    boxShadow: `0 0 18px ${meta.color}12, 0 4px 20px rgba(0,0,0,0.5)`,
                  }}>
                    {/* Tier header */}
                    <div style={{
                      padding: '10px 14px',
                      background: `linear-gradient(135deg, ${meta.color}22 0%, rgba(0,0,0,0.5) 100%)`,
                      borderBottom: `1px solid ${meta.color}30`,
                      display: 'flex', alignItems: 'center', gap: 9,
                    }}>
                      <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: meta.color, letterSpacing: 1.5, textShadow: `0 0 10px ${meta.color}88` }}>
                          {tier.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginTop: 1 }}>
                          RANK TIER · BUDZ MULTIPLIER
                        </div>
                      </div>
                    </div>
                    {/* Payout rows */}
                    <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.45)' }}>
                      {data ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                          {Object.entries(data as Record<string, any>).map(([key, val]) => (
                            <div key={key} style={{
                              display: 'flex', alignItems: 'center', gap: 7,
                              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                              padding: '6px 9px', border: '1px solid rgba(255,255,255,0.07)',
                            }}>
                              <span style={{ color: meta.color, opacity: 0.8, flexShrink: 0 }}>
                                {SECTION_ICONS[key] || <Info size={13} />}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 1 }}>
                                  {SECTION_LABELS[key] || key}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 900, color: '#bef264', letterSpacing: 0.5 }}>
                                  {String(val)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0' }}>
                          No payout data for this tier.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Info size={32} style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>NO PAYOUT DATA AVAILABLE</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
